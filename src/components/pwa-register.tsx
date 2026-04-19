"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWARegister() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // Check if already dismissed
    if (typeof window !== "undefined" && localStorage.getItem("trackio-pwa-dismissed")) {
      setDismissed(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === "accepted") {
      setInstallPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setInstallPrompt(null);
    localStorage.setItem("trackio-pwa-dismissed", "1");
  };

  // Don't show if already installed, dismissed, or no prompt available
  if (!installPrompt || dismissed) return null;

  return (
    <div className="fixed bottom-36 sm:bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-30 bg-white border border-shark-200 rounded-xl shadow-lg p-4 animate-slide-in safe-bottom">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-action-50 flex items-center justify-center shrink-0">
          <Icon name="download" size={18} className="text-action-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-shark-900">Install trackio</p>
          <p className="text-xs text-shark-400 mt-0.5">Install as an app for faster access and mic permissions</p>
          <div className="flex items-center gap-2 mt-2.5">
            <button onClick={handleInstall} className="text-xs font-semibold text-white bg-action-500 hover:bg-action-600 px-3 py-1.5 rounded-lg transition-colors">
              Install
            </button>
            <button onClick={handleDismiss} className="text-xs text-shark-400 hover:text-shark-600 px-2 py-1.5 transition-colors">
              Not now
            </button>
          </div>
        </div>
        <button onClick={handleDismiss} className="text-shark-300 hover:text-shark-500 p-0.5">
          <Icon name="x" size={14} />
        </button>
      </div>
    </div>
  );
}
