"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { isAdminOrManager, canManageRegion, hasPermission } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit";
import { sendEmail, emailConsumableRequested } from "@/lib/email";
import { handleLowStockAlert } from "@/lib/low-stock-handler";
import { createNotification, notifyAdminsAndManagers } from "@/lib/notifications";
import { revalidatePath } from "next/cache";

export async function createConsumable(formData: FormData) {
  const session = await auth();
  if (!session?.user || !(await hasPermission(session.user.id, session.user.role, "consumableAdd"))) {
    throw new Error("Unauthorized");
  }

  const name = (formData.get("name") as string)?.trim();
  const category = (formData.get("category") as string)?.trim();
  const unitType = (formData.get("unitType") as string)?.trim();
  const quantityOnHand = parseInt(formData.get("quantityOnHand") as string) || 0;
  const minimumThreshold = parseInt(formData.get("minimumThreshold") as string) || 5;
  const reorderLevel = parseInt(formData.get("reorderLevel") as string) || 10;
  const regionId = formData.get("regionId") as string;
  const supplier = (formData.get("supplier") as string)?.trim();
  const unitCost = formData.get("unitCost") as string;
  const notes = (formData.get("notes") as string)?.trim();
  const imageUrl = formData.get("imageUrl") as string;

  if (!canManageRegion(session.user.role, session.user.regionId, regionId)) {
    throw new Error("Cannot manage this region");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

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
      unitCost: unitCost ? parseFloat(unitCost) : null,
      notes: notes || null,
    },
  });

  await createAuditLog({
    action: "CONSUMABLE_CREATED",
    description: `Consumable "${name}" created with qty ${quantityOnHand}`,
    performedById: session.user.id,
    consumableId: consumable.id,
    organizationId,
  });

  revalidatePath("/consumables");
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
  const minimumThreshold = parseInt(formData.get("minimumThreshold") as string) || 5;
  const reorderLevel = parseInt(formData.get("reorderLevel") as string) || 10;
  const regionId = formData.get("regionId") as string;
  const supplier = (formData.get("supplier") as string)?.trim();
  const unitCost = formData.get("unitCost") as string;
  const notes = (formData.get("notes") as string)?.trim();

  const consumable = await db.consumable.findUnique({ where: { id: consumableId } });
  if (!consumable) throw new Error("Consumable not found");
  if (consumable.organizationId !== organizationId) throw new Error("Consumable not found");

  if (!canManageRegion(session.user.role, session.user.regionId, consumable.regionId)) {
    throw new Error("Cannot manage this region");
  }

  if (regionId !== consumable.regionId) {
    if (!canManageRegion(session.user.role, session.user.regionId, regionId)) {
      throw new Error("Cannot manage target region");
    }
  }

  const updated = await db.consumable.update({
    where: { id: consumableId },
    data: {
      name,
      category,
      unitType,
      minimumThreshold,
      reorderLevel,
      regionId,
      supplier: supplier || null,
      unitCost: unitCost ? parseFloat(unitCost) : null,
      notes: notes || null,
    },
  });

  await createAuditLog({
    action: "CONSUMABLE_UPDATED",
    description: `Consumable "${updated.name}" updated`,
    performedById: session.user.id,
    consumableId,
    organizationId,
  });

  revalidatePath("/consumables");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function addStock(formData: FormData) {
  const session = await auth();
  if (!session?.user || !(await hasPermission(session.user.id, session.user.role, "consumableEdit"))) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  const consumableId = formData.get("consumableId") as string;
  const quantity = parseInt(formData.get("quantity") as string);
  if (!quantity || quantity <= 0) throw new Error("Invalid quantity");

  const consumable = await db.consumable.findUnique({
    where: { id: consumableId },
  });
  if (!consumable) throw new Error("Consumable not found");
  if (consumable.organizationId !== organizationId) throw new Error("Consumable not found");
  if (!canManageRegion(session.user.role, session.user.regionId, consumable.regionId)) {
    throw new Error("Cannot manage this region");
  }

  await db.consumable.update({
    where: { id: consumableId },
    data: { quantityOnHand: { increment: quantity } },
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
  if (!consumable) throw new Error("Consumable not found");
  if (consumable.organizationId !== organizationId) throw new Error("Consumable not found");

  // Staff can only request from their own region
  if (session.user.role === "STAFF") {
    if (session.user.regionId !== consumable.regionId) {
      throw new Error("Cannot request consumables from another region");
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
        subject: `Consumable Request: ${consumable.name}`,
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
    title: "New Consumable Request",
    message: `${session.user.name || session.user.email} requested ${quantity} ${consumable.unitType} of "${consumable.name}".`,
    link: "/consumables?tab=requests",
  });

  revalidatePath("/my-requests");
  revalidatePath("/consumables");
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

  revalidatePath("/my-requests");
  revalidatePath("/consumables");
  return { success: true };
}

export async function approveRequest(formData: FormData) {
  const session = await auth();
  if (!session?.user || !(await hasPermission(session.user.id, session.user.role, "consumableEdit"))) {
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
      title: "Consumable Request Approved",
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
      title: "Consumable Request Rejected",
      message: `Your request for ${request.quantity} ${request.consumable.unitType} of "${request.consumable.name}" was rejected.${rejectionNote ? ` Reason: ${rejectionNote}` : ""}`,
      link: "/dashboard",
    });
  }

  revalidatePath("/consumables");
  return { success: true };
}

