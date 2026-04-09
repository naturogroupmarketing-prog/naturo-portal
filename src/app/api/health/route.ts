import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/health — Health check endpoint
 * Returns minimal info only — no database details exposed.
 */
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 503 });
  }
}
