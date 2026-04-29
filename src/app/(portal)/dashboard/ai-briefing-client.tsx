"use client";

import { useState, useTransition } from "react";
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

export function AiBriefingClient({ initialContent, displayDate, chips, input }: AiBriefingClientProps) {
  const [mode, setMode] = useState<BriefingMode>("summary");
  const [content, setContent] = useState<BriefingContent>(initialContent);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  // Collapsed by default on mobile; always expanded on lg+
  const [collapsed, setCollapsed] = useState(true);

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
      {/* ── Collapsed row (mobile default, same height as stat cards) ── */}
      <button
        onClick={() => setCollapsed((p) => !p)}
        className="lg:hidden w-full flex items-center gap-3 px-4 py-3 text-left"
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Expand AI Briefing" : "Collapse AI Briefing"}
      >
        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
          <Icon name="star" size={14} className="text-indigo-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-xs font-semibold text-shark-900 dark:text-shark-100">AI Briefing</span>
            <span className="text-[9px] font-semibold bg-action-50 text-action-600 px-1.5 py-0.5 rounded-full">AI</span>
            {isPending && <Icon name="refresh-cw" size={10} className="animate-spin text-action-500" />}
          </div>
          <p className="text-[11px] text-shark-500 dark:text-shark-400 truncate leading-none">
            {content.text}
          </p>
        </div>
        <Icon
          name="chevron-down"
          size={16}
          className={cn("text-shark-400 shrink-0 transition-transform duration-200", !collapsed && "rotate-180")}
        />
      </button>

      {/* ── Expanded content (always visible on lg+, toggled on mobile) ── */}
      <div className={cn("p-5", collapsed ? "hidden lg:block" : "block")}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
          <Icon name="star" size={13} className="text-indigo-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-shark-900 dark:text-shark-100">AI Briefing</h3>
          <p className="text-xs text-shark-400">{displayDate}</p>
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
