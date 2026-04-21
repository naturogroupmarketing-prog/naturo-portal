/**
 * GET /api/support/tenants/[orgId] — Full tenant diagnostics for the support console
 */

import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isTrackioSupport } from "@/lib/support-session";
import { rateLimit, RATE_LIMITS, rateLimitHeaders } from "@/lib/rate-limit";

type Params = { params: Promise<{ orgId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { orgId } = await params;
  const session = await auth();
  if (!session?.user || !isTrackioSupport(session.user.role)) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }

  const rl = await rateLimit(`support:tenant-detail:${session.user.id}`, RATE_LIMITS.api);
  if (!rl.success) {
    return Response.json({ error: "Too many requests." }, { status: 429, headers: rateLimitHeaders(rl) });
  }

  const [org, policy, recentAudit, activeSessions, recentSessions, staffUsers] =
    await Promise.all([
      db.organization.findUnique({
        where: { id: orgId },
        select: {
          id: true,
          name: true,
          slug: true,
          email: true,
          plan: true,
          subscriptionStatus: true,
          maxUsers: true,
          maxAssets: true,
          aiRequestsUsed: true,
          aiRequestsLimit: true,
          createdAt: true,
          onboardingCompletedAt: true,
          _count: {
            select: {
              users: true,
              assets: true,
              consumables: true,
              regions: true,
              damageReports: true,
              purchaseOrders: true,
            },
          },
        },
      }),

      db.tenantSupportPolicy.findUnique({ where: { organizationId: orgId } }),

      // Last 30 audit events for this org
      db.auditLog.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          id: true,
          action: true,
          description: true,
          createdAt: true,
          performedBy: { select: { name: true, email: true, role: true } },
        },
      }),

      // Currently active support sessions
      db.supportSession.findMany({
        where: { organizationId: orgId, status: "ACTIVE" },
        orderBy: { startedAt: "desc" },
        select: {
          id: true,
          agentName: true,
          agentEmail: true,
          accessLevel: true,
          startedAt: true,
          expiresAt: true,
        },
      }),

      // Last 10 support sessions (any status)
      db.supportSession.findMany({
        where: { organizationId: orgId },
        orderBy: { startedAt: "desc" },
        take: 10,
        select: {
          id: true,
          agentName: true,
          agentEmail: true,
          accessLevel: true,
          status: true,
          startedAt: true,
          endedAt: true,
          endReason: true,
          writeAttempts: true,
          approvedByAdmin: true,
          impersonatingUserEmail: true,
        },
      }),

      // Staff with recent activity
      db.user.findMany({
        where: { organizationId: orgId, isActive: true, deletedAt: null },
        orderBy: { updatedAt: "desc" },
        take: 20,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          regionId: true,
          createdAt: true,
          updatedAt: true,
          recentActions: true,
          // Mask sensitive fields
          totpEnabled: true,
          failedLoginAttempts: true,
          lockedUntil: true,
        },
      }),
    ]);

  if (!org) return Response.json({ error: "Organisation not found" }, { status: 404 });

  // Compute a simple health score
  const damageOpen = await db.damageReport.count({
    where: { organizationId: orgId, isResolved: false },
  });
  const lowStock = await db.consumable.count({
    where: { organizationId: orgId, quantityOnHand: { lte: db.consumable.fields.minimumThreshold } as never },
  }).catch(() => 0);

  return Response.json({
    org,
    policy: policy ?? {
      supportAccessEnabled: true,
      requireApproval: false,
      defaultAccessLevel: "READONLY",
      sessionDurationMinutes: 60,
      notifyOnEntry: true,
      notifyOnImpersonation: true,
      emergencyAccessEnabled: true,
    },
    diagnostics: {
      openDamageReports: damageOpen,
      totalAuditEvents: org._count,
      recentAuditEvents: recentAudit,
      staff: staffUsers.map((u) => ({
        ...u,
        // Mask sensitive runtime data
        recentActions: u.recentActions ?? [],
      })),
    },
    sessions: {
      active: activeSessions,
      recent: recentSessions,
    },
  });
}
