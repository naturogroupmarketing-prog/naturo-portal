"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface CommandSearchProps {
  open: boolean;
  onClose: () => void;
}

interface QuickNavItem {
  emoji: string;
  label: string;
  href: string;
  shortcut: string;
}

const QUICK_NAV: QuickNavItem[] = [
  { emoji: "📦", label: "Assets", href: "/assets", shortcut: "G then A" },
  { emoji: "💧", label: "Consumables", href: "/consumables", shortcut: "G then C" },
  { emoji: "👥", label: "Staff", href: "/staff", shortcut: "G then S" },
  { emoji: "📋", label: "Reports", href: "/reports", shortcut: "G then R" },
  { emoji: "⚡", label: "Anomalies", href: "/alerts/anomalies", shortcut: "" },
];

const RECENT_SEARCHES = [
  "Low stock PPE",
  "Vacuum cleaner #23",
  "Pending purchase orders",
];

const SUGGESTED_PROMPTS = [
  "Show low stock items",
  "Who has vacuum #23",
  "What needs servicing this week",
  "Pending purchase orders",
];

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
  return { href: `/assets?search=${encodeURIComponent(query.trim())}`, label: "Assets search" };
}

export function CommandSearch({ open, onClose }: CommandSearchProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Reset query when closed
  useEffect(() => {
    if (!open) {
      setQuery("");
    } else {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Escape key to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const hasQuery = query.trim().length > 2;
  const result = hasQuery ? resolveQuery(query) : null;

  const handleNavigate = (href: string) => {
    onClose();
    router.push(href);
  };

  const handlePromptClick = (prompt: string) => {
    const resolved = resolveQuery(prompt);
    onClose();
    router.push(resolved.href);
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
          <div className="fixed inset-0 z-[61] flex items-start justify-center pt-[10vh] px-4 pointer-events-none">
            <motion.div
              key="modal"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-2xl bg-white dark:bg-shark-900 rounded-2xl shadow-2xl border border-shark-200 dark:border-shark-700 overflow-hidden pointer-events-auto"
            >
              {/* Search input row */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-shark-100 dark:border-shark-800">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-shark-400 shrink-0"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search assets, stock, staff... or ask AI"
                  className="flex-1 bg-transparent text-lg text-shark-900 dark:text-shark-100 placeholder-shark-400 outline-none border-none"
                />
                <kbd className="hidden sm:inline-flex items-center gap-1 text-xs text-shark-400 bg-shark-100 dark:bg-shark-800 border border-shark-200 dark:border-shark-700 px-2 py-1 rounded font-mono shrink-0">
                  Esc
                </kbd>
              </div>

              {/* Body — two-column layout */}
              <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-shark-100 dark:divide-shark-800 max-h-[60vh] overflow-hidden">
                {/* LEFT — Quick navigate */}
                <div className="sm:w-1/2 p-4 overflow-y-auto">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-shark-400 mb-2 px-1">
                    Quick Navigate
                  </p>
                  <div className="space-y-0.5">
                    {QUICK_NAV.map((item) => (
                      <button
                        key={item.href}
                        onClick={() => handleNavigate(item.href)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-shark-50 dark:hover:bg-shark-800 transition-colors text-left group"
                      >
                        <span className="text-base leading-none w-5 text-center shrink-0">
                          {item.emoji}
                        </span>
                        <span className="flex-1 text-sm text-shark-700 dark:text-shark-200 font-medium">
                          {item.label}
                        </span>
                        {item.shortcut && (
                          <kbd className="text-[10px] text-shark-400 bg-shark-100 dark:bg-shark-700 px-1.5 py-0.5 rounded font-mono shrink-0">
                            {item.shortcut}
                          </kbd>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* RIGHT — AI Results or Recent */}
                <div className="sm:w-1/2 p-4 overflow-y-auto">
                  {hasQuery && result ? (
                    <>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-shark-400 mb-2 px-1">
                        Navigate
                      </p>
                      <button
                        onClick={() => handleNavigate(result.href)}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-action-50 dark:bg-action-500/10 hover:bg-action-100 dark:hover:bg-action-500/20 border border-action-200 dark:border-action-500/30 transition-colors text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-shark-800 dark:text-shark-100">
                            Navigate to{" "}
                            <span className="text-action-600 dark:text-action-400">
                              {result.label}
                            </span>
                          </p>
                          <p className="text-xs text-shark-400 truncate mt-0.5">
                            for &ldquo;{query}&rdquo;
                          </p>
                        </div>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-action-500 shrink-0"
                        >
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Recent searches */}
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-shark-400 mb-2 px-1">
                        Recent Searches
                      </p>
                      <div className="space-y-0.5 mb-4">
                        {RECENT_SEARCHES.map((s) => (
                          <button
                            key={s}
                            onClick={() => {
                              const resolved = resolveQuery(s);
                              handleNavigate(resolved.href);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-shark-50 dark:hover:bg-shark-800 transition-colors text-left"
                          >
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-shark-400 shrink-0"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <span className="text-sm text-shark-600 dark:text-shark-300">{s}</span>
                          </button>
                        ))}
                      </div>

                      {/* Suggested prompts */}
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-shark-400 mb-2 px-1">
                        Try Asking
                      </p>
                      <div className="space-y-0.5">
                        {SUGGESTED_PROMPTS.map((p) => (
                          <button
                            key={p}
                            onClick={() => handlePromptClick(p)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-shark-50 dark:hover:bg-shark-800 transition-colors text-left"
                          >
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-action-400 shrink-0"
                            >
                              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                            </svg>
                            <span className="text-sm text-shark-600 dark:text-shark-300">{p}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
