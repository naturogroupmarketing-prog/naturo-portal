"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { isAdminOrManager } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit";
import { notifyAdminsAndManagers } from "@/lib/notifications";
import { revalidatePath } from "next/cache";

/**
 * Manager verifies a returned item and restocks it
 */
export async function verifyReturn(returnId: string, notes?: string) {
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const pendingReturn = await db.pendingReturn.findUnique({
    where: { id: returnId },
  });

  if (!pendingReturn || pendingReturn.isVerified) {
    throw new Error("Return not found or already verified");
  }

  await db.$transaction(async (tx) => {
    // Mark as verified
    await tx.pendingReturn.update({
      where: { id: returnId },
      data: {
        isVerified: true,
        verifiedById: session.user.id,
        verifiedAt: new Date(),
        verificationNotes: notes || null,
      },
    });

    // Restock the item — skip if stock was already handled (e.g. kit not-received)
    if (pendingReturn.returnReason !== "STOCK_ALREADY_HANDLED") {
      if (pendingReturn.itemType === "ASSET" && pendingReturn.assetId) {
        await tx.asset.update({
          where: { id: pendingReturn.assetId },
          data: { status: "AVAILABLE" },
        });
      } else if (pendingReturn.itemType === "CONSUMABLE" && pendingReturn.consumableId) {
        await tx.consumable.update({
          where: { id: pendingReturn.consumableId },
          data: { quantityOnHand: { increment: pendingReturn.quantity } },
        });
      }
    }
  });

  await createAuditLog({
    action: "ASSET_UPDATED",
    description: `Return verified and restocked: ${pendingReturn.itemType} from ${pendingReturn.returnedByName}`,
    performedById: session.user.id,
    assetId: pendingReturn.assetId || undefined,
    consumableId: pendingReturn.consumableId || undefined,
    organizationId: pendingReturn.organizationId,
  });

  revalidatePath("/returns");
  revalidatePath("/assets");
  revalidatePath("/consumables");
  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Manager verifies all pending returns at once
 */
export async function verifyAllReturns() {
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization");

  const regionFilter = session.user.role === "BRANCH_MANAGER"
    ? { regionId: session.user.regionId!, organizationId, isVerified: false }
    : { organizationId, isVerified: false };

  const pendingReturns = await db.pendingReturn.findMany({ where: regionFilter });

  for (const pr of pendingReturns) {
    await verifyReturn(pr.id);
  }

  return { success: true, count: pendingReturns.length };
}

/**
 * Batch process multiple returns in a single transaction
 * Replaces N sequential calls to verifyReturn/rejectReturn
 */
export async function batchProcessReturns(
  items: { id: string; status: "verified" | "rejected"; reason?: string }[]
) {
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const allIds = items.map((i) => i.id);
  const pendingReturns = await db.pendingReturn.findMany({
    where: { id: { in: allIds }, isVerified: false },
  });

  const returnMap = new Map(pendingReturns.map((r) => [r.id, r]));

  let verifiedCount = 0;
  let rejectedCount = 0;

  await db.$transaction(async (tx) => {
    for (const item of items) {
      const pr = returnMap.get(item.id);
      if (!pr) continue;

      if (item.status === "verified") {
        // Mark as verified
        await tx.pendingReturn.update({
          where: { id: item.id },
          data: {
            isVerified: true,
            verifiedById: session.user.id,
            verifiedAt: new Date(),
          },
        });

        // Restock — skip if stock already handled or NOT_RETURNED
        if (pr.returnReason !== "STOCK_ALREADY_HANDLED" && pr.returnCondition !== "NOT_RETURNED") {
          if (pr.itemType === "ASSET" && pr.assetId) {
            await tx.asset.update({
              where: { id: pr.assetId },
              data: { status: "AVAILABLE" },
            });
          } else if (pr.itemType === "CONSUMABLE" && pr.consumableId) {
            await tx.consumable.update({
              where: { id: pr.consumableId },
              data: { quantityOnHand: { increment: pr.quantity } },
            });
          }
        } else if (pr.returnCondition === "NOT_RETURNED") {
          // NOT_RETURNED items: acknowledge without restocking — mark asset as DAMAGED
          if (pr.itemType === "ASSET" && pr.assetId) {
            await tx.asset.update({
              where: { id: pr.assetId },
              data: { status: "DAMAGED" },
            });
          }
        }

        verifiedCount++;
      } else if (item.status === "rejected") {
        // Reject — mark as verified with rejection notes
        await tx.pendingReturn.update({
          where: { id: item.id },
          data: {
            isVerified: true,
            verifiedById: session.user.id,
            verifiedAt: new Date(),
            verificationNotes: `REJECTED: ${item.reason || "Not returned"}`,
          },
        });

        // Mark asset as DAMAGED
        if (pr.itemType === "ASSET" && pr.assetId) {
          await tx.asset.update({
            where: { id: pr.assetId },
            data: { status: "DAMAGED" },
          });
        }

        rejectedCount++;
      }
    }
  });

  await createAuditLog({
    action: "ASSET_UPDATED",
    description: `Batch return processed: ${verifiedCount} verified, ${rejectedCount} rejected`,
    performedById: session.user.id,
    organizationId: session.user.organizationId!,
  });

  revalidatePath("/returns");
  revalidatePath("/assets");
  revalidatePath("/consumables");
  revalidatePath("/dashboard");
  return { success: true, verified: verifiedCount, rejected: rejectedCount };
}

/**
 * Reject a return — mark as damaged or discard
 */
export async function rejectReturn(returnId: string, reason: string) {
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const pendingReturn = await db.pendingReturn.findUnique({
    where: { id: returnId },
  });

  if (!pendingReturn || pendingReturn.isVerified) {
    throw new Error("Return not found or already verified");
  }

  await db.$transaction(async (tx) => {
    await tx.pendingReturn.update({
      where: { id: returnId },
      data: {
        isVerified: true,
        verifiedById: session.user.id,
        verifiedAt: new Date(),
        verificationNotes: `REJECTED: ${reason}`,
      },
    });

    // Mark asset as damaged instead of available
    if (pendingReturn.itemType === "ASSET" && pendingReturn.assetId) {
      await tx.asset.update({
        where: { id: pendingReturn.assetId },
        data: { status: "DAMAGED" },
      });
    }
    // Consumables that are rejected don't get restocked
  });

  revalidatePath("/returns");
  revalidatePath("/assets");
  revalidatePath("/consumables");
  return { success: true };
}

/**
 * Staff initiates a return — creates PendingReturn for manager to verify
 */
export async function staffReturnAsset(assignmentId: string, condition: string, notes: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const assignment = await db.assetAssignment.findUnique({
    where: { id: assignmentId },
    include: { asset: { include: { region: true } } },
  });

  if (!assignment || assignment.userId !== session.user.id || !assignment.isActive) {
    throw new Error("Assignment not found or not yours");
  }

  await db.$transaction(async (tx) => {
    // Deactivate the assignment
    await tx.assetAssignment.update({
      where: { id: assignmentId },
      data: { isActive: false, actualReturnDate: new Date() },
    });

    // Mark asset as PENDING_RETURN
    await tx.asset.update({
      where: { id: assignment.assetId },
      data: { status: "PENDING_RETURN" },
    });

    // Create pending return for manager verification
    await tx.pendingReturn.create({
      data: {
        itemType: "ASSET",
        assetId: assignment.assetId,
        quantity: 1,
        returnedByName: session.user.name || session.user.email || "Unknown",
        returnedByEmail: session.user.email || "",
        returnReason: "Staff initiated return",
        returnCondition: condition || "GOOD",
        returnNotes: notes || null,
        organizationId: assignment.asset.organizationId,
        regionId: assignment.asset.regionId,
      },
    });
  });

  await createAuditLog({
    action: "ASSET_RETURNED",
    description: `Asset "${assignment.asset.name}" (${assignment.asset.assetCode}) returned by ${session.user.name || session.user.email}`,
    performedById: session.user.id,
    assetId: assignment.assetId,
    organizationId: assignment.asset.organizationId,
  });

  // Notify managers about the return
  await notifyAdminsAndManagers({
    organizationId: assignment.asset.organizationId,
    regionId: assignment.asset.regionId,
    type: "ASSET_RETURNED",
    title: "Asset Return Pending",
    message: `${session.user.name || session.user.email} returned "${assignment.asset.name}" (${assignment.asset.assetCode}). Condition: ${condition || "Good"}. Please verify and restock.`,
    link: "/returns",
  });

  revalidatePath("/my-assets");
  revalidatePath("/returns");
  revalidatePath("/assets");
  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Staff initiates a consumable return
 */
export async function staffReturnConsumable(assignmentId: string, quantity: number, condition: string, notes: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const assignment = await db.consumableAssignment.findUnique({
    where: { id: assignmentId },
    include: { consumable: { include: { region: true } } },
  });

  if (!assignment || assignment.userId !== session.user.id || !assignment.isActive) {
    throw new Error("Assignment not found or not yours");
  }

  const returnQty = Math.min(quantity, assignment.quantity);

  await db.$transaction(async (tx) => {
    if (returnQty >= assignment.quantity) {
      // Return all — deactivate assignment
      await tx.consumableAssignment.update({
        where: { id: assignmentId },
        data: { isActive: false },
      });
    } else {
      // Partial return — reduce quantity
      await tx.consumableAssignment.update({
        where: { id: assignmentId },
        data: { quantity: { decrement: returnQty } },
      });
    }

    // Create pending return
    await tx.pendingReturn.create({
      data: {
        itemType: "CONSUMABLE",
        consumableId: assignment.consumableId,
        quantity: returnQty,
        returnedByName: session.user.name || session.user.email || "Unknown",
        returnedByEmail: session.user.email || "",
        returnReason: "Staff initiated return",
        returnCondition: condition || "GOOD",
        returnNotes: notes || null,
        organizationId: assignment.consumable.organizationId,
        regionId: assignment.consumable.regionId,
      },
    });
  });

  revalidatePath("/my-assets");
  revalidatePath("/my-consumables");
  revalidatePath("/returns");
  revalidatePath("/consumables");
  revalidatePath("/dashboard");
  return { success: true };
}
