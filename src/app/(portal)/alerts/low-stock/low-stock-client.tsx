"use client";

import { useState, useMemo, useRef, useEffect } from "react";
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

interface Region {
  id: string;
  name: string;
  state: { name: string };
}

interface Props {
  items: LowStockItem[];
  regions: Region[];
  focusRegionId?: string;
  isSuperAdmin: boolean;
}

const ALL = "all";

export function LowStockClient({ items, regions, focusRegionId, isSuperAdmin }: Props) {
  // ── Region selector ──────────────────────────────────────────────────────
  const [selectedRegionId, setSelectedRegionId] = useState<string>(
    focusRegionId ?? (isSuperAdmin ? ALL : (regions[0]?.id ?? ALL))
  );
  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false);
  const [regionSearch, setRegionSearch] = useState("");
  const regionDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!regionDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (regionDropdownRef.current && !regionDropdownRef.current.contains(e.target as Node)) {
        setRegionDropdownOpen(false);
        setRegionSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [regionDropdownOpen]);

  // ── Search ───────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");

  // ── Region expand/collapse ───────────────────────────────────────────────
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(
    new Set(items.map((i) => i.region.id))
  );

  const toggleRegion = (id: string) => {
    setExpandedRegions((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Derived data ─────────────────────────────────────────────────────────

  // Items scoped to the selected region (or all)
  const regionItems = useMemo(
    () =>
      selectedRegionId === ALL
        ? items
        : items.filter((i) => i.region.id === selectedRegionId),
    [items, selectedRegionId]
  );

  // Apply text search on top of region filter
  const filteredItems = useMemo(() => {
    if (!search.trim()) return regionItems;
    const q = search.toLowerCase();
    return regionItems.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        (i.supplier ?? "").toLowerCase().includes(q) ||
        i.region.name.toLowerCase().includes(q)
    );
  }, [regionItems, search]);

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

  // Per-region low-stock counts (for dropdown badges)
  const lowStockByRegion = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      map.set(item.region.id, (map.get(item.region.id) ?? 0) + 1);
    }
    return map;
  }, [items]);

  // Summary stats for the selected region scope
  const outCount = regionItems.filter((i) => i.quantityOnHand === 0).length;
  const criticalCount = regionItems.filter(
    (i) => i.quantityOnHand > 0 && i.quantityOnHand <= Math.floor(i.minimumThreshold / 2)
  ).length;

  // Selected region object (or synthetic "All Regions" object)
  const selectedRegion =
    selectedRegionId === ALL
      ? { name: "All Regions", state: { name: `${regions.length} locations` } }
      : (regions.find((r) => r.id === selectedRegionId) ?? regions[0]);

  // Grouped regions for the dropdown list
  const regionsByState = useMemo(() => {
    const q = regionSearch.toLowerCase();
    const filtered = regions.filter(
      (r) =>
        r.name.toLowerCase().includes(q) || r.state.name.toLowerCase().includes(q)
    );
    return filtered.reduce<Record<string, Region[]>>((acc, r) => {
      const s = r.state.name;
      if (!acc[s]) acc[s] = [];
      acc[s].push(r);
      return acc;
    }, {});
  }, [regions, regionSearch]);

  const hasMultipleRegions = regions.length > 1;

  return (
    <div className="space-y-4">
      <Card padding="none">

        {/* ── Region selector ─────────────────────────────────────────────── */}
        <div className="relative" ref={regionDropdownRef}>
          <button
            onClick={() => {
              if (hasMultipleRegions || isSuperAdmin) {
                setRegionDropdownOpen((o) => !o);
                setRegionSearch("");
              }
            }}
            className={`w-full flex items-center gap-3 px-4 sm:px-5 py-4 border-b border-shark-100 dark:border-shark-800 transition-colors text-left ${
              hasMultipleRegions || isSuperAdmin
                ? "hover:bg-shark-50 dark:hover:bg-shark-800/50 cursor-pointer"
                : "cursor-default"
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-action-100 dark:bg-action-900/30 flex items-center justify-center shrink-0">
              <Icon name="map-pin" size={15} className="text-action-600 dark:text-action-400" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-semibold text-shark-900 dark:text-shark-100">
                  {selectedRegion?.name}
                </h2>
                {(hasMultipleRegions || isSuperAdmin) && (
                  <Icon
                    name="chevron-down"
                    size={14}
                    className={`text-shark-400 transition-transform shrink-0 ${regionDropdownOpen ? "rotate-180" : ""}`}
                  />
                )}
              </div>
              <p className="text-xs text-shark-400">
                {selectedRegion?.state.name}
                {(hasMultipleRegions || isSuperAdmin) && " · tap to switch region"}
              </p>
            </div>

            {/* Low-stock count badge */}
            {regionItems.length > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-[#E8532E] bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 px-2.5 py-1.5 rounded-lg shrink-0">
                <Icon name="alert-triangle" size={12} />
                {regionItems.length} low stock
              </span>
            )}
          </button>

          {/* ── Dropdown ──────────────────────────────────────────────────── */}
          {regionDropdownOpen && (hasMultipleRegions || isSuperAdmin) && (
            <div className="absolute left-0 right-0 top-full z-50 bg-white dark:bg-shark-900 border border-shark-100 dark:border-shark-700 shadow-xl rounded-b-xl overflow-hidden">
              {/* Search */}
              <div className="px-3 py-2.5 border-b border-shark-100 dark:border-shark-700">
                <div className="flex items-center gap-2 bg-shark-50 dark:bg-shark-800 rounded-lg px-3 py-1.5">
                  <Icon name="search" size={13} className="text-shark-400 shrink-0" />
                  <input
                    autoFocus
                    value={regionSearch}
                    onChange={(e) => setRegionSearch(e.target.value)}
                    placeholder="Search regions…"
                    className="flex-1 bg-transparent text-sm text-shark-800 dark:text-shark-100 placeholder-shark-400 outline-none"
                  />
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto">
                {/* All Regions option (Super Admin only) */}
                {isSuperAdmin && !regionSearch && (
                  <button
                    onClick={() => { setSelectedRegionId(ALL); setRegionDropdownOpen(false); setSearch(""); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-action-50 dark:hover:bg-action-500/10 transition-colors text-left border-b border-shark-50 dark:border-shark-800 ${selectedRegionId === ALL ? "bg-action-50 dark:bg-action-500/10" : ""}`}
                  >
                    <Icon name="map-pin" size={13} className={selectedRegionId === ALL ? "text-action-500" : "text-shark-300"} />
                    <span className={`text-sm flex-1 ${selectedRegionId === ALL ? "font-semibold text-action-600 dark:text-action-400" : "text-shark-700 dark:text-shark-200"}`}>
                      All Regions
                    </span>
                    <span className="text-[10px] text-shark-400">{items.length} items</span>
                    {selectedRegionId === ALL && <Icon name="check" size={12} className="text-action-500 shrink-0" />}
                  </button>
                )}

                {/* Regions grouped by state */}
                {Object.keys(regionsByState).length === 0 ? (
                  <p className="text-sm text-shark-400 text-center py-6">No regions found</p>
                ) : (
                  Object.entries(regionsByState).map(([stateName, stateRegions]) => (
                    <div key={stateName}>
                      <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-shark-400 bg-shark-50/80 dark:bg-shark-800/60 border-b border-shark-50 dark:border-shark-700">
                        {stateName}
                      </p>
                      {stateRegions.map((r) => {
                        const count = lowStockByRegion.get(r.id) ?? 0;
                        const isSelected = r.id === selectedRegionId;
                        return (
                          <button
                            key={r.id}
                            onClick={() => {
                              setSelectedRegionId(r.id);
                              setRegionDropdownOpen(false);
                              setRegionSearch("");
                              setSearch("");
                              // Auto-expand the selected region's group
                              setExpandedRegions((prev) => new Set([...prev, r.id]));
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-action-50 dark:hover:bg-action-500/10 transition-colors text-left ${isSelected ? "bg-action-50 dark:bg-action-500/10" : ""}`}
                          >
                            <Icon
                              name="map-pin"
                              size={13}
                              className={isSelected ? "text-action-500" : "text-shark-300"}
                            />
                            <span className={`text-sm flex-1 ${isSelected ? "font-semibold text-action-600 dark:text-action-400" : "text-shark-700 dark:text-shark-200"}`}>
                              {r.name}
                            </span>
                            {count > 0 && (
                              <span className="text-[10px] font-semibold text-[#E8532E] bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded-full shrink-0">
                                {count}
                              </span>
                            )}
                            {isSelected && <Icon name="check" size={12} className="text-action-500 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

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
                {regionItems.length} item{regionItems.length !== 1 ? "s" : ""} at or below minimum threshold
              </p>
            </div>
          </div>

          {/* Summary pills */}
          {regionItems.length > 0 && (
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
                {regionItems.length} total
              </span>
            </div>
          )}
        </div>

        {/* ── Search bar ──────────────────────────────────────────────────── */}
        {regionItems.length > 0 && (
          <div className="px-4 sm:px-5 py-3 border-b border-shark-100 dark:border-shark-800">
            <div className="flex items-center gap-2 bg-shark-50 dark:bg-shark-800 rounded-lg px-3 py-2">
              <Icon name="search" size={13} className="text-shark-400 shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, category, supplier…"
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
        {regionItems.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-action-50 dark:bg-action-950/30 flex items-center justify-center mx-auto mb-4">
              <Icon name="check" size={24} className="text-action-500" />
            </div>
            <p className="text-base font-semibold text-shark-900 dark:text-shark-100">All stock levels OK</p>
            <p className="text-sm text-shark-400 mt-1">No supplies are below their minimum threshold.</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-shark-500 dark:text-shark-400">
              No items match &ldquo;{search}&rdquo;
            </p>
            <button onClick={() => setSearch("")} className="mt-2 text-xs text-action-500 hover:underline">
              Clear search
            </button>
          </div>
        ) : (
          <div className="divide-y divide-shark-100 dark:divide-shark-800">
            {byRegion.map((group) => {
              const isExpanded = expandedRegions.has(group.regionId);
              const groupOutCount = group.items.filter((i) => i.quantityOnHand === 0).length;

              return (
                <div key={group.regionId}>
                  {/* Region row — only show header when viewing "All Regions" */}
                  {selectedRegionId === ALL && (
                    <button
                      onClick={() => toggleRegion(group.regionId)}
                      className="w-full flex items-center justify-between px-4 sm:px-5 py-3.5 hover:bg-shark-50 dark:hover:bg-shark-800/40 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center shrink-0">
                          <Icon name="map-pin" size={14} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-shark-900 dark:text-shark-100">{group.name}</span>
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
                  )}

                  {/* Items table — always visible when a specific region is selected */}
                  {(selectedRegionId !== ALL || isExpanded) && (
                    <div className={selectedRegionId === ALL ? "border-t border-shark-100 dark:border-shark-800" : ""}>
                      {/* Mobile */}
                      <div className="sm:hidden divide-y divide-shark-50 dark:divide-shark-800/60">
                        {group.items.map((item) => {
                          const isOut = item.quantityOnHand === 0;
                          const isCritical = !isOut && item.quantityOnHand <= Math.floor(item.minimumThreshold / 2);
                          return (
                            <div key={item.id} className="px-4 py-3 flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-shark-800 dark:text-shark-200 truncate">{item.name}</p>
                                <p className="text-xs text-shark-400">{item.category} · {item.unitType}</p>
                              </div>
                              <div className="shrink-0 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <span className={`text-sm font-bold ${isOut ? "text-red-600" : "text-[#E8532E]"}`}>
                                    {item.quantityOnHand}
                                  </span>
                                  {isOut && <span className="text-[10px] font-semibold text-red-600 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded">OUT</span>}
                                  {isCritical && <span className="text-[10px] font-semibold text-[#E8532E] bg-orange-50 dark:bg-orange-950/20 px-1.5 py-0.5 rounded">CRITICAL</span>}
                                </div>
                                <p className="text-[10px] text-shark-400 mt-0.5">Min: {item.minimumThreshold}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Desktop */}
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
                              const isCritical = !isOut && item.quantityOnHand <= Math.floor(item.minimumThreshold / 2);
                              return (
                                <tr key={item.id} className="hover:bg-shark-50/70 dark:hover:bg-shark-800/30 transition-colors">
                                  <td className="px-5 py-3">
                                    <p className="font-medium text-shark-800 dark:text-shark-200">{item.name}</p>
                                    <p className="text-xs text-shark-400 mt-0.5">{item.category} · {item.unitType}</p>
                                  </td>
                                  <td className="px-5 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <span className={`font-bold ${isOut ? "text-red-600" : "text-[#E8532E]"}`}>
                                        {item.quantityOnHand}
                                      </span>
                                      {isOut && <span className="text-[10px] font-semibold text-red-600 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded">OUT</span>}
                                      {isCritical && <span className="text-[10px] font-semibold text-[#E8532E] bg-orange-50 dark:bg-orange-950/20 px-1.5 py-0.5 rounded">CRITICAL</span>}
                                    </div>
                                  </td>
                                  <td className="px-5 py-3 text-right text-shark-500 dark:text-shark-400">{item.minimumThreshold}</td>
                                  <td className="px-5 py-3 text-right text-shark-500 dark:text-shark-400 hidden md:table-cell">{item.reorderLevel}</td>
                                  <td className="px-5 py-3 text-right text-shark-500 dark:text-shark-400 hidden lg:table-cell">{item.supplier || "—"}</td>
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
