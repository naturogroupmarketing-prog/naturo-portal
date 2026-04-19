"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AssetHealthWidgetProps {
  summary: {
    averageScore: number;
    distribution: { grade: string; count: number }[];
    criticalAssets: Array<{
      assetId: string;
      assetName: string;
      assetCode: string;
      score: number;
      grade: string;
      recommendation: string;
    }>;
    topPerformers: Array<{
      assetId: string;
      assetName: string;
      assetCode: string;
      score: number;
      grade: string;
    }>;
  };
}

// ─── Grade config ─────────────────────────────────────────────────────────────

const GRADE_CONFIG: Record<
  string,
  { bar: string; text: string; bg: string; border: string }
> = {
  A: {
    bar: "bg-green-500",
    text: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
  },
  B: {
    bar: "bg-teal-500",
    text: "text-teal-700",
    bg: "bg-teal-50",
    border: "border-teal-200",
  },
  C: {
    bar: "bg-amber-400",
    text: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  D: {
    bar: "bg-orange-500",
    text: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
  F: {
    bar: "bg-red-500",
    text: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
  },
};

const RECOMMENDATION_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  retire: {
    label: "Retire",
    color: "text-red-700",
    bg: "bg-red-100",
  },
  service: {
    label: "Service",
    color: "text-orange-700",
    bg: "bg-orange-100",
  },
  monitor: {
    label: "Monitor",
    color: "text-amber-700",
    bg: "bg-amber-100",
  },
  maintain: {
    label: "Maintain",
    color: "text-green-700",
    bg: "bg-green-100",
  },
};

function scoreBadgeColor(score: number): string {
  if (score >= 80) return "bg-green-100 text-green-700 border-green-200";
  if (score >= 60) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-red-100 text-red-700 border-red-200";
}

function avgScoreBadgeColor(score: number): {
  bg: string;
  text: string;
  ring: string;
} {
  if (score >= 80)
    return { bg: "bg-green-50", text: "text-green-700", ring: "ring-green-200" };
  if (score >= 60)
    return {
      bg: "bg-amber-50",
      text: "text-amber-700",
      ring: "ring-amber-200",
    };
  return { bg: "bg-red-50", text: "text-red-700", ring: "ring-red-200" };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AssetHealthWidget({ summary }: AssetHealthWidgetProps) {
  const { averageScore, distribution, criticalAssets, topPerformers } = summary;

  const totalAssets = distribution.reduce((s, d) => s + d.count, 0);
  const maxGradeCount = Math.max(...distribution.map((d) => d.count), 1);

  const badgeColor = avgScoreBadgeColor(averageScore);

  const hasCritical = criticalAssets.length > 0;

  return (
    <Card className="border-action-200">
      <div className="p-4 sm:p-5">
        {/* ── Header ── */}
        <div className="flex items-center gap-2 mb-5">
          <div className="w-7 h-7 rounded-lg bg-action-50 flex items-center justify-center shrink-0">
            <Icon name="bar-chart" size={14} className="text-action-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-shark-900">Asset Health</h2>
            <p className="text-xs text-shark-400">
              {totalAssets} asset{totalAssets !== 1 ? "s" : ""} scored
            </p>
          </div>
          <span className="text-[10px] font-medium bg-action-50 text-action-600 px-1.5 py-0.5 rounded-full shrink-0">AI</span>
          {/* Average score badge */}
          <div
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full ring-1 font-semibold text-sm",
              badgeColor.bg,
              badgeColor.text,
              badgeColor.ring
            )}
          >
            <span className="text-lg font-bold leading-none">
              {averageScore}
            </span>
            <span className="text-xs font-medium opacity-70">/ 100</span>
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* LEFT — Grade distribution bar chart */}
          <div>
            <p className="text-[11px] font-semibold text-shark-400 uppercase tracking-wider mb-3">
              Grade Distribution
            </p>
            <div className="space-y-2.5">
              {distribution.map((item, idx) => {
                const cfg = GRADE_CONFIG[item.grade] ?? GRADE_CONFIG["F"];
                const widthPct =
                  maxGradeCount > 0
                    ? Math.max(4, Math.round((item.count / maxGradeCount) * 100))
                    : 4;

                return (
                  <div key={item.grade} className="flex items-center gap-3">
                    {/* Grade letter */}
                    <span
                      className={cn(
                        "w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0",
                        cfg.bg,
                        cfg.text
                      )}
                    >
                      {item.grade}
                    </span>

                    {/* Bar track */}
                    <div className="flex-1 h-5 bg-shark-100 rounded-full overflow-hidden">
                      <motion.div
                        className={cn("h-full rounded-full", cfg.bar)}
                        initial={{ width: 0 }}
                        animate={{ width: `${widthPct}%` }}
                        transition={{
                          duration: 0.6,
                          delay: idx * 0.08,
                          ease: "easeOut",
                        }}
                      />
                    </div>

                    {/* Count */}
                    <span className="text-xs font-semibold text-shark-700 w-6 text-right shrink-0">
                      {item.count}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Top performers teaser */}
            {topPerformers.length > 0 && (
              <div className="mt-4 pt-4 border-t border-shark-100 dark:border-shark-700">
                <p className="text-[11px] font-semibold text-shark-400 uppercase tracking-wider mb-2">
                  Top Performers
                </p>
                <div className="space-y-1.5">
                  {topPerformers.slice(0, 3).map((asset) => (
                    <Link
                      key={asset.assetId}
                      href={`/assets?search=${encodeURIComponent(asset.assetCode)}`}
                      className="flex items-center gap-2 py-1 px-1.5 rounded-lg hover:bg-shark-50 transition-colors group"
                    >
                      <span className="w-5 h-5 rounded-md bg-green-50 flex items-center justify-center text-[10px] font-bold text-green-700 shrink-0">
                        A
                      </span>
                      <span className="text-xs font-medium text-shark-700 truncate flex-1 group-hover:text-action-600 transition-colors">
                        {asset.assetName}
                      </span>
                      <span className="text-[10px] text-shark-400">
                        {asset.score}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — Critical / Needs Attention */}
          <div>
            <p className="text-[11px] font-semibold text-shark-400 uppercase tracking-wider mb-3">
              Needs Attention
            </p>

            {!hasCritical ? (
              /* All good state */
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-center rounded-xl bg-green-50 border border-green-100">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Icon name="check" size={18} className="text-green-600" />
                </div>
                <p className="text-sm font-semibold text-green-700">
                  All assets in good health
                </p>
                <p className="text-xs text-green-500">No critical assets found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {criticalAssets.slice(0, 5).map((asset, idx) => {
                  const recCfg =
                    RECOMMENDATION_CONFIG[asset.recommendation] ??
                    RECOMMENDATION_CONFIG["monitor"];

                  return (
                    <motion.div
                      key={asset.assetId}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.07, duration: 0.3 }}
                    >
                      <Link
                        href={`/assets?search=${encodeURIComponent(asset.assetCode)}`}
                        className="flex items-start gap-2.5 p-2.5 rounded-xl border border-shark-100 hover:border-action-200 hover:bg-action-50/30 transition-all group"
                      >
                        {/* Score badge */}
                        <span
                          className={cn(
                            "mt-0.5 text-xs font-bold px-1.5 py-0.5 rounded-md border shrink-0",
                            scoreBadgeColor(asset.score)
                          )}
                        >
                          {asset.score}
                        </span>

                        {/* Name + code */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-shark-800 truncate group-hover:text-action-600 transition-colors">
                            {asset.assetName}
                          </p>
                          <p className="text-[11px] text-shark-400">
                            {asset.assetCode}
                          </p>
                        </div>

                        {/* Recommendation pill */}
                        <span
                          className={cn(
                            "shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full",
                            recCfg.bg,
                            recCfg.color
                          )}
                        >
                          {recCfg.label}
                        </span>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="mt-4 pt-4 border-t border-shark-100 dark:border-shark-700 flex justify-end">
          <Link
            href="/assets"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-action-600 hover:text-action-700 transition-colors"
          >
            View all assets
            <Icon name="arrow-right" size={12} />
          </Link>
        </div>
      </div>
    </Card>
  );
}
