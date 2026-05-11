import { db } from "@/lib/db";

/**
 * Auto-sync: creates PENDING purchase orders for any low-stock consumables
 * that don't already have an active PO. Runs silently on page load.
 */
export async function autoSyncLowStockPOs(organizationId: string) {
  const lowStock = await db.consumable.findMany({
    where: { organizationId, isActive: true },
    select: { id: true, quantityOnHand: true, minimumThreshold: true, reorderLevel: true, regionId: true, supplier: true, organizationId: true },
  });

  const belowThreshold = lowStock.filter((c) => c.quantityOnHand <= c.minimumThreshold);
  if (belowThreshold.length === 0) return;

  const existingPOs = await db.purchaseOrder.findMany({
    where: { organizationId, status: { in: ["PENDING", "APPROVED", "ORDERED"] } },
    select: { consumableId: true },
  });
  const hasActivePO = new Set(existingPOs.map((po) => po.consumableId));

  for (const item of belowThreshold) {
    if (hasActivePO.has(item.id)) continue;
    await db.purchaseOrder.create({
      data: {
        consumableId: item.id,
        regionId: item.regionId,
        organizationId: item.organizationId,
        quantity: Math.max(item.reorderLevel - item.quantityOnHand, 1),
        supplier: item.supplier,
        status: "PENDING",
        createdById: null,
        notes: `Auto-generated: Stock (${item.quantityOnHand}) at or below threshold (${item.minimumThreshold}).`,
      },
    });
  }
}
