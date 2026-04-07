"use server";

import { db } from "@/lib/db";
import { isAdminOrManager, isSuperAdmin } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import type { ConditionCheckFrequency } from "@/generated/prisma/client";
import { withAuth } from "@/lib/action-utils";

// ─── Helpers ────────────────────────────────────────────

function addFrequencyInterval(date: Date, frequency: ConditionCheckFrequency): Date {
  const d = new Date(date);
  switch (frequency) {
    case "FORTNIGHTLY": d.setDate(d.getDate() + 14); break;
    case "MONTHLY": d.setMonth(d.getMonth() + 1); break;
    case "QUARTERLY": d.setMonth(d.getMonth() + 3); break;
    case "BIANNUAL": d.setMonth(d.getMonth() + 6); break;
  }
  return d;
}

function subtractFrequencyInterval(date: Date, frequency: ConditionCheckFrequency): Date {
  const d = new Date(date);
  switch (frequency) {
    case "FORTNIGHTLY": d.setDate(d.getDate() - 14); break;
    case "MONTHLY": d.setMonth(d.getMonth() - 1); break;
    case "QUARTERLY": d.setMonth(d.getMonth() - 3); break;
    case "BIANNUAL": d.setMonth(d.getMonth() - 6); break;
  }
  return d;
}

const FREQUENCY_LABELS: Record<ConditionCheckFrequency, string> = {
  FORTNIGHTLY: "Fortnightly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  BIANNUAL: "6-Monthly",
};

// ─── Staff submits condition check ─────────────────────

export async function submitConditionCheck(data: {
  itemType: "ASSET" | "CONSUMABLE";
  assetId?: string;
  consumableId?: string;
  condition: string;
  photoUrl: string;
  photoLabel?: string;
  notes?: string;
}) {
  const session = await withAuth();

  const organizationId = session.user.organizationId!;

  if (!data.photoUrl) throw new Error("Photo is required");
  if (!["GOOD", "FAIR", "POOR", "DAMAGED"].includes(data.condition)) {
    throw new Error("Invalid condition");
  }

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

  // Check if user has a custom schedule
  const schedule = await db.conditionCheckSchedule.findUnique({
    where: { userId: session.user.id },
  });

  const monthYear = new Date().toISOString().slice(0, 7);
  const periodStart = schedule?.periodStart || null;

  // Determine dedup query — use periodStart for scheduled users, monthYear for legacy
  const dedupWhere = {
    userId: session.user.id,
    itemType: data.itemType,
    ...(data.assetId ? { assetId: data.assetId } : {}),
    ...(data.consumableId ? { consumableId: data.consumableId } : {}),
    photoLabel,
    ...(periodStart ? { periodStart } : { monthYear }),
  };

  const existing = await db.conditionCheck.findFirst({ where: dedupWhere });

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
        periodStart,
      },
    });
  }

  // Auto-advance schedule if all items are now complete
  if (schedule) {
    await maybeAdvanceSchedule(session.user.id, organizationId, schedule);
  }

  revalidatePath("/dashboard");
  revalidatePath("/condition-checks");
  return { success: true };
}

/**
 * Check if all condition check items are complete for the current period, and auto-advance if so.
 */
async function maybeAdvanceSchedule(
  userId: string,
  organizationId: string,
  schedule: { id: string; periodStart: Date; nextDueDate: Date; frequency: ConditionCheckFrequency },
) {
  // Get inspection categories
  const inspectionCategories = await db.category.findMany({
    where: { organizationId, requiresInspection: true },
    select: { name: true, inspectionPhotos: true },
  });
  const catNames = new Set(inspectionCategories.map((c) => c.name));
  const photosPerCat = new Map(inspectionCategories.map((c) => [c.name, c.inspectionPhotos]));

  // Get user's active assignments in inspection categories
  const [assets, consumables] = await Promise.all([
    db.assetAssignment.findMany({
      where: { userId, isActive: true, acknowledgedAt: { not: null }, asset: { category: { in: [...catNames] } } },
      select: { asset: { select: { category: true } } },
    }),
    db.consumableAssignment.findMany({
      where: { userId, isActive: true, acknowledgedAt: { not: null }, consumable: { category: { in: [...catNames] } } },
      select: { consumable: { select: { category: true } } },
    }),
  ]);

  // Count expected photos
  let expectedPhotos = 0;
  for (const a of assets) expectedPhotos += Math.max((photosPerCat.get(a.asset.category) || []).length, 1);
  for (const c of consumables) expectedPhotos += Math.max((photosPerCat.get(c.consumable.category) || []).length, 1);

  if (expectedPhotos === 0) return;

  // Count submitted checks for this period
  const submittedCount = await db.conditionCheck.count({
    where: { userId, periodStart: schedule.periodStart },
  });

  if (submittedCount >= expectedPhotos) {
    // All done — advance the schedule
    const newPeriodStart = schedule.nextDueDate;
    const newNextDueDate = addFrequencyInterval(newPeriodStart, schedule.frequency);
    await db.conditionCheckSchedule.update({
      where: { id: schedule.id },
      data: {
        lastCompletedDate: new Date(),
        periodStart: newPeriodStart,
        nextDueDate: newNextDueDate,
      },
    });
  }
}

