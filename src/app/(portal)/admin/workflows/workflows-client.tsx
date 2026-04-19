"use client";

import { useState, useTransition, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { WorkflowRule, WorkflowTrigger, WorkflowAction } from "@/lib/workflow-engine";
import {
  createWorkflowRule,
  updateWorkflowRule,
  deleteWorkflowRule,
  toggleWorkflowRule,
} from "@/app/actions/workflows";

// ─── Props ────────────────────────────────────────────────────────────────────

interface WorkflowsClientProps {
  systemRules: WorkflowRule[];
  customRules: WorkflowRule[];
}

// ─── Trigger config ───────────────────────────────────────────────────────────

const TRIGGER_CONFIG: Record<WorkflowTrigger, { label: string; bg: string; text: string; dot: string }> = {
  stock_below_threshold: { label: "Stock", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  stock_critical:        { label: "Stock", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  asset_overdue_return:  { label: "Asset", bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  damage_report_unresolved: { label: "Damage", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  po_pending_approval:   { label: "Procurement", bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  low_health_score:      { label: "Health", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
};

const TRIGGER_OPTIONS: { value: WorkflowTrigger; label: string; description: string }[] = [
  { value: "stock_below_threshold", label: "Stock Below Threshold",   description: "When a consumable falls below its minimum stock level" },
  { value: "stock_critical",        label: "Stock Critical (Zero)",   description: "When a consumable hits zero units" },
  { value: "asset_overdue_return",  label: "Asset Overdue Return",    description: "When a checked-out asset hasn't been returned in N days" },
  { value: "damage_report_unresolved", label: "Damage Report Unresolved", description: "When a damage report is open for more than N days" },
  { value: "po_pending_approval",   label: "PO Pending Approval",     description: "When a purchase order has been waiting N days for approval" },
  { value: "low_health_score",      label: "Low Health Score",        description: "When the organisation health score drops below a threshold" },
];

const ACTION_OPTIONS: { value: WorkflowAction; label: string; description: string }[] = [
  { value: "send_notification",  label: "Send Notification",  description: "Send an in-app notification to admins" },
  { value: "create_draft_po",    label: "Create Draft PO",    description: "Automatically create a draft purchase order" },
  { value: "escalate_to_admin",  label: "Escalate to Admin",  description: "Escalate with a high-priority notification" },
  { value: "flag_anomaly",       label: "Flag Anomaly",       description: "Log an anomaly in the alerts feed" },
];

const ACTION_LABELS: Record<WorkflowAction, string> = {
  create_draft_po:    "Creates Draft PO",
  send_notification:  "Sends Notification",
  escalate_to_admin:  "Escalates to Admin",
  flag_anomaly:       "Flags Anomaly",
};

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

// ─── Condition fields per trigger ─────────────────────────────────────────────

interface ConditionField { key: string; label: string; type: "number" | "text"; placeholder: string }

const CONDITION_FIELDS: Partial<Record<WorkflowTrigger, ConditionField[]>> = {
  asset_overdue_return:     [{ key: "daysOverdue", label: "Days Overdue", type: "number", placeholder: "14" }],
  damage_report_unresolved: [{ key: "daysOpen", label: "Days Open", type: "number", placeholder: "7" }],
  po_pending_approval:      [{ key: "daysPending", label: "Days Pending", type: "number", placeholder: "3" }],
  low_health_score:         [{ key: "threshold", label: "Health Score Threshold", type: "number", placeholder: "60" }],
};

// ─── Toggle switch ────────────────────────────────────────────────────────────

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={cn(
        "relative inline-flex rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-action-500 focus:ring-offset-1 shrink-0",
        enabled ? "bg-action-500" : "bg-shark-200"
      )}
      style={{ height: 22, width: 40 }}
    >
      <span
        className={cn("absolute bg-white rounded-full shadow-sm transition-transform duration-200", enabled ? "translate-x-[19px]" : "translate-x-0.5")}
        style={{ height: 18, width: 18, top: 2 }}
      />
    </button>
  );
}

// ─── Condition chips ──────────────────────────────────────────────────────────

function ConditionChips({ conditions }: { conditions: Record<string, unknown> }) {
  const entries = Object.entries(conditions);
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {entries.map(([key, value]) => (
        <span key={key} className="inline-flex items-center gap-1 text-[11px] bg-shark-100 dark:bg-shark-700 text-shark-600 px-2 py-0.5 rounded-full">
          <span className="text-shark-400">{key}:</span>
          <span className="font-medium">{String(value)}</span>
          {(key === "daysOverdue" || key === "daysOpen" || key === "daysPending") && (
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
  isCustom,
  onToggle,
  onEdit,
  onDelete,
}: {
  rule: WorkflowRule;
  enabled: boolean;
  isCustom: boolean;
  onToggle: (id: string, val: boolean) => void;
  onEdit: (rule: WorkflowRule) => void;
  onDelete: (id: string) => void;
}) {
  const triggerCfg = TRIGGER_CONFIG[rule.trigger];
  const actionLabel = ACTION_LABELS[rule.action] ?? rule.action;
  const description = RULE_DESCRIPTIONS[rule.id] ?? "Custom automation rule.";

  return (
    <Card className={cn("transition-all duration-200", enabled ? "border-action-100" : "border-shark-100 opacity-60")}>
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">
            <ToggleSwitch enabled={enabled} onChange={(v) => onToggle(rule.id, v)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-sm font-semibold text-shark-900 dark:text-shark-100">{rule.name}</span>
              {isCustom && (
                <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-action-50 text-action-600">
                  Custom
                </span>
              )}
              {triggerCfg && (
                <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full", triggerCfg.bg, triggerCfg.text)}>
                  <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", triggerCfg.dot)} />
                  {triggerCfg.label}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-shark-100 dark:bg-shark-700 text-shark-600">
                <Icon name="arrow-right" size={10} className="text-shark-400" />
                {actionLabel}
              </span>
            </div>
            <p className="text-xs text-shark-500 leading-relaxed">{description}</p>
            <ConditionChips conditions={rule.conditions} />
            <div className="mt-2 flex items-center justify-between">
              <p className="text-[11px] text-shark-400">
                Last run: <span className="text-shark-500 font-medium">Never</span>
              </p>
              {isCustom && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(rule)}
                    className="p-1.5 text-shark-400 hover:text-action-600 hover:bg-action-50 rounded-lg transition-colors"
                    title="Edit rule"
                  >
                    <Icon name="edit" size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(rule.id)}
                    className="p-1.5 text-shark-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete rule"
                  >
                    <Icon name="trash-2" size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── Create / Edit Modal ──────────────────────────────────────────────────────

function WorkflowModal({
  editRule,
  onClose,
  onSaved,
}: {
  editRule: WorkflowRule | null;
  onClose: () => void;
  onSaved: (rule: WorkflowRule) => void;
}) {
  const [trigger, setTrigger] = useState<WorkflowTrigger>(
    editRule?.trigger ?? "stock_below_threshold"
  );
  const [action, setAction] = useState<WorkflowAction>(
    editRule?.action ?? "send_notification"
  );
  const [name, setName] = useState(editRule?.name ?? "");
  const [conditionValues, setConditionValues] = useState<Record<string, string>>(() => {
    if (!editRule) return {};
    return Object.fromEntries(
      Object.entries(editRule.conditions).map(([k, v]) => [k, String(v)])
    );
  });
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const conditionFields = CONDITION_FIELDS[trigger] ?? [];

  // Reset condition values when trigger changes
  const handleTriggerChange = (t: WorkflowTrigger) => {
    setTrigger(t);
    setConditionValues({});
  };

  function buildConditions(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const field of conditionFields) {
      const val = conditionValues[field.key];
      if (val !== undefined && val !== "") {
        result[field.key] = field.type === "number" ? Number(val) : val;
      }
    }
    return result;
  }

  function buildActionConfig(): Record<string, unknown> {
    if (action === "create_draft_po") return { targetDays: 30 };
    if (action === "send_notification") return { priority: "warning", message: "Automated workflow notification" };
    if (action === "escalate_to_admin") return { message: "Automated escalation from workflow rule" };
    if (action === "flag_anomaly") return { severity: "medium" };
    return {};
  }

  function handleSubmit() {
    setError(null);
    if (!name.trim()) { setError("Rule name is required"); return; }

    const fd = new FormData();
    fd.set("name", name.trim());
    fd.set("trigger", trigger);
    fd.set("action", action);
    fd.set("conditions", JSON.stringify(buildConditions()));
    fd.set("actionConfig", JSON.stringify(buildActionConfig()));

    startTransition(async () => {
      try {
        if (editRule) {
          await updateWorkflowRule(editRule.id, fd);
          onSaved({
            ...editRule,
            name: name.trim(),
            trigger,
            action,
            conditions: buildConditions(),
            actionConfig: buildActionConfig(),
          });
        } else {
          await createWorkflowRule(fd);
          // The page will revalidate and pass the new rule via props
          onSaved({
            id: `custom-${Date.now()}`,
            name: name.trim(),
            trigger,
            action,
            conditions: buildConditions(),
            actionConfig: buildActionConfig(),
            enabled: true,
          });
        }
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save rule");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white dark:bg-shark-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-shark-100 dark:border-shark-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-action-100 flex items-center justify-center shrink-0">
              <Icon name="git-branch" size={14} className="text-action-600" />
            </div>
            <h2 className="text-sm font-semibold text-shark-900 dark:text-shark-100">
              {editRule ? "Edit Rule" : "Create Automation Rule"}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-shark-400 hover:text-shark-700 dark:text-shark-300 hover:bg-shark-100 dark:bg-shark-700 rounded-lg transition-colors">
            <Icon name="x" size={16} />
          </button>
        </div>

        <form ref={formRef} className="p-5 space-y-4" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 dark:text-shark-300 mb-1">Rule Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Weekly Low-Stock Alert"
              maxLength={100}
              className="w-full rounded-xl border border-shark-200 dark:border-shark-700 px-3.5 py-2.5 text-sm text-shark-900 dark:text-shark-100 focus:border-action-400 focus:outline-none focus:ring-2 focus:ring-action-400/20 transition-colors"
            />
          </div>

          {/* Trigger */}
          <div>
            <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 dark:text-shark-300 mb-1">Trigger *</label>
            <div className="space-y-2">
              {TRIGGER_OPTIONS.map((opt) => (
                <label key={opt.value} className={cn(
                  "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors",
                  trigger === opt.value
                    ? "border-action-400 bg-action-50"
                    : "border-shark-200 dark:border-shark-700 hover:border-shark-300 dark:hover:border-shark-600 hover:bg-shark-50 dark:hover:bg-shark-800"
                )}>
                  <input
                    type="radio"
                    name="trigger"
                    value={opt.value}
                    checked={trigger === opt.value}
                    onChange={() => handleTriggerChange(opt.value)}
                    className="mt-0.5 accent-action-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-shark-900 dark:text-shark-100">{opt.label}</p>
                    <p className="text-xs text-shark-400 mt-0.5">{opt.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Conditions (dynamic based on trigger) */}
          {conditionFields.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 dark:text-shark-300 mb-2">Conditions</label>
              <div className="space-y-2">
                {conditionFields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs text-shark-500 mb-1">{field.label}</label>
                    <input
                      type={field.type}
                      value={conditionValues[field.key] ?? ""}
                      onChange={(e) => setConditionValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      min={field.type === "number" ? 1 : undefined}
                      className="w-full rounded-xl border border-shark-200 dark:border-shark-700 bg-white dark:bg-shark-800 px-3.5 py-2 text-sm text-shark-900 dark:text-shark-100 focus:border-action-400 focus:outline-none focus:ring-2 focus:ring-action-400/20 transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action */}
          <div>
            <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 dark:text-shark-300 mb-1">Action *</label>
            <div className="space-y-2">
              {ACTION_OPTIONS.map((opt) => (
                <label key={opt.value} className={cn(
                  "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors",
                  action === opt.value
                    ? "border-action-400 bg-action-50"
                    : "border-shark-200 dark:border-shark-700 hover:border-shark-300 dark:hover:border-shark-600 hover:bg-shark-50 dark:hover:bg-shark-800"
                )}>
                  <input
                    type="radio"
                    name="action"
                    value={opt.value}
                    checked={action === opt.value}
                    onChange={() => setAction(opt.value)}
                    className="mt-0.5 accent-action-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-shark-900 dark:text-shark-100">{opt.label}</p>
                    <p className="text-xs text-shark-400 mt-0.5">{opt.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? "Saving…" : editRule ? "Save Changes" : "Create Rule"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete confirmation dialog ───────────────────────────────────────────────

function DeleteConfirm({ ruleName, onConfirm, onCancel }: { ruleName: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-shark-900 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <Icon name="trash-2" size={18} className="text-red-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-shark-900 dark:text-shark-100">Delete Rule</h3>
            <p className="text-xs text-shark-400 mt-0.5">This action cannot be undone.</p>
          </div>
        </div>
        <p className="text-sm text-shark-600">
          Are you sure you want to delete <span className="font-semibold text-shark-900 dark:text-shark-100">{ruleName}</span>?
        </p>
        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button type="button" className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={onConfirm}>Delete</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function WorkflowsClient({ systemRules, customRules: initialCustomRules }: WorkflowsClientProps) {
  const [systemEnabledMap, setSystemEnabledMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(systemRules.map((r) => [r.id, r.enabled]))
  );
  const [customRules, setCustomRules] = useState<WorkflowRule[]>(initialCustomRules);
  const [customEnabledMap, setCustomEnabledMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(initialCustomRules.map((r) => [r.id, r.enabled]))
  );

  const [showModal, setShowModal] = useState(false);
  const [editRule, setEditRule] = useState<WorkflowRule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkflowRule | null>(null);
  const [, startTransition] = useTransition();

  const handleSystemToggle = (id: string, val: boolean) => {
    setSystemEnabledMap((prev) => ({ ...prev, [id]: val }));
  };

  const handleCustomToggle = (id: string, val: boolean) => {
    setCustomEnabledMap((prev) => ({ ...prev, [id]: val }));
    startTransition(async () => {
      try { await toggleWorkflowRule(id, val); } catch { /* revert */ setCustomEnabledMap((prev) => ({ ...prev, [id]: !val })); }
    });
  };

  const handleEdit = (rule: WorkflowRule) => {
    setEditRule(rule);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    const rule = customRules.find((r) => r.id === id);
    if (rule) setDeleteTarget(rule);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setCustomRules((prev) => prev.filter((r) => r.id !== id));
    setDeleteTarget(null);
    startTransition(async () => {
      try { await deleteWorkflowRule(id); } catch { /* silently fail — page will revalidate */ }
    });
  };

  const handleSaved = (rule: WorkflowRule) => {
    if (editRule) {
      setCustomRules((prev) => prev.map((r) => (r.id === editRule.id ? rule : r)));
      setCustomEnabledMap((prev) => ({ ...prev, [rule.id]: rule.enabled }));
    } else {
      setCustomRules((prev) => [...prev, rule]);
      setCustomEnabledMap((prev) => ({ ...prev, [rule.id]: rule.enabled }));
    }
    setEditRule(null);
    setShowModal(false);
  };

  const openCreate = () => {
    setEditRule(null);
    setShowModal(true);
  };

  return (
    <>
      <Card padding="none">
        <div className="p-4 sm:p-5 space-y-8">
          {/* Page header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-action-100 flex items-center justify-center shrink-0">
                <Icon name="git-branch" size={14} className="text-action-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-shark-900 dark:text-shark-100">Workflow Automation</h3>
                <p className="text-xs text-shark-400">Rules run every 6 hours automatically</p>
              </div>
            </div>
            <Button size="sm" onClick={openCreate} className="flex items-center gap-1.5 shrink-0">
              <Icon name="plus" size={14} />
              New Rule
            </Button>
          </div>

          {/* Info banner */}
          <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-blue-50 border border-blue-100">
            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
              <Icon name="info" size={14} className="text-blue-600" />
            </div>
            <p className="text-sm text-blue-700 leading-relaxed">
              These automations run in the background to keep your operations on track. System rules run for all organisations and cannot be deleted. Custom rules apply only to your organisation.
            </p>
          </div>

          {/* System rules */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold text-shark-400 uppercase tracking-widest">System Rules</p>
            {systemRules.map((rule) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                enabled={systemEnabledMap[rule.id] ?? rule.enabled}
                isCustom={false}
                onToggle={handleSystemToggle}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* Custom rules */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-shark-400 uppercase tracking-widest">Custom Rules</p>
              <span className="text-[11px] text-shark-400">{customRules.length} rule{customRules.length !== 1 ? "s" : ""}</span>
            </div>
            {customRules.length === 0 ? (
              <Card className="border-dashed border-shark-200">
                <CardContent className="py-10 text-center">
                  <div className="w-10 h-10 rounded-full bg-shark-100 dark:bg-shark-700 flex items-center justify-center mx-auto mb-3">
                    <Icon name="git-branch" size={18} className="text-shark-400" />
                  </div>
                  <p className="text-sm font-medium text-shark-700 dark:text-shark-300">No custom rules yet</p>
                  <p className="text-xs text-shark-400 mt-1 mb-4">Create rules tailored to your organisation&apos;s needs.</p>
                  <Button size="sm" variant="outline" onClick={openCreate} className="flex items-center gap-1.5 mx-auto">
                    <Icon name="plus" size={14} />
                    Create First Rule
                  </Button>
                </CardContent>
              </Card>
            ) : (
              customRules.map((rule) => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  enabled={customEnabledMap[rule.id] ?? rule.enabled}
                  isCustom={true}
                  onToggle={handleCustomToggle}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>

          {/* Recent executions */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold text-shark-400 uppercase tracking-widest">Recent Executions</p>
            <Card className="border-shark-100">
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-6">
                <div className="w-12 h-12 rounded-full bg-shark-100 dark:bg-shark-700 flex items-center justify-center">
                  <Icon name="clock" size={20} className="text-shark-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-shark-700 dark:text-shark-300">No executions yet</p>
                  <p className="text-xs text-shark-400 mt-0.5">Workflows run every 6 hours.</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Card>

      {/* Create / Edit modal */}
      {showModal && (
        <WorkflowModal
          editRule={editRule}
          onClose={() => { setShowModal(false); setEditRule(null); }}
          onSaved={handleSaved}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <DeleteConfirm
          ruleName={deleteTarget.name}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
