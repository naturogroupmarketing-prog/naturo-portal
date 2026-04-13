import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    // Rate limit by IP
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";
    const rl = await rateLimit(`auth:forgot:${ip}`, RATE_LIMITS.auth);
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });

    // Always return success to prevent email enumeration
    if (!user || !user.isActive) {
      return NextResponse.json({ success: true });
    }

    // Delete any existing tokens for this email
    await db.passwordResetToken.deleteMany({ where: { email: user.email } });

    // Generate secure token (32-char hex string — not brute-forceable)
    const token = crypto.randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await db.passwordResetToken.create({
      data: {
        email: user.email,
        token,
        expiresAt,
      },
    });

    const baseUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || "https://app.trackio.au";
    const resetLink = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

    await sendEmail({
      to: user.email,
      subject: "Password Reset",
      html: `
        <p style="color:#495057;">Hi ${user.name || "there"},</p>
        <p style="color:#495057;">We received a request to reset your trackio password. Use the code below to reset it:</p>
        <div style="text-align:center;margin:24px 0;">
          <span style="font-size:28px;font-weight:bold;letter-spacing:6px;color:#1F3DD9;background:#eef0fb;padding:12px 24px;border-radius:8px;display:inline-block;">${token}</span>
        </div>
        <p style="color:#495057;">Or click the button below:</p>
        <div style="text-align:center;margin:24px 0;">
          <a href="${resetLink}" style="background:#1F3DD9;color:#ffffff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block;">Reset Password</a>
        </div>
        <p style="color:#868e96;font-size:13px;">This code expires in 30 minutes. If you didn't request this, you can safely ignore this email.</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
