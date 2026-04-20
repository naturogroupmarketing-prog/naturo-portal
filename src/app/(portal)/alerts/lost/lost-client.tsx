"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

interface LostItem {
  id: string;
  name: string;
  assetCode: string;
  category: string;
  isHighValue: boolean;
  purchaseCost: number | null;
  region: { id: string; name: string; stateName: string };
  lastAssignedTo: string | null;
  report: { description: string; reportedBy: string; date: string; isResolved: boolean } | null;
}

export function LostItemsClient({ items, focusRegionId }: { items: LostItem[]; focusRegionId?: string }) {
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set(
    focusRegionId
      ? [focusRegionId]
      : [...new Set(items.map((i) => i.region.id))]
  ));

  const toggleRegion = (id: string) => {
    setExpandedRegions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const byRegion = new Map<string, { name: string; stateName: string; regionId: string; items: LostItem[] }>();
  for (const item of items) {
    const key = item.region.id;
    if (!byRegion.has(key)) byRegion.set(key, { name: item.region.name, stateName: item.region.stateName, regionId: key, items: [] });
    byRegion.get(key)!.items.push(item);
  }

  const totalCost = items.reduce((sum, i) => sum + (i.purchaseCost || 0), 0);

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-shark-400 hover:text-action-500 transition-colors">
          <Icon name="arrow-left" size={18} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-shark-900 dark:text-shark-100 tracking-tight">Lost Items</h1>
          <p className="text-sm text-shark-400 mt-0.5">
            {items.length} lost asset{items.length !== 1 ? "s" : ""}
            {totalCost > 0 && <span> · Est. value: ${totalCost.toLocaleString()}</span>}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-action-100 flex items-center justify-center mx-auto mb-4">
              <Icon name="check" size={24} className="text-action-600" />
            </div>
            <p className="text-lg font-semibold text-shark-900 dark:text-shark-100">No Lost Items</p>
            <p className="text-sm text-shark-400 mt-1">All assets are accounted for.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {[...byRegion.values()].map((group) => {
            const isExpanded = expandedRegions.has(group.regionId);
            const groupCost = group.items.reduce((sum, i) => sum + (i.purchaseCost || 0), 0);
            return (
              <Card key={group.regionId} className="overflow-hidden">
                <button
                  onClick={() => toggleRegion(group.regionId)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-shark-50 dark:hover:bg-shark-800/50 dark:hover:bg-shark-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-shark-700 flex items-center justify-center">
                      <Icon name="shield" size={16} className="text-white" />
                    </div>
                    <div className="text-left">
                      <span className="font-semibold text-shark-900 dark:text-shark-100">{group.name}</span>
                      <span className="ml-2 text-xs text-shark-400">{group.stateName}</span>
                    </div>
                    <span className="ml-2 text-xs font-semibold text-shark-600 dark:text-shark-400 bg-shark-100 dark:bg-shark-700 px-2 py-0.5 rounded-full">
                      {group.items.length} item{group.items.length !== 1 ? "s" : ""}
                      {groupCost > 0 && ` · $${groupCost.toLocaleString()}`}
                    </span>
                  </div>
                  <Icon name="chevron-down" size={16} className={`text-shark-400 transition-transform ${isExpanded ? "" : "-rotate-90"}`} />
                </button>

                {isExpanded && (
                  <div className="border-t border-shark-100 dark:border-shark-700 divide-y divide-shark-50 dark:divide-shark-800">
                    {group.items.map((item) => (
                      <div key={item.id} className="px-5 py-4 hover:bg-shark-50 dark:hover:bg-shark-800/30 dark:hover:bg-shark-800/30">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-shark-800 dark:text-shark-200">{item.name}</p>
                              <span className="text-xs font-mono text-shark-400">{item.assetCode}</span>
                              {item.isHighValue && <span className="text-xs text-[#E8532E] font-medium">High Value</span>}
                            </div>
                            <p className="text-xs text-shark-400 mt-0.5">{item.category}</p>
                            {item.report && (
                              <p className="text-sm text-shark-600 dark:text-shark-400 mt-2">{item.report.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-shark-400 flex-wrap">
                              {item.lastAssignedTo && <span>Last assigned to: {item.lastAssignedTo}</span>}
                              {item.report && (
                                <>
                                  <span>&middot;</span>
                                  <span>Reported by {item.report.reportedBy}</span>
                                  <span>&middot;</span>
                                  <span>{new Date(item.report.date).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}</span>
                                </>
                              )}
                            </div>
                          </div>
                          {item.purchaseCost && (
                            <p className="text-sm font-bold text-shark-700 shrink-0">${item.purchaseCost.toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
