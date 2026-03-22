"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { isSuperAdmin, MANAGER_DEFAULTS, type PermissionKey } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function updatePermission(
  userId: string,
  permission: PermissionKey,
  enabled: boolean
) {
  const session = await auth();
  if (!session?.user || !isSuperAdmin(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");
  if (user.organizationId !== session.user.organizationId) throw new Error("User not found");
  if (user.role !== "BRANCH_MANAGER") throw new Error("Permissions only apply to Branch Managers");

  await db.managerPermission.upsert({
    where: { userId },
    create: {
      userId,
      ...MANAGER_DEFAULTS,
      [permission]: enabled,
    },
    update: {
      [permission]: enabled,
    },
  });

  await createAuditLog({
    action: "USER_UPDATED",
    description: `Permission "${permission}" ${enabled ? "granted to" : "revoked from"} Branch Manager "${user.name || user.email}"`,
    performedById: session.user.id,
    targetUserId: userId,
    organizationId: session.user.organizationId || undefined,
  });

  revalidatePath("/admin/permissions");
  return { success: true };
}
