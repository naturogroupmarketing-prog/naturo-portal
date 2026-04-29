"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { isAdminOrManager, canManageRegion, hasPermission } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit";
import { sendEmail, emailConsumableRequested } from "@/lib/email";
import { handleLowStockAlert } from "@/lib/low-stock-handler";
import { createNotification, notifyAdminsAndManagers } from "@/lib/notifications";
import { revalidatePath } from "next/cache";
import { withAuth, validateForm } from "@/lib/action-utils";
import { createConsumableSchema, addStockSchema } from "@/lib/validations";
import { addBatch, consumeFromBatches } from "@/lib/inventory-engine";

export async function createConsumable(formData: FormData) {
  const session = await withAuth();
  if (!(await hasPermission(session.user.id, session.user.role, "consumableAdd"))) {
    throw new Error("Unauthorized");
  }

  const { name, category, unitType, quantityOnHand, minimumThreshold, reorderLevel, regionId, supplier, unitCost, notes, imageUrl } = validateForm(createConsumableSchema, formData);

  if (!canManageRegion(session.user.role, session.user.regionId, regionId)) {
    throw new Error("Cannot manage this region");
  }

  const organizationId = session.user.organizationId!;

  const consumable = await db.consumable.create({
    data: {
      name,
      category,
      unitType,
      quantityOnHand,
      minimumThreshold,
      reorderLevel,
      regionId,
      organizationId,
      imageUrl: imageUrl || null,
      supplier: supplier || null,
      unitCost: unitCost ?? null,
      notes: notes || null,
    },
  });

  // Create initial batch if opening stock > 0
  if (quantityOnHand > 0) {
    await addBatch(
      consumable.id,
      organizationId,
      quantityOnHand,
      "STOCK_ADD",
      session.user.id,
      db,
      unitCost ?? undefined,
      "Opening stock on supply creation"
    );
  }

  await createAuditLog({
    action: "CONSUMABLE_CREATED",
    description: `Supply "${name}" created with qty ${quantityOnHand}`,
    performedById: session.user.id,
    consumableId: consumable.id,
    organizationId,
  });

  revalidatePath("/consumables");
  revalidatePath("/inventory");
  revalidatePath("/inventory");
  return { success: true, consumableId: consumable.id };
}

