"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

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
  const color = score >= 80 ? "#004e9f" : score >= 50 ? "#E8532E" : "#ef4444";

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

export function OperationsWidget({ data }: { data: OperationsOverview }) {
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

  const issues = [
    { label: "Overdue Returns", value: data.overdueReturns, icon: "arrow-left" as const, href: "/returns", danger: true },
    { label: "Low Stock Items", value: data.lowStockCount, icon: "alert-triangle" as const, href: "/purchase-orders", danger: true },
    { label: "Damage / Loss", value: data.unresolvedDamage + data.lostItems, icon: "alert-triangle" as const, href: "/alerts/damage", danger: true },
    { label: "Overdue Inspections", value: data.incompleteInspections, icon: "search" as const, href: "/condition-checks", danger: true },
  ].filter((i) => i.value > 0);

  return (
    <Card className="border-action-100 h-full">
      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-action-100 flex items-center justify-center shrink-0">
              <Icon name="settings" size={14} className="text-action-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-shark-900 dark:text-shark-100">Operations Performance</h2>
              <p className="text-xs text-shark-400">Business health overview</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 rounded-full px-2.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">Live</span>
          </div>
        </div>

        {/* Gauge + Stats row */}
        <div className="flex gap-4 mb-4">
          {/* Large gauge — left */}
          <div className="relative shrink-0 flex flex-col items-center group/health cursor-pointer">
            <HealthRing score={data.healthScore} size={96} />
            <p className="text-[9px] font-bold text-shark-400 uppercase tracking-widest mt-1.5">Efficiency</p>
            {/* Tooltip */}
            <div className="absolute left-full top-0 ml-3 w-56 bg-[#1a1c21] text-white rounded-xl p-3.5 shadow-2xl opacity-0 invisible group-hover/health:opacity-100 group-hover/health:visible transition-all duration-200 z-50 text-left">
              <p className="text-xs font-semibold mb-2 text-shark-400">Health Score Breakdown</p>
              <div className="space-y-1.5 text-xs">
                {data.lowStockCount > 0 && (
                  <div className="flex justify-between"><span className="text-shark-400">Low stock ({data.lowStockCount})</span><span className="text-red-400">-{Math.min(30, data.lowStockCount * 5)}</span></div>
                )}
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
          <div className="flex-1 grid grid-cols-2 gap-2">
            {stats.map((s) => (
              <Link
                key={s.label}
                href={s.href}
                className="bg-shark-50 dark:bg-shark-800/50 rounded-xl p-2.5 hover:bg-shark-100 dark:hover:bg-shark-800 transition-colors"
              >
                <p className="text-[9px] text-shark-400 uppercase tracking-wider font-semibold mb-1 leading-tight">{s.label}</p>
                <p className={`text-xl font-black leading-none ${
                  s.danger ? "text-[#E8532E]" : s.accent ? "text-action-600 dark:text-action-400" : "text-shark-900 dark:text-shark-100"
                }`}>{s.value}</p>
                <p className="text-[9px] text-shark-400 mt-0.5">{s.sub}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Issues list */}
        {issues.length > 0 ? (
          <div className="bg-white dark:bg-shark-900 rounded-xl border border-shark-100 dark:border-shark-800 divide-y divide-shark-50 dark:divide-shark-800 overflow-hidden">
            {issues.map((item) => (
              <Link key={item.label} href={item.href} className="flex items-center justify-between px-3 py-2.5 hover:bg-shark-50 dark:hover:bg-shark-800 transition-colors">
                <div className="flex items-center gap-2.5">
                  <Icon name={item.icon} size={13} className="text-[#E8532E]" />
                  <span className="text-sm text-shark-600 dark:text-shark-400">{item.label}</span>
                </div>
                <span className="text-sm font-bold text-[#E8532E]">{item.value}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-shark-900 rounded-xl border border-shark-100 dark:border-shark-800">
            <div className="flex items-center gap-2 px-3 py-3">
              <Icon name="check" size={15} className="text-action-500" />
              <span className="text-sm text-action-600 font-medium">All clear — no outstanding issues</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