export async function issueConsumable(formData: FormData) {
  const session = await auth();
  if (!session?.user || !(await hasPermission(session.user.id, session.user.role, "consumableEdit"))) {
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
    await tx.consumableAssignment.create({
      data: {
        consumableId: request.consumableId,
        userId: request.userId,
        quantity: request.quantity,
      },
    });
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
  if (!consumable) throw new Error("Consumable not found");
  if (consumable.organizationId !== organizationId) throw new Error("Consumable not found");

  if (!canManageRegion(session.user.role, session.user.regionId, consumable.regionId)) {
    throw new Error("Cannot manage this region");
  }

  if (consumable.assignments.length > 0) {
    throw new Error("Cannot delete consumable with active assignments. Return them first.");
  }

  // Delete related records first, then the consumable
  await db.$transaction([
    db.auditLog.deleteMany({ where: { consumableId } }),
    db.consumableAssignment.deleteMany({ where: { consumableId } }),
    db.consumableRequest.deleteMany({ where: { consumableId } }),
    db.consumable.delete({ where: { id: consumableId } }),
  ]);

  revalidatePath("/consumables");
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

  let deleted = 0;
  const errors: string[] = [];

  for (const consumableId of consumableIds) {
    const consumable = await db.consumable.findUnique({
      where: { id: consumableId },
      include: { assignments: { where: { isActive: true } } },
    });

    if (!consumable) {
      errors.push("Consumable not found");
      continue;
    }

    if (consumable.organizationId !== organizationId) {
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

    await db.$transaction([
      db.auditLog.deleteMany({ where: { consumableId } }),
      db.consumableAssignment.deleteMany({ where: { consumableId } }),
      db.consumableRequest.deleteMany({ where: { consumableId } }),
      db.consumable.delete({ where: { id: consumableId } }),
    ]);

    deleted++;
  }

  revalidatePath("/consumables");
  revalidatePath("/dashboard");
  return { deleted, errors };
}

export async function assignConsumable(formData: FormData) {
  const session = await auth();
  if (!session?.user || !(await hasPermission(session.user.id, session.user.role, "consumableEdit"))) {
    throw new Error("Unauthorized");
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
  if (!consumable) throw new Error("Consumable not found");
  if (consumable.organizationId !== organizationId) throw new Error("Consumable not found");

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

  await db.$transaction(async (tx) => {
    await tx.consumable.update({
      where: { id: consumableId },
      data: { quantityOnHand: { decrement: quantity } },
    });
    await tx.consumableAssignment.create({
      data: {
        consumableId,
        userId,
        quantity,
      },
    });

    // Auto-close any pending/approved requests from this user for this consumable
    await tx.consumableRequest.updateMany({
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
  revalidatePath("/purchase-orders");
  revalidatePath("/my-consumables");
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
  return { success: true };
}

export async function markConsumableUsed(assignmentId: string, quantityUsed: number) {
  const session = await auth();
  if (!session?.user || session.user.role !== "STAFF") {
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
