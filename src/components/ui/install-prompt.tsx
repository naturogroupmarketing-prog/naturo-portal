"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";

const STORAGE_KEY = "naturo-install-dismissed-at-v2"; // v2 forces re-prompt after nav redesign
const DISMISS_DAYS = 14;

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

function isDismissed(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    return Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function dismiss() {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {}
}

export function InstallPrompt() {
  const [platform, setPlatform] = useState<Platform>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const [showIOSSteps, setShowIOSSteps] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Don't show if already running as installed app or previously dismissed
    if (isStandalone() || isDismissed()) return;

    const plt = detectPlatform();
    setPlatform(plt);

    if (plt === "android" || plt === "desktop") {
      // Chrome / Edge / Samsung Browser — capture beforeinstallprompt
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        // Slight delay so the page loads first
        setTimeout(() => setVisible(true), 3000);
      };
      window.addEventListener("beforeinstallprompt", handler);

      // Also listen for successful install
      window.addEventListener("appinstalled", () => {
        setInstalled(true);
        setTimeout(() => setVisible(false), 2500);
      });

      return () => {
        window.removeEventListener("beforeinstallprompt", handler);
      };
    }

    if (plt === "ios") {
      // On iOS we can't trigger the native prompt — just show instructions
      setTimeout(() => setVisible(true), 3000);
    }
  }, []);

  if (!visible || !platform) return null;

  const handleInstall = async () => {
    if (platform === "ios") {
      setShowIOSSteps(true);
      return;
    }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
      setTimeout(() => setVisible(false), 2500);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    dismiss();
    setVisible(false);
  };

  return (
    <div
      className="fixed bottom-[5.5rem] lg:bottom-4 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-md"
      style={{ pointerEvents: "auto" }}
    >
      <div className="bg-white dark:bg-shark-900 rounded-2xl shadow-2xl border border-shark-100 dark:border-shark-800 overflow-hidden">
        {installed ? (
          <div className="px-5 py-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
              <Icon name="check" size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-shark-900 dark:text-shark-100">App installed!</p>
              <p className="text-xs text-shark-400">You can now open Trackio from your home screen.</p>
            </div>
          </div>
        ) : showIOSSteps ? (
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-shark-900 dark:text-shark-100">Add to Home Screen</p>
              <button onClick={handleDismiss} className="text-shark-400 hover:text-shark-600 transition-colors">
                <Icon name="x" size={16} />
              </button>
            </div>
            <ol className="space-y-2">
              <li className="flex items-start gap-2.5 text-xs text-shark-600 dark:text-shark-300">
                <span className="w-5 h-5 rounded-full bg-action-100 text-action-600 flex items-center justify-center font-bold shrink-0 mt-0.5">1</span>
                <span>Tap the <strong>Share</strong> button <Icon name="upload" size={12} className="inline" /> in Safari's toolbar</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-shark-600 dark:text-shark-300">
                <span className="w-5 h-5 rounded-full bg-action-100 text-action-600 flex items-center justify-center font-bold shrink-0 mt-0.5">2</span>
                <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-shark-600 dark:text-shark-300">
                <span className="w-5 h-5 rounded-full bg-action-100 text-action-600 flex items-center justify-center font-bold shrink-0 mt-0.5">3</span>
                <span>Tap <strong>"Add"</strong> in the top-right corner</span>
              </li>
            </ol>
            <button
              onClick={handleDismiss}
              className="w-full text-center text-xs text-shark-400 hover:text-shark-600 transition-colors py-1"
            >
              Got it, dismiss
            </button>
          </div>
        ) : (
          <div className="px-5 py-4 flex items-center gap-4">
            {/* App icon */}
            <div className="w-12 h-12 rounded-2xl bg-action-600 flex items-center justify-center shrink-0 overflow-hidden">
              {/* Try using the favicon/icon, fall back to a styled initial */}
              <span className="text-white font-bold text-lg">T</span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-shark-900 dark:text-shark-100 truncate">Install Trackio</p>
              <p className="text-xs text-shark-400 leading-snug">
                {platform === "ios"
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
