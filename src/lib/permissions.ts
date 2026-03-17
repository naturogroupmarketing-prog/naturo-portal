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

export function isAdminOrManager(role: Role) {
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

  const perms = await db.managerPermission.findUnique({
    where: { userId },
  });

  if (!perms) return MANAGER_DEFAULTS[permission];
  return perms[permission];
}
