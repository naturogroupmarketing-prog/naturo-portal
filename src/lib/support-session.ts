/**
 * Trackio Support Session Utilities
 *
 * Handles creation, validation, and revocation of support session tokens.
 * Tokens are signed with HMAC-SHA256 and stored in DB + HTTP-only cookie.
 *
 * Cookie name: trackio-support-session
 * Header injected by middleware: x-support-session-id, x-support-org-id, x-support-level
 */

import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { db } from "./db";
import { createAuditLog } from "./audit";
import type { SupportAccessLevel, SupportSessionStatus } from "@/generated/prisma/client";

export const SUPPORT_COOKIE = "trackio-support-session";

// How long a session token is valid (DB record is the authoritative source)
export const SESSION_DURATION_DEFAULTS: Record<string, number> = {
  "15": 15,
  "30": 30,
  "60": 60,
  "120": 120,
  "240": 240,
};

// ── Token format ─────────────────────────────────────────────────────────────

interface SupportTokenPayload {
  sessionId: string;
  agentId: string;
  orgId: string;
  level: SupportAccessLevel;
  expiresAt: number; // unix ms
}

function getSigningKey(): string {
  const key = process.env.SUPPORT_SESSION_SECRET || process.env.NEXTAUTH_SECRET;
  if (!key) throw new Error("SUPPORT_SESSION_SECRET or NEXTAUTH_SECRET must be set");
  return key;
}

