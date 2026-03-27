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
    data: { password: hashed },
  });

  return { success: true };
}
