"use client";

import { useEffect, useState, useId } from "react";
import Link from "next/link";
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

// ─── Shared animated bar ──────────────────────────────────────────────────────

function AnimatedBar({ value, colorClass, delay = 0 }: { value: number; colorClass: string; delay?: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(Math.max(0, Math.min(100, value))), delay + 80);
    return () => clearTimeout(t);
  }, [value, delay]);

  return (
    <div className="h-1.5 bg-shark-100 dark:bg-shark-800 rounded-full overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all duration-700 ease-out", colorClass)}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

// ─── Shared widget header ─────────────────────────────────────────────────────

function WidgetHeader({ icon, label }: { icon: Parameters<typeof Icon>[0]["name"]; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <Icon name={icon} size={13} className="text-shark-400" />
      <p className="text-[11px] font-semibold text-shark-400 dark:text-shark-500 uppercase tracking-widest">
        {label}
      </p>
    </div>
  );
}

// ─── Health ring ─────────────────────────────────────────────────────────────

function HealthRing({ score, size = 96 }: { score: number; size?: number }) {
  const uid = useId().replace(/:/g, "");
  const gradId = `rg-${uid}`;

  const [animated, setAnimated] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);

  const strokeWidth   = 9;
  const radius        = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset        = circumference - (animated / 100) * circumference;

  const isGreen  = score >= 90;
  const isOrange = score >= 75;
  const color1 = isGreen ? "#15803d" : isOrange ? "#ea580c" : "#dc2626";
  const color2 = isGreen ? "#4ade80" : isOrange ? "#fb923c" : "#f87171";

  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 120);
    return () => clearTimeout(t);
  }, [score]);

  useEffect(() => {
    let rafId: number;
    const duration  = 1300;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * score));
      if (progress < 1) rafId = requestAnimationFrame(tick);
    };
    const timeout = setTimeout(() => { rafId = requestAnimationFrame(tick); }, 160);
    return () => { clearTimeout(timeout); cancelAnimationFrame(rafId); };
  }, [score]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor={color1} />
            <stop offset="100%" stopColor={color2} />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="currentColor"
          className="text-shark-100 dark:text-shark-800"
          strokeWidth={strokeWidth} strokeLinecap="round"
        />
        {/* Active arc */}
        <circle cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.2s ease-out" }}
        />
      </svg>
      {/* Centre score */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[22px] font-bold text-shark-800 dark:text-shark-200 leading-none tabular-nums">
          {displayScore}
        </span>
      </div>
    </div>
  );
}

// ─── Health Score Widget ──────────────────────────────────────────────────────

export function HealthScoreWidget({ data, className, trend }: { data: OperationsOverview; className?: string; trend?: number }) {
  const score = data.healthScore;

  const statusLabel =
    score >= 90 ? "Excellent" :
    score >= 75 ? "Good" :
    score >= 60 ? "Fair" :
    score >= 40 ? "Poor" : "Critical";

  const statusColor =
    score >= 90 ? "text-green-600 dark:text-green-400" :
    score >= 75 ? "text-orange-500 dark:text-orange-400" :
    "text-red-500 dark:text-red-400";


  return (
    <div className={cn("rounded-[28px] bg-white dark:bg-shark-900 border border-black/[0.05] dark:border-white/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.07),0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden", className)}>

      {/* ── Widget header — top-left, matches other widgets ── */}
      <div className="px-6 pt-6">
        <WidgetHeader icon="check-circle" label="Health Score" />
      </div>

      {/* ── Hero section ── */}
      <div className="flex flex-col items-center text-center px-6 pt-0 pb-8">
        {/* Ring */}
        <HealthRing score={score} size={120} />

        {/* Status — Apple large label style */}
        <p className={cn("text-[32px] font-bold tracking-tight leading-none mt-5", statusColor)}>
          {statusLabel}
        </p>

        {/* Descriptor */}
        <p className="text-[13px] text-shark-400 dark:text-shark-500 mt-2 leading-snug">
          Operations health score
        </p>

        {/* Trend — plain text, no pill */}
        {trend !== undefined && trend !== 0 && (
          <p className={cn("text-[12px] mt-2 font-normal", trend > 0 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400")}>
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)} pts from last week
          </p>
        )}
      </div>

    </div>
  );
}

