"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";

interface SystemHealthBarProps {
  healthScore: number;
  lowStockCount: number;
  overdueReturns: number;
  pendingRequests: number;
  totalStaff: number;
  unresolvedDamage: number;
}

function AnimatedBar({
  value,
  colorClass,
  delay = 0,
}: {
  value: number;
  colorClass: string;
  delay?: number;
}) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(Math.max(0, Math.min(100, value))), delay + 80);
    return () => clearTimeout(t);
  }, [value, delay]);

  return (
    <div className="h-1.5 bg-shark-100 dark:bg-shark-800 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${colorClass}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function scoreColor(val: number): string {
  if (val >= 80) return "bg-green-500";
  if (val >= 60) return "bg-amber-500";
  return "bg-red-500";
}

function scoreLabel(val: number): string {
  if (val >= 90) return "Excellent";
  if (val >= 75) return "Good";
  if (val >= 60) return "Fair";
  if (val >= 40) return "Poor";
  return "Critical";
}

function scoreTextColor(val: number): string {
  if (val >= 80) return "text-green-600 dark:text-green-400";
  if (val >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export function SystemHealthBar({
  healthScore,
  lowStockCount,
  overdueReturns,
  pendingRequests,
  totalStaff,
  unresolvedDamage,
}: SystemHealthBarProps) {
  // Derived metrics
  const totalIssues = lowStockCount + overdueReturns + unresolvedDamage;
  const baseItems = Math.max(20, totalStaff * 3); // rough denominator for accuracy
  const inventoryAccuracy = Math.round(Math.max(0, 100 - (totalIssues / baseItems) * 100));
  const requestResolution =
    pendingRequests === 0
      ? 100
      : Math.round(Math.max(0, 100 - Math.min(90, pendingRequests * 8)));

  const metrics = [
    {
      label: "System Health",
      value: healthScore,
      displayValue: `${healthScore}%`,
      sublabel: scoreLabel(healthScore),
      colorClass: scoreColor(healthScore),
      href: undefined as string | undefined,
    },
    {
      label: "Inventory Accuracy",
      value: inventoryAccuracy,
      displayValue: `${inventoryAccuracy}%`,
      sublabel:
        totalIssues === 0
          ? "No stock issues"
          : `${totalIssues} issue${totalIssues !== 1 ? "s" : ""} open`,
      colorClass: scoreColor(inventoryAccuracy),
      href: "/alerts/low-stock",
    },
    {
      label: "Requests Resolved",
      value: requestResolution,
      displayValue: `${requestResolution}%`,
      sublabel:
        pendingRequests === 0
          ? "Queue is clear"
          : `${pendingRequests} pending`,
      colorClass: scoreColor(requestResolution),
      href: "/consumables?tab=requests",
    },
  ];

  return (
    <div className="rounded-xl border border-shark-100 dark:border-shark-800 bg-white dark:bg-shark-900 p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <Icon name="bar-chart" size={13} className="text-shark-400" />
        <p className="text-[11px] font-semibold text-shark-400 dark:text-shark-500 uppercase tracking-widest">
          System Performance
        </p>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {metrics.map((m, i) => {
          const inner = (
            <div className="space-y-2 group">
              <div className="flex items-center justify-between">
                <p className="text-xs text-shark-500 dark:text-shark-400">{m.label}</p>
                <div className="flex items-baseline gap-1">
                  <p className={`text-base font-bold ${scoreTextColor(m.value)}`}>
                    {m.displayValue}
                  </p>
                </div>
              </div>
              <AnimatedBar value={m.value} colorClass={m.colorClass} delay={i * 120} />
              <p className="text-[11px] text-shark-400 dark:text-shark-500">{m.sublabel}</p>
            </div>
          );

          return m.href ? (
            <Link key={m.label} href={m.href} className="block hover:opacity-80 transition-opacity">
              {inner}
            </Link>
          ) : (
            <div key={m.label}>{inner}</div>
          );
        })}
      </div>
    </div>
  );
}
