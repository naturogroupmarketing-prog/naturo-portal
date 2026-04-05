import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    // Rate limit by IP
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";
    const rl = await rateLimit(`auth:reset:${ip}`, RATE_LIMITS.auth);
    if (!rl.success) {
      return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
    }

    const { email, token, password } = await req.json();

    if (!email || !token || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }
    if (!/[A-Z]/.test(password)) {
      return NextResponse.json({ error: "Password must contain at least one uppercase letter" }, { status: 400 });
    }
    if (!/[0-9]/.test(password)) {
      return NextResponse.json({ error: "Password must contain at least one number" }, { status: 400 });
    }

    // Find valid token
    const resetToken = await db.passwordResetToken.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        token,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!resetToken) {
      return NextResponse.json({ error: "Invalid or expired reset code" }, { status: 400 });
    }

    // Find user
    const user = await db.user.findUnique({ where: { email: resetToken.email } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(password, 12);
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Mark token as used
    await db.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    });

    // Clean up old tokens for this email
    await db.passwordResetToken.deleteMany({
      where: { email: resetToken.email, id: { not: resetToken.id } },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
