"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Toggle email notifications for the current user
 */
export async function toggleEmailNotifications(enabled: boolean) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await db.user.update({
    where: { id: session.user.id },
    data: { emailNotifications: enabled },
  });

  revalidatePath("/dashboard");
  return { success: true, emailNotifications: enabled };
}

/**
 * Change the current user's password
 */
export async function changePassword(currentPassword: string, newPassword: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  if (newPassword.length < 8) throw new Error("New password must be at least 8 characters");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });

  if (!user?.password) throw new Error("No password set. You may be using Google Sign-In.");

  const bcrypt = await import("bcryptjs");
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw new Error("Current password is incorrect");

  const hashed = await bcrypt.hash(newPassword, 12);
  await db.user.update({
    where: { id: session.user.id },
    data: { password: hashed, sessionVersion: { increment: 1 } },
  });

  return { success: true };
}

/**
 * Update the current user's profile (name, email, phone)
 */
export async function updateProfile(data: { name?: string; email?: string; phone?: string }) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const updates: Record<string, string | null> = {};
  if (data.name?.trim()) updates.name = data.name.trim();
  if (data.email?.trim()) {
    const newEmail = data.email.trim().toLowerCase();
    if (newEmail !== session.user.email) {
      const existing = await db.user.findUnique({ where: { email: newEmail } });
      if (existing) throw new Error("Email already in use");
      updates.email = newEmail;
    }
  }
  if (data.phone !== undefined) updates.phone = data.phone?.trim() || null;

  if (Object.keys(updates).length === 0) return { success: true };

  await db.user.update({ where: { id: session.user.id }, data: updates });
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Export all personal data for the current user (APP 12 compliance)
 */
export async function exportMyData() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true, email: true, phone: true, role: true, createdAt: true,
      emailNotifications: true, image: true,
      assetAssignments: {
        include: { asset: { select: { name: true, assetCode: true, category: true } } },
        orderBy: { checkoutDate: "desc" },
      },
      consumableAssignments: {
        include: { consumable: { select: { name: true, category: true } } },
        orderBy: { assignedDate: "desc" },
      },
      conditionChecks: {
        select: { itemType: true, condition: true, notes: true, monthYear: true, createdAt: true,
          asset: { select: { name: true, assetCode: true } },
          consumable: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      damageReports: {
        select: { type: true, description: true, isResolved: true, createdAt: true,
          asset: { select: { name: true, assetCode: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) throw new Error("User not found");

  return {
    exportDate: new Date().toISOString(),
    profile: {
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      emailNotifications: user.emailNotifications,
      accountCreated: user.createdAt,
    },
    assetAssignments: user.assetAssignments.map((a) => ({
      asset: a.asset.name,
      code: a.asset.assetCode,
      category: a.asset.category,
      assignedDate: a.checkoutDate,
      returnDate: a.actualReturnDate,
      isActive: a.isActive,
    })),
    consumableAssignments: user.consumableAssignments.map((c) => ({
      consumable: c.consumable.name,
      category: c.consumable.category,
      quantity: c.quantity,
      assignedDate: c.assignedDate,
      isActive: c.isActive,
    })),
    conditionChecks: user.conditionChecks.map((c) => ({
      item: c.asset?.name || c.consumable?.name,
      type: c.itemType,
      condition: c.condition,
      notes: c.notes,
      month: c.monthYear,
      date: c.createdAt,
    })),
    damageReports: user.damageReports.map((d) => ({
      asset: d.asset?.name,
      type: d.type,
      description: d.description,
      resolved: d.isResolved,
      date: d.createdAt,
    })),
  };
}

/**
 * Request account deletion (marks account for deletion, admin must confirm)
 */
export async function requestAccountDeletion(password: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  // Verify password
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });

  if (user?.password) {
    const bcrypt = await import("bcryptjs");
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error("Incorrect password");
  }

  // Deactivate account (admin can reactivate or fully delete)
  await db.user.update({
    where: { id: session.user.id },
    data: { isActive: false },
  });

  // Notify admins
  const { notifyAdminsAndManagers } = await import("@/lib/notifications");
  await notifyAdminsAndManagers({
    organizationId: session.user.organizationId!,
    type: "GENERAL",
    title: "Account Deletion Request",
    message: `${session.user.name || session.user.email} has requested account deletion. Their account has been deactivated. Review and permanently delete from the Staff page if appropriate.`,
    link: "/staff",
  });

  return { success: true };
}