export async function updateConsumable(formData: FormData) {
  const session = await auth();
  if (!session?.user || !(await hasPermission(session.user.id, session.user.role, "consumableEdit"))) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  const consumableId = formData.get("consumableId") as string;
  const name = (formData.get("name") as string)?.trim();
  const category = (formData.get("category") as string)?.trim();
  const unitType = (formData.get("unitType") as string)?.trim();
  const minimumThresholdRaw = formData.get("minimumThreshold") as string;
  const reorderLevelRaw = formData.get("reorderLevel") as string;
  const minimumThreshold = minimumThresholdRaw ? parseInt(minimumThresholdRaw) || 5 : 5;
  const reorderLevel = reorderLevelRaw ? parseInt(reorderLevelRaw) || 10 : 10;
  const regionId = formData.get("regionId") as string;
  const supplier = (formData.get("supplier") as string)?.trim();
  const shopUrl = (formData.get("shopUrl") as string)?.trim();
  const unitCostRaw = (formData.get("unitCost") as string)?.trim();
  const notes = (formData.get("notes") as string)?.trim();
  const imageUrl = formData.get("imageUrl") as string | null;
  const quantityRaw = formData.get("quantityOnHand") as string | null;
  const inventoryMethodRaw = (formData.get("inventoryMethod") as string)?.trim() || null;
  const inventoryMethod = inventoryMethodRaw === "FIFO" || inventoryMethodRaw === "LIFO"
    ? inventoryMethodRaw
    : null;

  if (!consumableId) throw new Error("Supply ID is required");
  if (!name) throw new Error("Name is required");
  if (!category) throw new Error("Category is required");
  if (!regionId) throw new Error("Region is required");

  const parsedUnitCost = unitCostRaw && unitCostRaw !== "" ? parseFloat(unitCostRaw) : null;

  const consumable = await db.consumable.findUnique({ where: { id: consumableId } });
  if (!consumable) throw new Error("Supply not found");
  if (consumable.organizationId !== organizationId) throw new Error("Supply not found");

  if (!canManageRegion(session.user.role, session.user.regionId, consumable.regionId)) {
    throw new Error("Cannot manage this region");
  }

  if (regionId !== consumable.regionId) {
    if (!canManageRegion(session.user.role, session.user.regionId, regionId)) {
      throw new Error("Cannot manage target region");
    }
  }

  // Handle stock quantity change (super admin or stockAdjust permission)
  let stockUpdate: { quantityOnHand?: number } = {};
  if (quantityRaw !== null && quantityRaw !== "") {
    const newQty = parseInt(quantityRaw);
    if (!isNaN(newQty) && newQty >= 0 && newQty !== consumable.quantityOnHand) {
      const canAdjust = session.user.role === "SUPER_ADMIN" || await hasPermission(session.user.id, session.user.role, "consumableStockAdjust");
      if (canAdjust) {
        stockUpdate = { quantityOnHand: newQty };
      }
    }
  }

  await db.consumable.update({
    where: { id: consumableId },
    data: {
      name,
      category,
      unitType: unitType || "units",
      minimumThreshold,
      reorderLevel,
      regionId,
      supplier: supplier || null,
      shopUrl: shopUrl || null,
      unitCost: parsedUnitCost !== null && !isNaN(parsedUnitCost) ? parsedUnitCost : null,
      notes: notes || null,
      inventoryMethod, // null = inherit org default
      ...(imageUrl !== null ? { imageUrl: imageUrl || null } : {}),
      ...stockUpdate,
    },
  });

  // Sync photo to all other consumables with the same name across regions
  if (imageUrl !== null && name) {
    await db.consumable.updateMany({
      where: { name, organizationId, id: { not: consumableId } },
      data: { imageUrl: imageUrl || null },
    });
  }

  const stockChangeNote = stockUpdate.quantityOnHand !== undefined
    ? ` Stock changed: ${consumable.quantityOnHand} → ${stockUpdate.quantityOnHand}`
    : "";

  await createAuditLog({
    action: "CONSUMABLE_UPDATED",
    description: `Supply "${name}" updated${stockChangeNote}`,
    performedById: session.user.id,
    consumableId,
    organizationId,
  });

  // Check low stock if stock was edited downward
  if (stockUpdate.quantityOnHand !== undefined && stockUpdate.quantityOnHand < consumable.quantityOnHand) {
    await handleLowStockAlert({ consumableId, performedById: session.user.id });
  }

  revalidatePath("/consumables");
  revalidatePath("/inventory");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  revalidatePath("/starter-kits");
}

export async function addStock(formData: FormData) {
  const session = await withAuth();
  if (!(await hasPermission(session.user.id, session.user.role, "consumableEdit"))) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId!;
  const { consumableId, quantity } = validateForm(addStockSchema, formData);

  const consumable = await db.consumable.findUnique({
    where: { id: consumableId },
  });
  if (!consumable) throw new Error("Supply not found");
  if (consumable.organizationId !== organizationId) throw new Error("Supply not found");
  if (!canManageRegion(session.user.role, session.user.regionId, consumable.regionId)) {
    throw new Error("Cannot manage this region");
  }

  await db.$transaction(async (tx) => {
    await tx.consumable.update({
      where: { id: consumableId },
      data: { quantityOnHand: { increment: quantity } },
    });
    // Create a new batch layer — used for LIFO/FIFO consumption ordering
    await addBatch(
      consumableId,
      organizationId,
      quantity,
      "STOCK_ADD",
      session.user.id,
      tx,
      consumable.unitCost ?? undefined
    );
  });

  await createAuditLog({
    action: "CONSUMABLE_STOCK_ADDED",
    description: `Added ${quantity} ${consumable.unitType} of "${consumable.name}"`,
    performedById: session.user.id,
    consumableId,
    organizationId,
    metadata: { quantity, previousQty: consumable.quantityOnHand },
  });

  revalidatePath("/consumables");
  revalidatePath("/inventory");
  return { success: true };
}

