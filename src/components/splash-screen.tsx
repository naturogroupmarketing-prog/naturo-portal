"use client";

import { useState, useEffect } from "react";

export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade out after 1.5s
    const fadeTimer = setTimeout(() => setFadeOut(true), 1500);
    // Remove from DOM after fade completes
    const removeTimer = setTimeout(() => setVisible(false), 2200);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center transition-opacity duration-700 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
      style={{ backgroundColor: "#ffffff" }}
      id="splash-screen"
    >
      {/* Animated logo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/trackio_t_full_logo.svg"
        alt="trackio"
        className="h-16 w-auto animate-splash-icon"
        draggable={false}
      />

      <style jsx global>{`
        @media (prefers-color-scheme: dark) {
          .dark #splash-screen {
            background-color: #1a1c21 !important;
          }
        }
        @keyframes splash-icon {
          0% {
            opacity: 0;
            transform: scale(0.6);
          }
          40% {
            opacity: 1;
            transform: scale(1.08);
          }
          60% {
            transform: scale(0.96);
          }
          80% {
            transform: scale(1.02);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-splash-icon {
          animation: splash-icon 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  );
}
