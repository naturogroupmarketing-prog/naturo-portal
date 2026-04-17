"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface CommandSearchProps {
  open: boolean;
  onClose: () => void;
}

function resolveQuery(query: string): { href: string; label: string } {
  const q = query.toLowerCase();
  if (q.includes("low stock")) return { href: "/alerts/low-stock", label: "Low Stock Alerts" };
  if (q.includes("damage")) return { href: "/alerts/damage", label: "Damage Alerts" };
  if (q.includes("return")) return { href: "/returns", label: "Returns" };
  if (q.includes("order") || q.includes(" po")) return { href: "/purchase-orders", label: "Purchase Orders" };
  if (q.includes("staff") || q.includes("team")) return { href: "/staff", label: "Staff" };
  if (q.includes("report")) return { href: "/reports", label: "Reports" };
  if (q.includes("maintenance")) return { href: "/maintenance", label: "Maintenance" };
  if (q.includes("anomal")) return { href: "/alerts/anomalies", label: "Anomalies" };
  if (q.includes("consumable") || q.includes("supply") || q.includes("supplies") || q.includes("stock")) return { href: "/consumables", label: "Consumables" };
  if (q.includes("asset")) return { href: "/assets", label: "Assets" };
  return { href: `/assets?search=${encodeURIComponent(query.trim())}`, label: `Search assets for "${query.trim()}"` };
}

export function CommandSearch({ open, onClose }: CommandSearchProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) {
      setQuery("");
    } else {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const hasQuery = query.trim().length > 1;
  const result = hasQuery ? resolveQuery(query) : null;

  const handleNavigate = (href: string) => {
    onClose();
    router.push(href);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && result) {
      handleNavigate(result.href);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[61] flex items-start justify-center pt-[12vh] px-4 pointer-events-none">
            <motion.div
              key="modal"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-xl bg-white dark:bg-shark-900 rounded-2xl shadow-2xl border border-shark-200 dark:border-shark-700 overflow-hidden pointer-events-auto"
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-5 py-4">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-shark-400 shrink-0">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search or ask AI anything…"
                  className="flex-1 bg-transparent text-lg text-shark-900 dark:text-shark-100 placeholder-shark-400 outline-none border-none"
                />
                <kbd className="hidden sm:inline-flex items-center text-xs text-shark-400 bg-shark-100 dark:bg-shark-800 border border-shark-200 dark:border-shark-700 px-2 py-1 rounded font-mono shrink-0">
                  Esc
                </kbd>
              </div>

              {/* AI result — only shows when user has typed */}
              {result && (
                <div className="px-4 pb-4">
                  <button
                    onClick={() => handleNavigate(result.href)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-shark-50 dark:bg-shark-800 hover:bg-shark-100 dark:hover:bg-shark-700 border border-shark-100 dark:border-shark-700 transition-colors text-left"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-action-500 shrink-0">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    <span className="flex-1 text-sm text-shark-800 dark:text-shark-100">{result.label}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-shark-400 shrink-0">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
