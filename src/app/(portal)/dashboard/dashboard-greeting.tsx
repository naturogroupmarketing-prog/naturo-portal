"use client";

import { useEffect, useState } from "react";

interface DashboardGreetingProps {
  userName?: string;
  /** Total number of action items needing attention */
  attentionCount: number;
  /** Number of items rated critical priority */
  criticalCount: number;
  /** System health 0–100 */
  healthScore: number;
  /** If provided, the status badge becomes a button that calls this */
  onClickStatus?: () => void;
  /** Controls chevron direction when badge is a toggle */
  actionsExpanded?: boolean;
}

function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getStatusText(attentionCount: number, criticalCount: number): string {
  if (attentionCount === 0) return "Everything is on track today";
  if (criticalCount > 0)
    return `${criticalCount} critical item${criticalCount !== 1 ? "s" : ""} need immediate attention`;
  return `${attentionCount} item${attentionCount !== 1 ? "s" : ""} require attention today`;
}

export function DashboardGreeting({
  userName,
  attentionCount,
  criticalCount,
  healthScore,
  onClickStatus,
  actionsExpanded = false,
}: DashboardGreetingProps) {
  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    setGreeting(getTimeGreeting());
  }, []);

  const firstName = userName?.split(" ")[0] || "there";
  const statusText = getStatusText(attentionCount, criticalCount);

  const isCritical = criticalCount > 0;
  const isWarning = !isCritical && attentionCount > 0;
  const isGood = attentionCount === 0;

  const statusStyle = isCritical
    ? "bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20 text-red-700 dark:text-red-400"
    : isWarning
    ? "bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20 text-amber-700 dark:text-amber-400"
    : "bg-green-50 dark:bg-green-500/10 border-green-100 dark:border-green-500/20 text-green-700 dark:text-green-400";

  const dotColor = isCritical
    ? "bg-red-500"
    : isWarning
    ? "bg-amber-500"
    : "bg-green-500";

  const todayLabel = new Date().toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="flex items-start sm:items-center justify-between gap-3">
      {/* Left — greeting */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-shark-900 dark:text-shark-100 leading-tight">
          {greeting},{" "}
          <span className="text-action-600 dark:text-action-400">{firstName}</span>
        </h1>
        <p className="text-xs sm:text-sm text-shark-400 dark:text-shark-500 mt-0.5">
          {todayLabel}
        </p>
      </div>

      {/* Right — live status badge (clickable when onClickStatus is provided) */}
      {onClickStatus && attentionCount > 0 ? (
        <button
          onClick={onClickStatus}
          className={`flex items-center gap-2 px-3 py-2 rounded-[28px] border text-xs sm:text-sm font-medium shrink-0 transition-all duration-200 hover:shadow-sm active:scale-95 ${statusStyle}`}
          aria-expanded={actionsExpanded}
          aria-label={statusText}
        >
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${dotColor} ${
              isCritical || isWarning ? "animate-pulse" : ""
            }`}
          />
          <span className="hidden sm:inline">{statusText}</span>
          <span className="sm:hidden">
            {isCritical ? `${criticalCount} critical` : `${attentionCount} items`}
          </span>
          {/* Chevron indicates expandable */}
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`shrink-0 transition-transform duration-200 ${actionsExpanded ? "rotate-180" : ""}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      ) : (
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-[28px] border text-xs sm:text-sm font-medium shrink-0 ${statusStyle}`}
        >
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${dotColor} ${
              isCritical || isWarning ? "animate-pulse" : ""
            }`}
          />
          <span className="hidden sm:inline">{statusText}</span>
          <span className="sm:hidden">
            {isGood
              ? "All clear"
              : isCritical
              ? `${criticalCount} critical`
              : `${attentionCount} items`}
          </span>
        </div>
      )}
    </div>
  );
}
