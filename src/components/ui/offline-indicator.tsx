"use client";

import { useState, useEffect } from "react";
import { Icon } from "./icon";

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);

    // Check initial state
    if (!navigator.onLine) setIsOffline(true);

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[200] safe-top">
      <div className="bg-red-600 text-white text-center px-4 py-2 text-sm font-medium flex items-center justify-center gap-2">
        <Icon name="alert-triangle" size={16} />
        You&apos;re offline — changes won&apos;t sync until you reconnect
      </div>
    </div>
  );
}
