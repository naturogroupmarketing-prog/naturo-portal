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

export function ReplenishmentBanner({ suggestions }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [approving, setApproving] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const { addToast } = useToast();
  const router = useRouter();

  const visible = suggestions.filter((s) => !dismissed.has(s.consumableId));

  if (visible.length === 0) return null;

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

  const criticalCount = visible.filter((s) => s.riskLevel === "critical").length;
  const warningCount = visible.filter((s) => s.riskLevel === "warning").length;

  return (
    <Card className="border-[#E8532E]/20 bg-gradient-to-r from-[#E8532E]/5 to-transparent">
      <CardContent className="py-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-[#E8532E]/10 flex items-center justify-center">
            <Icon name="bar-chart" size={14} className="text-[#E8532E]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-shark-900">Smart Replenishment</h3>
            <p className="text-xs text-shark-400">
              {criticalCount > 0 && <span className="text-red-500 font-medium">{criticalCount} critical</span>}
              {criticalCount > 0 && warningCount > 0 && " · "}
              {warningCount > 0 && <span className="text-amber-500 font-medium">{warningCount} warning</span>}
              {" "}— AI-suggested orders based on usage trends
            </p>
          </div>
          <span className="ml-auto text-[10px] font-medium bg-action-50 text-action-600 px-1.5 py-0.5 rounded-full">AI</span>
        </div>

        <div className="space-y-2">
          {visible.slice(0, 5).map((s) => (
            <div key={s.consumableId} className="flex items-center gap-3 bg-white rounded-lg border border-shark-100 px-3 py-2.5">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.riskLevel === "critical" ? "bg-red-500" : "bg-amber-400"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-shark-800 truncate">{s.consumableName}</p>
                <p className="text-xs text-shark-400">
                  {s.regionName} · {s.currentStock} in stock · {s.avgDailyUsage.toFixed(1)}/day
                  {s.daysRemaining !== null && (
                    <span className={`ml-1 font-medium ${s.riskLevel === "critical" ? "text-red-500" : "text-amber-500"}`}>
                      · {s.daysRemaining === 0 ? "Depleted" : `~${s.daysRemaining}d left`}
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right mr-2">
                <p className="text-sm font-bold text-shark-900">{s.suggestedOrderQty} <span className="text-xs font-normal text-shark-400">{s.unitType}</span></p>
                <p className="text-[10px] text-shark-400">{s.reason}</p>
              </div>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  onClick={() => handleApprove(s)}
                  disabled={approving === s.consumableId}
                  className="h-7 px-2.5 text-xs"
                >
                  {approving === s.consumableId ? (
                    <Icon name="clock" size={12} className="animate-spin" />
                  ) : (
                    <>
                      <Icon name="check" size={12} className="mr-1" />
                      Order
                    </>
                  )}
                </Button>
                <button
                  onClick={() => setDismissed((prev) => new Set(prev).add(s.consumableId))}
                  className="h-7 w-7 flex items-center justify-center rounded-md text-shark-400 hover:text-shark-600 hover:bg-shark-100 transition-colors"
                  title="Dismiss"
                >
                  <Icon name="x" size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {visible.length > 5 && (
          <p className="text-xs text-shark-400 mt-2 text-center">
            +{visible.length - 5} more suggestions
          </p>
        )}
      </CardContent>
    </Card>
  );
}
