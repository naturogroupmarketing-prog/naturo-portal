"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import {
  generateAiBriefing,
  type BriefingContent,
  type BriefingMode,
  type BriefingInput,
} from "@/app/actions/ai-briefing";

interface FocusChip {
  label: string;
  colorClass: string;
  href?: string;
}

interface AiBriefingClientProps {
  initialContent: BriefingContent;
  displayDate: string;
  chips: FocusChip[];
  input: BriefingInput;
  /** First-name displayed in the greeting */
  userName?: string;
  /** Total action items needing attention (drives badge colour) */
  attentionCount?: number;
  /** Items rated critical (drives red badge) */
  criticalCount?: number;
}

const MODES: { id: BriefingMode; label: string }[] = [
  { id: "summary", label: "Summary" },
  { id: "detailed", label: "Detailed" },
  { id: "alerts", label: "Alerts" },
];

const ACTION_ICON: Record<string, IconName> = {
  "/consumables?tab=requests": "clipboard",
  "/purchase-orders": "truck",
  "/purchase-orders?status=ORDERED": "truck",
  "/purchase-orders?action=create": "plus",
  "/returns": "arrow-left",
  "/alerts/damage": "alert-triangle",
  "/alerts/low-stock": "alert-triangle",
  "/staff": "users",
  "/assets": "package",
};