// ─── Operations Performance Widget ───────────────────────────────────────────

export function OperationsWidget({ data, className }: { data: OperationsOverview; className?: string }) {
  const pct0 = Math.max(4, 100 - Math.min(96, data.ordersAwaitingApproval * 18));
  const pct1 = Math.min(100, Math.max(10, data.totalStaff * 5));
  const pct2 = Math.max(4, 100 - Math.min(96, data.ordersAwaitingReceival * 12));

  const metrics = [
    {
      label: "Awaiting Approval",
      displayValue: `${data.ordersAwaitingApproval} orders`,
      sublabel: data.ordersAwaitingApproval === 0 ? "Queue is clear" : "Pending review",
      barPct: pct0,
      colorClass: pct0 < 50 ? "bg-red-500" : "bg-action-500",
      valueColor: pct0 < 50 ? "text-red-600 dark:text-red-400" : "text-action-500",
      href: "/purchase-orders",
    },
    {
      label: "Fleet Uptime",
      displayValue: `${data.totalStaff} staff`,
      sublabel: data.totalStaff === 0 ? "No active staff" : "Active members",
      barPct: pct1,
      colorClass: pct1 < 50 ? "bg-red-500" : "bg-action-500",
      valueColor: pct1 < 50 ? "text-red-600 dark:text-red-400" : "text-action-500",
      href: "/staff",
    },
    {
      label: "Awaiting Receival",
      displayValue: `${data.ordersAwaitingReceival} orders`,
      sublabel: data.ordersAwaitingReceival === 0 ? "All orders received" : "In transit",
      barPct: pct2,
      colorClass: pct2 < 50 ? "bg-red-500" : "bg-action-500",
      valueColor: pct2 < 50 ? "text-red-600 dark:text-red-400" : "text-action-500",
      href: "/purchase-orders?status=ORDERED",
    },
  ];

  return (
    <div className={cn("rounded-[28px] bg-white dark:bg-shark-900 border border-black/[0.05] dark:border-white/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.07),0_1px_2px_rgba(0,0,0,0.04)] p-6", className)}>
      <WidgetHeader icon="bar-chart" label="Operations Performance" />

      <div className="grid grid-cols-1 gap-5">
        {metrics.map((m, i) => (
          <Link key={m.label} href={m.href} className="block hover:opacity-80 transition-opacity">
            <div className="space-y-2 group">
              <div className="flex items-center justify-between">
                <p className="text-xs text-shark-500 dark:text-shark-400">{m.label}</p>
                <p className={cn("text-base font-bold", m.valueColor)}>{m.displayValue}</p>
              </div>
              <AnimatedBar value={m.barPct} colorClass={m.colorClass} delay={i * 120} />
              <p className="text-[11px] text-shark-400 dark:text-shark-500">{m.sublabel}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
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
    <div className="rounded-[28px] bg-white dark:bg-shark-900 border border-black/[0.05] dark:border-white/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.07),0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Header row — always visible, tap to toggle */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-shark-50 dark:hover:bg-shark-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon name="alert-triangle" size={13} className="text-shark-400" />
          <p className="text-[11px] font-semibold text-shark-400 dark:text-shark-500 uppercase tracking-widest">
            Priority Alerts
          </p>
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
            <div className="divide-y divide-shark-100 dark:divide-shark-800 border-t border-shark-100 dark:border-shark-800">
              {alerts.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center justify-between px-5 py-3 hover:bg-shark-50 dark:hover:bg-shark-800 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon name={item.icon} size={13} className="text-action-600" />
                    <span className="text-xs text-shark-600 dark:text-shark-400">{item.label}</span>
                  </div>
                  <span className="text-xs font-bold text-action-500">{item.value}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-5 py-3 border-t border-shark-100 dark:border-shark-800 flex items-center gap-2">
              <Icon name="check-circle" size={13} className="text-action-500" />
              <span className="text-xs text-shark-500 dark:text-shark-400">No active alerts — all clear!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
