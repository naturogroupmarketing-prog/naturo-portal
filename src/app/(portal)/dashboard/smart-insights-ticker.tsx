"use client";

import { useEffect, useState, useCallback } from "react";
import { Icon } from "@/components/ui/icon";

export interface SmartInsight {
  text: string;
  type: "info" | "warning" | "success" | "tip";
}

interface SmartInsightsTickerProps {
  insights: SmartInsight[];
}

const TYPE_STYLES: Record<SmartInsight["type"], { bg: string; border: string; iconBg: string; text: string; dot: string }> = {
  success: {
    bg: "bg-green-50 dark:bg-green-500/10",
    border: "border-green-100 dark:border-green-500/20",
    iconBg: "bg-green-500",
    text: "text-green-800 dark:text-green-300",
    dot: "bg-green-500",
  },
  warning: {
    bg: "bg-amber-50 dark:bg-amber-500/10",
    border: "border-amber-100 dark:border-amber-500/20",
    iconBg: "bg-amber-500",
    text: "text-amber-800 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  info: {
    bg: "bg-action-50 dark:bg-action-500/10",
    border: "border-action-100 dark:border-action-500/20",
    iconBg: "bg-action-500",
    text: "text-action-800 dark:text-action-300",
    dot: "bg-action-500",
  },
  tip: {
    bg: "bg-indigo-50 dark:bg-indigo-500/10",
    border: "border-indigo-100 dark:border-indigo-500/20",
    iconBg: "bg-indigo-500",
    text: "text-indigo-800 dark:text-indigo-300",
    dot: "bg-indigo-500",
  },
};

const TYPE_ICON: Record<SmartInsight["type"], import("@/components/ui/icon").IconName> = {
  success: "check-circle",
  warning: "alert-triangle",
  info: "bar-chart",
  tip: "star",
};

export function SmartInsightsTicker({ insights }: SmartInsightsTickerProps) {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);

  const advance = useCallback(() => {
    if (insights.length <= 1) return;
    setFading(true);
    setTimeout(() => {
      setCurrent((prev) => (prev + 1) % insights.length);
      setFading(false);
    }, 250);
  }, [insights.length]);

  useEffect(() => {
    if (insights.length <= 1) return;
    const timer = setInterval(advance, 6000);
    return () => clearInterval(timer);
  }, [advance, insights.length]);

  if (insights.length === 0) return null;

  const insight = insights[current];
  const style = TYPE_STYLES[insight.type];
  const icon = TYPE_ICON[insight.type];

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors duration-300 ${style.bg} ${style.border}`}
    >
      {/* Icon */}
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${style.iconBg}`}
      >
        <Icon name={icon} size={13} className="text-white" />
      </div>

      {/* Label */}
      <span className="text-[10px] font-bold uppercase tracking-widest text-shark-400 dark:text-shark-500 shrink-0 hidden sm:block">
        Insight
      </span>

      {/* Text — fades between items */}
      <p
        className={`text-sm font-medium flex-1 min-w-0 transition-opacity duration-250 ${style.text} ${
          fading ? "opacity-0" : "opacity-100"
        }`}
      >
        {insight.text}
      </p>

      {/* Dot indicators + next button */}
      {insights.length > 1 && (
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex gap-1">
            {insights.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  if (i === current) return;
                  setFading(true);
                  setTimeout(() => { setCurrent(i); setFading(false); }, 250);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
                  i === current ? style.dot : "bg-shark-200 dark:bg-shark-700"
                }`}
                aria-label={`Insight ${i + 1}`}
              />
            ))}
          </div>
          <button
            onClick={advance}
            className="text-shark-400 hover:text-shark-600 dark:text-shark-500 dark:hover:text-shark-300 transition-colors"
            aria-label="Next insight"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
