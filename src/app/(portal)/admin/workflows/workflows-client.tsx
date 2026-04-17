"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { WorkflowRule, WorkflowTrigger, WorkflowAction } from "@/lib/workflow-engine";

// ─── Props ────────────────────────────────────────────────────────────────────

interface WorkflowsClientProps {
  rules: WorkflowRule[];
}

// ─── Trigger badge config ─────────────────────────────────────────────────────

const TRIGGER_CONFIG: Record<
  WorkflowTrigger,
  { label: string; bg: string; text: string; dot: string }
> = {
  stock_below_threshold: {
    label: "Stock",
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  stock_critical: {
    label: "Stock",
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  asset_overdue_return: {
    label: "Asset",
    bg: "bg-purple-50",
    text: "text-purple-700",
    dot: "bg-purple-500",
  },
  damage_report_unresolved: {
    label: "Damage",
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
  },
  po_pending_approval: {
    label: "Procurement",
    bg: "bg-green-50",
    text: "text-green-700",
    dot: "bg-green-500",
  },
  low_health_score: {
    label: "Health",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-400",
  },
};

// ─── Action label map ─────────────────────────────────────────────────────────

const ACTION_LABELS: Record<WorkflowAction, string> = {
  create_draft_po: "Creates Draft PO",
  send_notification: "Sends Notification",
  escalate_to_admin: "Escalates to Admin",
  flag_anomaly: "Flags Anomaly",
};

// ─── Rule description map ─────────────────────────────────────────────────────

const RULE_DESCRIPTIONS: Record<string, string> = {
  "rule-low-stock-auto-notify":
    "Notifies all admins and managers when a consumable drops below its minimum threshold, prompting review before stock runs out.",
  "rule-zero-stock-draft-po":
    "Automatically creates a draft purchase order when any consumable hits zero stock with no active order in place.",
  "rule-overdue-return-notify":
    "Escalates to admins when a checked-out asset hasn't been returned after 14 days.",
  "rule-damage-escalation":
    "Escalates unresolved damage reports to admins after 7 days to ensure nothing falls through the cracks.",
};

// ─── Toggle switch ────────────────────────────────────────────────────────────

function ToggleSwitch({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={cn(
        "relative inline-flex w-10 h-5.5 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-action-500 focus:ring-offset-1 shrink-0",
        enabled ? "bg-action-500" : "bg-shark-200"
      )}
      style={{ height: 22, width: 40 }}
    >
      <span
        className={cn(
          "absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow-sm transition-transform duration-200",
          enabled ? "translate-x-[19px]" : "translate-x-0.5"
        )}
        style={{ height: 18, width: 18, top: 2 }}
      />
    </button>
  );
}

// ─── Condition display ────────────────────────────────────────────────────────

function ConditionChips({ conditions }: { conditions: Record<string, unknown> }) {
  const entries = Object.entries(conditions);
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {entries.map(([key, value]) => (
        <span
          key={key}
          className="inline-flex items-center gap-1 text-[11px] bg-shark-100 text-shark-600 px-2 py-0.5 rounded-full"
        >
          <span className="text-shark-400">{key}:</span>
          <span className="font-medium">{String(value)}</span>
          {(key === "daysOverdue" || key === "daysOpen") && (
            <span className="text-shark-400">days</span>
          )}
        </span>
      ))}
    </div>
  );
}

// ─── Rule card ────────────────────────────────────────────────────────────────

function RuleCard({
  rule,
  enabled,
  onToggle,
}: {
  rule: WorkflowRule;
  enabled: boolean;
  onToggle: (id: string, val: boolean) => void;
}) {
  const triggerCfg = TRIGGER_CONFIG[rule.trigger];
  const actionLabel = ACTION_LABELS[rule.action] ?? rule.action;
  const description = RULE_DESCRIPTIONS[rule.id] ?? "Automation rule.";

  return (
    <Card
      className={cn(
        "transition-all duration-200",
        enabled ? "border-action-100" : "border-shark-100 opacity-60"
      )}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          {/* Toggle */}
          <div className="mt-0.5 shrink-0">
            <ToggleSwitch
              enabled={enabled}
              onChange={(v) => onToggle(rule.id, v)}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Name + badges row */}
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-sm font-semibold text-shark-900">
                {rule.name}
              </span>

              {/* Trigger badge */}
              {triggerCfg && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full",
                    triggerCfg.bg,
                    triggerCfg.text
                  )}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full shrink-0",
                      triggerCfg.dot
                    )}
                  />
                  {triggerCfg.label}
                </span>
              )}

              {/* Action badge */}
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-shark-100 text-shark-600">
                <Icon name="arrow-right" size={10} className="text-shark-400" />
                {actionLabel}
              </span>
            </div>

            {/* Description */}
            <p className="text-xs text-shark-500 leading-relaxed">
              {description}
            </p>

            {/* Conditions */}
            <ConditionChips conditions={rule.conditions} />

            {/* Last run */}
            <p className="mt-2 text-[11px] text-shark-400">
              Last run:{" "}
              <span className="text-shark-500 font-medium">Never</span>
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function WorkflowsClient({ rules }: WorkflowsClientProps) {
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(rules.map((r) => [r.id, r.enabled]))
  );

  const handleToggle = (id: string, val: boolean) => {
    setEnabledMap((prev) => ({ ...prev, [id]: val }));
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-shark-900 tracking-tight">
          Workflow Automation
        </h1>
        <p className="mt-1 text-sm text-shark-500">
          Rules run every 6 hours automatically
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-blue-50 border border-blue-100">
        <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
          <Icon name="info" size={14} className="text-blue-600" />
        </div>
        <p className="text-sm text-blue-700 leading-relaxed">
          These automations run in the background to keep your operations on
          track. Review and adjust triggers as needed.
        </p>
      </div>

      {/* Rules list */}
      <div className="space-y-3">
        <p className="text-[11px] font-semibold text-shark-400 uppercase tracking-widest">
          Active Rules
        </p>
        {rules.map((rule) => (
          <RuleCard
            key={rule.id}
            rule={rule}
            enabled={enabledMap[rule.id] ?? rule.enabled}
            onToggle={handleToggle}
          />
        ))}
      </div>

      {/* Execution history */}
      <div className="space-y-3">
        <p className="text-[11px] font-semibold text-shark-400 uppercase tracking-widest">
          Recent Executions
        </p>
        <Card className="border-shark-100">
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-6">
            <div className="w-12 h-12 rounded-full bg-shark-100 flex items-center justify-center">
              <Icon name="clock" size={20} className="text-shark-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-shark-700">
                No executions yet
              </p>
              <p className="text-xs text-shark-400 mt-0.5">
                Workflows run every 6 hours.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom note */}
      <p className="text-xs text-shark-400 text-center pb-4">
        Custom rules and execution history coming soon
      </p>
    </div>
  );
}
