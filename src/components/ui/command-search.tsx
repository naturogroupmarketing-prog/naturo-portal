"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Icon, type IconName } from "@/components/ui/icon";

interface CommandSearchProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  icon: IconName;
  label: string;
  href: string;
  keywords?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { icon: "home",           label: "Dashboard",       href: "/dashboard",         keywords: ["home"] },
  { icon: "droplet",        label: "Supplies",        href: "/inventory",         keywords: ["stock", "consumable", "supply", "inventory", "location"] },
  { icon: "package",        label: "Assets",          href: "/assets",            keywords: ["equipment", "items"] },
  { icon: "truck",          label: "Purchase Orders", href: "/purchase-orders",   keywords: ["po", "order", "buy"] },
  { icon: "users",          label: "Staff",           href: "/staff",             keywords: ["team", "people", "member"] },
  { icon: "box",            label: "Starter Kits",   href: "/starter-kits",      keywords: ["kit", "kits"] },
  { icon: "arrow-left",     label: "Returns",         href: "/returns",           keywords: ["return"] },
  { icon: "wrench",         label: "Maintenance",     href: "/maintenance",       keywords: ["repair", "service"] },
  { icon: "bar-chart",      label: "Reports",         href: "/reports",           keywords: ["report", "analytics"] },
  { icon: "search",         label: "Inspections",     href: "/condition-checks",  keywords: ["condition", "check", "inspect"] },
  { icon: "alert-triangle", label: "Anomalies",       href: "/alerts/anomalies",  keywords: ["alert", "anomaly"] },
  { icon: "alert-triangle", label: "Low Stock",       href: "/alerts/low-stock",  keywords: ["low", "stock", "alert"] },
  { icon: "settings",       label: "Settings",        href: "/settings",          keywords: ["setting", "config"] },
];

function resolveQuery(query: string): string {
  const q = query.toLowerCase().trim();
  // Try to match a nav item first
  const match = NAV_ITEMS.find(
    (item) =>
      item.label.toLowerCase().includes(q) ||
      item.keywords?.some((k) => k.includes(q))
  );
  if (match) return match.href;
  // Fall back to asset search
  return `/assets?search=${encodeURIComponent(query.trim())}`;
}

function filterItems(query: string): NavItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return NAV_ITEMS;
  return NAV_ITEMS.filter(
    (item) =>
      item.label.toLowerCase().includes(q) ||
      item.keywords?.some((k) => k.includes(q))
  );
}

export function CommandSearch({ open, onClose }: CommandSearchProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const filtered = filterItems(query);

  // Reset state on open/close
  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
    } else {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered.length > 0 && !query.trim()) {
          // Navigate to focused nav item
          navigate(filtered[activeIndex].href);
        } else if (query.trim()) {
          // Navigate via query resolver
          onClose();
          router.push(resolveQuery(query));
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose, filtered, activeIndex, query]);

  const navigate = (href: string) => {
    onClose();
    router.push(href);
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
            className="fixed inset-0 z-[60] bg-black/40"
            onClick={onClose}
          />

          {/* Panel */}
          <div className="fixed inset-0 z-[61] flex items-start justify-center pt-[10vh] px-4 pointer-events-none">
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-lg bg-white dark:bg-shark-900 rounded-[20px] shadow-2xl border border-shark-200 dark:border-shark-700 overflow-hidden pointer-events-auto"
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-shark-100 dark:border-shark-800">
                <Icon name="search" size={16} className="text-shark-400 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search or jump to…"
                  className="flex-1 bg-transparent text-base text-shark-900 dark:text-shark-100 placeholder-shark-400 outline-none border-none"
                />
                <kbd className="hidden sm:inline-flex items-center text-xs text-shark-400 bg-shark-100 dark:bg-shark-800 border border-shark-200 dark:border-shark-700 px-1.5 py-0.5 rounded font-mono shrink-0">
                  Esc
                </kbd>
              </div>

              {/* Results */}
              <div className="p-2 max-h-[60vh] overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="py-8 text-center text-sm text-shark-400">
                    No results for &ldquo;{query}&rdquo;
                  </div>
                ) : (
                  <>
                    {!query && (
                      <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-shark-400 mb-0.5">
                        Jump to
                      </p>
                    )}
                    {filtered.map((item, i) => (
                      <button
                        key={item.href}
                        onClick={() => navigate(item.href)}
                        onMouseEnter={() => setActiveIndex(i)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[14px] transition-colors text-left group ${
                          i === activeIndex
                            ? "bg-action-50 dark:bg-action-950/40"
                            : "hover:bg-shark-50 dark:hover:bg-shark-800/40"
                        }`}
                      >
                        <span
                          className={`w-7 h-7 flex items-center justify-center rounded-[10px] shrink-0 transition-colors ${
                            i === activeIndex
                              ? "bg-action-100 dark:bg-action-900/50"
                              : "bg-shark-100 dark:bg-shark-800"
                          }`}
                        >
                          <Icon
                            name={item.icon}
                            size={14}
                            className={
                              i === activeIndex
                                ? "text-action-600 dark:text-action-400"
                                : "text-shark-500 dark:text-shark-400"
                            }
                          />
                        </span>
                        <span
                          className={`flex-1 text-sm font-medium transition-colors ${
                            i === activeIndex
                              ? "text-action-700 dark:text-action-300"
                              : "text-shark-700 dark:text-shark-200"
                          }`}
                        >
                          {item.label}
                        </span>
                        {i === activeIndex && (
                          <kbd className="text-[10px] text-shark-400 dark:text-shark-500 bg-shark-100 dark:bg-shark-800 border border-shark-200 dark:border-shark-700 px-1.5 py-0.5 rounded font-mono shrink-0">
                            ↵
                          </kbd>
                        )}
                      </button>
                    ))}

                    {/* Free-text search footer when query is typed but no exact route match */}
                    {query.trim() && filtered.length > 0 && (
                      <button
                        onClick={() => { onClose(); router.push(`/assets?search=${encodeURIComponent(query.trim())}`); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[14px] hover:bg-shark-50 dark:hover:bg-shark-800/40 transition-colors text-left mt-0.5 border-t border-shark-100 dark:border-shark-800 pt-2 mt-1"
                      >
                        <span className="w-7 h-7 flex items-center justify-center rounded-[10px] bg-shark-100 dark:bg-shark-800 shrink-0">
                          <Icon name="search" size={14} className="text-shark-500 dark:text-shark-400" />
                        </span>
                        <span className="text-sm text-shark-500 dark:text-shark-400">
                          Search assets for <span className="font-semibold text-shark-700 dark:text-shark-200">&ldquo;{query}&rdquo;</span>
                        </span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