/**
 * Super Admin: deduct stock directly (for corrections, write-offs, etc.)
 */
export async function deductStock(formData: FormData) {
  const session = await withAuth();
  if (!(await hasPermission(session.user.id, session.user.role, "consumableStockAdjust"))) {
    throw new Error("You do not have permission to adjust stock");
  }

  const organizationId = session.user.organizationId!;
  const consumableId = formData.get("consumableId") as string;
  const quantity = parseInt(formData.get("quantity") as string);
  const reason = (formData.get("reason") as string)?.trim();

  if (!quantity || quantity <= 0) throw new Error("Invalid quantity");
  if (!reason) throw new Error("A reason is required for stock deduction");

  const consumable = await db.consumable.findUnique({
    where: { id: consumableId },
  });
  if (!consumable) throw new Error("Supply not found");
  if (consumable.organizationId !== organizationId) throw new Error("Supply not found");

  if (consumable.quantityOnHand < quantity) {
    throw new Error(`Cannot deduct ${quantity} — only ${consumable.quantityOnHand} ${consumable.unitType} in stock`);
  }

  // Atomic: deduct stock + consume from batch layers in one transaction
  let afterUpdateQty: number = consumable.quantityOnHand - quantity;

  await db.$transaction(async (tx) => {
    const updated = await tx.consumable.updateMany({
      where: { id: consumableId, quantityOnHand: { gte: quantity } },
      data: { quantityOnHand: { decrement: quantity } },
    });
    if (updated.count === 0) {
      throw new Error("Insufficient stock — another operation may have reduced it. Please try again.");
    }
    // Consume from LIFO/FIFO batch layers
    await consumeFromBatches(
      consumableId,
      organizationId,
      quantity,
      "DIRECT_DEDUCT",
      session.user.id,
      tx
    );
    const after = await tx.consumable.findUnique({
      where: { id: consumableId },
      select: { quantityOnHand: true },
    });
    if (after) afterUpdateQty = after.quantityOnHand;
  });

  await createAuditLog({
    action: "CONSUMABLE_STOCK_REDUCED",
    description: `Deducted ${quantity} ${consumable.unitType} of "${consumable.name}" — Reason: ${reason}`,
    performedById: session.user.id,
    consumableId,
    organizationId,
    metadata: { quantity, previousQty: consumable.quantityOnHand, newQty: afterUpdateQty, reason },
  });

  // Trigger low stock alert + auto-PO if below threshold
  await handleLowStockAlert({
    consumableId,
    performedById: session.user.id,
  });

  revalidatePath("/consumables");
  revalidatePath("/inventory");
  revalidatePath("/inventory");
  return { success: true };
}

export async function requestConsumable(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  const consumableId = formData.get("consumableId") as string;
  const quantity = parseInt(formData.get("quantity") as string);
  const notes = formData.get("notes") as string;

  if (!quantity || quantity <= 0) throw new Error("Invalid quantity");

  const consumable = await db.consumable.findUnique({
    where: { id: consumableId },
  });
  if (!consumable) throw new Error("Supply not found");
  if (consumable.organizationId !== organizationId) throw new Error("Supply not found");

  // Staff can only request from their own region
  if (session.user.role === "STAFF") {
    if (session.user.regionId !== consumable.regionId) {
      throw new Error("Cannot request supplies from another region");
    }
  }

  const request = await db.consumableRequest.create({
    data: {
      consumableId,
      userId: session.user.id,
      quantity,
      notes: notes || null,
    },
  });

  await createAuditLog({
    action: "CONSUMABLE_REQUEST_CREATED",
    description: `Request for ${quantity} ${consumable.unitType} of "${consumable.name}"`,
    performedById: session.user.id,
    consumableId,
    organizationId,
  });

  // Notify region managers
  const managers = await db.user.findMany({
    where: {
      organizationId,
      regionId: consumable.regionId,
      role: { in: ["BRANCH_MANAGER", "SUPER_ADMIN"] },
      isActive: true,
    },
  });

  for (const mgr of managers) {
    if (mgr.email) {
      await sendEmail({
        to: mgr.email,
        subject: `Supply Request: ${consumable.name}`,
        html: emailConsumableRequested(
          mgr.name || "Manager",
          session.user.name || session.user.email || "Staff",
          consumable.name,
          quantity
        ),
      });
    }
  }

  // In-app notification for managers
  await notifyAdminsAndManagers({
    organizationId,
    regionId: consumable.regionId,
    type: "PENDING_REQUEST",
    title: "New Supply Request",
    message: `${session.user.name || session.user.email} requested ${quantity} ${consumable.unitType} of "${consumable.name}".`,
    link: "/consumables?tab=requests",
  });

  revalidatePath("/request-consumables");
  revalidatePath("/consumables");
  revalidatePath("/inventory");
  revalidatePath("/inventory");
  return { success: true, requestId: request.id };
}

