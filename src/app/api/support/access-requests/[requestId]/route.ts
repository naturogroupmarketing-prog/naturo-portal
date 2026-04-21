/**
 * PATCH /api/support/access-requests/[requestId] — Approve or deny a request (tenant admin)
 */

import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { rateLimit, RATE_LIMITS, rateLimitHeaders } from "@/lib/rate-limit";

type Params = { params: Promise<{ requestId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { requestId } = await params;
  const session = await auth();

  if (!session?.user || session.user.role !== "SUPER_ADMIN" || !session.user.organizationId) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }

  const rl = await rateLimit(`support:access-req-action:${session.user.id}`, RATE_LIMITS.action);
  if (!rl.success) {
    return Response.json({ error: "Too many requests." }, { status: 429, headers: rateLimitHeaders(rl) });
  }

  const body = await request.json() as {
    action: "APPROVE" | "DENY";
    note?: string;
  };

  if (!body.action || !["APPROVE", "DENY"].includes(body.action)) {
    return Response.json({ error: "action must be APPROVE or DENY" }, { status: 400 });
  }

  const accessRequest = await db.supportAccessRequest.findUnique({
    where: { id: requestId },
  });

  if (!accessRequest) return Response.json({ error: "Request not found" }, { status: 404 });
  if (accessRequest.organizationId !== session.user.organizationId) {
    return Response.json({ error: "Unauthorised" }, { status: 403 });
  }
  if (accessRequest.status !== "PENDING") {
    return Response.json({ error: `Request is already ${accessRequest.status}` }, { status: 409 });
  }
  if (accessRequest.expiresAt < new Date()) {
    return Response.json({ error: "Request has expired" }, { status: 410 });
  }

  const now = new Date();

  if (body.action === "APPROVE") {
    await db.supportAccessRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        approvedById: session.user.id,
        approvedAt: now,
        statusNote: body.note,
      },
    });

    await createAuditLog({
      action: "SUPPORT_ACCESS_APPROVED",
      description: `Support access approved by ${session.user.name ?? session.user.email} — Request from ${accessRequest.agentName}`,
      performedById: session.user.id,
      organizationId: session.user.organizationId,
      metadata: { requestId, agentId: accessRequest.agentId, accessLevel: accessRequest.accessLevel },
    });

    return Response.json({ ok: true, status: "APPROVED" });
  }

  // DENY
  await db.supportAccessRequest.update({
    where: { id: requestId },
    data: {
      status: "DENIED",
      deniedAt: now,
      statusNote: body.note,
    },
  });

  await createAuditLog({
    action: "SUPPORT_ACCESS_DENIED",
    description: `Support access denied by ${session.user.name ?? session.user.email} — Request from ${accessRequest.agentName}`,
    performedById: session.user.id,
    organizationId: session.user.organizationId,
    metadata: { requestId, agentId: accessRequest.agentId, reason: body.note },
  });

  return Response.json({ ok: true, status: "DENIED" });
}
