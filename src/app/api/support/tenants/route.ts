/**
 * GET /api/support/tenants — Search tenants for the support console
 * Support-only endpoint. Returns health summary and support eligibility.
 */

import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isTrackioSupport } from "@/lib/support-session";
import { rateLimit, RATE_LIMITS, rateLimitHeaders } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !isTrackioSupport(session.user.role)) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }

  const rl = await rateLimit(`support:tenants:${session.user.id}`, RATE_LIMITS.api);
  if (!rl.success) {
    return Response.json({ error: "Too many requests." }, { status: 429, headers: rateLimitHeaders(rl) });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") ?? "20"), 50);

  const orgs = await db.organization.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { id: q.length > 10 ? q : undefined },
          ],
        }
      : {},
    take: limit,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      email: true,
      plan: true,
      subscriptionStatus: true,
      createdAt: true,
      supportPolicy: {
        select: {
          supportAccessEnabled: true,
          requireApproval: true,
          defaultAccessLevel: true,
          sessionDurationMinutes: true,
        },
      },
      _count: {
        select: {
          users: true,
          assets: true,
          supportSessions: true,
        },
      },
    },
  });

  // Attach current active session count
  const orgIds = orgs.map((o) => o.id);
  const activeSessions = await db.supportSession.groupBy({
    by: ["organizationId"],
    where: { organizationId: { in: orgIds }, status: "ACTIVE" },
    _count: { id: true },
  });

  const activeMap = new Map(activeSessions.map((s) => [s.organizationId, s._count.id]));

  const result = orgs.map((org) => ({
    ...org,
    activeSessionCount: activeMap.get(org.id) ?? 0,
    // Default policy if not set
    supportPolicy: org.supportPolicy ?? {
      supportAccessEnabled: true,
      requireApproval: false,
      defaultAccessLevel: "READONLY",
      sessionDurationMinutes: 60,
    },
  }));

  return Response.json({ tenants: result });
}
