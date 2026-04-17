"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { Anomaly, AnomalySeverity, AnomalyCategory } from "@/lib/anomaly-detection";
import type { IconName } from "@/components/ui/icon";
import { updateAnomalySettings } from "@/app/actions/anomaly-settings";

// ─── Types & constants ───────────────────────────────────────────────────────

type FilterTab = "all" | AnomalySeverity;

const SEVERITY_CONFIG: Record<
  AnomalySeverity,
  { label: string; bar: string; badge: string; count: string; icon: IconName }
> = {
  critical: {
    label: "Critical",
    bar: "bg-red-500",
    badge: "bg-red-50 text-red-600 ring-1 ring-red-200 dark:bg-red-950/50 dark:text-red-400 dark:ring-red-800",
    count: "text-red-600 dark:text-red-400",
    icon: "alert-triangle",
  },
  warning: {
    label: "Warning",
    bar: "bg-amber-400",
    badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:ring-amber-800",
    count: "text-amber-600 dark:text-amber-400",
    icon: "alert-triangle",
  },
  info: {
    label: "Info",
    bar: "bg-blue-400",
    badge: "bg-blue-50 text-blue-600 ring-1 ring-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:ring-blue-800",
    count: "text-blue-600 dark:text-blue-400",
    icon: "help-circle",
  },
};

const CATEGORY_CONFIG: Record<
  AnomalyCategory,
  { label: string; icon: IconName; bg: string; text: string }
> = {
  stock: {
    label: "Stock",
    icon: "package",
    bg: "bg-violet-50 dark:bg-violet-950/50",
    text: "text-violet-700 dark:text-violet-400",
  },
  asset: {
    label: "Asset",
    icon: "box",
    bg: "bg-sky-50 dark:bg-sky-950/50",
    text: "text-sky-700 dark:text-sky-400",
  },
  staff: {
    label: "Staff",
    icon: "users",
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  damage: {
    label: "Damage",
    icon: "alert-triangle",
    bg: "bg-orange-50 dark:bg-orange-950/50",
    text: "text-orange-700 dark:text-orange-400",
  },
  procurement: {
    label: "Procurement",
    icon: "truck",
    bg: "bg-indigo-50 dark:bg-indigo-950/50",
    text: "text-indigo-700 dark:text-indigo-400",
  },
};

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "critical", label: "Critical" },
  { id: "warning", label: "Warning" },
  { id: "info", label: "Info" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 2) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "yesterday";
  return `${diffDay}d ago`;
}

function formatTimestamp(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-AU", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface AnomalyCardProps {
  anomaly: Anomaly;
  index: number;
}

function AnomalyCard({ anomaly, index }: AnomalyCardProps) {
  const sev = SEVERITY_CONFIG[anomaly.severity];
  const cat = CATEGORY_CONFIG[anomaly.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, delay: index * 0.04, ease: "easeOut" }}
      className="relative flex gap-0 rounded-xl border border-shark-100 bg-white shadow-sm overflow-hidden dark:border-shark-800 dark:bg-shark-900/60"
    >
      {/* Left severity bar */}
      <div className={cn("w-1 shrink-0", sev.bar)} aria-hidden />

      {/* Card body */}
      <div className="flex-1 min-w-0 px-4 py-4">
        {/* Top row: category badge + metric pill + timestamp */}
        <div className="flex flex-wrap items-center gap-2 mb-2.5">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
              cat.bg,
              cat.text
            )}
          >
            <Icon name={cat.icon} size={11} />
            {cat.label}
          </span>

          <span
            className={cn(
              "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
              sev.badge
            )}
          >
            <Icon name={sev.icon} size={11} className="mr-1" />
            {sev.label}
          </span>

          <span className="ml-auto shrink-0 text-xs text-shark-400 dark:text-shark-500 tabular-nums">
            {formatRelativeTime(anomaly.detectedAt)}
          </span>
        </div>

        {/* Title */}
        <p className="text-sm font-semibold text-shark-900 dark:text-shark-100 leading-snug mb-1">
          {anomaly.title}
        </p>

        {/* Description */}
        <p className="text-sm text-shark-500 dark:text-shark-400 leading-relaxed mb-3">
          {anomaly.description}
        </p>

        {/* Metric pill */}
        <div className="mb-3">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-mono font-medium",
              anomaly.severity === "critical"
                ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                : anomaly.severity === "warning"
                  ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                  : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
            )}
          >
            <span
              className={cn(
                "inline-block w-1.5 h-1.5 rounded-full",
                anomaly.severity === "critical"
                  ? "bg-red-500 animate-pulse"
                  : anomaly.severity === "warning"
                    ? "bg-amber-400"
                    : "bg-blue-400"
              )}
            />
            {anomaly.metric}
          </span>
        </div>

        {/* Recommendation */}
        <p className="text-xs italic text-shark-400 dark:text-shark-500 mb-3 leading-relaxed">
          {anomaly.recommendation}
        </p>

        {/* Footer: timestamp + link */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-shark-50 dark:border-shark-800">
          <span className="text-[11px] text-shark-400 dark:text-shark-600 tabular-nums">
            Detected {formatTimestamp(anomaly.detectedAt)}
          </span>

          {anomaly.auditLink && (
            <Link
              href={anomaly.auditLink}
              className="inline-flex items-center gap-1 text-xs font-medium text-action-600 hover:text-action-700 dark:text-action-400 dark:hover:text-action-300 transition-colors shrink-0"
            >
              View Details
              <Icon name="arrow-right" size={12} />
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ filter }: { filter: FilterTab }) {
  const label =
    filter === "all"
      ? "No anomalies detected"
      : `No ${filter} anomalies`;
  const sub =
    filter === "all"
      ? "All systems are operating within normal parameters."
      : `No ${filter}-severity anomalies were found for the current period.`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center mb-5">
        <Icon name="check-circle" size={28} className="text-emerald-500 dark:text-emerald-400" />
      </div>
      <p className="text-base font-semibold text-shark-900 dark:text-shark-100">{label}</p>
      <p className="mt-1.5 text-sm text-shark-400 dark:text-shark-500 max-w-xs">{sub}</p>
    </motion.div>
  );
}

