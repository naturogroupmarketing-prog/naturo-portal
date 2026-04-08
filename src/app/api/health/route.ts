import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/health — Health check endpoint
 * Returns 200 if app and database are healthy, 503 if not.
 */
export async function GET() {
  try {
    // Test database connection
    await db.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}
