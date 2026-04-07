"use server";

import { db } from "@/lib/db";
import { canManageRegion, hasPermission } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import type { PurchaseOrderStatus } from "@/generated/prisma/client";
import { withAuth } from "@/lib/action-utils";

export async function approvePurchaseOrder(formData: FormData) {
  const session = await withAuth();
  // Super admin can always approve; branch managers need purchaseOrderApprove permission
  const canApprove = session.user.role === "SUPER_ADMIN" || await hasPermission(session.user.id, session.user.role, "purchaseOrderApprove");
  if (!canApprove) {
    throw new Error("Unauthorized — only super admins or managers with approve permission can approve/reject orders");
  }

  const organizationId = session.user.organizationId!;

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
  const session = await withAuth();
  if (!(await hasPermission(session.user.id, session.user.role, "purchaseOrderManage"))) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId!;

  const purchaseOrderId = formData.get("purchaseOrderId") as string;
  const quantity = parseInt(formData.get("quantity") as string, 10);
  const supplier = (formData.get("supplier") as string) || null;
  const notes = (formData.get("notes") as string) || null;
  const status = formData.get("status") as string;

  if (!purchaseOrderId || !quantity || quantity < 1) {
    throw new Error("Invalid data");
  }

  // Check if user is allowed to change quantity
  const canEditQty = session.user.role === "SUPER_ADMIN" || await hasPermission(session.user.id, session.user.role, "purchaseOrderEditQty");

  const existingPo = await db.purchaseOrder.findUnique({ where: { id: purchaseOrderId }, select: { quantity: true } });
  if (existingPo && existingPo.quantity !== quantity && !canEditQty) {
    throw new Error("You don't have permission to adjust purchase order quantities");
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
  const session = await withAuth();
  const canOrder = session.user.role === "SUPER_ADMIN" || await hasPermission(session.user.id, session.user.role, "purchaseOrderApprove");
  if (!canOrder) {
    throw new Error("Unauthorized — only super admins or managers with approve permission can mark orders");
  }

  const organizationId = session.user.organizationId!;

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
  const session = await withAuth();
  if (!(await hasPermission(session.user.id, session.user.role, "purchaseOrderManage"))) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId!;

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
  const session = await withAuth();
  if (!(await hasPermission(session.user.id, session.user.role, "purchaseOrderManage"))) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId!;

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

/**
 * Sync: create PENDING purchase orders for any low-stock consumables
 * that don't already have a PENDING or ORDERED PO.
 */
export async function syncLowStockPOs() {
  const session = await withAuth();
  if (session.user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

  const organizationId = session.user.organizationId!;

  // Find all low-stock consumables
  const lowStock = await db.consumable.findMany({
    where: { organizationId, isActive: true, deletedAt: null },
    select: {
      id: true, name: true, unitType: true, quantityOnHand: true,
      minimumThreshold: true, reorderLevel: true, regionId: true,
      supplier: true, organizationId: true,
    },
  });

  const belowThreshold = lowStock.filter((c) => c.quantityOnHand <= c.minimumThreshold);

  // Find existing PENDING or ORDERED POs
  const existingPOs = await db.purchaseOrder.findMany({
    where: {
      organizationId,
      status: { in: ["PENDING", "ORDERED", "APPROVED"] },
    },
    select: { consumableId: true },
  });
  const hasActivePO = new Set(existingPOs.map((po) => po.consumableId));

  // Create POs for items without one
  let created = 0;
  for (const item of belowThreshold) {
    if (hasActivePO.has(item.id)) continue;

    const suggestedQty = Math.max(item.reorderLevel - item.quantityOnHand, 1);

    await db.purchaseOrder.create({
      data: {
        consumableId: item.id,
        regionId: item.regionId,
        organizationId: item.organizationId,
        quantity: suggestedQty,
        supplier: item.supplier,
        status: "PENDING",
        createdById: null,
        notes: `Auto-generated: Stock (${item.quantityOnHand}) is at or below threshold (${item.minimumThreshold}). Suggested reorder to level ${item.reorderLevel}.`,
      },
    });
    created++;
  }

  if (created > 0) {
    await createAuditLog({
      action: "PURCHASE_ORDER_CREATED",
      description: `Synced ${created} missing purchase orders for low-stock items`,
      performedById: session.user.id,
      organizationId,
    });
  }

  revalidatePath("/purchase-orders");
  revalidatePath("/alerts/low-stock");
  revalidatePath("/dashboard");
  return { success: true, created, alreadyHadPO: belowThreshold.length - created };
}
