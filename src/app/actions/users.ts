"use server";

import { db } from "@/lib/db";
import { isSuperAdmin, isAdminOrManager, hasPermission } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { Role } from "@/generated/prisma/client";
import bcrypt from "bcryptjs";
import { enforceUserLimit } from "@/lib/tenant";
import { applyStarterKit } from "@/app/actions/starter-kits";
import { withAuth } from "@/lib/action-utils";
import { sendEmail, emailWelcome } from "@/lib/email";

export async function createUser(formData: FormData) {
  try {
    const session = await withAuth();
    if (!(await hasPermission(session.user.id, session.user.role, "staffAdd"))) {
      return { error: "Unauthorized" };
    }

    const organizationId = session.user.organizationId!;

    try {
      await enforceUserLimit(organizationId);
    } catch (e) {
      return { error: e instanceof Error ? e.message : "User limit reached" };
    }

    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const name = (formData.get("name") as string)?.trim();
    const phone = (formData.get("phone") as string)?.trim() || null;
    const role = formData.get("role") as Role;
    const regionId = formData.get("regionId") as string;
    const password = formData.get("password") as string;

    if (!email) return { error: "Email is required" };
    if (!name) return { error: "Name is required" };
    if (!password || password.length < 8) {
      return { error: "Password must be at least 8 characters" };
    }
    if (!/[A-Z]/.test(password)) {
      return { error: "Password must contain at least one uppercase letter" };
    }
    if (!/[0-9]/.test(password)) {
      return { error: "Password must contain at least one number" };
    }

    // Branch Managers can only create STAFF in their own region
    if (session.user.role === "BRANCH_MANAGER") {
      if (role !== "STAFF") return { error: "Branch Managers can only create Staff users" };
      if (!session.user.regionId) return { error: "No region assigned" };
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return { error: "A user with this email already exists" };

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        email,
        name,
        phone,
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

    // Send welcome email with login details
    const sendWelcome = formData.get("sendWelcomeEmail") !== "false";
    if (sendWelcome) {
      try {
        const org = await db.organization.findUnique({ where: { id: organizationId }, select: { name: true } });
        await sendEmail({
          to: email,
          subject: `Welcome to ${org?.name || "trackio"} — Your Account is Ready`,
          html: emailWelcome(name, email, password, org?.name || "trackio", role),
        });
      } catch (e) {
        console.error("Welcome email failed:", e instanceof Error ? e.message : e);
      }
    }

    // Auto-apply default starter kit if user has a region
    const applyKit = formData.get("applyStarterKit") !== "false";
    if (applyKit && regionId) {
      const starterKitId = formData.get("starterKitId") as string | null;
      try {
        await applyStarterKit(user.id, starterKitId || undefined);
      } catch (e) {
        console.error("Starter kit application failed:", e instanceof Error ? e.message : e);
      }
    }

    revalidatePath("/admin/users");
    revalidatePath("/staff");
    revalidatePath("/dashboard");
    return { success: true, userId: user.id };
  } catch (e) {
    console.error("createUser error:", e);
    return { error: e instanceof Error ? e.message : "Failed to create user" };
  }
}

export async function updateUser(formData: FormData) {
  try {
    const session = await withAuth();
    if (!isSuperAdmin(session.user.role)) {
      return { error: "Unauthorized" };
    }

    const organizationId = session.user.organizationId!;

    const userId = formData.get("userId") as string;
    const name = formData.get("name") as string;
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const phone = (formData.get("phone") as string)?.trim() || null;
    const role = formData.get("role") as Role;
    const regionId = formData.get("regionId") as string;

    // Verify target user belongs to same org
    const targetUser = await db.user.findUnique({ where: { id: userId } });
    if (!targetUser || targetUser.organizationId !== organizationId) return { error: "User not found" };

    // If email is changing, check it's not already taken
    if (email) {
      const existing = await db.user.findFirst({
        where: { email, id: { not: userId } },
      });
      if (existing) return { error: "Email already in use by another user" };
    }

    await db.user.update({
      where: { id: userId },
      data: { name, email: email || undefined, phone, role, regionId: regionId || null },
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
  } catch (e) {
    console.error("updateUser error:", e);
    return { error: e instanceof Error ? e.message : "Failed to update user" };
  }
}

export async function toggleUserActive(formData: FormData) {
  const session = await withAuth();
  if (!(await hasPermission(session.user.id, session.user.role, "staffDelete"))) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId!;

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
  const session = await withAuth();
  if (!(await hasPermission(session.user.id, session.user.role, "staffDelete"))) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId!;

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
  const session = await withAuth();
  if (!isAdminOrManager(session.user.role)) {
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
  const session = await withAuth();
  if (!isSuperAdmin(session.user.role)) {
    return { success: false, error: "Unauthorized" };
  }

  const organizationId = session.user.organizationId!;

  try {
  // Prevent deleting yourself
  if (userId === session.user.id) throw new Error("Cannot delete yourself");

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  // Auto-return all active assignments in a single transaction
  const [activeAssetAssignments, activeConsumableAssignments] = await Promise.all([
    db.assetAssignment.findMany({ where: { userId, isActive: true }, include: { asset: true } }),
    db.consumableAssignment.findMany({ where: { userId, isActive: true }, include: { consumable: true } }),
  ]);

  if (activeAssetAssignments.length > 0 || activeConsumableAssignments.length > 0) {
    await db.$transaction(async (tx) => {
      // Batch deactivate all asset assignments
      if (activeAssetAssignments.length > 0) {
        await tx.assetAssignment.updateMany({
          where: { userId, isActive: true },
          data: { isActive: false, actualReturnDate: new Date(), returnNotes: "Auto-returned: user deleted" },
        });
        // Set all assets to PENDING_RETURN
        await tx.asset.updateMany({
          where: { id: { in: activeAssetAssignments.map((a) => a.assetId) } },
          data: { status: "PENDING_RETURN" },
        });
        // Create pending returns in bulk
        await tx.pendingReturn.createMany({
          data: activeAssetAssignments.map((a) => ({
            itemType: "ASSET",
            assetId: a.assetId,
            returnedByName: user.name || user.email,
            returnedByEmail: user.email,
            returnReason: "User deleted",
            organizationId: organizationId!,
            regionId: a.asset.regionId,
          })),
        });
      }
      // Batch deactivate all consumable assignments
      if (activeConsumableAssignments.length > 0) {
        await tx.consumableAssignment.updateMany({
          where: { userId, isActive: true },
          data: { isActive: false, returnedDate: new Date(), returnNotes: "Auto-returned: user deleted" },
        });
        await tx.pendingReturn.createMany({
          data: activeConsumableAssignments.map((a) => ({
            itemType: "CONSUMABLE",
            consumableId: a.consumableId,
            quantity: a.quantity,
            returnedByName: user.name || user.email,
            returnedByEmail: user.email,
            returnReason: "User deleted",
            organizationId: organizationId!,
            regionId: a.consumable.regionId,
          })),
        });
      }
    });
  }

  // Gather history for audit archive before deletion
  const [assetHistory, consumableHistory] = await Promise.all([
    db.assetAssignment.findMany({
      where: { userId },
      include: { asset: { select: { name: true, assetCode: true } } },
    }),
    db.consumableAssignment.findMany({
      where: { userId },
      include: { consumable: { select: { name: true } } },
    }),
  ]);

  const archiveData = {
    userName: user.name,
    userEmail: user.email,
    userPhone: user.phone,
    userRole: user.role,
    assetHistory: assetHistory.map((a) => ({
      asset: `${a.asset.name} (${a.asset.assetCode})`,
      checkoutDate: a.checkoutDate,
      returnDate: a.actualReturnDate,
      type: a.assignmentType,
    })),
    consumableHistory: consumableHistory.map((c) => ({
      consumable: c.consumable.name,
      quantity: c.quantity,
      assignedDate: c.assignedDate,
      returnedDate: c.returnedDate,
    })),
  };

  // Clean up ALL related records that don't have onDelete: Cascade
  await db.starterKitApplication.deleteMany({ where: { OR: [{ userId }, { appliedById: userId }] } });
  await db.notification.deleteMany({ where: { userId } });
  await db.maintenanceLog.deleteMany({ where: { performedById: userId } });
  await db.maintenanceSchedule.updateMany({ where: { assignedToId: userId }, data: { assignedToId: null } });
  // Nullify audit log references instead of deleting (preserve history)
  await db.auditLog.updateMany({ where: { performedById: userId }, data: { performedById: session.user.id } });
  await db.auditLog.updateMany({ where: { targetUserId: userId }, data: { targetUserId: null } });
  // Nullify purchase order references
  await db.purchaseOrder.updateMany({ where: { createdById: userId }, data: { createdById: null } });
  await db.purchaseOrder.updateMany({ where: { approvedById: userId }, data: { approvedById: null } });
  // Remove manager permissions
  await db.managerPermission.deleteMany({ where: { userId } });

  // Soft-delete user — preserve data for audit trail
  await db.user.update({ where: { id: userId }, data: { deletedAt: new Date(), isActive: false } });

  await createAuditLog({
    action: "USER_DELETED",
    description: `User "${user.name || user.email}" (${user.email}) deleted. Data archived.`,
    performedById: session.user.id,
    organizationId,
    metadata: archiveData,
  });

  revalidatePath("/admin/users");
  revalidatePath("/staff");
  revalidatePath("/dashboard");
  revalidatePath("/returns");
  return { success: true };
  } catch (err) {
    console.error("Delete user error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to delete user" };
  }
}

export async function restoreUser(userId: string) {
  const session = await withAuth();
  if (!isSuperAdmin(session.user.role)) return { error: "Unauthorized" };

  const organizationId = session.user.organizationId!;
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || user.organizationId !== organizationId) return { error: "User not found" };
  if (!user.deletedAt) return { error: "User is not deleted" };

  await db.user.update({
    where: { id: userId },
    data: { deletedAt: null, isActive: true },
  });

  await createAuditLog({
    action: "USER_ENABLED",
    description: `User "${user.name || user.email}" restored from deleted`,
    performedById: session.user.id,
    targetUserId: userId,
    organizationId,
  });

  revalidatePath("/staff");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function permanentlyDeleteUser(userId: string) {
  const session = await withAuth();
  if (!isSuperAdmin(session.user.role)) return { error: "Unauthorized" };

  const organizationId = session.user.organizationId!;
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || user.organizationId !== organizationId) return { error: "User not found" };
  if (!user.deletedAt) return { error: "User must be soft-deleted first" };

  // Clean up all related data then hard delete
  await db.$transaction([
    db.auditLog.updateMany({ where: { performedById: userId }, data: { performedById: session.user.id } }),
    db.auditLog.updateMany({ where: { targetUserId: userId }, data: { targetUserId: null } }),
    db.purchaseOrder.updateMany({ where: { createdById: userId }, data: { createdById: null } }),
    db.purchaseOrder.updateMany({ where: { approvedById: userId }, data: { approvedById: null } }),
    db.managerPermission.deleteMany({ where: { userId } }),
    db.conditionCheck.deleteMany({ where: { userId } }),
    db.notification.deleteMany({ where: { userId } }),
    db.consumableRequest.deleteMany({ where: { userId } }),
    db.consumableAssignment.deleteMany({ where: { userId } }),
    db.assetAssignment.deleteMany({ where: { userId } }),
    db.damageReport.deleteMany({ where: { reportedById: userId } }),
    db.user.delete({ where: { id: userId } }),
  ]);

  await createAuditLog({
    action: "USER_DELETED",
    description: `User "${user.name || user.email}" permanently deleted`,
    performedById: session.user.id,
    organizationId,
  });

  revalidatePath("/staff");
  return { success: true };
}

export async function resetPassword(userId: string, newPassword: string) {
  const session = await withAuth();
  if (!isSuperAdmin(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId!;

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
