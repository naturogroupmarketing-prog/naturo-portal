"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export interface ReorderRecommendation {
  consumableId: string;
  name: string;
  category: string;
  currentStock: number;
  unit: string;
  suggestedQty: number;
  estimatedCost?: number;
  supplierName?: string;
  riskLevel: "critical" | "warning" | "ok";
  daysRemaining?: number;
  avgDailyUsage: number;
  reasoning: string;
}

export interface SmartReorderPanelProps {
  recommendations: ReorderRecommendation[];
  canApprove: boolean;
}

const RISK_CONFIG = {
  critical: {
    badge: "bg-red-50 text-red-600 ring-1 ring-red-200",
    label: "Critical",
    dot: "bg-red-500 animate-pulse",
  },
  warning: {
    badge: "bg-amber-50 text-amber-600 ring-1 ring-amber-200",
    label: "Low",
    dot: "bg-amber-400",
  },
  ok: {
    badge: "bg-green-50 text-green-600 ring-1 ring-green-200",
    label: "OK",
    dot: "bg-green-400",
  },
};

const VISIBLE_COUNT = 5;

function formatCost(amount: number): string {
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}k`;
  return `$${amount.toFixed(2)}`;
}

interface RecommendationCardProps {
  item: ReorderRecommendation;
  index: number;
}

function RecommendationCard({ item, index }: RecommendationCardProps) {
  const risk = RISK_CONFIG[item.riskLevel];
  const showDaysWarning = item.daysRemaining !== undefined && item.daysRemaining < 14;
  const daysColor =
    item.daysRemaining !== undefined && item.daysRemaining <= 3
      ? "text-red-600"
      : "text-orange-600";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className="border border-shark-100 dark:border-shark-800 rounded-xl p-3.5 bg-white dark:bg-shark-900 space-y-2"
    >
      {/* Top row: name + badges */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[13px] font-semibold text-shark-900 dark:text-shark-100 truncate">
              {item.name}
            </span>
            {/* Category badge */}
            <span className="text-[10px] font-medium bg-shark-100 dark:bg-shark-800 text-shark-500 dark:text-shark-400 px-1.5 py-0.5 rounded-full shrink-0">
              {item.category}
            </span>
            {/* Risk badge */}
            <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0", risk.badge)}>
              {risk.label}
            </span>
          </div>

          {/* Days remaining warning */}
          {showDaysWarning && (
            <p className={cn("text-[11px] font-semibold mt-0.5", daysColor)}>
              ⚡ {item.daysRemaining} day{item.daysRemaining !== 1 ? "s" : ""} remaining
            </p>
          )}
        </div>

        {/* Cost + supplier */}
        {(item.estimatedCost !== undefined || item.supplierName) && (
          <div className="text-right shrink-0">
            {item.estimatedCost !== undefined && (
              <p className="text-[13px] font-bold text-shark-800 dark:text-shark-200">
                {formatCost(item.estimatedCost)}
              </p>
            )}
            {item.supplierName && (
              <p className="text-[10px] text-shark-400 truncate max-w-[100px]">{item.supplierName}</p>
            )}
          </div>
        )}
      </div>

      {/* Middle row: stock → reorder */}
      <div className="flex items-center gap-1.5 text-[12px]">
        <span className="font-bold text-shark-800 dark:text-shark-200">{item.currentStock}</span>
        <span className="text-shark-400">{item.unit}</span>
        <Icon name="arrow-right" size={11} className="text-shark-300 mx-0.5" />
        <span className="font-bold text-action-600">+{item.suggestedQty}</span>
        <span className="text-shark-400">{item.unit}</span>
      </div>

      {/* Reasoning */}
      <p className="text-[11px] text-shark-400 leading-relaxed">{item.reasoning}</p>
    </motion.div>
  );
}

export function SmartReorderPanel({ recommendations, canApprove }: SmartReorderPanelProps) {
  const [showAll, setShowAll] = useState(false);
  const [draftToastVisible, setDraftToastVisible] = useState(false);

  const hasItems = recommendations.length > 0;
  const criticalCount = recommendations.filter((r) => r.riskLevel === "critical").length;
  const visibleItems = showAll ? recommendations : recommendations.slice(0, VISIBLE_COUNT);
  const hiddenCount = recommendations.length - VISIBLE_COUNT;

  const handleDraftAll = () => {
    setDraftToastVisible(true);
    setTimeout(() => setDraftToastVisible(false), 3000);
  };

  return (
    <Card className="border-action-200 overflow-hidden">
      {/* Header */}
      <div className="border-b border-shark-100 dark:border-shark-800 px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-action-50 flex items-center justify-center shrink-0">
            <Icon name="truck" size={14} className="text-action-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-shark-900 dark:text-shark-100">Smart Reorder</h3>
            <p className="text-xs text-shark-400">Powered by AI predictions</p>
          </div>
          <span className="text-[10px] font-medium bg-action-50 text-action-600 px-1.5 py-0.5 rounded-full shrink-0">AI</span>
          {hasItems && (
            <span
              className={cn(
                "text-[11px] font-bold px-2 py-0.5 rounded-full",
                criticalCount > 0
                  ? "bg-red-50 text-red-600"
                  : "bg-shark-100 dark:bg-shark-800 text-shark-600 dark:text-shark-400"
              )}
            >
              {recommendations.length} item{recommendations.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      <div className="p-5 space-y-3">
        {/* Empty state */}
        {!hasItems && (
          <div className="py-8 text-center">
            <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <Icon name="check" size={20} className="text-green-600" />
            </div>
            <p className="text-sm font-semibold text-shark-700 dark:text-shark-300">
              All inventory levels are healthy
            </p>
            <p className="text-[11px] text-shark-400 mt-1">
              No reorders needed right now — check back soon
            </p>
          </div>
        )}

        {/* Recommendation list */}
        {hasItems && (
          <>
            <AnimatePresence initial={false}>
              {visibleItems.map((item, i) => (
                <RecommendationCard key={item.consumableId} item={item} index={i} />
              ))}
            </AnimatePresence>

            {/* Show more / less toggle */}
            {hiddenCount > 0 && (
              <button
                onClick={() => setShowAll((v) => !v)}
                className="w-full text-[12px] font-semibold text-action-600 hover:text-action-700 py-1.5 transition-colors"
              >
                {showAll ? "Show less" : `Show ${hiddenCount} more item${hiddenCount !== 1 ? "s" : ""}`}
              </button>
            )}
          </>
        )}

        {/* Footer actions */}
        {canApprove && hasItems && (
          <div className="flex items-center gap-2 pt-1 border-t border-shark-50 dark:border-shark-800">
            <button
              onClick={handleDraftAll}
              className="flex-1 text-[12px] font-semibold border border-shark-200 dark:border-shark-700 text-shark-700 dark:text-shark-300 rounded-xl py-2.5 hover:bg-shark-50 dark:hover:bg-shark-800 transition-colors"
            >
              Draft All Orders
            </button>
            <Link
              href="/purchase-orders"
              className="flex-1 text-center text-[12px] font-semibold bg-action-500 hover:bg-action-600 text-white rounded-xl py-2.5 transition-colors"
            >
              Review in Purchase Orders
            </Link>
          </div>
        )}

        {/* Toast notification */}
        <AnimatePresence>
          {draftToastVisible && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-shark-900 text-white text-[12px] font-medium px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 z-50"
            >
              <Icon name="truck" size={13} className="text-action-400" />
              Creating purchase orders...
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
