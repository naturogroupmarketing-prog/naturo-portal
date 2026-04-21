"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

interface LowStockItem {
  id: string;
  name: string;
  category: string;
  unitType: string;
  quantityOnHand: number;
  minimumThreshold: number;
  reorderLevel: number;
  supplier: string | null;
  region: { id: string; name: string; state: { name: string } };
}

interface Props {
  items: LowStockItem[];
  focusRegionId?: string;
}

export function LowStockClient({ items, focusRegionId }: Props) {
  const [search, setSearch] = useState("");
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(
    new Set(
      focusRegionId
        ? [focusRegionId]
        : [...new Set(items.map((i) => i.region.id))]
    )
  );

  const toggleRegion = (id: string) => {
    setExpandedRegions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filter items by search query
  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        (i.supplier ?? "").toLowerCase().includes(q) ||
        i.region.name.toLowerCase().includes(q)
    );
  }, [items, search]);

  // Group filtered items by region
  const byRegion = useMemo(() => {
    const map = new Map<
      string,
      { name: string; stateName: string; regionId: string; items: LowStockItem[] }
    >();
    for (const item of filteredItems) {
      const key = item.region.id;
      if (!map.has(key))
        map.set(key, {
          name: item.region.name,
          stateName: item.region.state.name,
          regionId: key,
          items: [],
        });
      map.get(key)!.items.push(item);
    }
    return [...map.values()];
  }, [filteredItems]);

  const outCount = items.filter((i) => i.quantityOnHand === 0).length;
  const criticalCount = items.filter(
    (i) => i.quantityOnHand > 0 && i.quantityOnHand <= Math.floor(i.minimumThreshold / 2)
  ).length;

  return (
    <div className="space-y-4">
      <Card padding="none">
        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 px-4 sm:px-5 py-4 border-b border-shark-100 dark:border-shark-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center shrink-0">
              <Icon name="alert-triangle" size={16} className="text-[#E8532E]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-semibold text-shark-900 dark:text-shark-100 leading-tight">
                Low Stock Alerts
              </h1>
              <p className="text-xs text-shark-400 mt-0.5">
                {items.length} item{items.length !== 1 ? "s" : ""} at or below minimum threshold
              </p>
            </div>
          </div>

          {/* Summary pills */}
          {items.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              {outCount > 0 && (
                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 px-2.5 py-1 rounded-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                  {outCount} out of stock
                </span>
              )}
              {criticalCount > 0 && (
                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-[#E8532E] bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 px-2.5 py-1 rounded-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E8532E] inline-block" />
                  {criticalCount} critical
                </span>
              )}
              <span className="inline-flex items-center text-xs font-semibold text-shark-500 dark:text-shark-400 bg-shark-50 dark:bg-shark-800 border border-shark-100 dark:border-shark-700 px-2.5 py-1 rounded-lg">
                {items.length} total
              </span>
            </div>
          )}
        </div>

        {/* ── Search bar ──────────────────────────────────────────────────── */}
        {items.length > 0 && (
          <div className="px-4 sm:px-5 py-3 border-b border-shark-100 dark:border-shark-800">
            <div className="flex items-center gap-2 bg-shark-50 dark:bg-shark-800 rounded-lg px-3 py-2">
              <Icon name="search" size={13} className="text-shark-400 shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, category, region…"
                className="flex-1 bg-transparent text-sm text-shark-800 dark:text-shark-100 placeholder-shark-400 outline-none"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="text-shark-400 hover:text-shark-600 dark:hover:text-shark-200 transition-colors"
                >
                  <Icon name="x" size={13} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Content ─────────────────────────────────────────────────────── */}
        {items.length === 0 ? (
          /* All clear empty state */
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-action-50 dark:bg-action-950/30 flex items-center justify-center mx-auto mb-4">
              <Icon name="check" size={24} className="text-action-500" />
            </div>
            <p className="text-base font-semibold text-shark-900 dark:text-shark-100">
              All stock levels OK
            </p>
            <p className="text-sm text-shark-400 mt-1">
              No supplies are below their minimum threshold.
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          /* No search results */
          <div className="py-12 text-center">
            <p className="text-sm text-shark-500 dark:text-shark-400">
              No items match &ldquo;{search}&rdquo;
            </p>
            <button
              onClick={() => setSearch("")}
              className="mt-2 text-xs text-action-500 hover:underline"
            >
              Clear search
            </button>
          </div>
        ) : (
          /* Region groups */
          <div className="divide-y divide-shark-100 dark:divide-shark-800">
            {byRegion.map((group) => {
              const isExpanded = expandedRegions.has(group.regionId);
              const groupOutCount = group.items.filter((i) => i.quantityOnHand === 0).length;

              return (
                <div key={group.regionId}>
                  {/* Region row */}
                  <button
                    onClick={() => toggleRegion(group.regionId)}
                    className="w-full flex items-center justify-between px-4 sm:px-5 py-3.5 hover:bg-shark-50 dark:hover:bg-shark-800/40 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center shrink-0">
                        <Icon name="map-pin" size={14} className="text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-shark-900 dark:text-shark-100">
                          {group.name}
                        </span>
                        <span className="ml-2 text-xs text-shark-400">{group.stateName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-[#E8532E] bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-full">
                          {group.items.length} item{group.items.length !== 1 ? "s" : ""}
                        </span>
                        {groupOutCount > 0 && (
                          <span className="text-xs font-semibold text-red-600 bg-red-100 dark:bg-red-950/50 px-2 py-0.5 rounded-full">
                            {groupOutCount} out
                          </span>
                        )}
                      </div>
                    </div>
                    <Icon
                      name="chevron-down"
                      size={15}
                      className={`text-shark-400 transition-transform shrink-0 ${isExpanded ? "" : "-rotate-90"}`}
                    />
                  </button>

                  {/* Items */}
                  {isExpanded && (
                    <div className="border-t border-shark-100 dark:border-shark-800">
                      {/* Mobile: card layout */}
                      <div className="sm:hidden divide-y divide-shark-50 dark:divide-shark-800/60">
                        {group.items.map((item) => {
                          const isOut = item.quantityOnHand === 0;
                          const isCritical =
                            !isOut &&
                            item.quantityOnHand <= Math.floor(item.minimumThreshold / 2);
                          return (
                            <div
                              key={item.id}
                              className="px-4 py-3 flex items-center justify-between gap-3"
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-shark-800 dark:text-shark-200 truncate">
                                  {item.name}
                                </p>
                                <p className="text-xs text-shark-400">
                                  {item.category} · {item.unitType}
                                </p>
                              </div>
                              <div className="shrink-0 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <span
                                    className={`text-sm font-bold ${isOut ? "text-red-600" : "text-[#E8532E]"}`}
                                  >
                                    {item.quantityOnHand}
                                  </span>
                                  {isOut && (
                                    <span className="text-[10px] font-semibold text-red-600 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded">
                                      OUT
                                    </span>
                                  )}
                                  {isCritical && (
                                    <span className="text-[10px] font-semibold text-[#E8532E] bg-orange-50 dark:bg-orange-950/20 px-1.5 py-0.5 rounded">
                                      CRITICAL
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-shark-400 mt-0.5">
                                  Min: {item.minimumThreshold}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Desktop: table layout */}
                      <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-shark-50 dark:border-shark-800 text-left text-xs font-medium text-shark-400 uppercase tracking-wider bg-shark-50/50 dark:bg-shark-800/30">
                              <th scope="col" className="px-5 py-2.5">Item</th>
                              <th scope="col" className="px-5 py-2.5 text-right">On Hand</th>
                              <th scope="col" className="px-5 py-2.5 text-right">Min Threshold</th>
                              <th scope="col" className="px-5 py-2.5 text-right hidden md:table-cell">Reorder Level</th>
                              <th scope="col" className="px-5 py-2.5 text-right hidden lg:table-cell">Supplier</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-shark-50 dark:divide-shark-800/60">
                            {group.items.map((item) => {
                              const isOut = item.quantityOnHand === 0;
                              const isCritical =
                                !isOut &&
                                item.quantityOnHand <= Math.floor(item.minimumThreshold / 2);
                              return (
                                <tr
                                  key={item.id}
                                  className="hover:bg-shark-50/70 dark:hover:bg-shark-800/30 transition-colors"
                                >
                                  <td className="px-5 py-3">
                                    <p className="font-medium text-shark-800 dark:text-shark-200">
                                      {item.name}
                                    </p>
                                    <p className="text-xs text-shark-400 mt-0.5">
                                      {item.category} · {item.unitType}
                                    </p>
                                  </td>
                                  <td className="px-5 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <span
                                        className={`font-bold ${isOut ? "text-red-600" : "text-[#E8532E]"}`}
                                      >
                                        {item.quantityOnHand}
                                      </span>
                                      {isOut && (
                                        <span className="text-[10px] font-semibold text-red-600 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded">
                                          OUT
                                        </span>
                                      )}
                                      {isCritical && (
                                        <span className="text-[10px] font-semibold text-[#E8532E] bg-orange-50 dark:bg-orange-950/20 px-1.5 py-0.5 rounded">
                                          CRITICAL
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-5 py-3 text-right text-shark-500 dark:text-shark-400">
                                    {item.minimumThreshold}
                                  </td>
                                  <td className="px-5 py-3 text-right text-shark-500 dark:text-shark-400 hidden md:table-cell">
                                    {item.reorderLevel}
                                  </td>
                                  <td className="px-5 py-3 text-right text-shark-500 dark:text-shark-400 hidden lg:table-cell">
                                    {item.supplier || "—"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
