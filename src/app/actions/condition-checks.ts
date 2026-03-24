"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { isAdminOrManager, isSuperAdmin } from "@/lib/permissions";
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
  photoLabel?: string;
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

  const monthYear = new Date().toISOString().slice(0, 7);

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

  const photoLabel = data.photoLabel || null;

  // Check if already submitted this month (for this specific photo label)
  const existing = await db.conditionCheck.findFirst({
    where: {
      userId: session.user.id,
      itemType: data.itemType,
      ...(data.assetId ? { assetId: data.assetId } : {}),
      ...(data.consumableId ? { consumableId: data.consumableId } : {}),
      photoLabel,
      monthYear,
    },
  });

  if (existing) {
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
        photoLabel,
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
 * Super admin toggles which categories require inspection
 */
export async function toggleCategoryInspection(categoryId: string, enabled: boolean) {
  const session = await auth();
  if (!session?.user || !isSuperAdmin(session.user.role)) throw new Error("Unauthorized");

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  const cat = await db.category.findUnique({ where: { id: categoryId } });
  if (!cat || cat.organizationId !== organizationId) throw new Error("Category not found");

  await db.category.update({
    where: { id: categoryId },
    data: { requiresInspection: enabled },
  });

  revalidatePath("/condition-checks");
  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Super admin manages custom photo labels for a category
 */
export async function updateCategoryInspectionPhotos(categoryId: string, photos: string[]) {
  const session = await auth();
  if (!session?.user || !isSuperAdmin(session.user.role)) throw new Error("Unauthorized");

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  const cat = await db.category.findUnique({ where: { id: categoryId } });
  if (!cat || cat.organizationId !== organizationId) throw new Error("Category not found");

  // Clean and deduplicate
  const cleaned = [...new Set(photos.map((p) => p.trim()).filter(Boolean))];

  await db.category.update({
    where: { id: categoryId },
    data: { inspectionPhotos: cleaned, requiresInspection: cleaned.length > 0 || cat.requiresInspection },
  });

  revalidatePath("/condition-checks");
  revalidatePath("/dashboard");
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

  // Get categories that require inspection (for total count)
  const inspectionCategories = await db.category.findMany({
    where: { organizationId, requiresInspection: true },
    select: { name: true, type: true, inspectionPhotos: true },
  });

  const inspectionCategoryNames = new Set(inspectionCategories.map((c) => c.name));

  // Get staff with assignments in inspection categories
  const staffWithAssignments = await db.user.findMany({
    where: {
      organizationId,
      isActive: true,
      ...regionFilter,
      OR: [
        { assetAssignments: { some: { isActive: true, asset: { category: { in: [...inspectionCategoryNames] } } } } },
        { consumableAssignments: { some: { isActive: true, consumable: { category: { in: [...inspectionCategoryNames] } } } } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      assetAssignments: {
        where: { isActive: true, asset: { category: { in: [...inspectionCategoryNames] } } },
        select: { asset: { select: { category: true } } },
      },
      consumableAssignments: {
        where: { isActive: true, consumable: { category: { in: [...inspectionCategoryNames] } } },
        select: { consumable: { select: { category: true } } },
      },
    },
  });

  // Calculate expected photos per user (item count × photo labels per category)
  const photoCountByCategory = new Map<string, number>();
  for (const cat of inspectionCategories) {
    photoCountByCategory.set(cat.name, Math.max(cat.inspectionPhotos.length, 1));
  }

  const checksPerUser = new Map<string, number>();
  for (const check of checks) {
    checksPerUser.set(check.userId, (checksPerUser.get(check.userId) || 0) + 1);
  }

  const staffStatus = staffWithAssignments.map((s) => {
    let totalPhotos = 0;
    for (const a of s.assetAssignments) {
      totalPhotos += photoCountByCategory.get(a.asset.category) || 1;
    }
    for (const c of s.consumableAssignments) {
      totalPhotos += photoCountByCategory.get(c.consumable.category) || 1;
    }
    return {
      id: s.id,
      name: s.name,
      email: s.email,
      totalItems: totalPhotos,
      checkedItems: checksPerUser.get(s.id) || 0,
    };
  });

  return { checks, staffStatus, monthYear, inspectionCategories };
}

/**
 * Get inspection configuration (categories + photo types)
 */
export async function getInspectionConfig() {
  const session = await auth();
  if (!session?.user || !isSuperAdmin(session.user.role)) throw new Error("Unauthorized");

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  const categories = await db.category.findMany({
    where: { organizationId },
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
    select: {
      id: true,
      name: true,
      type: true,
      requiresInspection: true,
      inspectionPhotos: true,
    },
  });

  return categories;
}
