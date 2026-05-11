/**
 * DELETE /api/support/sessions/[sessionId] — End a support session
 * PATCH  /api/support/sessions/[sessionId] — Add notes, revoke (admin revoking from tenant side)
 */

import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { endSupportSession, isTrackioSupport, SUPPORT_COOKIE } from "@/lib/support-session";
import { rateLimit, RATE_LIMITS, rateLimitHeaders } from "@/lib/rate-limit";
import { cookies } from "next/headers";

type Params = { params: Promise<{ sessionId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { sessionId } = await params;
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorised" }, { status: 401 });

  const rl = await rateLimit(`support:session:${session.user.id}`, RATE_LIMITS.action);
  if (!rl.success) {
    return Response.json({ error: "Too many requests." }, { status: 429, headers: rateLimitHeaders(rl) });
  }

  const supportSession = await db.supportSession.findUnique({
    where: { id: sessionId },
    select: { agentId: true, organizationId: true, status: true },
  });

  if (!supportSession) return Response.json({ error: "Session not found" }, { status: 404 });

  const isOwner = supportSession.agentId === session.user.id;
  const isTenantAdmin = session.user.role === "SUPER_ADMIN" && session.user.organizationId === supportSession.organizationId;
  const isTrackioStaff = isTrackioSupport(session.user.role);

  if (!isOwner && !isTenantAdmin && !isTrackioStaff) {
    return Response.json({ error: "Unauthorised" }, { status: 403 });
  }

  const reason = isTenantAdmin ? "REVOKED" : "MANUALLY_ENDED";
  await endSupportSession(sessionId, reason);

  return Response.json({ ok: true, reason });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { sessionId } = await params;
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorised" }, { status: 401 });

  const rl = await rateLimit(`support:session:${session.user.id}`, RATE_LIMITS.action);
  if (!rl.success) {
    return Response.json({ error: "Too many requests." }, { status: 429, headers: rateLimitHeaders(rl) });
  }

  const body = await request.json() as { notes?: string; revoke?: boolean };

  const supportSession = await db.supportSession.findUnique({
    where: { id: sessionId },
    select: { agentId: true, organizationId: true, status: true },
  });

  if (!supportSession) return Response.json({ error: "Session not found" }, { status: 404 });

  const isOwner = supportSession.agentId === session.user.id;
  const isTenantAdmin = session.user.role === "SUPER_ADMIN" && session.user.organizationId === supportSession.organizationId;

  if (!isOwner && !isTenantAdmin && !isTrackioSupport(session.user.role)) {
    return Response.json({ error: "Unauthorised" }, { status: 403 });
  }

  if (body.revoke) {
    await endSupportSession(sessionId, "REVOKED");
    return Response.json({ ok: true });
  }

  if (body.notes !== undefined) {
    await db.supportSession.update({
      where: { id: sessionId },
      data: { notes: body.notes },
    });
  }

  return Response.json({ ok: true });
}
