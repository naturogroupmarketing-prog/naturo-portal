"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/icon";

export interface SmartActionItem {
  id: string;
  priority: "critical" | "urgent" | "normal";
  type: "request" | "overdue" | "stock" | "po" | "damage";
  title: string;
  description: string;
  href: string;
  timeLabel: string;
}

const PRIORITY_CONFIG = {
  critical: {
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-600 border border-red-100",
    label: "Urgent",
  },
  urgent: {
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-600 border border-amber-100",
    label: "Attention",
  },
  normal: {
    dot: "bg-blue-400",
    badge: "bg-blue-50 text-blue-600 border border-blue-100",
    label: "To do",
  },
};

const TYPE_ICON: Record<SmartActionItem["type"], IconName> = {
  request: "clipboard",
  overdue: "clock",
  stock: "droplet",
  po: "truck",
  damage: "alert-triangle",
};

const DISMISS_KEY = "naturo-smartpanel-dismissed-at";
const DISMISS_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

export function SmartActionsPanel({ items }: { items: SmartActionItem[] }) {
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(DISMISS_KEY);
    if (stored && Date.now() - parseInt(stored, 10) < DISMISS_DURATION_MS) {
      setDismissed(true);
    }
  }, []);

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
    <div className="bg-white dark:bg-shark-900 border border-shark-100 dark:border-shark-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-shark-100 dark:border-shark-800 bg-shark-50/40 dark:bg-shark-800/40">
        <Icon name="bell" size={14} className="text-shark-500 flex-shrink-0" />
        <span className="text-sm font-semibold text-shark-800 flex-1">
          {items.length === 0 ? "All caught up" : "Action Required"}
        </span>
        {items.length > 0 && (
          <span className="text-[10px] font-bold bg-[#E8532E] text-white px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-tight">
            {items.length}
          </span>
        )}
        <button
          onClick={handleDismiss}
          className="text-shark-300 hover:text-shark-500 transition-colors ml-1 flex-shrink-0"
          title="Dismiss for 8 hours"
        >
          <Icon name="x" size={13} />
        </button>
      </div>

      {/* All clear */}
      {items.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
            <Icon name="check-circle" size={20} className="text-green-600" />
          </div>
          <p className="text-sm font-semibold text-shark-700">Everything is on track</p>
          <p className="text-xs text-shark-400 mt-1">No outstanding actions right now</p>
        </div>
      ) : (
        <>
          {/* Priority summary */}
          {(criticalCount > 0 || urgentCount > 0) && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50/60 border-b border-red-100">
              {criticalCount > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-red-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  {criticalCount} critical
                </span>
              )}
              {criticalCount > 0 && urgentCount > 0 && <span className="text-red-200 text-xs">·</span>}
              {urgentCount > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  {urgentCount} need attention
                </span>
              )}
            </div>
          )}

          {/* Action list */}
          <div className="divide-y divide-shark-50 dark:divide-shark-800 max-h-[480px] overflow-y-auto">
            {items.map((item) => {
              const config = PRIORITY_CONFIG[item.priority];
              const icon = TYPE_ICON[item.type];
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-start gap-3 px-4 py-3.5 hover:bg-shark-25 transition-colors group"
                >
                  {/* Priority dot */}
                  <span
                    className={`w-2 h-2 rounded-full mt-[5px] flex-shrink-0 ${config.dot} ${
                      item.priority === "critical" ? "animate-pulse" : ""
                    }`}
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-shark-800 leading-snug">{item.title}</p>
                    <p className="text-[11px] text-shark-400 mt-0.5 leading-snug">{item.description}</p>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-1.5 ${config.badge}`}>
                      <Icon name={icon} size={9} />
                      {item.timeLabel}
                    </span>
                  </div>

                  {/* Arrow */}
                  <Icon
                    name="arrow-right"
                    size={12}
                    className="text-shark-300 group-hover:text-action-500 transition-colors mt-1 flex-shrink-0"
                  />
                </Link>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-shark-50 bg-shark-50/30">
            <p className="text-[10px] text-shark-400 text-center">Tap any item to go directly to it</p>
          </div>
        </>
      )}
    </div>
  );
}
