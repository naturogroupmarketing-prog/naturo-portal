/**
 * POST /api/support/access-requests      — Support agent submits an access request
 * GET  /api/support/access-requests      — List pending requests for a tenant admin
 */

import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isTrackioSupport } from "@/lib/support-session";
import { createAuditLog } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { rateLimit, RATE_LIMITS, rateLimitHeaders } from "@/lib/rate-limit";
import type { SupportAccessLevel } from "@/generated/prisma/client";

// Support agent submits a request
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !isTrackioSupport(session.user.role)) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }

  const rl = await rateLimit(`support:access-req:${session.user.id}`, RATE_LIMITS.action);
  if (!rl.success) {
    return Response.json({ error: "Too many requests." }, { status: 429, headers: rateLimitHeaders(rl) });
  }

  const body = await request.json() as {
    organizationId: string;
    accessLevel: SupportAccessLevel;
    reason: string;
    targetUserId?: string;
    sessionDurationMinutes?: number;
  };

  const { organizationId, accessLevel, reason, targetUserId, sessionDurationMinutes = 60 } = body;

  if (!organizationId || !accessLevel || !reason?.trim()) {
    return Response.json({ error: "organizationId, accessLevel, and reason are required" }, { status: 400 });
  }

  const org = await db.organization.findUnique({
    where: { id: organizationId },
    select: { name: true, supportPolicy: true },
  });
  if (!org) return Response.json({ error: "Organisation not found" }, { status: 404 });

  // Request expires in 24 hours if not actioned
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  let targetUserEmail: string | undefined;
  if (targetUserId) {
    const u = await db.user.findUnique({ where: { id: targetUserId }, select: { email: true } });
    targetUserEmail = u?.email;
  }

  const accessRequest = await db.supportAccessRequest.create({
    data: {
      organizationId,
      agentId: session.user.id,
      agentEmail: session.user.email!,
      agentName: session.user.name ?? session.user.email!,
      accessLevel,
      reason: reason.trim(),
      targetUserId,
      targetUserEmail,
      sessionDurationMinutes,
      expiresAt,
    },
  });

  await createAuditLog({
    action: "SUPPORT_ACCESS_REQUESTED",
    description: `Support access requested by ${session.user.name ?? session.user.email} — Level: ${accessLevel} — Org: ${org.name}`,
    performedById: session.user.id,
    organizationId,
    metadata: { requestId: accessRequest.id, accessLevel, reason },
  });

  // Notify tenant admins
  const admins = await db.user.findMany({
    where: { organizationId, role: "SUPER_ADMIN", isActive: true, deletedAt: null },
    select: { email: true, name: true },
  });

  for (const admin of admins) {
    sendEmail({
      to: admin.email,
      subject: `Action required: Trackio support is requesting access to your account`,
      html: `
        <p style="color:#495057;">Hi ${admin.name ?? "Admin"},</p>
        <p style="color:#495057;">A Trackio support agent has requested access to your account to help investigate an issue.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px 12px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;color:#0f1b3d;">Agent</td>
              <td style="padding:8px 12px;border:1px solid #e9ecef;color:#495057;">${session.user.name ?? session.user.email}</td></tr>
          <tr><td style="padding:8px 12px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;color:#0f1b3d;">Access type</td>
              <td style="padding:8px 12px;border:1px solid #e9ecef;color:#495057;">${accessLevel}</td></tr>
          <tr><td style="padding:8px 12px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;color:#0f1b3d;">Reason</td>
              <td style="padding:8px 12px;border:1px solid #e9ecef;color:#495057;">${reason}</td></tr>
          <tr><td style="padding:8px 12px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;color:#0f1b3d;">Duration</td>
              <td style="padding:8px 12px;border:1px solid #e9ecef;color:#495057;">${sessionDurationMinutes} minutes</td></tr>
          <tr><td style="padding:8px 12px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;color:#0f1b3d;">Request expires</td>
              <td style="padding:8px 12px;border:1px solid #e9ecef;color:#495057;">${expiresAt.toLocaleString("en-AU")}</td></tr>
        </table>
        <p style="color:#495057;">Log in to your trackio account and go to <strong>Settings → Support Access</strong> to approve or deny this request.</p>
        <p style="color:#868e96;font-size:13px;">If you did not expect this request, you can ignore it and it will expire automatically. You can also disable support access entirely in Settings → Support Access.</p>
      `,
    }).catch(() => {});
  }

  return Response.json({ requestId: accessRequest.id, expiresAt });
}

// Tenant admin lists pending requests for their org
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorised" }, { status: 401 });

  const rl = await rateLimit(`support:access-req:${session.user.id}`, RATE_LIMITS.api);
  if (!rl.success) {
    return Response.json({ error: "Too many requests." }, { status: 429, headers: rateLimitHeaders(rl) });
  }

  // Support agents can see all requests they made
  if (isTrackioSupport(session.user.role)) {
    const requests = await db.supportAccessRequest.findMany({
      where: { agentId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return Response.json({ requests });
  }

  // Tenant admins can see requests for their org
  if (session.user.role !== "SUPER_ADMIN" || !session.user.organizationId) {
    return Response.json({ error: "Unauthorised" }, { status: 403 });
  }

  const requests = await db.supportAccessRequest.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return Response.json({ requests });
}
