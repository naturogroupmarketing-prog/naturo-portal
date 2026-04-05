"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Generate a new TOTP secret for the current user
 */
export async function generateTOTPSecret() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const { TOTP, Secret } = await import("otpauth");

  const secret = new Secret({ size: 20 });
  const totp = new TOTP({
    issuer: "Trackio",
    label: session.user.email || "User",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });

  // Save secret to DB (not yet enabled — user must verify first)
  await db.user.update({
    where: { id: session.user.id },
    data: { totpSecret: secret.base32 },
  });

  return {
    secret: secret.base32,
    uri: totp.toString(),
  };
}

/**
 * Verify TOTP code and enable MFA
 */
export async function enableMFA(code: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { totpSecret: true },
  });

  if (!user?.totpSecret) throw new Error("No TOTP secret found. Please set up MFA first.");

  const { TOTP, Secret } = await import("otpauth");
  const totp = new TOTP({
    issuer: "Trackio",
    label: session.user.email || "User",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(user.totpSecret),
  });

  const isValid = totp.validate({ token: code, window: 1 }) !== null;
  if (!isValid) throw new Error("Invalid code. Please try again.");

  await db.user.update({
    where: { id: session.user.id },
    data: { totpEnabled: true },
  });

  revalidatePath("/settings");
  return { success: true };
}

/**
 * Disable MFA for the current user
 */
export async function disableMFA(password: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  // Verify password first
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });

  if (user?.password) {
    const bcrypt = await import("bcryptjs");
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error("Incorrect password");
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { totpEnabled: false, totpSecret: null },
  });

  revalidatePath("/settings");
  return { success: true };
}

/**
 * Verify a TOTP code (used during login)
 */
export async function verifyTOTPCode(userId: string, code: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { totpSecret: true, totpEnabled: true },
  });

  if (!user?.totpEnabled || !user.totpSecret) return true; // MFA not enabled

  const { TOTP, Secret } = await import("otpauth");
  const totp = new TOTP({
    issuer: "Trackio",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(user.totpSecret),
  });

  return totp.validate({ token: code, window: 1 }) !== null;
}