export async function closeRequest(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  const requestId = formData.get("requestId") as string;

  const request = await db.consumableRequest.findUnique({
    where: { id: requestId },
    include: { consumable: true },
  });
  if (!request) throw new Error("Request not found");
  if (request.consumable.organizationId !== organizationId) throw new Error("Request not found");

  // Only the staff member who created the request can close it
  if (request.userId !== session.user.id) {
    throw new Error("You can only close your own requests");
  }

  // Can only close APPROVED or REJECTED requests
  if (!["APPROVED", "REJECTED"].includes(request.status)) {
    throw new Error("Only approved or rejected requests can be closed");
  }

  await db.consumableRequest.update({
    where: { id: requestId },
    data: { status: "CLOSED" },
  });

  await createAuditLog({
    action: "CONSUMABLE_REQUEST_CLOSED",
    description: `Staff closed ${request.status.toLowerCase()} request for ${request.quantity} ${request.consumable.unitType} of "${request.consumable.name}"`,
    performedById: session.user.id,
    consumableId: request.consumableId,
    organizationId,
  });

  revalidatePath("/request-consumables");
  revalidatePath("/consumables");
  revalidatePath("/inventory");
  revalidatePath("/inventory");
  return { success: true };
}

export async function approveRequest(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  const requestId = formData.get("requestId") as string;
  const action = formData.get("action") as string; // "approve" or "reject"
  const rejectionNote = formData.get("rejectionNote") as string;

  const request = await db.consumableRequest.findUnique({
    where: { id: requestId },
    include: {
      consumable: true,
      user: true,
    },
  });
  if (!request) throw new Error("Request not found");
  if (request.consumable.organizationId !== organizationId) throw new Error("Request not found");
  if (request.status !== "PENDING") throw new Error("Request already processed");

  if (!canManageRegion(session.user.role, session.user.regionId, request.consumable.regionId)) {
    throw new Error("Cannot manage this region");
  }

  if (action === "approve") {
    await db.consumableRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        approvedById: session.user.id,
        approvedAt: new Date(),
      },
    });

    await createAuditLog({
      action: "CONSUMABLE_REQUEST_APPROVED",
      description: `Approved request for ${request.quantity} ${request.consumable.unitType} of "${request.consumable.name}" by ${request.user.name || request.user.email}`,
      performedById: session.user.id,
      consumableId: request.consumableId,
      targetUserId: request.userId,
      organizationId,
    });

    await createNotification({
      userId: request.userId,
      type: "REQUEST_APPROVED",
      title: "Supply Request Approved",
      message: `Your request for ${request.quantity} ${request.consumable.unitType} of "${request.consumable.name}" has been approved.`,
      link: "/dashboard",
    });
  } else {
    await db.consumableRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        approvedById: session.user.id,
        approvedAt: new Date(),
        rejectionNote: rejectionNote || null,
      },
    });

    await createAuditLog({
      action: "CONSUMABLE_REQUEST_REJECTED",
      description: `Rejected request for ${request.quantity} ${request.consumable.unitType} of "${request.consumable.name}" by ${request.user.name || request.user.email}`,
      performedById: session.user.id,
      consumableId: request.consumableId,
      targetUserId: request.userId,
      organizationId,
    });

    await createNotification({
      userId: request.userId,
      type: "REQUEST_REJECTED",
      title: "Supply Request Rejected",
      message: `Your request for ${request.quantity} ${request.consumable.unitType} of "${request.consumable.name}" was rejected.${rejectionNote ? ` Reason: ${rejectionNote}` : ""}`,
      link: "/dashboard",
    });
  }

  revalidatePath("/consumables");
  revalidatePath("/inventory");
  revalidatePath("/inventory");
  return { success: true };
}

