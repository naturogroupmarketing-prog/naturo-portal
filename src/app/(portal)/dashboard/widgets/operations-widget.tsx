"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

interface OperationsOverview {
  healthScore: number;
  ordersAwaitingApproval: number;
  ordersAwaitingReceival: number;
  overdueReturns: number;
  incompleteInspections: number;
  unresolvedDamage: number;
  lostItems: number;
  totalStaff: number;
  pendingRequests: number;
  lowStockCount: number;
}

function HealthRing({ score, size = 96 }: { score: number; size?: number }) {
  const [animated, setAnimated] = useState(0);
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animated / 100) * circumference;
  const color = score >= 80 ? "#1F3DD9" : score >= 50 ? "#E8532E" : "#ef4444";

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.2s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <span className="text-2xl font-black text-shark-800 dark:text-shark-200 leading-none">{score}</span>
          <span className="text-[10px] text-shark-400 font-normal block leading-none mt-0.5">/ 100</span>
        </div>
      </div>
    </div>
  );
}

export function OperationsWidget({ data, className }: { data: OperationsOverview; className?: string }) {
  const metrics = [
    {
      label: "Awaiting Approval",
      display: `${data.ordersAwaitingApproval} orders`,
      barPct: Math.max(4, 100 - Math.min(96, data.ordersAwaitingApproval * 18)),
      barColor: data.ordersAwaitingApproval > 0 ? "#E8532E" : "#1F3DD9",
      href: "/purchase-orders",
    },
    {
      label: "Fleet Uptime",
      display: `${data.totalStaff} staff`,
      barPct: Math.min(100, Math.max(10, data.totalStaff * 5)),
      barColor: "#22c55e",
      href: "/staff",
    },
    {
      label: "Awaiting Receival",
      display: `${data.ordersAwaitingReceival} orders`,
      barPct: Math.max(4, 100 - Math.min(96, data.ordersAwaitingReceival * 12)),
      barColor: "#1F3DD9",
      href: "/purchase-orders?status=ORDERED",
    },
  ];

  return (
    <Card className={cn("h-full bg-white/60 dark:bg-shark-900/60 backdrop-blur-xl backdrop-saturate-150 border border-white/60 dark:border-white/10", className)}>
      <div className="p-3 sm:p-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-shark-900 dark:text-shark-100 leading-tight">Operations Performance</h2>
          <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 rounded-full px-2 py-0.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">Live</span>
          </div>
        </div>

        {/* Ring + Metrics — always side by side */}
        <div className="flex items-center gap-3">
          {/* Ring */}
          <div className="shrink-0">
            <HealthRing score={data.healthScore} size={96} />
          </div>

          {/* Metrics — stacked vertically */}
          <div className="flex-1 grid grid-cols-1 gap-1.5">
            {metrics.map((m) => (
              <Link
                key={m.label}
                href={m.href}
                className="group block bg-white/60 dark:bg-shark-800/50 backdrop-blur-sm border border-white/70 dark:border-white/10 rounded-xl px-2.5 py-2 shadow-sm hover:bg-white/80 dark:hover:bg-shark-800/70 transition-all duration-200"
              >
                <p className="text-[9px] text-shark-400 dark:text-shark-500 leading-none font-medium truncate">{m.label}</p>
                <p className="text-xs font-bold text-shark-900 dark:text-shark-100 leading-tight truncate group-hover:text-action-600 dark:group-hover:text-action-400 transition-colors mt-0.5">
                  {m.display}
                </p>
                <div className="mt-1.5 h-0.5 bg-shark-100/80 dark:bg-shark-700/80 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${m.barPct}%`, backgroundColor: m.barColor }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </Card>
  );
}

// ─── Priority Alerts Panel ────────────────────────────────────────────────────

export function PriorityAlertsPanel({ data }: { data: OperationsOverview }) {
  const [open, setOpen] = useState(false);

  const alerts = [
    { label: "Overdue Returns",     value: data.overdueReturns,                        icon: "arrow-left"     as const, href: "/returns" },
    { label: "Damage / Loss",       value: data.unresolvedDamage + data.lostItems,      icon: "alert-triangle" as const, href: "/alerts/damage" },
    { label: "Overdue Inspections", value: data.incompleteInspections,                  icon: "search"         as const, href: "/condition-checks" },
    { label: "Low Stock",           value: data.lowStockCount,                          icon: "droplet"        as const, href: "/consumables?stock=low" },
    { label: "Pending Requests",    value: data.pendingRequests,                        icon: "clipboard"      as const, href: "/consumables?tab=requests" },
  ].filter((a) => a.value > 0);

  const total = alerts.reduce((sum, a) => sum + a.value, 0);

  return (
    <Card className="h-fit border-shark-100 dark:border-shark-800 overflow-hidden">
      {/* Header row — always visible, tap to toggle */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-shark-50 dark:hover:bg-shark-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center shrink-0">
            <Icon name="alert-triangle" size={12} className="text-red-500" />
          </div>
          <span className="text-sm font-semibold text-shark-900 dark:text-shark-100">Priority Alerts</span>
          {total > 0 && (
            <span className="text-[10px] font-bold bg-red-500 text-white rounded-full px-1.5 py-0.5 leading-none">
              {total}
            </span>
          )}
        </div>
        <Icon
          name="chevron-down"
          size={14}
          className={cn("text-shark-400 transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      {/* Collapsible content */}
      <div className={cn(
        "grid transition-[grid-template-rows] duration-300",
        open ? "grid-rows-[1fr] ease-out" : "grid-rows-[0fr] ease-in"
      )}>
        <div className="overflow-hidden min-h-0">
          {alerts.length > 0 ? (
            <div className="divide-y divide-shark-50 dark:divide-shark-800 border-t border-shark-100 dark:border-shark-800">
              {alerts.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center justify-between px-3 py-2.5 hover:bg-shark-50 dark:hover:bg-shark-800 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon name={item.icon} size={13} className="text-[#E8532E]" />
                    <span className="text-xs text-shark-600 dark:text-shark-400">{item.label}</span>
                  </div>
                  <span className="text-xs font-bold text-[#E8532E]">{item.value}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-3 py-3 border-t border-shark-100 dark:border-shark-800 flex items-center gap-2">
              <Icon name="check-circle" size={13} className="text-green-500" />
              <span className="text-xs text-shark-500 dark:text-shark-400">No active alerts — all clear!</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
