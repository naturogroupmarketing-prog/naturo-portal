"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";

type Platform = "ios-safari" | "ios-other" | "android" | "desktop" | null;
type State = "idle" | "ready" | "installed";

function detectPlatform(): Platform {
  if (typeof window === "undefined") return null;
  const ua = navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua) && !(window as any).MSStream;
  if (isIOS) {
    return /CriOS|FxiOS|OPiOS|EdgiOS/i.test(ua) ? "ios-other" : "ios-safari";
  }
  if (/android/i.test(ua)) return "android";
  return "desktop";
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

export function InstallAppSection() {
  const [state, setState] = useState<State>("idle");
  const [platform, setPlatform] = useState<Platform>(null);
  const [deferredPrompt, setDeferred] = useState<any>(null);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setState("installed");
      return;
    }
    const plt = detectPlatform();
    setPlatform(plt);

    // Android / Desktop — check for captured native prompt
    const captured = (window as any).__pwaPrompt;
    if (captured) {
      setDeferred(captured);
      setState("ready");
    }

    const handler = (e: Event) => {
      e.preventDefault();
      (window as any).__pwaPrompt = e;
      setDeferred(e);
      setState("ready");
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setState("installed"));

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setState("installed");
      setDeferred(null);
    }
  };

  // ── Already installed ─────────────────────────────────────────────────────
  if (state === "installed") {
    return (
      <div className="flex items-center gap-3 py-1">
        <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
          <Icon name="check-circle" size={18} className="text-green-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-shark-800 dark:text-shark-200">App installed</p>
          <p className="text-xs text-shark-400 mt-0.5">Trackio is on your home screen</p>
        </div>
      </div>
    );
  }

  // ── Native prompt ready (Android / Desktop) ───────────────────────────────
  if (state === "ready" && deferredPrompt) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-action-100 flex items-center justify-center shrink-0">
            <Icon name="download" size={18} className="text-action-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-shark-800 dark:text-shark-200">Install App</p>
            <p className="text-xs text-shark-400 mt-0.5">Add Trackio to your home screen</p>
          </div>
        </div>
        <button
          onClick={handleInstall}
          className="text-xs font-semibold text-white bg-action-600 hover:bg-action-700 px-4 py-2 rounded-lg transition-colors"
        >
          Install
        </button>
      </div>
    );
  }

  // ── iOS Safari — collapsible guide ────────────────────────────────────────
  if (platform === "ios-safari") {
    return (
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-action-100 flex items-center justify-center shrink-0">
              <Icon name="download" size={18} className="text-action-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-shark-800 dark:text-shark-200">Install App</p>
              <p className="text-xs text-shark-400 mt-0.5">Add to your iPhone home screen</p>
            </div>
          </div>
          <button
            onClick={() => setShowGuide((p) => !p)}
            className="text-xs font-semibold text-action-600 hover:text-action-700 px-3 py-1.5 bg-action-50 rounded-lg shrink-0"
          >
            {showGuide ? "Close" : "How to"}
          </button>
        </div>
        {showGuide && (
          <div className="mt-3 bg-shark-50 dark:bg-shark-800 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-shark-500 uppercase tracking-wider">Steps to install</p>
            <ol className="space-y-2.5">
              {[
                <>Tap the <strong>Share</strong> button{" "}
                  <svg className="inline mb-0.5" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>{" "}
                  at the bottom of Safari
                </>,
                <>Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong></>,
                <>Tap <strong>&quot;Add&quot;</strong> in the top-right corner</>,
              ].map((step, i) => (
                <li key={i} className="flex items-center gap-3 text-xs text-shark-700 dark:text-shark-300">
                  <span className="w-6 h-6 rounded-full bg-action-500 text-white flex items-center justify-center font-bold text-[11px] shrink-0">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    );
  }

  // ── iOS Chrome / Firefox — needs Safari ───────────────────────────────────
  if (platform === "ios-other") {
    return (
      <div className="flex items-center gap-3 py-1">
        <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
          <Icon name="alert-triangle" size={18} className="text-amber-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-shark-800 dark:text-shark-200">Open in Safari to install</p>
          <p className="text-xs text-shark-400 mt-0.5">Copy the URL, open Safari, and paste it</p>
        </div>
      </div>
    );
  }

  // ── Android / Desktop — no native prompt yet, show Chrome guide ───────────
  if (platform === "android" || platform === "desktop") {
    const isAndroid = platform === "android";
    const steps = isAndroid
      ? [
          <>Tap the <strong>three-dot menu (⋮)</strong> in Chrome's address bar</>,
          <>Tap <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home Screen&quot;</strong></>,
          <>Tap <strong>&quot;Install&quot;</strong> to confirm</>,
        ]
      : [
          <>Click the <strong>install icon (⊕)</strong> in your browser's address bar</>,
          <>Or open the browser menu and select <strong>&quot;Install Trackio&quot;</strong></>,
          <>Click <strong>&quot;Install&quot;</strong> to confirm</>,
        ];

    return (
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-action-100 flex items-center justify-center shrink-0">
              <Icon name="download" size={18} className="text-action-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-shark-800 dark:text-shark-200">Install App</p>
              <p className="text-xs text-shark-400 mt-0.5">Add Trackio to your home screen</p>
            </div>
          </div>
          <button
            onClick={() => setShowGuide((p) => !p)}
            className="text-xs font-semibold text-action-600 hover:text-action-700 px-3 py-1.5 bg-action-50 rounded-lg shrink-0"
          >
            {showGuide ? "Close" : "How to"}
          </button>
        </div>
        {showGuide && (
          <div className="mt-3 bg-shark-50 dark:bg-shark-800 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-shark-500 uppercase tracking-wider">
              Steps to install{isAndroid ? " (Chrome)" : ""}
            </p>
            <ol className="space-y-2.5">
              {steps.map((step, i) => (
                <li key={i} className="flex items-center gap-3 text-xs text-shark-700 dark:text-shark-300">
                  <span className="w-6 h-6 rounded-full bg-action-500 text-white flex items-center justify-center font-bold text-[11px] shrink-0">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    );
  }

  return null;
}
