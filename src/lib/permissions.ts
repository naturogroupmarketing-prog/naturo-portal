import { Role } from "@/generated/prisma/client";
import { db } from "@/lib/db";

export function isSuperAdmin(role: Role) {
  return role === "SUPER_ADMIN";
}

export function isBranchManager(role: Role) {
  return role === "BRANCH_MANAGER";
}

export function isStaff(role: Role) {
  return role === "STAFF";
}

export function isAuditor(role: Role | string): boolean {
  return role === "AUDITOR";
}

export function canViewReports(role: Role | string): boolean {
  return role === "SUPER_ADMIN" || role === "BRANCH_MANAGER" || role === "AUDITOR";
}

export function isAdminOrManager(role: Role) {
  // AUDITOR is NOT included — auditors have read-only access and cannot manage
  return role === "SUPER_ADMIN" || role === "BRANCH_MANAGER";
}

export function canManageRegion(
  userRole: Role,
  userRegionId: string | null,
  targetRegionId: string
) {
  if (isSuperAdmin(userRole)) return true;
  if (isBranchManager(userRole) && userRegionId === targetRegionId) return true;
  return false;
}

export function canViewAsset(
  userRole: Role,
  userRegionId: string | null,
  assetRegionId: string
) {
  if (isSuperAdmin(userRole)) return true;
  if (isBranchManager(userRole) && userRegionId === assetRegionId) return true;
  return false;
}

// ─── Granular Manager Permissions ───────────────────────

// Re-export types/constants from client-safe module
export { type PermissionKey, MANAGER_DEFAULTS } from "@/lib/permission-types";

import { type PermissionKey } from "@/lib/permission-types";
import { MANAGER_DEFAULTS } from "@/lib/permission-types";

export async function hasPermission(
  userId: string,
  userRole: Role,
  permission: PermissionKey
): Promise<boolean> {
  if (isSuperAdmin(userRole)) return true;
  if (!isBranchManager(userRole)) return false;

  try {
    const perms = await db.managerPermission.findUnique({
      where: { userId },
    });

    if (!perms) return MANAGER_DEFAULTS[permission];
    // Fall back to default if column doesn't exist yet
    return (perms as unknown as Record<string, boolean>)[permission] ?? MANAGER_DEFAULTS[permission];
  } catch {
    return MANAGER_DEFAULTS[permission];
  }
}

/**
 * Check multiple permissions in a single DB query instead of N separate calls
 */
export async function hasPermissions(
  userId: string,
  userRole: Role,
  permissions: PermissionKey[]
): Promise<Record<PermissionKey, boolean>> {
  const result = {} as Record<PermissionKey, boolean>;

  if (isSuperAdmin(userRole)) {
    for (const p of permissions) result[p] = true;
    return result;
  }

  if (!isBranchManager(userRole)) {
    for (const p of permissions) result[p] = false;
    return result;
  }

  // Single DB query for all permissions
  try {
    const perms = await db.managerPermission.findUnique({
      where: { userId },
    });

    for (const p of permissions) {
      result[p] = perms ? ((perms as unknown as Record<string, boolean>)[p] ?? MANAGER_DEFAULTS[p]) : MANAGER_DEFAULTS[p];
    }
  } catch {
    for (const p of permissions) result[p] = MANAGER_DEFAULTS[p];
  }
  return result;
}