/**
 * Super admin toggles which categories require inspection
 */
export async function toggleCategoryInspection(categoryId: string, enabled: boolean) {
  const session = await withAuth();
  if (!isSuperAdmin(session.user.role)) throw new Error("Unauthorized");

  const organizationId = session.user.organizationId!;

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
  const session = await withAuth();
  if (!isSuperAdmin(session.user.role)) throw new Error("Unauthorized");

  const organizationId = session.user.organizationId!;

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
  const session = await withAuth();
  if (!isAdminOrManager(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId!;

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
  const session = await withAuth();
  if (!isSuperAdmin(session.user.role)) throw new Error("Unauthorized");

  const organizationId = session.user.organizationId!;

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

/**
 * Super admin creates a scheduled inspection with due date
 */
export async function createInspectionSchedule(data: {
  title: string;
  dueDate: string; // ISO date string
  notes?: string;
}) {
  const session = await withAuth();
  if (!isSuperAdmin(session.user.role)) throw new Error("Unauthorized");

  const organizationId = session.user.organizationId!;

  if (!data.title?.trim()) throw new Error("Title is required");
  if (!data.dueDate) throw new Error("Due date is required");

  const dueDate = new Date(data.dueDate);
  if (isNaN(dueDate.getTime())) throw new Error("Invalid date");

  const schedule = await db.inspectionSchedule.create({
    data: {
      organizationId,
      title: data.title.trim(),
      dueDate,
      notes: data.notes?.trim() || null,
      createdById: session.user.id,
    },
  });

  // Notify all staff with inspection-eligible items
  const { createNotification } = await import("@/lib/notifications");
  const inspectionCategories = await db.category.findMany({
    where: { organizationId, requiresInspection: true },
    select: { name: true },
  });
  const catNames = inspectionCategories.map((c) => c.name);

  if (catNames.length > 0) {
    const staffToNotify = await db.user.findMany({
      where: {
        organizationId,
        isActive: true,
        OR: [
          { assetAssignments: { some: { isActive: true, asset: { category: { in: catNames } } } } },
          { consumableAssignments: { some: { isActive: true, consumable: { category: { in: catNames } } } } },
        ],
      },
      select: { id: true },
    });

    const formattedDate = dueDate.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });
    for (const staff of staffToNotify) {
      await createNotification({
        userId: staff.id,
        type: "MAINTENANCE_DUE",
        title: `Inspection Scheduled: ${data.title.trim()}`,
        message: `Equipment inspection due by ${formattedDate}.${data.notes ? ` Notes: ${data.notes.trim()}` : ""}`,
        link: "/dashboard",
      });
    }
  }

  revalidatePath("/condition-checks");
  revalidatePath("/dashboard");
  return { success: true, id: schedule.id };
}

/**
 * Get all inspection schedules for the org
 */
export async function getInspectionSchedules() {
  const session = await withAuth();
  if (!isAdminOrManager(session.user.role)) throw new Error("Unauthorized");

  const organizationId = session.user.organizationId!;

  return db.inspectionSchedule.findMany({
    where: { organizationId, isActive: true },
    include: { createdBy: { select: { name: true, email: true } } },
    orderBy: { dueDate: "desc" },
  });
}

/**
 * Delete an inspection schedule
 */
export async function deleteInspectionSchedule(id: string) {
  const session = await withAuth();
  if (!isSuperAdmin(session.user.role)) throw new Error("Unauthorized");

  const organizationId = session.user.organizationId!;

  const schedule = await db.inspectionSchedule.findUnique({ where: { id } });
  if (!schedule || schedule.organizationId !== organizationId) throw new Error("Not found");

  await db.inspectionSchedule.update({ where: { id }, data: { isActive: false } });
  revalidatePath("/condition-checks");
  return { success: true };
}

// ─── Per-Staff Condition Check Scheduling ──────────────

/**
 * Super admin sets/updates a staff member's condition check schedule
 */
export async function setStaffConditionSchedule(data: {
  userId: string;
  frequency: ConditionCheckFrequency;
  nextDueDate: string; // ISO date
}) {
  const session = await withAuth();
  if (!isSuperAdmin(session.user.role)) throw new Error("Unauthorized");

  const organizationId = session.user.organizationId!;

  // Validate target user
  const targetUser = await db.user.findUnique({ where: { id: data.userId } });
  if (!targetUser || targetUser.organizationId !== organizationId) throw new Error("User not found");

  const nextDueDate = new Date(data.nextDueDate);
  if (isNaN(nextDueDate.getTime())) throw new Error("Invalid date");

  const periodStart = subtractFrequencyInterval(nextDueDate, data.frequency);

  await db.conditionCheckSchedule.upsert({
    where: { userId: data.userId },
    create: {
      userId: data.userId,
      organizationId,
      frequency: data.frequency,
      nextDueDate,
      periodStart,
      createdById: session.user.id,
    },
    update: {
      frequency: data.frequency,
      nextDueDate,
      periodStart,
    },
  });

  // Notify the staff member
  const { createNotification } = await import("@/lib/notifications");
  const formattedDate = nextDueDate.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });
  await createNotification({
    userId: data.userId,
    type: "MAINTENANCE_DUE",
    title: `Condition Check Schedule Set`,
    message: `Your condition checks are now ${FREQUENCY_LABELS[data.frequency].toLowerCase()}. Next due by ${formattedDate}.`,
    link: "/dashboard",
  });

  revalidatePath("/condition-checks");
  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Super admin sets the same schedule on multiple staff at once
 */