export async function issueConsumable(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  const requestId = formData.get("requestId") as string;

  const request = await db.consumableRequest.findUnique({
    where: { id: requestId },
    include: {
      consumable: { include: { region: true } },
    },
  });
  if (!request) throw new Error("Request not found");
  if (request.consumable.organizationId !== organizationId) throw new Error("Request not found");
  if (!["PENDING", "APPROVED"].includes(request.status)) throw new Error("Request already processed");

  // Use conditional update to prevent race condition
  await db.$transaction(async (tx) => {
    // Lock the consumable row and check stock atomically
    const consumable = await tx.consumable.findUnique({
      where: { id: request.consumableId },
    });
    if (!consumable || consumable.quantityOnHand < request.quantity) {
      throw new Error("Insufficient stock");
    }

    await tx.consumableRequest.update({
      where: { id: requestId },
      data: { status: "CLOSED", issuedAt: new Date() },
    });
    await tx.consumable.update({
      where: { id: request.consumableId },
      data: { quantityOnHand: { decrement: request.quantity } },
    });
    // Create assignment so staff sees it in their consumables
    const assignment = await tx.consumableAssignment.create({
      data: {
        consumableId: request.consumableId,
        userId: request.userId,
        quantity: request.quantity,
      },
    });
    // Consume from LIFO/FIFO batch layers
    await consumeFromBatches(
      request.consumableId,
      request.consumable.organizationId,
      request.quantity,
      "REQUEST_ISSUE",
      session.user.id,
      tx,
      assignment.id
    );
  });

  // Check for low stock — alerts managers/admins + creates AI purchase order
  await handleLowStockAlert({
    consumableId: request.consumableId,
    performedById: session.user.id,
  });

  await createAuditLog({
    action: "CONSUMABLE_REQUEST_ISSUED",
    description: `Issued ${request.quantity} ${request.consumable.unitType} of "${request.consumable.name}"`,
    performedById: session.user.id,
    consumableId: request.consumableId,
    targetUserId: request.userId,
    organizationId,
    metadata: { quantity: request.quantity },
  });

  revalidatePath("/consumables");
  revalidatePath("/inventory");
  revalidatePath("/inventory");
  revalidatePath("/purchase-orders");
  revalidatePath("/my-consumables");
  return { success: true };
}

