"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import type { SupportAccessLevel } from "@/generated/prisma/client";

// ── Customer-facing: update support access policy ────────────────────────────

export interface SupportPolicyInput {
  supportAccessEnabled: boolean;
  requireApproval: boolean;
  defaultAccessLevel: SupportAccessLevel;
  sessionDurationMinutes: number;
  notifyOnEntry: boolean;
  notifyOnImpersonation: boolean;
  emergencyAccessEnabled: boolean;
}

export async function updateSupportPolicy(data: SupportPolicyInput) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN" || !session.user.organizationId) {
    return { error: "Unauthorised" };
  }

  const orgId = session.user.organizationId;

  const policy = await db.tenantSupportPolicy.upsert({
    where: { organizationId: orgId },
    create: { organizationId: orgId, ...data },
    update: { ...data },
  });

  await createAuditLog({
    action: "SUPPORT_SETTINGS_UPDATED",
    description: `Support access settings updated — Access ${data.supportAccessEnabled ? "enabled" : "DISABLED"}, Require approval: ${data.requireApproval}`,
    performedById: session.user.id,
    organizationId: orgId,
    metadata: data as unknown as Record<string, unknown>,
  });

  revalidatePath("/settings/support-access");
  return { ok: true, policy };
}

// ── Customer-facing: get support policy ─────────────────────────────────────

export async function getSupportPolicy() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN" || !session.user.organizationId) {
    return { error: "Unauthorised" };
  }

  const policy = await db.tenantSupportPolicy.findUnique({
    where: { organizationId: session.user.organizationId },
  });

  return {
    policy: policy ?? {
      supportAccessEnabled: true,
      requireApproval: false,
      defaultAccessLevel: "READONLY" as SupportAccessLevel,
      sessionDurationMinutes: 60,
      notifyOnEntry: true,
      notifyOnImpersonation: true,
      emergencyAccessEnabled: true,
    },
  };
}

// ── Customer-facing: get support session audit history ───────────────────────

export async function getSupportAuditHistory() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN" || !session.user.organizationId) {
    return { error: "Unauthorised" };
  }

  const [sessions, requests] = await Promise.all([
    db.supportSession.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { startedAt: "desc" },
      take: 50,
      select: {
        id: true,
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
        pagesVisited: true,
        notes: true,
      },
    }),
    db.supportAccessRequest.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        agentName: true,
        agentEmail: true,
        accessLevel: true,
        status: true,
        reason: true,
        createdAt: true,
        approvedAt: true,
        deniedAt: true,
        statusNote: true,
        sessionDurationMinutes: true,
      },
    }),
  ]);

  return { sessions, requests };
}

// ── Customer-facing: revoke an active support session ───────────────────────

export async function revokeSupportSession(sessionId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN" || !session.user.organizationId) {
    return { error: "Unauthorised" };
  }

  const supportSession = await db.supportSession.findUnique({
    where: { id: sessionId },
    select: { organizationId: true, status: true, agentName: true },
  });

  if (!supportSession) return { error: "Session not found" };
  if (supportSession.organizationId !== session.user.organizationId) return { error: "Unauthorised" };
  if (supportSession.status !== "ACTIVE") return { error: "Session is not active" };

  await db.supportSession.update({
    where: { id: sessionId },
    data: { status: "ENDED", endedAt: new Date(), endReason: "REVOKED" },
  });

  await createAuditLog({
    action: "SUPPORT_ACCESS_REVOKED",
    description: `Support session revoked by ${session.user.name ?? session.user.email} — Agent: ${supportSession.agentName}`,
    performedById: session.user.id,
    organizationId: session.user.organizationId,
    metadata: { sessionId },
  });

  revalidatePath("/settings/support-access");
  return { ok: true };
}