export async function bulkSetConditionSchedule(data: {
  userIds: string[];
  frequency: ConditionCheckFrequency;
  nextDueDate: string;
}) {
  const session = await withAuth();
  if (!isSuperAdmin(session.user.role)) throw new Error("Unauthorized");

  const organizationId = session.user.organizationId!;

  const nextDueDate = new Date(data.nextDueDate);
  if (isNaN(nextDueDate.getTime())) throw new Error("Invalid date");

  const periodStart = subtractFrequencyInterval(nextDueDate, data.frequency);
  const { createNotification } = await import("@/lib/notifications");
  const formattedDate = nextDueDate.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });

  let updated = 0;
  for (const userId of data.userIds) {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user || user.organizationId !== organizationId) continue;

    await db.conditionCheckSchedule.upsert({
      where: { userId },
      create: {
        userId,
        organizationId,
        frequency: data.frequency,
        nextDueDate,
        periodStart,
        createdById: session.user.id,
      },
      update: {
        frequency: data.frequency,
        nextDueDate,
        periodStart,
      },
    });

    await createNotification({
      userId,
      type: "MAINTENANCE_DUE",
      title: `Condition Check Schedule Set`,
      message: `Your condition checks are now ${FREQUENCY_LABELS[data.frequency].toLowerCase()}. Next due by ${formattedDate}.`,
      link: "/dashboard",
    });

    updated++;
  }

  revalidatePath("/condition-checks");
  revalidatePath("/dashboard");
  return { success: true, updated };
}

/**
 * Get all staff condition check schedules for the org (admin view)
 */
export async function getStaffSchedules() {
  const session = await withAuth();
  if (!isSuperAdmin(session.user.role)) throw new Error("Unauthorized");

  const organizationId = session.user.organizationId!;

  const schedules = await db.conditionCheckSchedule.findMany({
    where: { organizationId, isActive: true },
    include: {
      user: { select: { id: true, name: true, email: true, regionId: true, region: { select: { name: true } } } },
    },
    orderBy: { nextDueDate: "asc" },
  });

  // Also get staff WITHOUT a schedule (they use default monthly)
  const scheduledUserIds = schedules.map((s) => s.userId);
  const unscheduledStaff = await db.user.findMany({
    where: {
      organizationId,
      isActive: true,
      id: { notIn: scheduledUserIds },
      OR: [
        { assetAssignments: { some: { isActive: true } } },
        { consumableAssignments: { some: { isActive: true } } },
      ],
    },
    select: { id: true, name: true, email: true, regionId: true, region: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  return {
    schedules: schedules.map((s) => ({
      id: s.id,
      userId: s.userId,
      userName: s.user.name,
      userEmail: s.user.email,
      regionName: s.user.region?.name || "No region",
      frequency: s.frequency,
      nextDueDate: s.nextDueDate.toISOString(),
      lastCompletedDate: s.lastCompletedDate?.toISOString() || null,
      periodStart: s.periodStart.toISOString(),
    })),
    unscheduledStaff: unscheduledStaff.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      regionName: u.region?.name || "No region",
    })),
  };
}

/**
 * Remove a staff member's custom schedule (revert to default monthly)
 */
export async function removeStaffConditionSchedule(userId: string) {
  const session = await withAuth();
  if (!isSuperAdmin(session.user.role)) throw new Error("Unauthorized");

  const organizationId = session.user.organizationId!;

  const schedule = await db.conditionCheckSchedule.findUnique({ where: { userId } });
  if (!schedule || schedule.organizationId !== organizationId) throw new Error("Schedule not found");

  await db.conditionCheckSchedule.delete({ where: { userId } });

  revalidatePath("/condition-checks");
  revalidatePath("/dashboard");
  return { success: true };
}