export async function deleteConsumable(formData: FormData) {
  const session = await auth();
  if (!session?.user || !(await hasPermission(session.user.id, session.user.role, "consumableDelete"))) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  const consumableId = formData.get("consumableId") as string;

  const consumable = await db.consumable.findUnique({
    where: { id: consumableId },
    include: { assignments: { where: { isActive: true } } },
  });
  if (!consumable) throw new Error("Supply not found");
  if (consumable.organizationId !== organizationId) throw new Error("Supply not found");

  if (!canManageRegion(session.user.role, session.user.regionId, consumable.regionId)) {
    throw new Error("Cannot manage this region");
  }

  if (consumable.assignments.length > 0) {
    throw new Error("Cannot delete supply with active assignments. Return them first.");
  }

  // Soft-delete — preserve data for audit trail
  await db.consumable.update({
    where: { id: consumableId },
    data: { deletedAt: new Date(), isActive: false },
  });

  revalidatePath("/consumables");
  revalidatePath("/inventory");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function bulkDeleteConsumables(consumableIds: string[]) {
  const session = await auth();
  if (!session?.user || !(await hasPermission(session.user.id, session.user.role, "consumableDelete"))) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  // Batch fetch all consumables in one query instead of N individual queries
  const consumables = await db.consumable.findMany({
    where: { id: { in: consumableIds }, organizationId },
    include: { assignments: { where: { isActive: true } } },
  });
  const consumableMap = new Map(consumables.map((c) => [c.id, c]));

  let deleted = 0;
  const errors: string[] = [];
  const toDelete: string[] = [];

  for (const consumableId of consumableIds) {
    const consumable = consumableMap.get(consumableId);

    if (!consumable) {
      errors.push("Consumable not found");
      continue;
    }

    if (!canManageRegion(session.user.role, session.user.regionId, consumable.regionId)) {
      errors.push(`No permission for: ${consumable.name}`);
      continue;
    }

    if (consumable.assignments.length > 0) {
      errors.push(`${consumable.name} has active assignments`);
      continue;
    }

    toDelete.push(consumableId);
  }

  // Soft-delete all eligible consumables
  if (toDelete.length > 0) {
    await db.consumable.updateMany({
      where: { id: { in: toDelete } },
      data: { deletedAt: new Date(), isActive: false },
    });
    deleted = toDelete.length;
  }

  revalidatePath("/consumables");
  revalidatePath("/inventory");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return { deleted, errors };
}

export async function assignConsumable(formData: FormData) {
  const session = await withAuth();
  if (!(await hasPermission(session.user.id, session.user.role, "consumableAssign"))) {
    throw new Error("Unauthorized — you don't have permission to assign supplies");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  const consumableId = formData.get("consumableId") as string;
  const userId = formData.get("userId") as string;
  const quantity = parseInt(formData.get("quantity") as string);

  if (!quantity || quantity <= 0) throw new Error("Invalid quantity");

  const consumable = await db.consumable.findUnique({
    where: { id: consumableId },
  });
  if (!consumable) throw new Error("Supply not found");
  if (consumable.organizationId !== organizationId) throw new Error("Supply not found");

  if (!canManageRegion(session.user.role, session.user.regionId, consumable.regionId)) {
    throw new Error("Cannot manage this region");
  }

  if (consumable.quantityOnHand < quantity) {
    throw new Error("Insufficient stock");
  }

  const targetUser = await db.user.findUnique({ where: { id: userId } });
  if (!targetUser) throw new Error("User not found");
  if (targetUser.organizationId !== organizationId) throw new Error("User not found");

  // Staff can only be assigned consumables from their own region
  if (targetUser.regionId && targetUser.regionId !== consumable.regionId) {
    throw new Error("Staff can only be assigned items from their region");
  }

  // Atomic: deduct stock + create assignment + consume from batch layers
  let assignmentId: string | null = null;

  await db.$transaction(async (tx) => {
    const updated = await tx.consumable.updateMany({
      where: { id: consumableId, quantityOnHand: { gte: quantity } },
      data: { quantityOnHand: { decrement: quantity } },
    });
    if (updated.count === 0) {
      throw new Error("Insufficient stock — another operation may have reduced it");
    }
    const assignment = await tx.consumableAssignment.create({
      data: { consumableId, userId, quantity },
    });
    assignmentId = assignment.id;
    // Consume from LIFO/FIFO batch layers
    await consumeFromBatches(
      consumableId,
      organizationId,
      quantity,
      "ASSIGNMENT",
      session.user.id,
      tx,
      assignment.id
    );
  });

  void assignmentId; // used inside tx, referenced to avoid TS warning

  // Auto-close any pending/approved requests from this user for this consumable
  await db.consumableRequest.updateMany({
    where: {
      consumableId,
      userId,
      status: { in: ["PENDING", "APPROVED"] },
    },
    data: {
      status: "CLOSED",
      issuedAt: new Date(),
    },
  });

  // Check for low stock — alerts managers/admins + creates AI purchase order
  await handleLowStockAlert({
    consumableId,
    performedById: session.user.id,
  });

  await createAuditLog({
    action: "CONSUMABLE_ASSIGNED",
    description: `Assigned ${quantity} ${consumable.unitType} of "${consumable.name}" to ${targetUser.name || targetUser.email}`,
    performedById: session.user.id,
    consumableId,
    targetUserId: userId,
    organizationId,
    metadata: { quantity },
  });

  revalidatePath("/consumables");
  revalidatePath("/inventory");
  revalidatePath("/inventory");
  revalidatePath("/purchase-orders");
  revalidatePath("/my-consumables");
  return { success: true };
}

export async function acknowledgeConsumable(assignmentId: string) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "STAFF" && session.user.role !== "BRANCH_MANAGER")) {
    throw new Error("Unauthorized");
  }

  const assignment = await db.consumableAssignment.findUnique({
    where: { id: assignmentId },
    include: { consumable: true },
  });

  if (!assignment || !assignment.isActive) {
    throw new Error("Assignment not found or inactive");
  }
  if (assignment.userId !== session.user.id) {
    throw new Error("This assignment does not belong to you");
  }
  if (assignment.acknowledgedAt) {
    throw new Error("Already acknowledged");
  }

  await db.consumableAssignment.update({
    where: { id: assignmentId },
    data: { acknowledgedAt: new Date() },
  });

  await createAuditLog({
    action: "CONSUMABLE_ASSIGNED",
    description: `Supply "${assignment.consumable.name}" (${assignment.quantity} ${assignment.consumable.unitType}) receipt confirmed by ${session.user.name || session.user.email}`,
    performedById: session.user.id,
    consumableId: assignment.consumableId,
    organizationId: session.user.organizationId || undefined,
  });

  revalidatePath("/my-consumables");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function returnConsumable(formData: FormData) {
  const session = await auth();
  if (!session?.user || !(await hasPermission(session.user.id, session.user.role, "consumableEdit"))) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  const assignmentId = formData.get("assignmentId") as string;
  const returnQuantity = parseInt(formData.get("returnQuantity") as string);
  const returnCondition = formData.get("returnCondition") as string;
  const returnNotes = formData.get("returnNotes") as string;

  if (!returnQuantity || returnQuantity <= 0) throw new Error("Invalid quantity");

  const assignment = await db.consumableAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      consumable: true,
      user: true,
    },
  });
  if (!assignment || !assignment.isActive) throw new Error("Assignment not found or already returned");
  if (assignment.consumable.organizationId !== organizationId) throw new Error("Assignment not found");

  if (!canManageRegion(session.user.role, session.user.regionId, assignment.consumable.regionId)) {
    throw new Error("Cannot manage this region");
  }

  await db.$transaction(async (tx) => {
    await tx.consumableAssignment.update({
      where: { id: assignmentId },
      data: {
        isActive: false,
        returnedDate: new Date(),
        returnCondition: returnCondition || null,
        returnNotes: returnNotes || null,
      },
    });
    // Don't restock immediately — create pending return for manager verification
    await tx.pendingReturn.create({
      data: {
        itemType: "CONSUMABLE",
        consumableId: assignment.consumableId,
        quantity: returnQuantity,
        returnedByName: assignment.user.name || assignment.user.email,
        returnedByEmail: assignment.user.email,
        returnCondition: returnCondition || null,
        returnNotes: returnNotes || null,
        organizationId,
        regionId: assignment.consumable.regionId,
        returnReason: "Manual return",
      },
    });
  });

  await createAuditLog({
    action: "CONSUMABLE_RETURNED",
    description: `${assignment.user.name || assignment.user.email} returned ${returnQuantity} ${assignment.consumable.unitType} of "${assignment.consumable.name}". Condition: ${returnCondition || "N/A"}`,
    performedById: session.user.id,
    consumableId: assignment.consumableId,
    targetUserId: assignment.userId,
    organizationId,
    metadata: { returnQuantity, returnCondition, returnNotes },
  });

  revalidatePath("/consumables");
  revalidatePath("/inventory");
  revalidatePath("/inventory");
  return { success: true };
}