// ─── Settings panel ──────────────────────────────────────────────────────────

interface AnomalySettingsValues {
  stockConsumptionMultiplier: number;
  overdueReturnDays: number;
  damageReportsThreshold: number;
  maxAnomalies: number;
}

function SettingsPanel({ currentSettings }: { currentSettings: AnomalySettingsValues }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formRef.current) return;
    setSaving(true);
    setSaveMsg(null);
    const fd = new FormData(formRef.current);
    const result = await updateAnomalySettings(fd);
    setSaving(false);
    if (result.success) {
      setSaveMsg("Settings saved. Reload to see updated anomalies.");
    } else {
      setSaveMsg(result.error ?? "Failed to save.");
    }
  }

  return (
    <div className="rounded-xl border border-shark-100 bg-white shadow-sm overflow-hidden dark:border-shark-800 dark:bg-shark-900/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-shark-700 hover:bg-shark-50 dark:text-shark-300 dark:hover:bg-shark-800/50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Icon name="settings" size={15} className="text-shark-400" />
          Threshold Settings
        </span>
        <Icon
          name="chevron-down"
          size={15}
          className={cn("text-shark-400 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-shark-100 dark:border-shark-800">
          <p className="text-xs text-shark-400 mt-3 mb-4">
            Adjust detection thresholds. Changes take effect on next page load.
          </p>
          <form ref={formRef} onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-shark-600 dark:text-shark-400 mb-1">
                Stock consumption multiplier
                <span className="ml-1 font-normal text-shark-400">(flag if usage exceeds Nx baseline)</span>
              </label>
              <input
                type="number"
                name="stockConsumptionMultiplier"
                step="0.1"
                min="1.1"
                max="10"
                defaultValue={currentSettings.stockConsumptionMultiplier}
                required
                className="w-full rounded-lg border border-shark-200 bg-white px-3 py-2 text-sm text-shark-900 focus:border-action-400 focus:outline-none focus:ring-2 focus:ring-action-400/20 dark:border-shark-700 dark:bg-shark-800 dark:text-shark-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-shark-600 dark:text-shark-400 mb-1">
                Overdue return days
                <span className="ml-1 font-normal text-shark-400">(flag checkouts older than N days)</span>
              </label>
              <input
                type="number"
                name="overdueReturnDays"
                step="1"
                min="1"
                max="90"
                defaultValue={currentSettings.overdueReturnDays}
                required
                className="w-full rounded-lg border border-shark-200 bg-white px-3 py-2 text-sm text-shark-900 focus:border-action-400 focus:outline-none focus:ring-2 focus:ring-action-400/20 dark:border-shark-700 dark:bg-shark-800 dark:text-shark-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-shark-600 dark:text-shark-400 mb-1">
                Damage reports threshold
                <span className="ml-1 font-normal text-shark-400">(flag staff with more than N reports/30d)</span>
              </label>
              <input
                type="number"
                name="damageReportsThreshold"
                step="1"
                min="1"
                max="20"
                defaultValue={currentSettings.damageReportsThreshold}
                required
                className="w-full rounded-lg border border-shark-200 bg-white px-3 py-2 text-sm text-shark-900 focus:border-action-400 focus:outline-none focus:ring-2 focus:ring-action-400/20 dark:border-shark-700 dark:bg-shark-800 dark:text-shark-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-shark-600 dark:text-shark-400 mb-1">
                Max anomalies shown
                <span className="ml-1 font-normal text-shark-400">(cap on total anomalies displayed)</span>
              </label>
              <input
                type="number"
                name="maxAnomalies"
                step="1"
                min="10"
                max="200"
                defaultValue={currentSettings.maxAnomalies}
                required
                className="w-full rounded-lg border border-shark-200 bg-white px-3 py-2 text-sm text-shark-900 focus:border-action-400 focus:outline-none focus:ring-2 focus:ring-action-400/20 dark:border-shark-700 dark:bg-shark-800 dark:text-shark-100"
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-action-600 px-4 py-2 text-sm font-medium text-white hover:bg-action-700 disabled:opacity-60 transition-colors"
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
              {saveMsg && (
                <p className={cn("text-xs", saveMsg.includes("saved") ? "text-green-600" : "text-red-500")}>
                  {saveMsg}
                </p>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

interface AnomaliesClientProps {
  anomalies: Anomaly[];
  isSuperAdmin?: boolean;
  currentSettings?: {
    stockConsumptionMultiplier: number;
    overdueReturnDays: number;
    damageReportsThreshold: number;
    maxAnomalies: number;
  };
}

export default function AnomaliesClient({ anomalies, isSuperAdmin, currentSettings }: AnomaliesClientProps) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  const filteredAnomalies =
    activeFilter === "all"
      ? anomalies
      : anomalies.filter((a) => a.severity === activeFilter);

  const counts: Record<FilterTab, number> = {
    all: anomalies.length,
    critical: anomalies.filter((a) => a.severity === "critical").length,
    warning: anomalies.filter((a) => a.severity === "warning").length,
    info: anomalies.filter((a) => a.severity === "info").length,
  };

  const lastChecked =
    anomalies.length > 0
      ? formatRelativeTime(
          anomalies.reduce(
            (latest, a) =>
              new Date(a.detectedAt) > new Date(latest) ? a.detectedAt : latest,
            anomalies[0].detectedAt
          )
        )
      : "just now";

  return (
    <div className="space-y-6">
      {/* Settings panel — Super Admin only */}
      {isSuperAdmin && currentSettings && (
        <SettingsPanel currentSettings={currentSettings} />
      )}

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-shark-900 dark:text-shark-100">
            Anomaly Alerts
          </h1>
          <p className="mt-0.5 text-sm text-shark-500 dark:text-shark-400">
            {anomalies.length === 0 ? (
              "No anomalies detected — all systems normal."
            ) : (
              <>
                <span className="font-semibold text-shark-700 dark:text-shark-300">
                  {anomalies.length} {anomalies.length === 1 ? "anomaly" : "anomalies"} detected
                </span>
                <span className="mx-1.5 text-shark-300 dark:text-shark-600">·</span>
                Last checked {lastChecked}
              </>
            )}
          </p>
        </div>

        {/* Severity summary pills */}
        {anomalies.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            {(["critical", "warning", "info"] as AnomalySeverity[]).map((sev) => {
              const c = counts[sev];
              if (c === 0) return null;
              const cfg = SEVERITY_CONFIG[sev];
              return (
                <span
                  key={sev}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                    cfg.badge
                  )}
                >
                  <span
                    className={cn(
                      "inline-block w-1.5 h-1.5 rounded-full",
                      cfg.bar,
                      sev === "critical" && "animate-pulse"
                    )}
                  />
                  {c} {cfg.label}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 border-b border-shark-100 dark:border-shark-800 pb-px">
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab.id;
          const count = counts[tab.id];
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={cn(
                "relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors rounded-t",
                isActive
                  ? "text-shark-900 dark:text-shark-100"
                  : "text-shark-400 hover:text-shark-600 dark:text-shark-500 dark:hover:text-shark-300"
              )}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={cn(
                    "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold leading-none",
                    isActive
                      ? tab.id === "critical"
                        ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                        : tab.id === "warning"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                          : tab.id === "info"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
                            : "bg-shark-100 text-shark-600 dark:bg-shark-800 dark:text-shark-300"
                      : "bg-shark-100 text-shark-500 dark:bg-shark-800 dark:text-shark-500"
                  )}
                >
                  {count}
                </span>
              )}
              {isActive && (
                <motion.div
                  layoutId="anomaly-filter-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-shark-900 dark:bg-shark-100 rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Anomaly list */}
      <AnimatePresence mode="wait">
        {filteredAnomalies.length === 0 ? (
          <EmptyState key={`empty-${activeFilter}`} filter={activeFilter} />
        ) : (
          <motion.div
            key={`list-${activeFilter}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-3"
          >
            {filteredAnomalies.map((anomaly, i) => (
              <AnomalyCard key={anomaly.id} anomaly={anomaly} index={i} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
