/**
 * POST /api/support/sessions   — Start a support session
 * GET  /api/support/sessions   — List agent's own sessions (or all, for senior)
 */

import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createSupportSession, endSupportSession, isTrackioSupport, canImpersonate, SUPPORT_COOKIE } from "@/lib/support-session";
import { sendEmail } from "@/lib/email";
import { rateLimit, RATE_LIMITS, rateLimitHeaders } from "@/lib/rate-limit";
import type { SupportAccessLevel } from "@/generated/prisma/client";

function isSupportAgent(role: string): boolean {
  return isTrackioSupport(role);
}

// POST — start a new support session
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !isSupportAgent(session.user.role)) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }

  const rl = await rateLimit(`support:post:${session.user.id}`, RATE_LIMITS.action);
  if (!rl.success) {
    return Response.json({ error: "Too many requests." }, { status: 429, headers: rateLimitHeaders(rl) });
  }

  const body = await request.json() as {
    organizationId: string;
    accessLevel: SupportAccessLevel;
    durationMinutes?: number;
    reason?: string;
    targetUserId?: string;
    accessRequestId?: string;
  };

  const { organizationId, accessLevel, durationMinutes = 60, reason, targetUserId, accessRequestId } = body;

  if (!organizationId || !accessLevel) {
    return Response.json({ error: "organizationId and accessLevel are required" }, { status: 400 });
  }

  // L3 impersonation requires senior role
  if (accessLevel === "IMPERSONATION" && !canImpersonate(session.user.role)) {
    return Response.json({ error: "Impersonation requires TRACKIO_SUPPORT_SENIOR role" }, { status: 403 });
  }

  // Fetch the target org and its policy
  const org = await db.organization.findUnique({
    where: { id: organizationId },
    include: { supportPolicy: true },
  });

  if (!org) return Response.json({ error: "Organisation not found" }, { status: 404 });

  const policy = org.supportPolicy;

  // Check if support access is enabled for this tenant
  if (policy && !policy.supportAccessEnabled) {
    return Response.json({
      error: "This organisation has disabled Trackio support access. Contact the tenant admin.",
    }, { status: 403 });
  }

  // Check if approval is required (and we don't have an approved request)
  if (policy?.requireApproval && !accessRequestId) {
    return Response.json({
      error: "This organisation requires approval before support access. Submit an access request first.",
      requiresApproval: true,
    }, { status: 403 });
  }

  // If approval-gated, validate the access request
  let approvedByAdmin = false;
  let approvalTimestamp: Date | undefined;

  if (accessRequestId) {
    const accessRequest = await db.supportAccessRequest.findUnique({
      where: { id: accessRequestId },
    });

    if (!accessRequest || accessRequest.organizationId !== organizationId) {
      return Response.json({ error: "Invalid access request" }, { status: 400 });
    }
    if (accessRequest.status !== "APPROVED") {
      return Response.json({ error: "Access request has not been approved" }, { status: 403 });
    }
    if (accessRequest.expiresAt < new Date()) {
      return Response.json({ error: "Access request has expired" }, { status: 403 });
    }

    approvedByAdmin = true;
    approvalTimestamp = accessRequest.approvedAt ?? undefined;
  }

  // Resolve impersonation target
  let impersonatingUserEmail: string | undefined;
  let impersonatingUserName: string | undefined;

  if (accessLevel === "IMPERSONATION" && targetUserId) {
    const targetUser = await db.user.findUnique({
      where: { id: targetUserId },
      select: { email: true, name: true, organizationId: true },
    });
    if (!targetUser || targetUser.organizationId !== organizationId) {
      return Response.json({ error: "Target user not found in this organisation" }, { status: 404 });
    }
    impersonatingUserEmail = targetUser.email;
    impersonatingUserName = targetUser.name ?? undefined;
  }

  const maxDuration = policy?.sessionDurationMinutes ?? 60;
  const clampedDuration = Math.min(durationMinutes, maxDuration);

  const { session: supportSession, token } = await createSupportSession({
    organizationId,
    orgName: org.name,
    agentId: session.user.id,
    agentEmail: session.user.email!,
    agentName: session.user.name ?? session.user.email!,
    accessLevel,
    durationMinutes: clampedDuration,
    ipAddress: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
    impersonatingUserId: targetUserId,
    impersonatingUserEmail,
    impersonatingUserName,
    approvedByAdmin,
    approvalTimestamp,
    accessRequestId,
  });

  // Send notification to tenant admins if configured
  if (policy?.notifyOnEntry) {
    const orgAdmins = await db.user.findMany({
      where: { organizationId, role: "SUPER_ADMIN", isActive: true, deletedAt: null },
      select: { email: true, name: true },
    });

    const agentName = session.user.name ?? session.user.email!;
    for (const admin of orgAdmins) {
      sendEmail({
        to: admin.email,
        subject: `Trackio Support accessed your account — ${new Date().toLocaleString("en-AU")}`,
        html: `
          <p style="color:#495057;">Hi ${admin.name ?? "Admin"},</p>
          <p style="color:#495057;">A Trackio support agent has started a support session in your account.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr><td style="padding:8px 12px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;color:#0f1b3d;">Agent</td>
                <td style="padding:8px 12px;border:1px solid #e9ecef;color:#495057;">${agentName}</td></tr>
            <tr><td style="padding:8px 12px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;color:#0f1b3d;">Access type</td>
                <td style="padding:8px 12px;border:1px solid #e9ecef;color:#495057;">${accessLevel}</td></tr>
            <tr><td style="padding:8px 12px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;color:#0f1b3d;">Duration</td>
                <td style="padding:8px 12px;border:1px solid #e9ecef;color:#495057;">${clampedDuration} minutes</td></tr>
            <tr><td style="padding:8px 12px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;color:#0f1b3d;">Reason</td>
                <td style="padding:8px 12px;border:1px solid #e9ecef;color:#495057;">${reason ?? "Not specified"}</td></tr>
          </table>
          <p style="color:#495057;">You can view the full session log in your trackio account under Settings → Support Access → Audit History.</p>
          <p style="color:#868e96;font-size:13px;">If you did not request support or want to revoke access, go to Settings → Support Access and disable access immediately.</p>
        `,
      }).catch(() => {});
    }
  }

  // Return session data + token (client stores in cookie)
  return Response.json({
    sessionId: supportSession.id,
    token,
    expiresAt: supportSession.expiresAt,
    accessLevel,
    orgName: org.name,
    durationMinutes: clampedDuration,
  });
}

// GET — list sessions (agents see their own; seniors see all)
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !isSupportAgent(session.user.role)) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }

  const rl = await rateLimit(`support:get:${session.user.id}`, RATE_LIMITS.api);
  if (!rl.success) {
    return Response.json({ error: "Too many requests." }, { status: 429, headers: rateLimitHeaders(rl) });
  }

  const orgId = request.nextUrl.searchParams.get("orgId");
  const statusFilter = request.nextUrl.searchParams.get("status");

  const sessions = await db.supportSession.findMany({
    where: {
      ...(orgId ? { organizationId: orgId } : {}),
      // Non-senior agents can only see their own sessions
      ...(!canImpersonate(session.user.role) ? { agentId: session.user.id } : {}),
      ...(statusFilter ? { status: statusFilter as never } : {}),
    },
    orderBy: { startedAt: "desc" },
    take: 50,
    select: {
      id: true,
      organizationId: true,
      orgName: true,
      agentName: true,
      agentEmail: true,
      accessLevel: true,
      status: true,
      startedAt: true,
      endedAt: true,
      expiresAt: true,
      endReason: true,
      writeAttempts: true,
      approvedByAdmin: true,
      impersonatingUserEmail: true,
    },
  });

  return Response.json({ sessions });
}