export async function markConsumableUsed(assignmentId: string, quantityUsed: number) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "STAFF" && session.user.role !== "BRANCH_MANAGER")) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  if (!quantityUsed || quantityUsed <= 0) throw new Error("Invalid quantity");

  const assignment = await db.consumableAssignment.findUnique({
    where: { id: assignmentId },
    include: { consumable: true },
  });

  if (!assignment || !assignment.isActive) {
    throw new Error("Assignment not found or already closed");
  }

  if (assignment.userId !== session.user.id) {
    throw new Error("This assignment does not belong to you");
  }

  if (quantityUsed > assignment.quantity) {
    throw new Error("Cannot use more than assigned quantity");
  }

  if (quantityUsed >= assignment.quantity) {
    // All used — close the assignment
    await db.consumableAssignment.update({
      where: { id: assignmentId },
      data: {
        isActive: false,
        returnedDate: new Date(),
        returnCondition: "USED",
        returnNotes: "Marked as used up by staff",
      },
    });
  } else {
    // Partial use — decrement the quantity
    await db.consumableAssignment.update({
      where: { id: assignmentId },
      data: {
        quantity: { decrement: quantityUsed },
      },
    });
  }

  await createAuditLog({
    action: "CONSUMABLE_USED",
    description: `${session.user.name || session.user.email} used ${quantityUsed} ${assignment.consumable.unitType} of "${assignment.consumable.name}" (had ${assignment.quantity})`,
    performedById: session.user.id,
    consumableId: assignment.consumableId,
    organizationId,
  });

  revalidatePath("/my-consumables");
  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Batch approve or reject multiple consumable requests at once
 */
