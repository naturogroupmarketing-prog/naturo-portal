"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("trackio-cookie-consent");
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem("trackio-cookie-consent", "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem("trackio-cookie-consent", "essential-only");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-shark-900 border-t border-shark-200 dark:border-shark-700 shadow-lg px-4 py-3 sm:px-6 sm:py-4 transition-colors">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <p className="text-sm text-shark-600 dark:text-shark-200 flex-1">
          We use essential cookies to keep you logged in. No advertising or tracking cookies are used.{" "}
          <Link href="/privacy-policy" className="text-action-500 dark:text-action-400 hover:underline">Privacy Policy</Link>
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={decline}
            className="px-4 py-2 text-sm text-shark-500 hover:text-shark-700 dark:text-shark-200 dark:hover:text-white border border-shark-200 dark:border-shark-600 rounded-lg hover:bg-shark-50 dark:hover:bg-shark-800 transition-colors"
          >
            Essential Only
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
            style={{ backgroundColor: "#1F3DD9" }}
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
