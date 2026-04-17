"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface CommandSearchProps {
  open: boolean;
  onClose: () => void;
}

function resolveQuery(query: string): string {
  const q = query.toLowerCase();
  if (q.includes("low stock"))  return "/alerts/low-stock";
  if (q.includes("damage"))     return "/alerts/damage";
  if (q.includes("return"))     return "/returns";
  if (q.includes("order") || q.includes(" po")) return "/purchase-orders";
  if (q.includes("staff") || q.includes("team")) return "/staff";
  if (q.includes("report"))     return "/reports";
  if (q.includes("maintenance"))return "/maintenance";
  if (q.includes("anomal"))     return "/alerts/anomalies";
  if (q.includes("consumable") || q.includes("supply") || q.includes("supplies")) return "/consumables";
  if (q.includes("asset"))      return "/assets";
  return `/assets?search=${encodeURIComponent(query.trim())}`;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onClose();
    router.push(resolveQuery(query));
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <div className="fixed inset-0 z-[61] flex items-start justify-center pt-[12vh] px-4 pointer-events-none">
            <motion.div
              key="modal"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-xl pointer-events-auto"
            >
              <form onSubmit={handleSubmit}>
                <div className="flex items-center gap-3 px-5 py-4 bg-white dark:bg-shark-900 rounded-2xl shadow-2xl border border-shark-200 dark:border-shark-700">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-shark-400 shrink-0">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search assets, stock, staff…"
                    className="flex-1 bg-transparent text-lg text-shark-900 dark:text-shark-100 placeholder-shark-400 outline-none border-none"
                  />
                  <kbd className="hidden sm:inline-flex items-center text-xs text-shark-400 bg-shark-100 dark:bg-shark-800 border border-shark-200 dark:border-shark-700 px-2 py-1 rounded font-mono shrink-0">
                    Esc
                  </kbd>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
