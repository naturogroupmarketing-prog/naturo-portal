"use client";

/**
 * <SupportDiagnosticsCapture>
 *
 * Mounts silently when a support session is active.  Captures:
 *  - JS errors (window.onerror)
 *  - Unhandled promise rejections (window.onunhandledrejection)
 *  - Route navigation events (popstate / Next.js router)
 *  - Console errors (patched during the session)
 *
 * Events are batched and flushed to /api/support/diagnostics every 10 s
 * (or immediately on page unload).  The component does nothing if
 * `sessionId` is falsy, so it is safe to render unconditionally in the
 * portal layout.
 */

import { useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

/* ── Types ─────────────────────────────────────────────────────────────── */

interface DiagnosticEvent {
  type: "error" | "rejection" | "console_error" | "navigation";
  message: string;
  stack?: string;
  url?: string;
  timestamp: string;
}

interface Props {
  sessionId: string | null | undefined;
}

const FLUSH_INTERVAL_MS = 10_000; // 10 seconds
const MAX_QUEUE = 50;              // don't queue more than this

/* ── Component ──────────────────────────────────────────────────────────── */

export function SupportDiagnosticsCapture({ sessionId }: Props) {
  const pathname = usePathname();
  const queueRef = useRef<DiagnosticEvent[]>([]);
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Flush batch to API ─────────────────────────────────────────────── */
  const flush = useCallback(async () => {
    if (!sessionId || queueRef.current.length === 0) return;

    const events = queueRef.current.splice(0); // drain the queue
    try {
      await fetch("/api/support/diagnostics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, events }),
        // keepalive so the request survives page unload
        keepalive: true,
      });
    } catch {
      // Silently discard — diagnostics must never crash the app
    }
  }, [sessionId]);

  /* ── Enqueue a single event ─────────────────────────────────────────── */
  const enqueue = useCallback((event: DiagnosticEvent) => {
    if (!sessionId) return;
    if (queueRef.current.length >= MAX_QUEUE) return; // cap memory usage
    queueRef.current.push(event);
  }, [sessionId]);

  /* ── Track navigation ───────────────────────────────────────────────── */
  useEffect(() => {
    if (!sessionId) return;
    enqueue({
      type: "navigation",
      message: `Navigated to ${pathname}`,
      url: pathname,
      timestamp: new Date().toISOString(),
    });
  }, [pathname, sessionId, enqueue]);

  /* ── Wire up global error listeners ───────────────────────────────────── */
  useEffect(() => {
    if (!sessionId) return;

    // JS errors
    const onError = (event: ErrorEvent) => {
      enqueue({
        type: "error",
        message: event.message || "Unknown error",
        stack: event.error?.stack,
        url: event.filename,
        timestamp: new Date().toISOString(),
      });
    };

    // Unhandled promise rejections
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      enqueue({
        type: "rejection",
        message: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
        timestamp: new Date().toISOString(),
      });
    };

    // Patch console.error to capture React / component errors too
    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      originalConsoleError(...args);
      const message = args
        .map((a) => (a instanceof Error ? a.message : typeof a === "string" ? a : JSON.stringify(a)))
        .join(" ");
      enqueue({
        type: "console_error",
        message: message.slice(0, 500), // cap length
        timestamp: new Date().toISOString(),
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    // Start periodic flush
    flushTimerRef.current = setInterval(flush, FLUSH_INTERVAL_MS);

    // Flush on page unload
    const onUnload = () => { flush(); };
    window.addEventListener("beforeunload", onUnload);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      window.removeEventListener("beforeunload", onUnload);
      console.error = originalConsoleError;
      if (flushTimerRef.current) clearInterval(flushTimerRef.current);
      flush(); // final flush on unmount
    };
  }, [sessionId, enqueue, flush]);

  // Renders nothing — purely behavioural
  return null;
}
