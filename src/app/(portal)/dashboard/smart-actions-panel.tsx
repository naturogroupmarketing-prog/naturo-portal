"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";

export interface SmartActionItem {
  id: string;
  priority: "critical" | "urgent" | "normal";
  type: "request" | "overdue" | "stock" | "po" | "damage";
  title: string;
  description: string;
  href: string;
  timeLabel: string;
}

const XP_BY_PRIORITY = { critical: 50, urgent: 25, normal: 10 } as const;

function totalXP(items: SmartActionItem[]) {
  return items.reduce((sum, i) => sum + XP_BY_PRIORITY[i.priority], 0);
}


const DISMISS_KEY = "naturo-smartpanel-dismissed-at-v2";
const DISMISS_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

export function SmartActionsPanel({ items, maxHeight }: { items: SmartActionItem[]; maxHeight?: number }) {
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [xpFloating, setXpFloating] = useState<string | null>(null);
  const [celebrated, setCelebrated] = useState(false);
  const xpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(DISMISS_KEY);
    if (stored && Date.now() - parseInt(stored, 10) < DISMISS_DURATION_MS) {
      setDismissed(true);
    }
    // One-time confetti celebrate when panel is all-clear
    if (items.length === 0) {
      const key = "naturo-allclear-celebrated";
      if (!sessionStorage.getItem(key)) {
        setCelebrated(true);
        sessionStorage.setItem(key, "1");
      }
    }
  }, [items.length]);

  const handleXpClick = (id: string, priority: SmartActionItem["priority"]) => {
    setXpFloating(`${id}-${XP_BY_PRIORITY[priority]}`);
    if (xpTimerRef.current) clearTimeout(xpTimerRef.current);
    xpTimerRef.current = setTimeout(() => setXpFloating(null), 1500);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setDismissed(true);
  };

  const handleReopen = () => {
    localStorage.removeItem(DISMISS_KEY);
    setDismissed(false);
  };

  // Don't render until mounted (avoids hydration mismatch with localStorage)
  if (!mounted) return null;

  const criticalCount = items.filter((i) => i.priority === "critical").length;
  const urgentCount = items.filter((i) => i.priority === "urgent").length;

  // Collapsed state — show a small re-open chip if there are critical items
  if (dismissed) {
    if (criticalCount === 0 && urgentCount === 0) return null;
    return (
      <button
        onClick={handleReopen}
        className="flex items-center gap-2 text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full hover:bg-red-100 transition-colors"
      >
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
        {criticalCount > 0
          ? `${criticalCount} urgent action${criticalCount !== 1 ? "s" : ""} need attention`
          : `${urgentCount} item${urgentCount !== 1 ? "s" : ""} need attention`}
      </button>
    );
  }

  return (
    <div
      className="bg-white dark:bg-shark-900 border border-shark-100 dark:border-shark-800 rounded-2xl shadow-sm overflow-hidden flex flex-col"
      style={maxHeight ? { height: maxHeight } : undefined}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-shark-100 dark:border-shark-800">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-shark-900 dark:text-shark-100">Priority Alerts</span>
          {items.length > 0 && (
            <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full leading-tight">
              +{totalXP(items)} XP
            </span>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          {items.length > 0 && (
            <span className="text-[10px] font-bold bg-[#E8532E] text-white px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-tight">
              {items.length}
            </span>
          )}
          <button
            onClick={handleDismiss}
            className="text-[11px] font-semibold text-action-500 hover:text-action-700 dark:hover:text-action-300 transition-colors"
            title="Dismiss for 8 hours"
          >
            Dismiss
          </button>
        </div>
      </div>

      {/* All clear */}
      {items.length === 0 ? (
        <div className="px-5 py-8 text-center flex-1 flex flex-col items-center justify-center">
          <div className={`relative w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3 ${celebrated ? "animate-grade-pop" : ""}`}>
            <Icon name="check-circle" size={20} className="text-green-600" />
            {celebrated && (
              <>
                {["#E8532E","#1113d4","#c9a84c","#10b981","#e879f9","#f59e0b"].map((c, i) => (
                  <span key={i} className="animate-confetti-pop absolute w-2 h-2 rounded-full" style={{ background: c, top: "50%", left: "50%", transformOrigin: `${12 * Math.cos((i/6)*2*Math.PI)}px ${12 * Math.sin((i/6)*2*Math.PI)}px`, animationDelay: `${i * 0.07}s` }} />
                ))}
              </>
            )}
          </div>
          <p className="text-sm font-semibold text-shark-700 dark:text-shark-300">All clear</p>
          <p className="text-xs text-shark-400 mt-1">No outstanding alerts right now</p>
          {celebrated && (
            <p className="text-[10px] font-bold text-amber-600 mt-2 animate-xp-float">🎉 Quest complete!</p>
          )}
        </div>
      ) : (
        <div className="divide-y divide-shark-50 dark:divide-shark-800 overflow-y-auto flex-1">
          {items.map((item) => {
            const borderColor =
              item.priority === "critical"
                ? "border-l-red-500"
                : item.priority === "urgent"
                ? "border-l-amber-400"
                : "border-l-blue-400";
            const xp = XP_BY_PRIORITY[item.priority];
            const floatKey = `${item.id}-${xp}`;
            return (
              <div key={item.id} className={`px-5 py-4 border-l-4 ${borderColor}`}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-[13px] font-bold text-shark-900 dark:text-shark-100 leading-snug">{item.title}</p>
                  <span className="text-[10px] text-shark-400 shrink-0 whitespace-nowrap mt-0.5">{item.timeLabel}</span>
                </div>
                <p className="text-[11px] text-shark-500 dark:text-shark-400 leading-snug mb-3">{item.description}</p>
                <div className="flex items-center gap-2">
                  <Link
                    href={item.href}
                    onClick={() => handleXpClick(item.id, item.priority)}
                    className={`relative inline-flex items-center px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                      item.priority === "critical"
                        ? "bg-red-500 text-white hover:bg-red-600"
                        : item.priority === "urgent"
                        ? "border border-amber-300 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                        : "border border-shark-200 dark:border-shark-700 text-shark-600 dark:text-shark-400 hover:bg-shark-50 dark:hover:bg-shark-800"
                    }`}
                  >
                    {item.priority === "critical" ? "Resolve" : item.priority === "urgent" ? "Review" : "Details"}
                    {xpFloating === floatKey && (
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-black text-amber-500 animate-xp-float whitespace-nowrap pointer-events-none">
                        +{xp} XP
                      </span>
                    )}
                  </Link>
                  <span className="text-[9px] font-semibold text-amber-500/70">+{xp} XP</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
