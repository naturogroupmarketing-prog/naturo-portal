import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    // Rate limit by IP
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";
    const rl = await rateLimit(`auth:set-password:${ip}`, RATE_LIMITS.auth);
    if (!rl.success) {
      return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
    }

    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    if (password.length < 10) {
      return NextResponse.json({ error: "Password must be at least 10 characters" }, { status: 400 });
    }
    if (!/[A-Z]/.test(password)) {
      return NextResponse.json({ error: "Password must contain at least one uppercase letter" }, { status: 400 });
    }
    if (!/[a-z]/.test(password)) {
      return NextResponse.json({ error: "Password must contain at least one lowercase letter" }, { status: 400 });
    }
    if (!/[0-9]/.test(password)) {
      return NextResponse.json({ error: "Password must contain at least one number" }, { status: 400 });
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return NextResponse.json({ error: "Password must contain at least one special character" }, { status: 400 });
    }

    // Find user by invite token
    const user = await db.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "This invite link is invalid or has expired. Please contact your administrator." },
        { status: 400 }
      );
    }

    // Set password and clear invite token
    const hashedPassword = await bcrypt.hash(password, 12);
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
        sessionVersion: { increment: 1 },
      },
    });

    return NextResponse.json({ success: true, email: user.email });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
