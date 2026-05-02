"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";

type Platform = "ios-safari" | "ios-other" | "android" | "desktop" | null;

function detectPlatform(): Platform {
  if (typeof window === "undefined") return null;
  const ua = navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua) && !(window as any).MSStream;
  if (isIOS) {
    // Safari on iOS: no "CriOS" (Chrome) or "FxiOS" (Firefox)
    const isSafari = !/CriOS|FxiOS|OPiOS|EdgiOS/i.test(ua);
    return isSafari ? "ios-safari" : "ios-other";
  }
  if (/android/i.test(ua)) return "android";
  return "desktop";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

export function InstallPrompt() {
  const [platform, setPlatform]       = useState<Platform>(null);
  const [deferredPrompt, setDeferred] = useState<any>(null);
  const [visible, setVisible]         = useState(false);
  const [installed, setInstalled]     = useState(false);
  const promptRef = useRef<any>(null);

  useEffect(() => {
    if (isStandalone()) return;

    const plt = detectPlatform();
    setPlatform(plt);

    // iOS-other (Chrome on iPhone etc): show immediately — user needs to switch browser
    if (plt === "ios-other") {
      setVisible(true);
      return;
    }

    // iOS Safari: show instructions immediately — no native prompt available
    if (plt === "ios-safari") {
      setTimeout(() => setVisible(true), 1000);
      return;
    }

    // Android / Desktop: ONLY show when Chrome fires the native install prompt.
    // Never fall back to manual instructions — those create a Chrome shortcut,
    // not a real installed PWA.
    const captured = (window as any).__pwaPrompt;
    if (captured) {
      promptRef.current = captured;
      setDeferred(captured);
      setTimeout(() => setVisible(true), 1000);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      (window as any).__pwaPrompt = e;
      promptRef.current = e;
      setDeferred(e);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setTimeout(() => setVisible(false), 2500);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  if (!visible || !platform) return null;

  const handleNativeInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
      setTimeout(() => setVisible(false), 2500);
    }
    setDeferred(null);
    promptRef.current = null;
  };

  const handleDismiss = () => setVisible(false);

  // Sits above the mobile bottom nav + notch safe area
  const bottomStyle = "calc(4rem + env(safe-area-inset-bottom, 0px) + 1.25rem)";

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-sm"
      style={{ bottom: bottomStyle }}
    >
      <div className="bg-white dark:bg-shark-900 rounded-2xl shadow-2xl border border-shark-100 dark:border-shark-800 overflow-hidden">

        {/* ── Installed ── */}
        {installed && (
          <div className="px-5 py-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
              <Icon name="check" size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-shark-900 dark:text-shark-100">App installed!</p>
              <p className="text-xs text-shark-400">Open Trackio from your home screen.</p>
            </div>
          </div>
        )}

        {/* ── iOS Safari: Add to Home Screen steps ── */}
        {!installed && platform === "ios-safari" && (
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-action-600 flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-sm">T</span>
                </div>
                <p className="text-sm font-semibold text-shark-900 dark:text-shark-100">Install Trackio</p>
              </div>
              <button onClick={handleDismiss} className="text-shark-400 hover:text-shark-600 p-1 -mr-1">
                <Icon name="x" size={15} />
              </button>
            </div>
            <ol className="space-y-2.5 mb-3">
              <li className="flex items-center gap-3 text-xs text-shark-700 dark:text-shark-300">
                <span className="w-6 h-6 rounded-full bg-action-500 text-white flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                <span>Tap the <strong>Share</strong> button
                  {/* Safari share icon */}
                  <svg className="inline mx-1 mb-0.5" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
                  at the bottom of Safari
                </span>
              </li>
              <li className="flex items-center gap-3 text-xs text-shark-700 dark:text-shark-300">
                <span className="w-6 h-6 rounded-full bg-action-500 text-white flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                <span>Scroll down and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong></span>
              </li>
              <li className="flex items-center gap-3 text-xs text-shark-700 dark:text-shark-300">
                <span className="w-6 h-6 rounded-full bg-action-500 text-white flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
                <span>Tap <strong>&ldquo;Add&rdquo;</strong> in the top-right corner</span>
              </li>
            </ol>
            <button onClick={handleDismiss} className="w-full text-center text-[11px] text-shark-400 hover:text-shark-600 py-1">
              Dismiss
            </button>
          </div>
        )}

        {/* ── iOS Chrome / Firefox etc: must use Safari ── */}
        {!installed && platform === "ios-other" && (
          <div className="px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-action-600 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-white font-bold">T</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-shark-900 dark:text-shark-100">Install Trackio</p>
                  <p className="text-xs text-shark-400 mt-0.5 leading-snug">
                    Open this page in <strong>Safari</strong> to add it to your home screen.
                  </p>
                  <p className="text-[11px] text-shark-400 mt-1">
                    Copy the URL, open Safari, and paste it.
                  </p>
                </div>
              </div>
              <button onClick={handleDismiss} className="text-shark-400 hover:text-shark-600 p-1 shrink-0">
                <Icon name="x" size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ── Android / Desktop with native prompt ── */}
        {!installed && (platform === "android" || platform === "desktop") && deferredPrompt && (
          <div className="px-5 py-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-action-600 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-shark-900 dark:text-shark-100">Install Trackio</p>
              <p className="text-xs text-shark-400 leading-snug">Install for a faster, app-like experience</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={handleDismiss} className="text-shark-400 hover:text-shark-600 p-1" aria-label="Dismiss">
                <Icon name="x" size={15} />
              </button>
              <button onClick={handleNativeInstall} className="bg-action-600 hover:bg-action-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors">
                Install
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
