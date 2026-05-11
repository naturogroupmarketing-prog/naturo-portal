"use client";

import { useEffect } from "react";

/**
 * Registers the service worker only.
 * The install prompt UI is handled exclusively by InstallPrompt (portal layout).
 */
export function PWARegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return null;
}
