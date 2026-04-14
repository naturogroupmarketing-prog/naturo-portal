"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Global keyboard shortcuts handler.
 * - Cmd/Ctrl+K: Open command palette (handled by command-palette.tsx)
 * - G then D: Go to Dashboard
 * - G then A: Go to Assets
 * - G then S: Go to Staff
 * - G then P: Go to Purchase Orders
 * - G then I: Go to Inventory
 * - G then R: Go to Reports
 * - ?: Show keyboard shortcuts help (in command palette)
 */
export function KeyboardShortcuts() {
  const router = useRouter();
  const pendingG = useRef(false);
  const gTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.target as HTMLElement)?.isContentEditable) return;

      // Skip if modifier keys are held (except for ?)
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "g" && !pendingG.current) {
        pendingG.current = true;
        clearTimeout(gTimeout.current);
        gTimeout.current = setTimeout(() => {
          pendingG.current = false;
        }, 1000);
        return;
      }

      if (pendingG.current) {
        pendingG.current = false;
        clearTimeout(gTimeout.current);

        const routes: Record<string, string> = {
          d: "/dashboard",
          a: "/assets",
          s: "/staff",
          p: "/purchase-orders",
          i: "/inventory",
          r: "/reports",
          c: "/consumables",
          o: "/alerts",
          h: "/help",
        };

        const route = routes[e.key.toLowerCase()];
        if (route) {
          e.preventDefault();
          router.push(route);
        }
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [router]);

  return null;
}