export function AiBriefingClient({
  initialContent,
  displayDate,
  chips,
  input,
  userName,
  attentionCount = 0,
  criticalCount = 0,
}: AiBriefingClientProps) {
  const [mode, setMode] = useState<BriefingMode>("summary");
  const [content, setContent] = useState<BriefingContent>(initialContent);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  // Collapsed by default on mobile; always expanded on lg+
  const [collapsed, setCollapsed] = useState(true);

  // ── Greeting ──────────────────────────────────────────────────────────
  const [greeting, setGreeting] = useState("Good morning");
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
  }, []);

  const firstName = userName?.split(" ")[0] ?? "";
  const isCritical = criticalCount > 0;
  const isWarning = !isCritical && attentionCount > 0;

  const badgeStyle = isCritical
    ? "bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20 text-red-700 dark:text-red-400"
    : isWarning
    ? "bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20 text-amber-700 dark:text-amber-400"
    : "bg-green-50 dark:bg-green-500/10 border-green-100 dark:border-green-500/20 text-green-700 dark:text-green-400";
  const dotColor = isCritical ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-green-500";

  const handleToggleActions = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("dashboard-toggle-actions"));
    }
  };

  const load = (newMode: BriefingMode) => {
    startTransition(async () => {
      const result = await generateAiBriefing(input, newMode);
      setContent(result);
    });
  };

  const handleMode = (newMode: BriefingMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    load(newMode);
  };

  const handleRefresh = () => load(mode);

  const handleCopy = () => {
    const parts = [content.text];
    if (content.weekAhead) parts.push(`\nWeek ahead: ${content.weekAhead}`);
    if (content.staffInsight) parts.push(`Staff: ${content.staffInsight}`);
    navigator.clipboard.writeText(parts.join("\n")).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      {/* ── Collapsed row (mobile default) ── */}
      {/* Fixed 2-line height so content below never jumps */}
      <div className="lg:hidden flex items-center gap-2 px-4 py-3">

        {/* Expand / collapse trigger — takes up the left area */}
        <button
          onClick={() => setCollapsed((p) => !p)}
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand AI Briefing" : "Collapse AI Briefing"}
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
            <Icon name="star" size={14} className="text-indigo-500" />
          </div>

          {/* Text area — locked to exactly 2 lines, no content can change its height */}
          <div className="flex-1 min-w-0 overflow-hidden">
            {/* Line 1 — greeting (single line, truncated) */}
            <div className="flex items-center gap-1.5 h-[18px] overflow-hidden">
              <span className="text-xs font-semibold text-shark-900 dark:text-shark-100 truncate leading-none">
                {firstName
                  ? <>{greeting},{" "}<span className="text-action-600 dark:text-action-400">{firstName}</span></>
                  : "AI Briefing"}
              </span>
              <span className="text-[9px] font-semibold bg-action-50 text-action-600 px-1.5 py-0.5 rounded-full shrink-0 leading-none">AI</span>
              {isPending && <Icon name="refresh-cw" size={10} className="animate-spin text-action-500 shrink-0" />}
            </div>
            {/* Line 2 — briefing preview (single line, truncated) */}
            <p className="text-[11px] text-shark-500 dark:text-shark-400 truncate leading-none h-[14px] overflow-hidden mt-1">
              {content.text}
            </p>
          </div>
        </button>

        {/* Attention badge — separate tap target; fires the actions panel toggle */}
        {attentionCount > 0 && (
          <button
            onClick={handleToggleActions}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-semibold shrink-0 transition-colors",
              badgeStyle,
            )}
            aria-label={isCritical ? `${criticalCount} critical items need attention` : `${attentionCount} items need attention`}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0 animate-pulse", dotColor)} />
            {isCritical ? `${criticalCount} critical` : `${attentionCount} items`}
          </button>
        )}

        {/* Chevron */}
        <button
          onClick={() => setCollapsed((p) => !p)}
          className="shrink-0 text-shark-400"
          tabIndex={-1}
          aria-hidden="true"
        >
          <Icon
            name="chevron-down"
            size={16}
            className={cn("transition-transform duration-200", !collapsed && "rotate-180")}
          />
        </button>
      </div>

      {/* ── Expanded content (always visible on lg+, toggled on mobile) ── */}
      <div className={cn("p-5", collapsed ? "hidden lg:block" : "block")}>
      {/* Header */}
      <div className="flex items-start gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0 mt-0.5">
          <Icon name="star" size={13} className="text-indigo-500" />
        </div>
        <div className="flex-1 min-w-0">
          {firstName ? (
            <h3 className="text-sm font-semibold text-shark-900 dark:text-shark-100 leading-tight">
              {greeting},{" "}
              <span className="text-action-600 dark:text-action-400">{firstName}</span>
            </h3>
          ) : (
            <>
              <h3 className="text-sm font-semibold text-shark-900 dark:text-shark-100">AI Briefing</h3>
              <p className="text-xs text-shark-400">{displayDate}</p>
            </>
          )}
        </div>
        {/* Actions row */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleCopy}
            title={copied ? "Copied!" : "Copy briefing"}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-shark-400 hover:text-shark-700 hover:bg-shark-50 dark:hover:bg-shark-800 transition-colors"
          >
            <Icon name={copied ? "check" : "copy"} size={13} className={copied ? "text-green-500" : ""} />
          </button>
          <button
            onClick={handleRefresh}
            disabled={isPending}
            title="Regenerate briefing"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-shark-400 hover:text-shark-700 hover:bg-shark-50 dark:hover:bg-shark-800 transition-colors disabled:opacity-40"
          >
            <Icon
              name="refresh-cw"
              size={13}
              className={isPending ? "animate-spin text-action-500" : ""}
            />
          </button>
          <span className="text-[10px] font-medium bg-action-50 text-action-600 px-1.5 py-0.5 rounded-full ml-1">
            AI
          </span>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-0.5 mb-3 bg-shark-50 dark:bg-shark-800/60 rounded-lg p-0.5 w-fit">
        {MODES.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => handleMode(id)}
            disabled={isPending}
            className={cn(
              "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors",
              mode === id
                ? "bg-white dark:bg-shark-800 text-shark-900 dark:text-shark-100 shadow-sm"
                : "text-shark-500 hover:text-shark-700 dark:text-shark-400 disabled:opacity-50"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content — fade while loading */}
      <div className={cn("transition-opacity duration-200", isPending ? "opacity-40" : "opacity-100")}>
        {/* Briefing text */}
        <p className="text-[13px] leading-relaxed text-shark-700 dark:text-shark-300 mb-3">
          {content.text}
        </p>

        {/* Week ahead */}
        {content.weekAhead && (
          <div className="flex gap-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg px-3 py-2 mb-3">
            <Icon name="calendar" size={13} className="text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-[12px] text-indigo-700 dark:text-indigo-300 leading-snug">
              {content.weekAhead}
            </p>
          </div>
        )}

        {/* Staff insight */}
        {content.staffInsight && (
          <div className="flex gap-2 bg-shark-50 dark:bg-shark-800/50 rounded-lg px-3 py-2 mb-3">
            <Icon name="users" size={13} className="text-shark-400 shrink-0 mt-0.5" />
            <p className="text-[12px] text-shark-600 dark:text-shark-400 leading-snug">
              {content.staffInsight}
            </p>
          </div>
        )}

        {/* Recommended actions */}
        {content.actions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {content.actions.map((action) => (
              <Link
                key={action.href + action.label}
                href={action.href}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-shark-800 dark:bg-shark-700 text-white px-2.5 py-1.5 rounded-lg hover:bg-shark-700 dark:hover:bg-shark-600 transition-colors"
              >
                <Icon name={ACTION_ICON[action.href] ?? "arrow-right"} size={11} />
                {action.label}
              </Link>
            ))}
          </div>
        )}

        {/* Focus chips */}
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {chips.map((chip) =>
              chip.href ? (
                <Link
                  key={chip.label}
                  href={chip.href}
                  className={cn(
                    "inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full transition-opacity hover:opacity-70",
                    chip.colorClass
                  )}
                >
                  {chip.label}
                </Link>
              ) : (
                <span
                  key={chip.label}
                  className={cn(
                    "inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full",
                    chip.colorClass
                  )}
                >
                  {chip.label}
                </span>
              )
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="text-[10px] text-shark-400 border-t border-shark-100 dark:border-shark-700 pt-2 mt-1">
        Generated by AI · {isPending ? "Refreshing…" : "Refreshes every 30 min"}
      </p>
      </div>
    </div>
  );
}