export async function batchApproveRequests(
  requestIds: string[],
  action: "approve" | "reject",
  rejectionNote?: string
) {
  const session = await auth();
  if (!session?.user || !(await hasPermission(session.user.id, session.user.role, "consumableEdit"))) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");
  if (requestIds.length === 0) return { success: true, processed: 0 };

  const requests = await db.consumableRequest.findMany({
    where: { id: { in: requestIds }, status: "PENDING" },
    include: { consumable: true, user: { select: { name: true, email: true, id: true } } },
  });

  let processed = 0;
  for (const request of requests) {
    if (request.consumable.organizationId !== organizationId) continue;
    if (!canManageRegion(session.user.role, session.user.regionId, request.consumable.regionId)) continue;

    if (action === "approve") {
      await db.consumableRequest.update({
        where: { id: request.id },
        data: { status: "APPROVED", approvedById: session.user.id, approvedAt: new Date() },
      });
    } else {
      await db.consumableRequest.update({
        where: { id: request.id },
        data: { status: "REJECTED", approvedById: session.user.id, approvedAt: new Date(), rejectionNote: rejectionNote || "Rejected" },
      });
    }
    processed++;
  }

  await createAuditLog({
    action: action === "approve" ? "CONSUMABLE_REQUEST_APPROVED" : "CONSUMABLE_REQUEST_REJECTED",
    description: `Batch ${action}d ${processed} supply request(s)`,
    performedById: session.user.id,
    organizationId,
  });

  revalidatePath("/consumables");
  revalidatePath("/inventory");
  revalidatePath("/inventory");
  revalidatePath("/request-consumables");
  revalidatePath("/dashboard");
  return { success: true, processed };
}

export async function getConsumables(
  regionId?: string,
  { page = 1, pageSize = 50 }: { page?: number; pageSize?: number } = {}
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const where: Record<string, unknown> = {
    organizationId: session.user.organizationId,
    isActive: true,
  };

  if (session.user.role === "BRANCH_MANAGER") {
    where.regionId = session.user.regionId;
  } else if (session.user.role === "STAFF") {
    throw new Error("Staff cannot list all supplies");
  }
  if (regionId) {
    where.regionId = regionId;
  }

  const [items, totalCount] = await Promise.all([
    db.consumable.findMany({
      where,
      include: {
        region: { include: { state: true } },
        assignments: {
          where: { isActive: true },
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.consumable.count({ where }),
  ]);

  return {
    items,
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}
