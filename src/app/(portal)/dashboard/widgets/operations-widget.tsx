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
  const strokeWidth = 7;
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
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <span className="text-xl font-black text-shark-800 dark:text-shark-200 leading-none">{score}</span>
          <span className="text-[10px] text-shark-400 font-normal block leading-none">/ 100</span>
        </div>
      </div>
    </div>
  );
}

type GradeKey = "S" | "A" | "B" | "C" | "D";

function getGrade(score: number): { label: GradeKey; threshold: number; next: number } {
  if (score >= 95) return { label: "S", threshold: 95, next: 100 };
  if (score >= 85) return { label: "A", threshold: 85, next: 95 };
  if (score >= 70) return { label: "B", threshold: 70, next: 85 };
  if (score >= 50) return { label: "C", threshold: 50, next: 70 };
  return { label: "D", threshold: 0, next: 50 };
}

const GRADE_STYLES: Record<GradeKey, { badge: string; bar: string; glow: boolean }> = {
  S: { badge: "from-yellow-300 to-amber-400 text-amber-900 border-amber-300", bar: "#c9a84c", glow: true },
  A: { badge: "from-action-400 to-action-600 text-white border-action-300",   bar: "#1113d4", glow: false },
  B: { badge: "from-blue-400 to-blue-600 text-white border-blue-300",         bar: "#3b82f6", glow: false },
  C: { badge: "from-amber-400 to-orange-500 text-white border-amber-300",     bar: "#E8532E", glow: false },
  D: { badge: "from-red-400 to-red-600 text-white border-red-300",            bar: "#ef4444", glow: false },
};

function useHealthStreak(score: number) {
  const [streak, setStreak] = useState(0);
  const [gradePop, setGradePop] = useState(false);

  useEffect(() => {
    try {
      const key = "naturo-health-streak";
      const raw = localStorage.getItem(key);
      let data: { streak: number; lastDate: string } = raw ? JSON.parse(raw) : { streak: 0, lastDate: "" };
      const today = new Date().toDateString();
      if (data.lastDate !== today) {
        data.streak = score >= 70 ? (data.streak ?? 0) + 1 : 0;
        data.lastDate = today;
        localStorage.setItem(key, JSON.stringify(data));
      }
      setStreak(data.streak);
    } catch { /* localStorage unavailable */ }

    const popKey = "naturo-grade-popped";
    if (!sessionStorage.getItem(popKey)) {
      const t = setTimeout(() => { setGradePop(true); sessionStorage.setItem(popKey, "1"); }, 700);
      return () => clearTimeout(t);
    } else {
      setGradePop(true);
    }
  }, [score]);

  return { streak, gradePop };
}

