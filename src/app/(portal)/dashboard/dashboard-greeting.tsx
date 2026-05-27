"use client";

import { useEffect, useState } from "react";

interface DashboardGreetingProps {
  userName?: string;
  attentionCount: number;
  criticalCount: number;
  healthScore: number;
  onClickStatus?: () => void;
  actionsExpanded?: boolean;
}

function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getSubtitle(attentionCount: number, criticalCount: number): string {
  if (attentionCount === 0) return "Everything is on track today.";
  if (criticalCount > 0)
    return `You have ${criticalCount} critical item${criticalCount !== 1 ? "s" : ""} that need immediate attention.`;
  return `You have ${attentionCount} item${attentionCount !== 1 ? "s" : ""} requiring your attention today.`;
}

export function DashboardGreeting({
  userName,
  attentionCount,
  criticalCount,
  onClickStatus,
  actionsExpanded = false,
}: DashboardGreetingProps) {
  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    setGreeting(getTimeGreeting());
  }, []);

  const firstName = userName?.split(" ")[0] || "there";
  const subtitle = getSubtitle(attentionCount, criticalCount);
  const isCritical = criticalCount > 0;
  const isWarning = !isCritical && attentionCount > 0;

  const todayLabel = new Date().toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const subtitleColor = isCritical
    ? "text-red-500 dark:text-red-400"
    : isWarning
    ? "text-shark-500 dark:text-shark-400"
    : "text-shark-400 dark:text-shark-500";

  return (
    <div className="py-2">
      {/* Date — small uppercase, Apple-style */}
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-shark-400 dark:text-shark-500 mb-3">
        {todayLabel}
      </p>

      {/* Main headline — large, display weight, Apple SF Pro style */}
      <h1 className="text-[34px] sm:text-[40px] lg:text-[44px] font-bold tracking-tight text-shark-900 dark:text-white leading-[1.05] mb-3">
        {greeting}, {firstName}.
      </h1>

      {/* Subtitle — clean single sentence, clickable if there are actions */}
      {onClickStatus && attentionCount > 0 ? (
        <button
          type="button"
          onClick={onClickStatus}
          className={`group flex items-center gap-1.5 text-[15px] font-normal leading-snug transition-opacity hover:opacity-70 active:opacity-50 ${subtitleColor}`}
          aria-expanded={actionsExpanded}
        >
          <span>{subtitle}</span>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={`shrink-0 transition-transform duration-200 ${actionsExpanded ? "rotate-180" : ""}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      ) : (
        <p className={`text-[15px] font-normal leading-snug ${subtitleColor}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
