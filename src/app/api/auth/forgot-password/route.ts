import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
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

    // Generate token (6-digit code for simplicity)
    const token = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await db.passwordResetToken.create({
      data: {
        email: user.email,
        token,
        expiresAt,
      },
    });

    // For now, since no email service is configured, we'll log the token
    // In production, you would send this via email
    // TODO: Add email sending when SMTP is configured
    console.log(`Password reset token for ${user.email}: ${token}`);

    // Try to send email if SMTP is configured
    if (process.env.SMTP_HOST) {
      try {
        const nodemailer = await import("nodemailer");
        const transporter = nodemailer.default.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || "587"),
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const baseUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || "https://app.trackio.au";

        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: user.email,
          subject: "Trackio - Password Reset",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
              <h2 style="color: #1a1a2e;">Reset Your Password</h2>
              <p>Hi ${user.name || "there"},</p>
              <p>We received a request to reset your Trackio password. Use the code below to reset it:</p>
              <div style="text-align: center; margin: 24px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #7C3AED; background: #f3f0ff; padding: 12px 24px; border-radius: 8px;">${token}</span>
              </div>
              <p>Or click the link below:</p>
              <p><a href="${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}" style="color: #7C3AED;">Reset Password</a></p>
              <p style="color: #666; font-size: 13px;">This code expires in 30 minutes. If you didn't request this, you can ignore this email.</p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("Failed to send reset email:", emailErr);
        // Still return success — the token was created
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