export function OperationsWidget({ data }: { data: OperationsOverview }) {
  const grade = getGrade(data.healthScore);
  const styles = GRADE_STYLES[grade.label];
  const progressPct = Math.max(0, Math.min(100, Math.round(
    ((data.healthScore - grade.threshold) / Math.max(1, grade.next - grade.threshold)) * 100
  )));
  const { streak, gradePop } = useHealthStreak(data.healthScore);

  const stats = [
    {
      label: "Awaiting Approval",
      value: data.ordersAwaitingApproval,
      sub: "purchase orders",
      danger: data.ordersAwaitingApproval > 0,
      href: "/purchase-orders",
    },
    {
      label: "Awaiting Receival",
      value: data.ordersAwaitingReceival,
      sub: "purchase orders",
      accent: true,
      href: "/purchase-orders?status=ORDERED",
    },
    {
      label: "Active Staff",
      value: data.totalStaff,
      sub: "team members",
      href: "/staff",
    },
    {
      label: "Pending Requests",
      value: data.pendingRequests,
      sub: "from staff",
      href: "/consumables?tab=requests",
    },
  ];

  return (
    <Card className="border-action-100 h-fit">
      <div className="p-3 sm:p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-action-100 flex items-center justify-center shrink-0">
              <Icon name="settings" size={12} className="text-action-600" />
            </div>
            <h2 className="text-sm font-semibold text-shark-900 dark:text-shark-100">Operations Performance</h2>
          </div>
          <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 rounded-full px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">Live</span>
          </div>
        </div>

        {/* Gauge + Stats row */}
        <div className="flex gap-3 mb-3">
          {/* Gauge — left */}
          <div className="relative shrink-0 flex flex-col items-center group/health cursor-pointer">
            <div className="relative">
              <HealthRing score={data.healthScore} size={76} />
              <div
                className={`absolute -top-1.5 -right-2.5 w-6 h-6 rounded-md border-2 bg-gradient-to-br flex items-center justify-center font-black text-xs select-none ${styles.badge} ${gradePop ? "animate-grade-pop" : "opacity-0"} ${styles.glow ? "animate-streak-glow" : ""}`}
              >
                {grade.label}
              </div>
            </div>
            <p className="text-[9px] font-bold text-shark-400 uppercase tracking-widest mt-1.5">Efficiency</p>
            <div className="w-16 mt-1">
              <div className="h-1 bg-shark-100 dark:bg-shark-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progressPct}%`, backgroundColor: styles.bar }}
                />
              </div>
            </div>
            {streak > 1 && (
              <div className={`flex items-center gap-0.5 mt-1 px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 ${streak >= 5 ? "animate-streak-glow" : ""}`}>
                <span className="text-[10px]">🔥</span>
                <span className="text-[9px] font-bold text-amber-700">{streak}d</span>
              </div>
            )}
            {/* Tooltip */}
            <div className="absolute left-full top-0 ml-3 w-56 bg-[#1a1c21] text-white rounded-xl p-3.5 shadow-2xl opacity-0 invisible group-hover/health:opacity-100 group-hover/health:visible transition-all duration-200 z-50 text-left">
              <p className="text-xs font-semibold mb-2 text-shark-400">Health Score Breakdown</p>
              <div className="space-y-1.5 text-xs">
                {data.overdueReturns > 0 && (
                  <div className="flex justify-between"><span className="text-shark-400">Overdue returns ({data.overdueReturns})</span><span className="text-red-400">-{Math.min(20, data.overdueReturns * 4)}</span></div>
                )}
                {(data.unresolvedDamage + data.lostItems) > 0 && (
                  <div className="flex justify-between"><span className="text-shark-400">Damage reports ({data.unresolvedDamage + data.lostItems})</span><span className="text-red-400">-{Math.min(15, (data.unresolvedDamage + data.lostItems) * 5)}</span></div>
                )}
                {data.incompleteInspections > 0 && (
                  <div className="flex justify-between"><span className="text-shark-400">Overdue inspections ({data.incompleteInspections})</span><span className="text-red-400">-{Math.min(15, data.incompleteInspections * 5)}</span></div>
                )}
                {data.pendingRequests > 0 && (
                  <div className="flex justify-between"><span className="text-shark-400">Pending requests ({data.pendingRequests})</span><span className="text-red-400">-{Math.min(10, data.pendingRequests * 2)}</span></div>
                )}
                {data.healthScore === 100 && (
                  <p className="text-action-400">No deductions — perfect score!</p>
                )}
                <div className="border-t border-shark-700 pt-1.5 mt-1.5 flex justify-between font-semibold">
                  <span>Total</span>
                  <span className={data.healthScore >= 80 ? "text-action-400" : data.healthScore >= 50 ? "text-amber-400" : "text-red-400"}>
                    {data.healthScore}/100
                  </span>
                </div>
              </div>
              <div className="absolute -left-1.5 top-5 w-3 h-3 bg-[#1a1c21] rotate-45" />
            </div>
          </div>

          {/* Stats grid — right */}
          <div className="flex-1 grid grid-cols-2 gap-1.5">
            {stats.map((s) => (
              <Link
                key={s.label}
                href={s.href}
                className="bg-shark-50 dark:bg-shark-800/50 rounded-xl p-2 hover:bg-shark-100 dark:hover:bg-shark-800 transition-colors"
              >
                <p className="text-[9px] text-shark-400 uppercase tracking-wider font-semibold mb-0.5 leading-tight">{s.label}</p>
                <p className={`text-lg font-black leading-none ${
                  s.danger ? "text-[#E8532E]" : s.accent ? "text-action-600 dark:text-action-400" : "text-shark-900 dark:text-shark-100"
                }`}>{s.value}</p>
                <p className="text-[9px] text-shark-400 mt-0.5">{s.sub}</p>
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
