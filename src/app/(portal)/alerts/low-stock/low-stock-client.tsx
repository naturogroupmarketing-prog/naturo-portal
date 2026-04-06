"use client";

import { useState } from "react";
import Link from "next/link";
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

export function LowStockClient({ items }: { items: LowStockItem[] }) {
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set(
    // Auto-expand all regions
    [...new Set(items.map((i) => i.region.id))]
  ));

  const toggleRegion = (id: string) => {
    setExpandedRegions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Group by region
  const byRegion = new Map<string, { name: string; stateName: string; regionId: string; items: LowStockItem[] }>();
  for (const item of items) {
    const key = item.region.id;
    if (!byRegion.has(key)) byRegion.set(key, { name: item.region.name, stateName: item.region.state.name, regionId: key, items: [] });
    byRegion.get(key)!.items.push(item);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-shark-400 hover:text-action-500 transition-colors">
          <Icon name="arrow-left" size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-shark-900">Low Stock Items</h1>
          <p className="text-sm text-shark-400 mt-0.5">{items.length} item{items.length !== 1 ? "s" : ""} at or below threshold</p>
        </div>
      </div>

      {items.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Icon name="check" size={24} className="text-emerald-600" />
            </div>
            <p className="text-lg font-semibold text-shark-900">All stock levels OK</p>
            <p className="text-sm text-shark-400 mt-1">No consumables are below their minimum threshold.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {[...byRegion.values()].map((group) => {
            const isExpanded = expandedRegions.has(group.regionId);
            return (
              <Card key={group.regionId} className="overflow-hidden">
                <button
                  onClick={() => toggleRegion(group.regionId)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-shark-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                      <Icon name="alert-triangle" size={16} className="text-amber-600" />
                    </div>
                    <div className="text-left">
                      <span className="font-semibold text-shark-900">{group.name}</span>
                      <span className="ml-2 text-xs text-shark-400">{group.stateName}</span>
                    </div>
                    <span className="ml-2 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      {group.items.length} item{group.items.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <Icon name="chevron-down" size={16} className={`text-shark-400 transition-transform ${isExpanded ? "" : "-rotate-90"}`} />
                </button>

                {isExpanded && (
                  <div className="border-t border-shark-100">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-shark-50/50">
                          <th className="px-5 py-2.5 text-left text-xs font-semibold text-shark-400">Item</th>
                          <th className="px-5 py-2.5 text-right text-xs font-semibold text-shark-400">Stock</th>
                          <th className="px-5 py-2.5 text-right text-xs font-semibold text-shark-400 hidden sm:table-cell">Threshold</th>
                          <th className="px-5 py-2.5 text-right text-xs font-semibold text-shark-400 hidden md:table-cell">Reorder Level</th>
                          <th className="px-5 py-2.5 text-right text-xs font-semibold text-shark-400 hidden lg:table-cell">Supplier</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.items.map((item) => {
                          const isOut = item.quantityOnHand === 0;
                          const isCritical = item.quantityOnHand <= Math.floor(item.minimumThreshold / 2);
                          return (
                            <tr key={item.id} className="border-t border-shark-50 hover:bg-shark-50/30">
                              <td className="px-5 py-3">
                                <p className="text-sm font-medium text-shark-800">{item.name}</p>
                                <p className="text-xs text-shark-400">{item.category} · {item.unitType}</p>
                              </td>
                              <td className="px-5 py-3 text-right">
                                <span className={`text-sm font-bold ${isOut ? "text-red-600" : isCritical ? "text-[#E8532E]" : "text-amber-600"}`}>
                                  {item.quantityOnHand}
                                </span>
                                {isOut && <span className="ml-1.5 text-[10px] font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">OUT</span>}
                                {isCritical && !isOut && <span className="ml-1.5 text-[10px] font-semibold text-[#E8532E] bg-red-50 px-1.5 py-0.5 rounded">CRITICAL</span>}
                              </td>
                              <td className="px-5 py-3 text-right text-sm text-shark-500 hidden sm:table-cell">{item.minimumThreshold}</td>
                              <td className="px-5 py-3 text-right text-sm text-shark-500 hidden md:table-cell">{item.reorderLevel}</td>
                              <td className="px-5 py-3 text-right text-sm text-shark-500 hidden lg:table-cell">{item.supplier || "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
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
