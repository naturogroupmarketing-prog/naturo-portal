"use client";

import { useState, useEffect, useCallback } from "react";

const WARNING_BEFORE_MS = 5 * 60 * 1000; // Show warning 5 min before expiry
const CHECK_INTERVAL_MS = 60 * 1000; // Check every 60 seconds
const SESSION_KEY = "trackio-session-start";

export function SessionTimeoutWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const [minutesLeft, setMinutesLeft] = useState(5);

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        sessionStorage.setItem(SESSION_KEY, Date.now().toString());
        setShowWarning(false);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    // Record session start time if not already set
    if (!sessionStorage.getItem(SESSION_KEY)) {
      sessionStorage.setItem(SESSION_KEY, Date.now().toString());
    }

    const check = () => {
      const start = parseInt(sessionStorage.getItem(SESSION_KEY) || "0", 10);
      if (!start) return;

      const sessionMaxAge = 24 * 60 * 60 * 1000; // 24 hours, matches auth.ts
      const expiresAt = start + sessionMaxAge;
      const remaining = expiresAt - Date.now();

      if (remaining <= 0) {
        window.location.href = "/login?error=session-expired";
        return;
      }

      if (remaining <= WARNING_BEFORE_MS) {
        setMinutesLeft(Math.max(1, Math.ceil(remaining / 60000)));
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    };

    check();
    const interval = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  if (!showWarning) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full mx-4 animate-fade-in">
      <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 shadow-lg flex items-start gap-3">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 shrink-0 mt-0.5">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Session expiring in {minutesLeft} min
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
            Save your work or extend your session.
          </p>
        </div>
        <button
          onClick={refreshSession}
          className="shrink-0 text-xs font-medium bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600 transition-colors"
        >
          Extend
        </button>
      </div>
    </div>
  );
}
