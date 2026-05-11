/**
 * POST /api/support/diagnostics  — Store captured client-side diagnostic events
 * GET  /api/support/diagnostics  — Retrieve events for a session (support staff only)
 */

import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isTrackioSupport, validateSupportSession, SUPPORT_COOKIE } from "@/lib/support-session";
import { rateLimit, RATE_LIMITS, rateLimitHeaders } from "@/lib/rate-limit";
import { cookies } from "next/headers";

/* ── Types ─────────────────────────────────────────────────────────────── */

interface DiagnosticEvent {
  type: "error" | "rejection" | "console_error" | "navigation";
  message: string;
  stack?: string;
  url?: string;
  timestamp: string;
}

interface PostBody {
  sessionId: string;
  events: DiagnosticEvent[];
}

/* ── POST — ingest events from the browser ──────────────────────────────── */

export async function POST(request: NextRequest) {
  // The sender is the support agent's browser — validate using the session cookie
  const cookieStore = await cookies();
  const supportToken = cookieStore.get(SUPPORT_COOKIE)?.value;

  if (!supportToken) {
    return Response.json({ error: "No support session" }, { status: 401 });
  }

  const activeSession = await validateSupportSession(supportToken);
  if (!activeSession) {
    return Response.json({ error: "Support session invalid or expired" }, { status: 401 });
  }

  // Rate-limit by session ID
  const rl = await rateLimit(`diag:${activeSession.sessionId}`, {
    maxRequests: 30,
    windowSec: 60,
  });
  if (!rl.success) {
    return Response.json({ error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl) });
  }

  let body: PostBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { sessionId, events } = body;

  if (!sessionId || !Array.isArray(events) || events.length === 0) {
    return Response.json({ error: "sessionId and events[] are required" }, { status: 400 });
  }

  // Must match the session that owns the cookie
  if (sessionId !== activeSession.sessionId) {
    return Response.json({ error: "Session ID mismatch" }, { status: 403 });
  }

  // Cap at 50 events per batch
  const batch = events.slice(0, 50);

  // Store each event as a SupportSessionEvent row
  await db.supportSessionEvent.createMany({
    data: batch.map((ev) => ({
      sessionId,
      eventType: ev.type,
      description: ev.message?.slice(0, 1000) ?? "(no message)",
      metadata: JSON.stringify({
        stack: ev.stack?.slice(0, 2000),
        url: ev.url?.slice(0, 500),
        clientTimestamp: ev.timestamp,
      }),
    })),
    skipDuplicates: false,
  });

  return Response.json({ ok: true, stored: batch.length });
}

/* ── GET — retrieve events for a session (support staff only) ────────────── */

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !isTrackioSupport(session.user.role)) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }

  const rl = await rateLimit(`diag:read:${session.user.id}`, RATE_LIMITS.api);
  if (!rl.success) {
    return Response.json({ error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl) });
  }

  const sessionId = request.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return Response.json({ error: "sessionId query param is required" }, { status: 400 });
  }

  // Verify the session exists (and the agent can see it)
  const supportSession = await db.supportSession.findUnique({
    where: { id: sessionId },
    select: { agentId: true },
  });

  if (!supportSession) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  // Non-senior agents can only view their own sessions
  const { canImpersonate } = await import("@/lib/support-session");
  if (!canImpersonate(session.user.role) && supportSession.agentId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const events = await db.supportSessionEvent.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    take: 500,
    select: {
      id: true,
      eventType: true,
      description: true,
      metadata: true,
      createdAt: true,
    },
  });

  return Response.json({ events });
}
