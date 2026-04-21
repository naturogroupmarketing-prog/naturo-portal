"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface SupportBannerProps {
  sessionId: string;
  orgName: string;
  accessLevel: "DIAGNOSTICS" | "READONLY" | "IMPERSONATION";
  expiresAt: string; // ISO string
  impersonatingUserEmail?: string;
  agentName?: string;
}

const LEVEL_CONFIG = {
  DIAGNOSTICS: {
    label: "Diagnostics Mode",
    bg: "bg-[#1e3a5f]",
    text: "text-white",
    badge: "bg-blue-500",
    description: "View-only diagnostics",
  },
  READONLY: {
    label: "Read-Only Support Session",
    bg: "bg-[#1e3a5f]",
    text: "text-white",
    badge: "bg-amber-500",
    description: "Read-only access · No changes possible",
  },
  IMPERSONATION: {
    label: "Impersonation Session",
    bg: "bg-red-700",
    text: "text-white",
    badge: "bg-red-900",
    description: "Acting as user · Changes are logged",
  },
};

function formatCountdown(ms: number): string {
  if (ms <= 0) return "Expired";
  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function SupportBanner({
  sessionId,
  orgName,
  accessLevel,
  expiresAt,
  impersonatingUserEmail,
  agentName,
}: SupportBannerProps) {
  const router = useRouter();
  const config = LEVEL_CONFIG[accessLevel];
  const expiry = new Date(expiresAt).getTime();

  const [remaining, setRemaining] = useState(() => expiry - Date.now());
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const left = expiry - Date.now();
      setRemaining(left);
      if (left <= 0) {
        clearInterval(timer);
        // Session expired — remove cookie and reload
        document.cookie = `trackio-support-session=; Max-Age=0; path=/`;
        router.refresh();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [expiry, router]);

  const handleEndSession = useCallback(async () => {
    if (ending) return;
    setEnding(true);
    try {
      await fetch(`/api/support/sessions/${sessionId}`, { method: "DELETE" });
    } catch {}
    document.cookie = `trackio-support-session=; Max-Age=0; path=/`;
    router.push("/support/console");
    router.refresh();
  }, [sessionId, ending, router]);

  const isExpiringSoon = remaining < 5 * 60 * 1000; // < 5 min
  const isAlmostGone = remaining < 60 * 1000; // < 1 min

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[9999] ${config.bg} ${config.text} px-4 py-2.5 flex items-center gap-4 shadow-lg`}
      role="alert"
      aria-live="polite"
    >
      {/* Pulsing dot */}
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isAlmostGone ? "bg-red-300" : "bg-white"}`} />
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isAlmostGone ? "bg-red-200" : "bg-white"}`} />
      </span>

      {/* Main label */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className={`shrink-0 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${config.badge}`}>
          Support
        </span>
        <span className="font-semibold text-sm truncate">
          {accessLevel === "IMPERSONATION"
            ? `Acting as ${impersonatingUserEmail ?? "user"} in ${orgName}`
            : `${config.label} — ${orgName}`}
        </span>
        <span className="hidden sm:inline text-xs opacity-75">{config.description}</span>
      </div>

      {/* Countdown */}
      <div
        className={`shrink-0 font-mono text-sm font-bold tabular-nums px-2.5 py-1 rounded-lg ${
          isAlmostGone
            ? "bg-red-900 text-red-200 animate-pulse"
            : isExpiringSoon
            ? "bg-amber-600/80 text-amber-100"
            : "bg-white/10"
        }`}
        title="Session expires in"
      >
        {formatCountdown(remaining)}
      </div>

      {/* End session */}
      <button
        onClick={handleEndSession}
        disabled={ending}
        className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors disabled:opacity-50 border border-white/20"
      >
        {ending ? "Ending…" : "End Session"}
      </button>
    </div>
  );
}
