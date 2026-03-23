"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { isAdminOrManager } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

/**
 * Staff submits a monthly condition check photo for an assigned item
 */
export async function submitConditionCheck(data: {
  itemType: "ASSET" | "CONSUMABLE";
  assetId?: string;
  consumableId?: string;
  condition: string;
  photoUrl: string;
  notes?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  if (!data.photoUrl) throw new Error("Photo is required");
  if (!["GOOD", "FAIR", "POOR", "DAMAGED"].includes(data.condition)) {
    throw new Error("Invalid condition");
  }

  const monthYear = new Date().toISOString().slice(0, 7); // "2026-03"

  // Verify the item is actually assigned to this user
  if (data.itemType === "ASSET" && data.assetId) {
    const assignment = await db.assetAssignment.findFirst({
      where: { assetId: data.assetId, userId: session.user.id, isActive: true },
    });
    if (!assignment) throw new Error("This asset is not assigned to you");
  } else if (data.itemType === "CONSUMABLE" && data.consumableId) {
    const assignment = await db.consumableAssignment.findFirst({
      where: { consumableId: data.consumableId, userId: session.user.id, isActive: true },
    });
    if (!assignment) throw new Error("This consumable is not assigned to you");
  } else {
    throw new Error("Invalid item");
  }

  // Check if already submitted this month
  const existing = await db.conditionCheck.findFirst({
    where: {
      userId: session.user.id,
      itemType: data.itemType,
      ...(data.assetId ? { assetId: data.assetId } : {}),
      ...(data.consumableId ? { consumableId: data.consumableId } : {}),
      monthYear,
    },
  });

  if (existing) {
    // Update existing check instead of creating duplicate
    await db.conditionCheck.update({
      where: { id: existing.id },
      data: {
        condition: data.condition,
        photoUrl: data.photoUrl,
        notes: data.notes || null,
      },
    });
  } else {
    await db.conditionCheck.create({
      data: {
        userId: session.user.id,
        organizationId,
        itemType: data.itemType,
        assetId: data.assetId || null,
        consumableId: data.consumableId || null,
        condition: data.condition,
        photoUrl: data.photoUrl,
        notes: data.notes || null,
        monthYear,
      },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/condition-checks");
  return { success: true };
}

/**
 * Get condition checks for manager/admin review
 */
export async function getConditionChecksForReview(filters?: {
  monthYear?: string;
  regionId?: string;
}) {
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  const monthYear = filters?.monthYear || new Date().toISOString().slice(0, 7);

  // Region scoping for branch managers
  const regionFilter = session.user.role === "BRANCH_MANAGER" && session.user.regionId
    ? { regionId: session.user.regionId }
    : filters?.regionId ? { regionId: filters.regionId } : {};

  const checks = await db.conditionCheck.findMany({
    where: {
      organizationId,
      monthYear,
      user: regionFilter,
    },
    include: {
      user: { select: { id: true, name: true, email: true, regionId: true } },
      asset: { select: { id: true, name: true, assetCode: true, category: true, imageUrl: true } },
      consumable: { select: { id: true, name: true, category: true, imageUrl: true } },
    },
    orderBy: [{ user: { name: "asc" } }, { createdAt: "desc" }],
  });

  // Also get all staff with active assignments for completion tracking
  const staffWithAssignments = await db.user.findMany({
    where: {
      organizationId,
      isActive: true,
      ...regionFilter,
      OR: [
        { assetAssignments: { some: { isActive: true } } },
        { consumableAssignments: { some: { isActive: true } } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      _count: {
        select: {
          assetAssignments: { where: { isActive: true } },
          consumableAssignments: { where: { isActive: true } },
        },
      },
    },
  });

  // Count checks per user for this month
  const checksPerUser = new Map<string, number>();
  for (const check of checks) {
    checksPerUser.set(check.userId, (checksPerUser.get(check.userId) || 0) + 1);
  }

  const staffStatus = staffWithAssignments.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    totalItems: s._count.assetAssignments + s._count.consumableAssignments,
    checkedItems: checksPerUser.get(s.id) || 0,
  }));

  return { checks, staffStatus, monthYear };
}
