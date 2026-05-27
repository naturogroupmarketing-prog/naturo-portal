"use client";

import { useEffect, useState } from "react";
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toRad(d: number) { return (d * Math.PI) / 180; }
function pt(cx: number, cy: number, r: number, deg: number) {
  return { x: cx + r * Math.cos(toRad(deg)), y: cy + r * Math.sin(toRad(deg)) };
}
function arc(cx: number, cy: number, r: number, startDeg: number, spanDeg: number) {
  const s = pt(cx, cy, r, startDeg);
  const e = pt(cx, cy, r, startDeg + spanDeg);
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${spanDeg > 180 ? 1 : 0} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}

// Stays red→orange until ~80 %, then quickly jumps to green near 100 %
function scoreHue(s: number): number {
  const v = Math.max(0, Math.min(100, s));
  if (v <= 80) return Math.round((v / 80) * 30);                   // 0–80 → 0–30  (red → orange)
  if (v <= 92) return Math.round(30 + ((v - 80) / 12) * 60);       // 80–92 → 30–90 (orange → yellow-green)
  return Math.round(90 + ((v - 92) / 8) * 30);                     // 92–100 → 90–120 (→ green)
}

// ─── Health ring ──────────────────────────────────────────────────────────────
//
// Full 360 ° circle track. Progress starts at 12 o'clock and sweeps clockwise.
// The colour follows the arc via a CSS conic-gradient (not a linear gradient),
// grading from deep red at the tail to bright amber / green at the leading edge.

function HealthRing({ score, size = 218 }: { score: number; size?: number }) {
  const [anim, setAnim] = useState(0);
  const [disp, setDisp] = useState(0);

  const sw = 20;
  const cx = size / 2;
  const cy = size / 2;
  const r  = (size - sw) / 2;

  const statusLabel =
    score >= 90 ? "Excellent" : score >= 75 ? "Good" :
    score >= 60 ? "Fair"      : score >= 40 ? "Poor" : "Critical";

  useEffect(() => {
    let raf: number;
    const dur = 1200, t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setAnim(e * score); setDisp(Math.round(e * score));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    const id = setTimeout(() => { raf = requestAnimationFrame(tick); }, 160);
    return () => { clearTimeout(id); cancelAnimationFrame(raf); };
  }, [score]);

  // Cap dot positions (12 o'clock = –90 °)
  const startPt = pt(cx, cy, r, -90);
  const endPt   = pt(cx, cy, r, -90 + (anim / 100) * 360);
  const dotR    = sw / 2;          // dot fills the full stroke width

  // Conic gradient — colour literally wraps around the arc from red → amber/green.
  // We place 4 stops spread across the visible arc so the gradient is smooth.
  const endDeg = anim * 3.6;
  const hEnd   = scoreHue(anim);
  const ringColor = `hsl(${hEnd}, 92%, 52%)`;

  // CSS conic-gradient: 0deg = 12 o'clock (top), positive = clockwise.
  // Must use `from 0deg` so the gradient starts at 12 o'clock, matching
  // the SVG cap dot positioned at pt(cx, cy, r, -90) which is also 12 o'clock.
  const conicGrad = endDeg > 0
    ? `conic-gradient(from 0deg at 50% 50%,` +
      ` hsl(5,100%,47%) 0deg,` +
      ` hsl(${scoreHue(anim * 0.33)},100%,50%) ${(endDeg * 0.33).toFixed(1)}deg,` +
      ` hsl(${scoreHue(anim * 0.66)},98%,50%) ${(endDeg * 0.66).toFixed(1)}deg,` +
      ` hsl(${hEnd},92%,52%) ${endDeg.toFixed(1)}deg,` +
      ` transparent ${endDeg.toFixed(1)}deg)`
    : "none";

  // Donut mask carves the ring shape out of the full square div
  const inner = r - sw / 2;
  const outer = r + sw / 2;
  const donutMask =
    `radial-gradient(circle at 50% 50%, transparent ${inner}px, black ${inner + 1}px, black ${outer}px, transparent ${outer + 1}px)`;

  return (
    <div className="relative" style={{ width: size, height: size }}>

      {/* ① Dark full-circle track (SVG) */}
      <svg width={size} height={size} className="absolute inset-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ebebeb" strokeWidth={sw} />
      </svg>

      {/* ② Conic-gradient progress ring (CSS div masked to donut shape) */}
      {anim > 0.5 && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: conicGrad,
            WebkitMaskImage: donutMask,
            maskImage: donutMask,
          }}
        />
      )}

      {/* ③ White cap dots — on top of gradient (SVG) */}
      <svg width={size} height={size} className="absolute inset-0">
        <circle cx={startPt.x} cy={startPt.y} r={dotR} fill="white" />
        {anim > 2 && <circle cx={endPt.x} cy={endPt.y} r={dotR} fill="white" />}
      </svg>

      {/* ④ Content: icon → label → number → status */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span style={{ color: ringColor }}>
          <Icon name="check-circle" size={16} />
        </span>
        <span className="text-[11px] font-semibold mt-1" style={{ color: ringColor }}>
          Health Score
        </span>
        <span className="text-shark-900 dark:text-white font-bold leading-none tabular-nums mt-2"
          style={{ fontSize: 52 }}>
          {disp}
          <span style={{ fontSize: 26, opacity: 0.45, fontWeight: 500 }}>%</span>
        </span>
        <span className="text-[13px] font-medium mt-2 text-shark-500">
          {statusLabel}
        </span>
      </div>
    </div>
  );
}

// ─── Health Score Widget ──────────────────────────────────────────────────────

export function HealthScoreWidget({ data, className, trend }: { data: OperationsOverview; className?: string; trend?: number }) {
  const score = data.healthScore;
  return (
    <div className={cn(
      "rounded-[28px] bg-white dark:bg-shark-900 h-full",
      "shadow-[0_2px_12px_rgba(0,0,0,0.07),0_1px_2px_rgba(0,0,0,0.04)]",
      className,
    )}>
      <div className="flex flex-col items-center justify-center gap-4 px-3 py-6 h-full">
        <HealthRing score={score} size={218} />
        {trend !== undefined && trend !== 0 && (
          <p className={cn("text-[12px] font-normal",
            trend > 0 ? "text-green-500" : "text-red-400")}>
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
