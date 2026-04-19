"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Card } from "@/components/ui/card";

export interface DepletionForecastItem {
  id: string;
  name: string;
  unitType: string;
  quantityOnHand: number;
  daysRemaining: number;
  riskLevel: "critical" | "warning" | "ok";
  regionName: string;
  predictedDepletionDate: string;
  spiking?: boolean; // usage accelerating vs historical baseline
}

interface Props {
  items: DepletionForecastItem[];
}

const BAND_CONFIG = {
  today: { label: "Runs out today / tomorrow", dot: "bg-red-500 animate-pulse", text: "text-red-600", bg: "bg-red-50 border-red-100" },
  week: { label: "This week (2–7 days)", dot: "bg-amber-400", text: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
  upcoming: { label: "Next 2 weeks (8–14 days)", dot: "bg-blue-400", text: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
};

function daysLabel(d: number) {
  if (d <= 0) return "Depleting now";
  if (d === 1) return "~1 day left";
  return `~${d} days left`;
}

export function AiForecastWidget({ items }: Props) {
  const today = items.filter((i) => i.daysRemaining <= 1);
  const week = items.filter((i) => i.daysRemaining >= 2 && i.daysRemaining <= 7);
  const upcoming = items.filter((i) => i.daysRemaining >= 8);

  const bands: { key: "today" | "week" | "upcoming"; items: DepletionForecastItem[] }[] = [
    { key: "today", items: today },
    { key: "week", items: week },
    { key: "upcoming", items: upcoming },
  ];

  const hasAny = items.length > 0;

  return (
    <Card className="border-action-200">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-action-50 flex items-center justify-center shrink-0">
            <Icon name="bar-chart" size={14} className="text-action-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-shark-900">AI Stock Forecast</h3>
            <p className="text-xs text-shark-400">Next 14 days — based on usage patterns</p>
          </div>
          <span className="text-[10px] font-medium bg-action-50 text-action-600 px-1.5 py-0.5 rounded-full shrink-0">AI</span>
        </div>

        {/* All clear */}
        {!hasAny && (
          <div className="py-6 text-center">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
              <Icon name="check-circle" size={20} className="text-green-600" />
            </div>
            <p className="text-sm font-semibold text-shark-700">All stocked for 2 weeks</p>
            <p className="text-xs text-shark-400 mt-1">No predicted shortfalls — keep it up!</p>
          </div>
        )}

        {/* Bands */}
        {hasAny && (
          <div className="space-y-3">
            {bands.map(({ key, items: bandItems }) => {
              if (bandItems.length === 0) return null;
              const cfg = BAND_CONFIG[key];
              return (
                <div key={key}>
                  {/* Band header */}
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                    <span className={`text-[11px] font-semibold ${cfg.text}`}>{cfg.label}</span>
                  </div>

                  {/* Items */}
                  <div className={`rounded-xl border divide-y divide-shark-50 dark:divide-shark-800 overflow-hidden ${cfg.bg}`}>
                    {bandItems.map((item) => (
                      <Link
                        key={item.id}
                        href="/purchase-orders?action=create"
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/60 transition-colors group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-[13px] font-semibold text-shark-800 truncate">{item.name}</p>
                            {item.spiking && (
                              <span className="text-[9px] font-bold bg-[#E8532E]/10 text-[#E8532E] px-1 py-0.5 rounded shrink-0 uppercase tracking-wide">
                                ↑ spike
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-shark-400 truncate">
                            {item.regionName} · {item.quantityOnHand} {item.unitType} left
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-[11px] font-bold ${cfg.text}`}>{daysLabel(item.daysRemaining)}</p>
                          <p className="text-[10px] text-shark-400">Order now</p>
                        </div>
                        <Icon name="arrow-right" size={12} className="text-shark-300 group-hover:text-action-500 transition-colors shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        {hasAny && (
          <div className="mt-4 pt-3 border-t border-shark-100 dark:border-shark-700 flex items-center justify-between">
            <p className="text-[10px] text-shark-400">{items.length} item{items.length !== 1 ? "s" : ""} tracked · Updated by AI Predict</p>
            <Link href="/purchase-orders" className="text-[11px] font-semibold text-action-600 hover:text-action-700 transition-colors">
              View all POs →
            </Link>
          </div>
        )}
      </div>
    </Card>
  );
}
