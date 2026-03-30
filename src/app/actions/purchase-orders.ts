"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canManageRegion, hasPermission } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import type { PurchaseOrderStatus } from "@/generated/prisma/client";

export async function approvePurchaseOrder(formData: FormData) {
  const session = await auth();
  if (!session?.user || !(await hasPermission(session.user.id, session.user.role, "purchaseOrderManage"))) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  const purchaseOrderId = formData.get("purchaseOrderId") as string;
  const action = formData.get("action") as string; // "approve" | "reject"

  const po = await db.purchaseOrder.findUnique({
    where: { id: purchaseOrderId },
    include: { consumable: true },
  });
  if (!po) throw new Error("Purchase order not found");
  if (po.organizationId !== organizationId) throw new Error("Purchase order not found");
  if (po.status !== "PENDING") throw new Error("Order already processed");

  if (!canManageRegion(session.user.role, session.user.regionId, po.regionId)) {
    throw new Error("Cannot manage this region");
  }

  if (action === "approve") {
    await db.purchaseOrder.update({
      where: { id: purchaseOrderId },
      data: {
        status: "APPROVED",
        approvedById: session.user.id,
        approvedAt: new Date(),
      },
    });

    await createAuditLog({
      action: "PURCHASE_ORDER_APPROVED",
      description: `Approved purchase order for ${po.quantity} ${po.consumable.unitType} of "${po.consumable.name}"`,
      performedById: session.user.id,
      consumableId: po.consumableId,
      organizationId,
      metadata: { purchaseOrderId, quantity: po.quantity },
    });
  } else {
    await db.purchaseOrder.update({
      where: { id: purchaseOrderId },
      data: {
        status: "REJECTED",
        approvedById: session.user.id,
        approvedAt: new Date(),
      },
    });

    await createAuditLog({
      action: "PURCHASE_ORDER_REJECTED",
      description: `Rejected purchase order for ${po.quantity} ${po.consumable.unitType} of "${po.consumable.name}"`,
      performedById: session.user.id,
      consumableId: po.consumableId,
      organizationId,
      metadata: { purchaseOrderId, quantity: po.quantity },
    });
  }

  revalidatePath("/purchase-orders");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updatePurchaseOrder(formData: FormData) {
  const session = await auth();
  if (!session?.user || !(await hasPermission(session.user.id, session.user.role, "purchaseOrderManage"))) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  const purchaseOrderId = formData.get("purchaseOrderId") as string;
  const quantity = parseInt(formData.get("quantity") as string, 10);
  const supplier = (formData.get("supplier") as string) || null;
  const notes = (formData.get("notes") as string) || null;
  const status = formData.get("status") as string;

  if (!purchaseOrderId || !quantity || quantity < 1) {
    throw new Error("Invalid data");
  }

  const validStatuses = ["PENDING", "APPROVED", "ORDERED", "REJECTED"];
  if (!validStatuses.includes(status)) {
    throw new Error("Invalid status");
  }

  const po = await db.purchaseOrder.findUnique({
    where: { id: purchaseOrderId },
    include: { consumable: true },
  });
  if (!po) throw new Error("Purchase order not found");
  if (po.organizationId !== organizationId) throw new Error("Purchase order not found");

  if (!canManageRegion(session.user.role, session.user.regionId, po.regionId)) {
    throw new Error("Cannot manage this region");
  }

  const statusChanged = po.status !== status;

  await db.purchaseOrder.update({
    where: { id: purchaseOrderId },
    data: {
      quantity,
      supplier,
      notes,
      status: status as PurchaseOrderStatus,
      ...(statusChanged && (status === "APPROVED" || status === "REJECTED")
        ? { approvedById: session.user.id, approvedAt: new Date() }
        : {}),
      ...(statusChanged && status === "PENDING"
        ? { approvedById: null, approvedAt: null }
        : {}),
    },
  });

  await createAuditLog({
    action: "PURCHASE_ORDER_UPDATED",
    description: `Updated purchase order for ${quantity} ${po.consumable.unitType} of "${po.consumable.name}"${statusChanged ? ` — status changed to ${status}` : ""}`,
    performedById: session.user.id,
    consumableId: po.consumableId,
    organizationId,
    metadata: { purchaseOrderId, quantity, supplier, status, previousStatus: po.status },
  });

  revalidatePath("/purchase-orders");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function markPurchaseOrderOrdered(formData: FormData) {
  const session = await auth();
  if (!session?.user || !(await hasPermission(session.user.id, session.user.role, "purchaseOrderManage"))) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  const purchaseOrderId = formData.get("purchaseOrderId") as string;

  const po = await db.purchaseOrder.findUnique({
    where: { id: purchaseOrderId },
    include: { consumable: true },
  });
  if (!po) throw new Error("Purchase order not found");
  if (po.organizationId !== organizationId) throw new Error("Purchase order not found");
  if (po.status !== "APPROVED") throw new Error("Order must be approved first");

  if (!canManageRegion(session.user.role, session.user.regionId, po.regionId)) {
    throw new Error("Cannot manage this region");
  }

  await db.purchaseOrder.update({
    where: { id: purchaseOrderId },
    data: { status: "ORDERED" },
  });

  await createAuditLog({
    action: "PURCHASE_ORDER_ORDERED",
    description: `Marked purchase order for ${po.quantity} ${po.consumable.unitType} of "${po.consumable.name}" as ordered`,
    performedById: session.user.id,
    consumableId: po.consumableId,
    organizationId,
    metadata: { purchaseOrderId, quantity: po.quantity, supplier: po.supplier },
  });

  revalidatePath("/purchase-orders");
  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Super admin or permitted manager manually creates a purchase order
 */
export async function createPurchaseOrder(formData: FormData) {
  const session = await auth();
  if (!session?.user || !(await hasPermission(session.user.id, session.user.role, "purchaseOrderManage"))) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  const consumableId = formData.get("consumableId") as string;
  const quantity = parseInt(formData.get("quantity") as string);
  const supplier = (formData.get("supplier") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!consumableId) throw new Error("Consumable is required");
  if (!quantity || quantity <= 0) throw new Error("Quantity must be greater than 0");

  const consumable = await db.consumable.findUnique({ where: { id: consumableId } });
  if (!consumable || consumable.organizationId !== organizationId) throw new Error("Consumable not found");

  if (!canManageRegion(session.user.role, session.user.regionId, consumable.regionId)) {
    throw new Error("Cannot manage this region");
  }

  const po = await db.purchaseOrder.create({
    data: {
      consumableId,
      regionId: consumable.regionId,
      organizationId,
      quantity,
      supplier: supplier || consumable.supplier || null,
      status: "PENDING",
      createdById: session.user.id,
      notes,
    },
  });

  await createAuditLog({
    action: "PURCHASE_ORDER_CREATED",
    description: `Purchase order created for ${quantity}x ${consumable.name}`,
    performedById: session.user.id,
    consumableId,
    organizationId,
    metadata: { purchaseOrderId: po.id, quantity, supplier: po.supplier, manual: true },
  });

  revalidatePath("/purchase-orders");
  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Mark an ordered PO as received — auto-adds stock to consumable
 */
export async function receivePurchaseOrder(formData: FormData) {
  const session = await auth();
  if (!session?.user || !(await hasPermission(session.user.id, session.user.role, "purchaseOrderManage"))) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  const purchaseOrderId = formData.get("purchaseOrderId") as string;
  const receivedQuantity = formData.get("receivedQuantity") as string;

  const po = await db.purchaseOrder.findUnique({
    where: { id: purchaseOrderId },
    include: { consumable: true },
  });
  if (!po || po.organizationId !== organizationId) throw new Error("PO not found");
  if (po.status !== "ORDERED") throw new Error("Can only receive ordered POs");

  const qty = receivedQuantity ? parseInt(receivedQuantity) : po.quantity;
  if (!qty || qty <= 0) throw new Error("Invalid quantity");

  // Mark as received
  await db.purchaseOrder.update({
    where: { id: purchaseOrderId },
    data: { status: "RECEIVED" },
  });

  // Auto-add stock to the consumable
  await db.consumable.update({
    where: { id: po.consumableId },
    data: { quantityOnHand: { increment: qty } },
  });

  await createAuditLog({
    action: "PURCHASE_ORDER_RECEIVED",
    description: `PO received: ${qty}x ${po.consumable.name} added to stock`,
    performedById: session.user.id,
    consumableId: po.consumableId,
    organizationId,
    metadata: { purchaseOrderId, orderedQuantity: po.quantity, receivedQuantity: qty },
  });

  revalidatePath("/purchase-orders");
  revalidatePath("/consumables");
  revalidatePath("/dashboard");
  return { success: true };
}
