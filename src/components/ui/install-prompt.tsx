"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";

// Dismissed only for this browser session — resets every time the app is opened fresh
const SESSION_KEY = "naturo-install-dismissed-session";

type Platform = "android" | "ios" | "desktop" | null;

function detectPlatform(): Platform {
  if (typeof window === "undefined") return null;
  const ua = navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua) && !(window as any).MSStream;
  if (isIOS) return "ios";
  const isAndroid = /android/i.test(ua);
  if (isAndroid) return "android";
  return "desktop";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

function isDismissedThisSession(): boolean {
  try { return sessionStorage.getItem(SESSION_KEY) === "1"; } catch { return false; }
}

function saveDismissSession() {
  try { sessionStorage.setItem(SESSION_KEY, "1"); } catch {}
}

export function InstallPrompt() {
  const [platform, setPlatform]       = useState<Platform>(null);
  const [deferredPrompt, setDeferred] = useState<any>(null);
  const [visible, setVisible]         = useState(false);
  const [showSteps, setShowSteps]     = useState(false);
  const [installed, setInstalled]     = useState(false);
  // Ref so the fallback timer can see whether the event was captured
  const promptRef = useRef<any>(null);

  useEffect(() => {
    if (isStandalone() || isDismissedThisSession()) return;

    const plt = detectPlatform();
    setPlatform(plt);

    // ── iOS: can't trigger native prompt, just show instructions ────────────
    if (plt === "ios") {
      setTimeout(() => setVisible(true), 2500);
      return;
    }

    // ── Android / Desktop ────────────────────────────────────────────────────
    // The beforeinstallprompt event often fires BEFORE React hydrates.
    // layout.tsx captures it into window.__pwaPrompt as early as possible.
    const alreadyCaptured = (window as any).__pwaPrompt;
    if (alreadyCaptured) {
      promptRef.current = alreadyCaptured;
      setDeferred(alreadyCaptured);
      setTimeout(() => setVisible(true), 2000);
    }

    // Also listen in case it fires later (e.g. after a delay on some browsers)
    const handler = (e: Event) => {
      e.preventDefault();
      (window as any).__pwaPrompt = e;
      promptRef.current = e;
      setDeferred(e);
      // Only show if not already visible from the early-capture path
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Fallback: if neither path fired after 7 s, show manual instructions anyway
    // (covers browsers that support PWA install but don't fire the event reliably)
    const fallback = setTimeout(() => {
      if (!promptRef.current) setVisible(true);
    }, 7000);

    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setTimeout(() => setVisible(false), 2500);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(fallback);
    };
  }, []);

  if (!visible || !platform) return null;

  const handleInstall = async () => {
    // No native prompt available (iOS, or browser that skips the event) — show steps
    if (!deferredPrompt) {
      setShowSteps(true);
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
      setTimeout(() => setVisible(false), 2500);
    }
    setDeferred(null);
    promptRef.current = null;
  };

  const handleDismiss = () => {
    saveDismissSession();
    setVisible(false);
  };

  // Position above the mobile bottom nav (4 rem) + safe-area inset + gap.
  // On desktop (no nav) this just sits ~88 px from the bottom — perfectly fine.
  const bottomStyle = "calc(4rem + env(safe-area-inset-bottom, 0px) + 1.25rem)";

  const isIOS = platform === "ios";

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-md"
      style={{ bottom: bottomStyle, pointerEvents: "auto" }}
    >
      <div className="bg-white dark:bg-shark-900 rounded-2xl shadow-2xl border border-shark-100 dark:border-shark-800 overflow-hidden">

        {/* ── Installed confirmation ── */}
        {installed ? (
          <div className="px-5 py-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
              <Icon name="check" size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-shark-900 dark:text-shark-100">App installed!</p>
              <p className="text-xs text-shark-400">Open Trackio from your home screen anytime.</p>
            </div>
          </div>

        /* ── Step-by-step instructions (iOS or fallback) ── */
        ) : showSteps ? (
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-shark-900 dark:text-shark-100">
                {isIOS ? "Add to Home Screen" : "Install the App"}
              </p>
              <button onClick={handleDismiss} className="text-shark-400 hover:text-shark-600 transition-colors">
                <Icon name="x" size={16} />
              </button>
            </div>

            {isIOS ? (
              <ol className="space-y-2">
                <li className="flex items-start gap-2.5 text-xs text-shark-600 dark:text-shark-300">
                  <span className="w-5 h-5 rounded-full bg-action-100 text-action-600 flex items-center justify-center font-bold shrink-0 mt-0.5">1</span>
                  <span>Tap the <strong>Share</strong> button <Icon name="upload" size={12} className="inline" /> in Safari&apos;s toolbar</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs text-shark-600 dark:text-shark-300">
                  <span className="w-5 h-5 rounded-full bg-action-100 text-action-600 flex items-center justify-center font-bold shrink-0 mt-0.5">2</span>
                  <span>Scroll down and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong></span>
                </li>
                <li className="flex items-start gap-2.5 text-xs text-shark-600 dark:text-shark-300">
                  <span className="w-5 h-5 rounded-full bg-action-100 text-action-600 flex items-center justify-center font-bold shrink-0 mt-0.5">3</span>
                  <span>Tap <strong>&ldquo;Add&rdquo;</strong> in the top-right corner</span>
                </li>
              </ol>
            ) : (
              <ol className="space-y-2">
                <li className="flex items-start gap-2.5 text-xs text-shark-600 dark:text-shark-300">
                  <span className="w-5 h-5 rounded-full bg-action-100 text-action-600 flex items-center justify-center font-bold shrink-0 mt-0.5">1</span>
                  <span>In your browser menu, tap <strong>&ldquo;Install app&rdquo;</strong> or <strong>&ldquo;Add to Home Screen&rdquo;</strong></span>
                </li>
                <li className="flex items-start gap-2.5 text-xs text-shark-600 dark:text-shark-300">
                  <span className="w-5 h-5 rounded-full bg-action-100 text-action-600 flex items-center justify-center font-bold shrink-0 mt-0.5">2</span>
                  <span>Tap <strong>&ldquo;Install&rdquo;</strong> to confirm</span>
                </li>
              </ol>
            )}

            <button
              onClick={handleDismiss}
              className="w-full text-center text-xs text-shark-400 hover:text-shark-600 transition-colors py-1"
            >
              Got it, dismiss
            </button>
          </div>

        /* ── Main install prompt ── */
        ) : (
          <div className="px-5 py-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-action-600 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-lg">T</span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-shark-900 dark:text-shark-100 truncate">Install Trackio</p>
              <p className="text-xs text-shark-400 leading-snug">
                {isIOS
                  ? "Add to your home screen for quick access"
                  : "Install for a faster, app-like experience"}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleDismiss}
                className="text-shark-400 hover:text-shark-600 transition-colors p-1"
                aria-label="Dismiss"
              >
                <Icon name="x" size={15} />
              </button>
              <button
                onClick={handleInstall}
                className="bg-action-600 hover:bg-action-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                Install
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