export function signSupportToken(payload: SupportTokenPayload): string {
  const data = JSON.stringify(payload);
  const encoded = Buffer.from(data).toString("base64url");
  const sig = createHmac("sha256", getSigningKey())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifySupportToken(token: string): SupportTokenPayload | null {
  try {
    const [encoded, sig] = token.split(".");
    if (!encoded || !sig) return null;

    const expected = createHmac("sha256", getSigningKey())
      .update(encoded)
      .digest("base64url");

    const sigBuf = Buffer.from(sig, "base64url");
    const expBuf = Buffer.from(expected, "base64url");
    if (sigBuf.length !== expBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expBuf)) return null;

    const payload: SupportTokenPayload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    );

    if (payload.expiresAt < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// ── Session creation ─────────────────────────────────────────────────────────

export interface CreateSessionParams {
  organizationId: string;
  orgName: string;
  agentId: string;
  agentEmail: string;
  agentName: string;
  accessLevel: SupportAccessLevel;
  durationMinutes: number;
  ipAddress?: string;
  userAgent?: string;
  impersonatingUserId?: string;
  impersonatingUserEmail?: string;
  impersonatingUserName?: string;
  approvedByAdmin?: boolean;
  approvalTimestamp?: Date;
  accessRequestId?: string;
}

export async function createSupportSession(params: CreateSessionParams): Promise<{
  session: Awaited<ReturnType<typeof db.supportSession.create>>;
  token: string;
}> {
  const expiresAt = new Date(Date.now() + params.durationMinutes * 60 * 1000);

  const session = await db.supportSession.create({
    data: {
      organizationId: params.organizationId,
      orgName: params.orgName,
      agentId: params.agentId,
      agentEmail: params.agentEmail,
      agentName: params.agentName,
      accessLevel: params.accessLevel,
      expiresAt,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      impersonatingUserId: params.impersonatingUserId,
      impersonatingUserEmail: params.impersonatingUserEmail,
      impersonatingUserName: params.impersonatingUserName,
      approvedByAdmin: params.approvedByAdmin ?? false,
      approvalTimestamp: params.approvalTimestamp,
      accessRequestId: params.accessRequestId,
    },
  });

  const token = signSupportToken({
    sessionId: session.id,
    agentId: params.agentId,
    orgId: params.organizationId,
    level: params.accessLevel,
    expiresAt: expiresAt.getTime(),
  });

  // Audit
  await createAuditLog({
    action: "SUPPORT_SESSION_STARTED",
    description: `Support session started by ${params.agentName} (${params.agentEmail}) — Level: ${params.accessLevel} — Org: ${params.orgName}`,
    performedById: params.agentId,
    organizationId: params.organizationId,
    metadata: {
      sessionId: session.id,
      accessLevel: params.accessLevel,
      durationMinutes: params.durationMinutes,
      ipAddress: params.ipAddress,
      impersonating: params.impersonatingUserId,
    },
  }).catch(() => {});

  if (params.accessLevel === "IMPERSONATION") {
    await createAuditLog({
      action: "SUPPORT_IMPERSONATION_STARTED",
      description: `Support impersonation started: ${params.agentName} acting as ${params.impersonatingUserEmail ?? "unknown"} in ${params.orgName}`,
      performedById: params.agentId,
      organizationId: params.organizationId,
      metadata: { sessionId: session.id, impersonatingUserId: params.impersonatingUserId },
    }).catch(() => {});
  }

  return { session, token };
}

// ── Session validation ───────────────────────────────────────────────────────

export interface ActiveSupportSession {
  sessionId: string;
  agentId: string;
  orgId: string;
  level: SupportAccessLevel;
  expiresAt: Date;
  impersonatingUserId?: string;
  impersonatingUserEmail?: string;
}

export async function validateSupportSession(
  token: string
): Promise<ActiveSupportSession | null> {
  const payload = verifySupportToken(token);
  if (!payload) return null;

  // Cross-check with DB (allows revocation)
  const session = await db.supportSession.findUnique({
    where: { id: payload.sessionId },
    select: {
      id: true,
      agentId: true,
      organizationId: true,
      accessLevel: true,
      status: true,
      expiresAt: true,
      impersonatingUserId: true,
      impersonatingUserEmail: true,
    },
  });

  if (!session) return null;
  if (session.status !== "ACTIVE") return null;
  if (session.expiresAt < new Date()) {
    // Auto-expire
    await endSupportSession(session.id, "EXPIRED").catch(() => {});
    return null;
  }

  return {
    sessionId: session.id,
    agentId: session.agentId,
    orgId: session.organizationId,
    level: session.accessLevel,
    expiresAt: session.expiresAt,
    impersonatingUserId: session.impersonatingUserId ?? undefined,
    impersonatingUserEmail: session.impersonatingUserEmail ?? undefined,
  };
}

// ── Session termination ──────────────────────────────────────────────────────

export async function endSupportSession(
  sessionId: string,
  reason: "EXPIRED" | "MANUALLY_ENDED" | "REVOKED" | "ERROR" | "FORCED" = "MANUALLY_ENDED"
): Promise<void> {
  const session = await db.supportSession.findUnique({
    where: { id: sessionId },
    select: { agentId: true, agentName: true, agentEmail: true, orgName: true, organizationId: true, accessLevel: true, status: true },
  });

  if (!session || session.status !== "ACTIVE") return;

  await db.supportSession.update({
    where: { id: sessionId },
    data: {
      status: "ENDED" as SupportSessionStatus,
      endedAt: new Date(),
      endReason: reason,
    },
  });

  await createAuditLog({
    action: "SUPPORT_SESSION_ENDED",
    description: `Support session ended — Reason: ${reason} — Agent: ${session.agentName} — Org: ${session.orgName}`,
    performedById: session.agentId,
    organizationId: session.organizationId,
    metadata: { sessionId, reason, accessLevel: session.accessLevel },
  }).catch(() => {});

  if (session.accessLevel === "IMPERSONATION") {
    await createAuditLog({
      action: "SUPPORT_IMPERSONATION_ENDED",
      description: `Support impersonation ended — Reason: ${reason} — Agent: ${session.agentName}`,
      performedById: session.agentId,
      organizationId: session.organizationId,
      metadata: { sessionId, reason },
    }).catch(() => {});
  }
}

// ── Page visit tracking ──────────────────────────────────────────────────────

export async function recordPageVisit(sessionId: string, path: string): Promise<void> {
  await db.supportSession.update({
    where: { id: sessionId },
    data: {
      pagesVisited: {
        push: `${new Date().toISOString()} ${path}`,
      },
    },
  });

  await db.supportSessionEvent.create({
    data: {
      sessionId,
      eventType: "PAGE_VISIT",
      description: `Visited: ${path}`,
    },
  });
}

// ── Write attempt tracking ───────────────────────────────────────────────────

export async function recordBlockedWrite(
  sessionId: string,
  agentId: string,
  orgId: string,
  path: string,
  method: string
): Promise<void> {
  await db.supportSession.update({
    where: { id: sessionId },
    data: { writeAttempts: { increment: 1 } },
  });

  await db.supportSessionEvent.create({
    data: {
      sessionId,
      eventType: "WRITE_ATTEMPT",
      description: `Blocked write attempt: ${method} ${path}`,
    },
  });

  await createAuditLog({
    action: "SUPPORT_WRITE_BLOCKED",
    description: `Read-only enforcement: blocked ${method} ${path} in support session`,
    performedById: agentId,
    organizationId: orgId,
    metadata: { sessionId, path, method },
  }).catch(() => {});
}

// ── Role helpers ─────────────────────────────────────────────────────────────

export function isTrackioSupport(role: string): boolean {
  return role === "TRACKIO_SUPPORT" || role === "TRACKIO_SUPPORT_SENIOR";
}

export function canImpersonate(role: string): boolean {
  return role === "TRACKIO_SUPPORT_SENIOR";
}
