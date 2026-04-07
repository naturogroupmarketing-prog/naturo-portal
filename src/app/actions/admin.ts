"use server";

import { db } from "@/lib/db";
import { isSuperAdmin } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { withAuth } from "@/lib/action-utils";

/**
 * Archive old audit logs — delete entries older than specified months
 * Super Admin only
 */
export async function archiveOldAuditLogs(olderThanMonths: number = 12) {
  const session = await withAuth();
  if (!isSuperAdmin(session.user.role)) throw new Error("Unauthorized");

  const organizationId = session.user.organizationId!;

  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - olderThanMonths);

  const deleted = await db.auditLog.deleteMany({
    where: {
      organizationId,
      createdAt: { lt: cutoffDate },
    },
  });

  await createAuditLog({
    action: "USER_UPDATED",
    description: `Archived ${deleted.count} audit log entries older than ${olderThanMonths} months`,
    performedById: session.user.id,
    organizationId,
  });

  revalidatePath("/activity");
  return { success: true, archived: deleted.count };
}

/**
 * Clean up resolved damage reports older than specified months
 */
export async function archiveResolvedDamageReports(olderThanMonths: number = 6) {
  const session = await withAuth();
  if (!isSuperAdmin(session.user.role)) throw new Error("Unauthorized");

  const organizationId = session.user.organizationId!;

  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - olderThanMonths);

  const deleted = await db.damageReport.deleteMany({
    where: {
      organizationId,
      isResolved: true,
      resolvedAt: { lt: cutoffDate },
    },
  });

  await createAuditLog({
    action: "USER_UPDATED",
    description: `Archived ${deleted.count} resolved damage reports older than ${olderThanMonths} months`,
    performedById: session.user.id,
    organizationId,
  });

  revalidatePath("/dashboard");
  return { success: true, archived: deleted.count };
}

/**
 * Get data health statistics for the organization
 */
export async function getDataHealth() {
  const session = await withAuth();
  if (!isSuperAdmin(session.user.role)) throw new Error("Unauthorized");

  const organizationId = session.user.organizationId!;

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const [totalAuditLogs, oldAuditLogs, totalDamageReports, resolvedOldDamage, inactiveUsers, totalAssets, totalConsumables] = await Promise.all([
    db.auditLog.count({ where: { organizationId } }),
    db.auditLog.count({ where: { organizationId, createdAt: { lt: twelveMonthsAgo } } }),
    db.damageReport.count({ where: { organizationId } }),
    db.damageReport.count({ where: { organizationId, isResolved: true, resolvedAt: { lt: sixMonthsAgo } } }),
    db.user.count({ where: { organizationId, isActive: false } }),
    db.asset.count({ where: { organizationId } }),
    db.consumable.count({ where: { organizationId, isActive: true } }),
  ]);

  return {
    totalAuditLogs,
    archivableAuditLogs: oldAuditLogs,
    totalDamageReports,
    archivableDamageReports: resolvedOldDamage,
    inactiveUsers,
    totalAssets,
    totalConsumables,
  };
}
