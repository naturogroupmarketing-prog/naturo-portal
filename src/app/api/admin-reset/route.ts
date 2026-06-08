import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashSync } from "bcryptjs";

// ONE-TIME password reset endpoint — DELETE THIS FILE after use
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");

  if (secret !== "naturo-reset-2024") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hash = hashSync("Naturo2024!", 10);

  const user = await db.user.update({
    where: { email: "admin@naturogroup.com.au" },
    data: {
      password: hash,
      failedLoginAttempts: 0,
      lockedUntil: null,
      isActive: true,
    },
    select: { id: true, email: true, isActive: true },
  });

  return NextResponse.json({
    ok: true,
    message: "Password reset to Naturo2024!",
    user,
  });
}
