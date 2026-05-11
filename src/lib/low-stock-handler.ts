import { db } from "@/lib/db";
import { sendEmail, emailLowStock } from "@/lib/email";
import { createAuditLog } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";

interface LowStockParams {
  consumableId: string;
  performedById: string;
}

export async function handleLowStockAlert({ consumableId, performedById }: LowStockParams) {
  const consumable = await db.consumable.findUnique({
    where: { id: consumableId },
    include: { region: true },
  });

  if (!consumable) return;
  if (consumable.quantityOnHand > consumable.minimumThreshold) return;

  // 1. Find all BRANCH_MANAGERs for this region + all SUPER_ADMINs
  const recipients = await db.user.findMany({
    where: {
      isActive: true,
      OR: [
        { role: "SUPER_ADMIN" },
        { role: "BRANCH_MANAGER", regionId: consumable.regionId },
      ],
    },
    select: { email: true, name: true },
  });

  // 2. Email each recipient + create in-app notification
  const recipientsWithId = await db.user.findMany({
    where: {
      isActive: true,
      OR: [
        { role: "SUPER_ADMIN" },
        { role: "BRANCH_MANAGER", regionId: consumable.regionId },
      ],
    },
    select: { id: true, email: true, name: true },
  });

  for (const recipient of recipientsWithId) {
    await sendEmail({
      to: recipient.email,
      subject: `Low Stock Alert: ${consumable.name}`,
      html: emailLowStock(
        consumable.name,
        consumable.quantityOnHand,
        consumable.minimumThreshold,
        consumable.region.name
      ),
    });
    await createNotification({
      userId: recipient.id,
      type: "LOW_STOCK",
      title: `Low Stock: ${consumable.name}`,
      message: `Only ${consumable.quantityOnHand} left (threshold: ${consumable.minimumThreshold}) in ${consumable.region.name}`,
      link: "/consumables",
    });
  }

  // 3. Check for existing PENDING purchase order to avoid duplicates
  const existingPO = await db.purchaseOrder.findFirst({
    where: {
      consumableId: consumable.id,
      status: "PENDING",
    },
  });

  if (!existingPO) {
    // 4. Calculate suggested quantity
    const suggestedQty = Math.max(
      consumable.reorderLevel - consumable.quantityOnHand,
      1
    );

    // 5. Create AI-generated purchase order
    const po = await db.purchaseOrder.create({
      data: {
        consumableId: consumable.id,
        regionId: consumable.regionId,
        organizationId: consumable.organizationId,
        quantity: suggestedQty,
        supplier: consumable.supplier,
        status: "PENDING",
        createdById: null, // AI-generated
        notes: `Auto-generated: Stock (${consumable.quantityOnHand}) dropped below threshold (${consumable.minimumThreshold}). Suggested reorder to reach level ${consumable.reorderLevel}.`,
      },
    });

    // 6. Audit log
    await createAuditLog({
      action: "PURCHASE_ORDER_CREATED",
      description: `AI auto-generated purchase order for ${suggestedQty} ${consumable.unitType} of "${consumable.name}" (${consumable.region.name})`,
      performedById,
      consumableId: consumable.id,
      metadata: {
        purchaseOrderId: po.id,
        quantity: suggestedQty,
        currentStock: consumable.quantityOnHand,
        threshold: consumable.minimumThreshold,
        reorderLevel: consumable.reorderLevel,
        aiGenerated: true,
      },
    });
  }
}
