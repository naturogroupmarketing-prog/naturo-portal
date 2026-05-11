/**
 * getEffectiveSession()
 *
 * Returns the correct user context for the current request, taking into account
 * any active support session.
 *
 * | Session state          | Returns                                            |
 * |------------------------|----------------------------------------------------|
 * | Normal user            | That user's own context                            |
 * | L1 DIAGNOSTICS support | Support agent's context + supportSession annotation|
 * | L2 READONLY support    | Support agent's context + supportSession annotation|
 * | L3 IMPERSONATION       | Impersonated user's full context + annotation      |
 *
 * Usage in server components / server actions:
 *   const user = await getEffectiveSession();
 *   if (!user) redirect("/login");
 */

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";

/* ── Types ─────────────────────────────────────────────────────────────── */

export interface SupportContext {
  sessionId: string;
  agentId: string;
  agentEmail: string;
  agentName: string;
  accessLevel: "DIAGNOSTICS" | "READONLY" | "IMPERSONATION";
  /** True when the agent is acting as a tenant user (L3) */
  isImpersonating: boolean;
}

export interface EffectiveUser {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
  organizationId: string | null;
  regionId: string | null;
  image: string | null;
  isActive: boolean;
  /**
   * Present when the request is part of a support session.
   * Undefined for normal user sessions.
   */
  supportSession?: SupportContext;
}

/* ── Implementation ──────────────────────────────────────────────────── */

export async function getEffectiveSession(): Promise<EffectiveUser | null> {
  const [session, headersList] = await Promise.all([auth(), headers()]);

  if (!session?.user) return null;

  const supportSessionId = headersList.get("x-support-session-id");
  const supportLevel = headersList.get(
    "x-support-level"
  ) as "DIAGNOSTICS" | "READONLY" | "IMPERSONATION" | null;
  const supportOrgId = headersList.get("x-support-org-id");

  // ── No active support session — return the authenticated user as-is ──
  if (!supportSessionId || !supportLevel || !supportOrgId) {
    return {
      id: session.user.id,
      email: session.user.email ?? null,
      name: session.user.name ?? null,
      role: session.user.role,
      organizationId: (session.user as { organizationId?: string }).organizationId ?? null,
      regionId: (session.user as { regionId?: string }).regionId ?? null,
      image: session.user.image ?? null,
      isActive: (session.user as { isActive?: boolean }).isActive ?? true,
    };
  }

  // ── Load the support session record from DB ──────────────────────────
  const supportSessionRecord = await db.supportSession.findUnique({
    where: { id: supportSessionId },
    select: {
      agentId: true,
      agentEmail: true,
      agentName: true,
      accessLevel: true,
      status: true,
      impersonatingUserId: true,
    },
  });

  // If the session no longer exists or has ended, fall back to the real user
  if (!supportSessionRecord || supportSessionRecord.status !== "ACTIVE") {
    return {
      id: session.user.id,
      email: session.user.email ?? null,
      name: session.user.name ?? null,
      role: session.user.role,
      organizationId: (session.user as { organizationId?: string }).organizationId ?? null,
      regionId: (session.user as { regionId?: string }).regionId ?? null,
      image: session.user.image ?? null,
      isActive: (session.user as { isActive?: boolean }).isActive ?? true,
    };
  }

  const supportContext: SupportContext = {
    sessionId: supportSessionId,
    agentId: supportSessionRecord.agentId,
    agentEmail: supportSessionRecord.agentEmail,
    agentName: supportSessionRecord.agentName,
    accessLevel: supportLevel,
    isImpersonating: supportLevel === "IMPERSONATION",
  };

  // ── L3 IMPERSONATION — return the target user's full context ─────────
  if (supportLevel === "IMPERSONATION" && supportSessionRecord.impersonatingUserId) {
    const impersonatedUser = await db.user.findUnique({
      where: { id: supportSessionRecord.impersonatingUserId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
        regionId: true,
        image: true,
        isActive: true,
      },
    });

    // Safety check: the impersonated user must belong to the support org
    if (impersonatedUser && impersonatedUser.organizationId === supportOrgId) {
      return {
        ...impersonatedUser,
        supportSession: supportContext,
      };
    }
    // If the target user is invalid, fall through to L2 behaviour
  }

  // ── L1/L2 — return the agent with the target org injected ────────────
  // The agent sees the tenant's data but carries their own identity.
  return {
    id: session.user.id,
    email: session.user.email ?? null,
    name: session.user.name ?? null,
    role: session.user.role,
    organizationId: supportOrgId, // Override with the tenant being supported
    regionId: null, // Agents have no region within the tenant
    image: session.user.image ?? null,
    isActive: true,
    supportSession: supportContext,
  };
}

/**
 * Convenience: returns true if the current support session is read-only
 * (i.e. DIAGNOSTICS or READONLY level — NOT impersonation).
 * Safe to call even when there is no support session (returns false).
 */
export function isSupportReadOnly(user: EffectiveUser | null): boolean {
  if (!user?.supportSession) return false;
  return (
    user.supportSession.accessLevel === "DIAGNOSTICS" ||
    user.supportSession.accessLevel === "READONLY"
  );
}
