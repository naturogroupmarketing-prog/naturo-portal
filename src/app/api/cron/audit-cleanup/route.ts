import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Monthly cron — deletes audit logs older than 90 days to manage database size.
 * Keeps the most recent 90 days of logs for all organizations.
 *
 * Schedule: Run monthly (e.g., 1st of each month)
 * Vercel Cron: 0 3 1 * *
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const retentionDays = parseInt(process.env.AUDIT_RETENTION_DAYS || "90", 10);
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  const result = await db.auditLog.deleteMany({
    where: {
      createdAt: { lt: cutoff },
    },
  });

  return NextResponse.json({
    deleted: result.count,
    retentionDays,
    cutoffDate: cutoff.toISOString(),
  });
}
