"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/ui/icon";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { approveReplenishment, type ReplenishmentSuggestion } from "@/app/actions/predictions";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";

interface Props {
  suggestions: ReplenishmentSuggestion[];
}

function fmtCost(n: number) {
  return n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
}

// Group suggestions by their shopUrl (or "no-link" if none)
function groupByShop(suggestions: ReplenishmentSuggestion[]) {
  const groups = new Map<string, { shopUrl: string | null; items: ReplenishmentSuggestion[] }>();

  for (const s of suggestions) {
    const key = s.shopUrl || "__no_link__";
    if (!groups.has(key)) {
      groups.set(key, { shopUrl: s.shopUrl || null, items: [] });
    }
    groups.get(key)!.items.push(s);
  }

  // Sort: shops with links first, then by item count desc
  return [...groups.values()].sort((a, b) => {
    if (a.shopUrl && !b.shopUrl) return -1;
    if (!a.shopUrl && b.shopUrl) return 1;
    return b.items.length - a.items.length;
  });
}

function buildShoppingList(items: ReplenishmentSuggestion[]) {
  return items
    .map((s) => `• ${s.consumableName} — order ${s.suggestedOrderQty} ${s.unitType} (have ${s.currentStock})`)
    .join("\n");
}

export function ReplenishmentBanner({ suggestions }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [approving, setApproving] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(true);
  const [, startTransition] = useTransition();
  const { addToast } = useToast();
  const router = useRouter();

  const visible = suggestions.filter((s) => !dismissed.has(s.consumableId));

  // "All clear" state
  if (visible.length === 0) {
    return (
      <Card className="border-green-100 bg-green-50/50">
        <CardContent className="py-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
              <Icon name="check" size={14} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-800">Stock levels look good</p>
              <p className="text-xs text-green-600">No items need reordering right now</p>
            </div>
            <span className="ml-auto text-[10px] font-medium bg-action-50 text-action-600 px-1.5 py-0.5 rounded-full">AI</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleApprove = async (suggestion: ReplenishmentSuggestion) => {
    setApproving(suggestion.consumableId);
    try {
      const result = await approveReplenishment(suggestion.consumableId, suggestion.suggestedOrderQty);
      if (result.success) {
        addToast(`PO created for ${result.itemName}`, "success");
        setDismissed((prev) => new Set(prev).add(suggestion.consumableId));
        startTransition(() => { router.refresh(); });
      }
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed to create PO", "error");
    } finally {
      setApproving(null);
    }
  };

  const handleApproveAll = async (items: ReplenishmentSuggestion[]) => {
    for (const s of items) {
      if (dismissed.has(s.consumableId)) continue;
      await handleApprove(s);
    }
  };

  const handleCopyList = (items: ReplenishmentSuggestion[], key: string) => {
    const list = buildShoppingList(items);
    navigator.clipboard.writeText(list).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  const criticalCount = visible.filter((s) => s.riskLevel === "critical").length;
  const warningCount = visible.filter((s) => s.riskLevel === "warning").length;
  const shopGroups = groupByShop(visible);
  const grandEstimatedCost = visible.reduce((s, r) => s + (r.estimatedCost || 0), 0);

  return (
    <Card className="border-[#E8532E]/20">
      <CardContent className="py-4 space-y-3">

        {/* Header — clickable to collapse/expand */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="w-full flex items-center gap-2 text-left"
        >
          <div className="w-7 h-7 rounded-lg bg-[#E8532E]/10 flex items-center justify-center shrink-0">
            <Icon name="bar-chart" size={14} className="text-[#E8532E]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-shark-900">Smart Replenishment</h3>
            <p className="text-xs text-shark-400">
              {criticalCount > 0 && <span className="text-red-500 font-medium">{criticalCount} critical</span>}
              {criticalCount > 0 && warningCount > 0 && " · "}
              {warningCount > 0 && <span className="text-amber-500 font-medium">{warningCount} warning</span>}
              {criticalCount === 0 && warningCount === 0 && <span>{visible.length} items</span>}
              {" "}— grouped by supplier to save on postage
            </p>
          </div>
          {grandEstimatedCost > 0 && (
            <div className="text-right shrink-0 mr-2">
              <p className="text-sm font-bold text-shark-900">{fmtCost(grandEstimatedCost)}</p>
              <p className="text-[10px] text-shark-400">est. total</p>
            </div>
          )}
          <span className="text-[10px] font-medium bg-action-50 text-action-600 px-1.5 py-0.5 rounded-full shrink-0">AI</span>
          <Icon
            name="chevron-down"
            size={14}
            className={`text-shark-400 transition-transform shrink-0 ml-1 ${collapsed ? "-rotate-90" : ""}`}
          />
        </button>

        {/* Groups by shop — collapsible */}
        {!collapsed && <div className="space-y-3">
          {shopGroups.map((group) => {
            const groupKey = group.shopUrl || "__no_link__";
            const groupVisible = group.items.filter((s) => !dismissed.has(s.consumableId));
            if (groupVisible.length === 0) return null;

            const groupCritical = groupVisible.filter((s) => s.riskLevel === "critical").length;
            const groupCost = groupVisible.reduce((s, r) => s + (r.estimatedCost || 0), 0);
            const hostname = group.shopUrl ? (() => { try { return new URL(group.shopUrl).hostname.replace("www.", ""); } catch { return group.shopUrl; } })() : null;

            return (
              <div key={groupKey} className="bg-white rounded-xl border border-shark-100 overflow-hidden">
                {/* Shop header */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-shark-50 bg-shark-50/50">
                  <Icon name="truck" size={13} className="text-shark-400 shrink-0" />
                  <span className="text-xs font-semibold text-shark-700 flex-1 truncate">
                    {hostname || "No shop link set"}
                  </span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${groupCritical > 0 ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600"}`}>
                    {groupVisible.length} item{groupVisible.length !== 1 ? "s" : ""}
                  </span>
                  {groupCost > 0 && (
                    <span className="text-[10px] font-semibold text-shark-600 bg-shark-50 px-1.5 py-0.5 rounded-full shrink-0">
                      {fmtCost(groupCost)}
                    </span>
                  )}
                  {/* Actions for this group */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleCopyList(groupVisible, groupKey)}
                      className="inline-flex items-center gap-1 text-[10px] font-medium text-shark-500 hover:text-shark-700 bg-shark-100 hover:bg-shark-200 px-1.5 py-1.5 rounded-lg transition-colors"
                      title="Copy shopping list to clipboard"
                    >
                      <Icon name={copiedKey === groupKey ? "check" : "copy"} size={10} />
                      {copiedKey === groupKey ? "Copied!" : "Copy list"}
                    </button>
                    {group.shopUrl && (
                      <a
                        href={group.shopUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-action-600 bg-action-50 hover:bg-action-100 px-1.5 py-1.5 rounded-lg transition-colors"
                        title="Open shop in new tab"
                      >
                        <Icon name="arrow-right" size={10} />
                        Open shop
                      </a>
                    )}
                  </div>
                </div>

                {/* Items in this group */}
                <div className="divide-y divide-shark-50">
                  {groupVisible.map((s) => (
                    <div key={s.consumableId} className="flex items-center gap-2 px-3 py-2">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.riskLevel === "critical" ? "bg-red-500" : "bg-amber-400"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-shark-800 truncate">{s.consumableName}</p>
                        <p className="text-xs text-shark-400">
                          {s.regionName} · {s.currentStock} in stock
                          {s.daysRemaining !== null && (
                            <span className={`ml-1 font-medium ${s.riskLevel === "critical" ? "text-red-500" : "text-amber-500"}`}>
                              · {s.daysRemaining === 0 ? "Depleted" : `~${s.daysRemaining}d left`}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="text-right shrink-0 mr-1">
                        <p className="text-sm font-bold text-shark-900">{s.suggestedOrderQty} <span className="text-xs font-normal text-shark-400">{s.unitType}</span></p>
                        {s.estimatedCost ? (
                          <p className="text-[10px] font-semibold text-action-600">~{fmtCost(s.estimatedCost)}</p>
                        ) : (
                          <p className="text-[10px] text-shark-400">{s.reason}</p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(s)}
                          disabled={approving === s.consumableId}
                          className="h-8 px-2 text-xs"
                        >
                          {approving === s.consumableId ? (
                            <Icon name="clock" size={11} className="animate-spin" />
                          ) : (
                            <>
                              <Icon name="check" size={11} className="mr-1" />
                              PO
                            </>
                          )}
                        </Button>
                        <button
                          onClick={() => setDismissed((prev) => new Set(prev).add(s.consumableId))}
                          className="h-8 w-8 flex items-center justify-center rounded-lg text-shark-300 hover:text-shark-500 hover:bg-shark-100 transition-colors"
                          title="Dismiss"
                        >
                          <Icon name="x" size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Group footer: "Create PO for all" */}
                {groupVisible.length > 1 && (
                  <div className="px-3 py-2 border-t border-shark-50 bg-shark-50/30 flex items-center justify-between">
                    <p className="text-[11px] text-shark-400">
                      Order all {groupVisible.length} items from this supplier to save on postage
                      {groupCost > 0 && <span className="ml-1 font-semibold text-shark-600">· Est. {fmtCost(groupCost)}</span>}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApproveAll(groupVisible)}
                      disabled={!!approving}
                      className="px-2 text-[10px]"
                    >
                      <Icon name="check" size={10} className="mr-1" />
                      Create all POs
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>}
      </CardContent>
    </Card>
  );
}
