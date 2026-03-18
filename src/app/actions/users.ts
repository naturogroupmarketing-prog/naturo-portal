"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { isSuperAdmin, isAdminOrManager, hasPermission } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { Role } from "@/generated/prisma/client";
import bcrypt from "bcryptjs";
import { enforceUserLimit } from "@/lib/tenant";

export async function createUser(formData: FormData) {
  const session = await auth();
  if (!session?.user || !(await hasPermission(session.user.id, session.user.role, "staffAdd"))) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  await enforceUserLimit(organizationId);

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const name = (formData.get("name") as string)?.trim();
  const role = formData.get("role") as Role;
  const regionId = formData.get("regionId") as string;
  const password = formData.get("password") as string;

  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  // Branch Managers can only create STAFF in their own region
  if (session.user.role === "BRANCH_MANAGER") {
    if (role !== "STAFF") throw new Error("Branch Managers can only create Staff users");
    if (!session.user.regionId) throw new Error("No region assigned");
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) throw new Error("User already exists");

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await db.user.create({
    data: {
      email,
      name,
      role,
      regionId: regionId || null,
      password: hashedPassword,
      organizationId,
    },
  });

  await createAuditLog({
    action: "USER_CREATED",
    description: `User "${name}" (${email}) created with role ${role}`,
    performedById: session.user.id,
    targetUserId: user.id,
    organizationId,
  });

  revalidatePath("/admin/users");
  revalidatePath("/dashboard");
  return { success: true, userId: user.id };
}

export async function updateUser(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isSuperAdmin(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  const userId = formData.get("userId") as string;
  const name = formData.get("name") as string;
  const role = formData.get("role") as Role;
  const regionId = formData.get("regionId") as string;

  await db.user.update({
    where: { id: userId },
    data: { name, role, regionId: regionId || null },
  });

  await createAuditLog({
    action: "USER_UPDATED",
    description: `User ${userId} updated: role=${role}, region=${regionId}`,
    performedById: session.user.id,
    targetUserId: userId,
    organizationId,
  });

  revalidatePath("/admin/users");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function toggleUserActive(formData: FormData) {
  const session = await auth();
  if (!session?.user || !(await hasPermission(session.user.id, session.user.role, "staffDelete"))) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  const userId = formData.get("userId") as string;
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  if (session.user.role === "BRANCH_MANAGER") {
    if (user.regionId !== session.user.regionId) {
      throw new Error("Cannot manage users in other regions");
    }
  }

  const newActive = !user.isActive;
  await db.user.update({
    where: { id: userId },
    data: { isActive: newActive },
  });

  await createAuditLog({
    action: newActive ? "USER_ENABLED" : "USER_DISABLED",
    description: `User "${user.name || user.email}" ${newActive ? "enabled" : "disabled"}`,
    performedById: session.user.id,
    targetUserId: userId,
    organizationId,
  });

  revalidatePath("/admin/users");
  revalidatePath("/staff");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function batchDisableUsers(userIds: string[]) {
  const session = await auth();
  if (!session?.user || !(await hasPermission(session.user.id, session.user.role, "staffDelete"))) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  if (userIds.length === 0) return { success: true, count: 0 };

  const users = await db.user.findMany({ where: { id: { in: userIds }, isActive: true } });

  if (session.user.role === "BRANCH_MANAGER") {
    const unauthorized = users.find((u) => u.regionId !== session.user.regionId);
    if (unauthorized) throw new Error("Cannot manage users in other regions");
  }

  await db.user.updateMany({
    where: { id: { in: users.map((u) => u.id) } },
    data: { isActive: false },
  });

  for (const user of users) {
    await createAuditLog({
      action: "USER_DISABLED",
      description: `User "${user.name || user.email}" disabled (batch)`,
      performedById: session.user.id,
      targetUserId: user.id,
      organizationId,
    });
  }

  revalidatePath("/admin/users");
  revalidatePath("/staff");
  revalidatePath("/dashboard");
  return { success: true, count: users.length };
}

export async function getUsers(regionId?: string) {
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const where: Record<string, unknown> = {};
  where.organizationId = session.user.organizationId;

  if (session.user.role === "BRANCH_MANAGER") {
    where.regionId = session.user.regionId;
  } else if (regionId) {
    where.regionId = regionId;
  }

  return db.user.findMany({
    where,
    include: { region: { include: { state: true } } },
    orderBy: { name: "asc" },
  });
}

export async function deleteUser(userId: string) {
  const session = await auth();
  if (!session?.user || !isSuperAdmin(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  // Prevent deleting yourself
  if (userId === session.user.id) throw new Error("Cannot delete yourself");

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  // Check for active assignments
  const activeAssignments = await db.assetAssignment.count({
    where: { userId, isActive: true },
  });
  if (activeAssignments > 0) {
    throw new Error("Cannot delete user with active asset assignments. Return all assets first.");
  }

  const activeConsumableAssignments = await db.consumableAssignment.count({
    where: { userId, isActive: true },
  });
  if (activeConsumableAssignments > 0) {
    throw new Error("Cannot delete user with active consumable assignments. Return all consumables first.");
  }

  // Delete user and related records
  await db.$transaction(async (tx) => {
    // Delete inactive assignments
    await tx.assetAssignment.deleteMany({ where: { userId } });
    await tx.consumableAssignment.deleteMany({ where: { userId } });
    // Delete consumable requests
    await tx.consumableRequest.deleteMany({ where: { userId } });
    // Delete the user
    await tx.user.delete({ where: { id: userId } });
  });

  await createAuditLog({
    action: "USER_DELETED",
    description: `User "${user.name || user.email}" permanently deleted`,
    performedById: session.user.id,
    targetUserId: userId,
    organizationId,
  });

  revalidatePath("/admin/users");
  revalidatePath("/staff");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function resetPassword(userId: string, newPassword: string) {
  const session = await auth();
  if (!session?.user || !isSuperAdmin(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  if (!newPassword || newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await db.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  await createAuditLog({
    action: "USER_UPDATED",
    description: `Password reset for user "${user.name || user.email}"`,
    performedById: session.user.id,
    targetUserId: userId,
    organizationId,
  });

  revalidatePath("/admin/users");
  return { success: true };
}
