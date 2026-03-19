"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { isAdminOrManager } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit";
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

    // Restock the item
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
