"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon, type IconName } from "@/components/ui/icon";
import dynamic from "next/dynamic";
import { DashboardSettingsModal } from "./dashboard-settings-modal";
import { removeCustomShortcut } from "@/app/actions/dashboard";
import type { DashboardPreferences } from "@/lib/dashboard-types";

// Lazy-load recharts components
const AreaChart = dynamic(() => import("recharts").then((m) => m.AreaChart), { ssr: false });
const Area = dynamic(() => import("recharts").then((m) => m.Area), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false });
const RechartsTooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });
const BarChart = dynamic(() => import("recharts").then((m) => m.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then((m) => m.Bar), { ssr: false });

// Lazy-load map — heavy dependency, only needed when locations have coordinates
const LocationMap = dynamic(
  () => import("@/components/ui/location-map").then((m) => m.LocationMap),
  { ssr: false, loading: () => <div className="flex items-center justify-center bg-shark-50 rounded-xl text-shark-400 text-sm" style={{ minHeight: 300 }}>Loading map...</div> }
);

interface StatCard {
  widgetId: string;
  label: string;
  value: number;
  icon: IconName;
  borderColor: string;
  iconBg: string;
  iconColor: string;
  href: string;
}

interface LowStockItem {
  id: string;
  name: string;
  unitType: string;
  quantityOnHand: number;
  minimumThreshold: number;
  region: { name: string };
}

interface QuickLink {
  label: string;
  href: string;
  icon: IconName;
  iconBg: string;
  iconColor: string;
}

interface RegionBreakdownItem {
  regionId: string;
  regionName: string;
  stateName: string;
  damaged: number;
  lost: number;
  pendingRequests: number;
  pendingPOs: number;
  lowStockItems: { id: string; name: string; unitType: string; quantityOnHand: number; minimumThreshold: number }[];
}

const REGION_COLORS = [
  { color: "text-blue-600", bg: "bg-blue-50" },
  { color: "text-emerald-600", bg: "bg-emerald-50" },
  { color: "text-amber-600", bg: "bg-amber-50" },
  { color: "text-cyan-600", bg: "bg-cyan-50" },
  { color: "text-red-600", bg: "bg-red-50" },
  { color: "text-violet-600", bg: "bg-violet-50" },
  { color: "text-pink-600", bg: "bg-pink-50" },
  { color: "text-orange-600", bg: "bg-orange-50" },
];

interface ChartItem {
  name: string;
  value: number;
  color?: string;
}

interface Props {
  stats: StatCard[];
  lowStockItems: LowStockItem[];
  quickLinks: QuickLink[];
  preferences: DashboardPreferences;
  subtitle: string;
  regionBreakdown?: RegionBreakdownItem[];
  assetStatusChart?: ChartItem[];
  categoryChart?: ChartItem[];
  consumableStatusChart?: ChartItem[];
  consumableCategoryChart?: ChartItem[];
  portfolioValue?: { purchase: number; current: number; depreciation: number; consumableValue: number };
  portfolioChartData?: { month: string; assets: number; consumables: number; depreciation: number }[];
  activityChartData?: { month: string; damaged: number; lost: number; staff: number }[];
  upcomingMaintenance?: number;
  isSuperAdmin?: boolean;
  mapLocations?: { id: string; name: string; stateName: string; latitude: number; longitude: number; assetCount: number; consumableCount: number; staffCount: number }[];
}

export function DashboardClient({ stats, lowStockItems, quickLinks, preferences, subtitle, regionBreakdown, assetStatusChart, categoryChart, consumableStatusChart, consumableCategoryChart, portfolioValue, portfolioChartData, activityChartData, upcomingMaintenance, isSuperAdmin, mapLocations = [] }: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [collapsedRegions, setCollapsedRegions] = useState<Set<string>>(new Set());

  const visibleStats = stats.filter((s) => !preferences.hiddenWidgets.includes(s.widgetId));
  const showLowStock = !preferences.hiddenWidgets.includes("low-stock-alerts");
  const showQuickLinks = !preferences.hiddenWidgets.includes("quick-links");
  const showPortfolio = !preferences.hiddenWidgets.includes("portfolio-valuation");

  const handleRemoveShortcut = (id: string) => {
    startTransition(async () => {
      await removeCustomShortcut(id);
    });
  };

  const toggleRegion = (id: string) => {
    setCollapsedRegions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-8">
      {/* Header with settings gear */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-shark-900">Dashboard</h1>
          <p className="text-sm text-shark-400 mt-1">{subtitle}</p>
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          className="p-2 rounded-lg text-shark-400 hover:text-shark-600 hover:bg-shark-50 transition-colors"
          title="Dashboard settings"
        >
          <Icon name="settings" size={20} />
        </button>
      </div>

      {preferences.sectionOrder.map((sectionId) => {
        switch (sectionId) {
          case "stats":
            return visibleStats.length > 0 ? (
              <div key="stats" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleStats.map((s) => (
                  <Link key={s.label} href={s.href} className="block group">
                    <Card className={`border-t-[3px] ${s.borderColor} hover:shadow-md transition-all duration-200 cursor-pointer`}>
                      <CardContent className="py-4 px-5">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl ${s.iconBg} flex items-center justify-center flex-shrink-0`}>
                            <Icon name={s.icon} size={22} className={s.iconColor} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-shark-400">{s.label}</p>
                            <p className="text-2xl font-bold text-shark-900">{s.value.toLocaleString()}</p>
                          </div>
                          <Icon name="arrow-right" size={18} className="text-shark-300 group-hover:text-action-500 transition-colors flex-shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : null;

          case "portfolio":
            return isSuperAdmin && showPortfolio ? (
              <div key="portfolio" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* LEFT — Activity Bar Chart (Damaged, Lost, Staff) like Edaly Attendance */}
                {activityChartData && activityChartData.length > 0 && (
                  <Card>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h2 className="text-lg font-bold text-shark-900">Activity</h2>
                          <p className="text-sm text-shark-400">Recent Activity</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-5 mb-4">
                        <span className="flex items-center gap-1.5 text-xs text-shark-500"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "#1F3DD9" }} /> Damaged</span>
                        <span className="flex items-center gap-1.5 text-xs text-shark-500"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "#E8532E" }} /> Lost</span>
                        <span className="flex items-center gap-1.5 text-xs text-shark-500"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "#10b981" }} /> Staff</span>
                      </div>
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={activityChartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }} barGap={2} barSize={14}>
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7080" }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#8b8f96" }} allowDecimals={false} />
                            <RechartsTooltip
                              content={(props: Record<string, unknown>) => {
                                const active = props.active as boolean;
                                const payload = props.payload as Array<{ value: number; dataKey: string }> | undefined;
                                const label = props.label as string;
                                if (!active || !payload?.length) return null;
                                return (
                                  <div style={{ background: "#1a1c21", borderRadius: 10, padding: "10px 14px", border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
                                    <p style={{ color: "#8b8f96", fontSize: 11, marginBottom: 6, fontWeight: 600 }}>{label}</p>
                                    {payload.map((p) => {
                                      const color = p.dataKey === "damaged" ? "#1F3DD9" : p.dataKey === "lost" ? "#E8532E" : "#10b981";
                                      const name = p.dataKey === "damaged" ? "Damaged" : p.dataKey === "lost" ? "Lost" : "Staff";
                                      return (
                                        <div key={p.dataKey} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                                          <span style={{ color: "#ffffff", fontSize: 13, fontWeight: 500 }}>{Number(p.value)}</span>
                                          <span style={{ color: "#6b7080", fontSize: 11 }}>{name}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              }}
                            />
                            <Bar dataKey="damaged" fill="#1F3DD9" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="lost" fill="#E8532E" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="staff" fill="#10b981" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </Card>
                )}

                {/* RIGHT — Portfolio Line Chart (Assets vs Consumables value) like Edaly Finance */}
                {portfolioValue && (portfolioValue.purchase > 0 || portfolioValue.consumableValue > 0) && (
                  <Card>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h2 className="text-lg font-bold text-shark-900">Finance</h2>
                          <p className="text-sm text-shark-400">Asset &amp; Consumable Value</p>
                        </div>
                      </div>

                      {/* Summary cards */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="border border-shark-100 rounded-xl px-3.5 py-2.5">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="w-2 h-2 rounded-full" style={{ background: "#1F3DD9" }} />
                            <span className="text-xs text-shark-500">Assets</span>
                          </div>
                          <p className="text-xl font-bold text-shark-900">
                            ${portfolioValue.current.toLocaleString("en-AU", { maximumFractionDigits: 0 })}
                          </p>
                          {portfolioValue.depreciation > 0 && (
                            <span className="text-[10px] text-[#E8532E] font-medium">
                              ↓ ${portfolioValue.depreciation.toLocaleString("en-AU", { maximumFractionDigits: 0 })}
                            </span>
                          )}
                        </div>
                        <div className="border border-shark-100 rounded-xl px-3.5 py-2.5">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="w-2 h-2 rounded-full" style={{ background: "#E8532E" }} />
                            <span className="text-xs text-shark-500">Consumables</span>
                          </div>
                          <p className="text-xl font-bold text-shark-900">
                            ${portfolioValue.consumableValue.toLocaleString("en-AU", { maximumFractionDigits: 0 })}
                          </p>
                        </div>
                      </div>

                      {/* Line chart */}
                      {portfolioChartData && portfolioChartData.length > 0 && (
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={portfolioChartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                              <defs>
                                <linearGradient id="gradAssets" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#1F3DD9" stopOpacity={0.12} />
                                  <stop offset="100%" stopColor="#1F3DD9" stopOpacity={0.01} />
                                </linearGradient>
                                <linearGradient id="gradConsumables" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#E8532E" stopOpacity={0.12} />
                                  <stop offset="100%" stopColor="#E8532E" stopOpacity={0.01} />
                                </linearGradient>
                                <linearGradient id="gradDepreciation" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#8b8f96" stopOpacity={0.1} />
                                  <stop offset="100%" stopColor="#8b8f96" stopOpacity={0.01} />
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7080" }} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#8b8f96" }} tickFormatter={(v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`} width={45} />
                              <RechartsTooltip
                                content={(props: Record<string, unknown>) => {
                                  const active = props.active as boolean;
                                  const payload = props.payload as Array<{ value: number; dataKey: string }> | undefined;
                                  const label = props.label as string;
                                  if (!active || !payload?.length) return null;
                                  return (
                                    <div style={{ background: "#1a1c21", borderRadius: 10, padding: "10px 14px", border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
                                      <p style={{ color: "#8b8f96", fontSize: 11, marginBottom: 6, fontWeight: 600 }}>{label}</p>
                                      {payload.map((p) => {
                                        const color = p.dataKey === "assets" ? "#1F3DD9" : p.dataKey === "consumables" ? "#E8532E" : "#8b8f96";
                                        const name = p.dataKey === "assets" ? "Assets" : p.dataKey === "consumables" ? "Consumables" : "Depreciation";
                                        return (
                                          <div key={p.dataKey} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                                            <span style={{ color: "#ffffff", fontSize: 13, fontWeight: 500 }}>
                                              ${Number(p.value).toLocaleString("en-AU", { maximumFractionDigits: 0 })}
                                            </span>
                                            <span style={{ color: "#6b7080", fontSize: 11 }}>{name}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                }}
                              />
                              <Area type="monotone" dataKey="assets" stroke="#1F3DD9" strokeWidth={2} fill="url(#gradAssets)" dot={false} activeDot={{ r: 4, fill: "#1F3DD9", stroke: "#fff", strokeWidth: 2 }} />
                              <Area type="monotone" dataKey="consumables" stroke="#E8532E" strokeWidth={2} fill="url(#gradConsumables)" dot={false} activeDot={{ r: 4, fill: "#E8532E", stroke: "#fff", strokeWidth: 2 }} />
                              <Area type="monotone" dataKey="depreciation" stroke="#8b8f96" strokeWidth={1.5} strokeDasharray="4 3" fill="url(#gradDepreciation)" dot={false} activeDot={{ r: 4, fill: "#8b8f96", stroke: "#fff", strokeWidth: 2 }} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {/* Total */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-shark-100">
                        <span className="text-xs font-medium text-shark-500">Total Portfolio</span>
                        <span className="text-lg font-bold text-shark-900">
                          ${(portfolioValue.current + portfolioValue.consumableValue).toLocaleString("en-AU", { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            ) : null;

          case "maintenance":
            return upcomingMaintenance !== undefined && upcomingMaintenance > 0 ? (
              <div key="maintenance" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link href="/maintenance">
                  <Card className="hover:border-amber-300 transition-colors cursor-pointer">
                    <CardContent className="pt-5">
                      <p className="text-xs font-medium text-shark-400 uppercase tracking-wider">Maintenance Due</p>
                      <p className="text-2xl font-bold text-amber-600 mt-1">{upcomingMaintenance}</p>
                      <p className="text-xs text-shark-400 mt-1">Due within 7 days</p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            ) : null;

          case "asset-charts":
            return (assetStatusChart && assetStatusChart.length > 0) || (categoryChart && categoryChart.length > 0) ? (
              <div key="asset-charts" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assetStatusChart && assetStatusChart.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Asset Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {assetStatusChart.map((item) => {
                          const total = assetStatusChart.reduce((sum, i) => sum + i.value, 0);
                          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                          const statusMap: Record<string, string> = { Available: "AVAILABLE", Assigned: "ASSIGNED", "Checked Out": "CHECKED_OUT", Damaged: "DAMAGED", Lost: "LOST", Unavailable: "UNAVAILABLE" };
                          const statusParam = statusMap[item.name] || "";
                          return (
                            <Link key={item.name} href={`/assets${statusParam ? `?status=${statusParam}` : ""}`} className="flex items-center gap-3 rounded-lg px-2 py-1.5 -mx-2 hover:bg-shark-50 transition-colors cursor-pointer">
                              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                              <span className="text-sm text-shark-700 flex-1">{item.name}</span>
                              <span className="text-sm font-semibold text-shark-900">{item.value}</span>
                              <div className="w-24 bg-shark-100 rounded-full h-2 overflow-hidden">
                                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                              </div>
                              <span className="text-xs text-shark-400 w-8 text-right">{pct}%</span>
                            </Link>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
                {categoryChart && categoryChart.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Assets by Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {categoryChart.map((item, idx) => {
                          const maxVal = Math.max(...categoryChart.map((c) => c.value));
                          const pct = maxVal > 0 ? Math.round((item.value / maxVal) * 100) : 0;
                          const colors = ["#7C3AED", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];
                          const color = colors[idx % colors.length];
                          return (
                            <Link key={item.name} href={`/assets?category=${encodeURIComponent(item.name)}`} className="flex items-center gap-3 rounded-lg px-2 py-1.5 -mx-2 hover:bg-shark-50 transition-colors cursor-pointer">
                              <span className="text-sm text-shark-700 flex-1 truncate">{item.name}</span>
                              <span className="text-sm font-semibold text-shark-900">{item.value}</span>
                              <div className="w-28 bg-shark-100 rounded-full h-2 overflow-hidden">
                                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : null;

          case "consumable-charts":
            return (consumableStatusChart && consumableStatusChart.length > 0) || (consumableCategoryChart && consumableCategoryChart.length > 0) ? (
              <div key="consumable-charts" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {consumableStatusChart && consumableStatusChart.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Consumable Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {consumableStatusChart.map((item) => {
                          const total = consumableStatusChart.reduce((sum, i) => sum + i.value, 0);
                          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                          const stockMap: Record<string, string> = { Adequate: "adequate", "Low Stock": "low", Critical: "critical", "Out of Stock": "out" };
                          const stockParam = stockMap[item.name] || "";
                          return (
                            <Link key={item.name} href={`/consumables${stockParam ? `?stock=${stockParam}` : ""}`} className="flex items-center gap-3 rounded-lg px-2 py-1.5 -mx-2 hover:bg-shark-50 transition-colors cursor-pointer">
                              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                              <span className="text-sm text-shark-700 flex-1">{item.name}</span>
                              <span className="text-sm font-semibold text-shark-900">{item.value}</span>
                              <div className="w-24 bg-shark-100 rounded-full h-2 overflow-hidden">
                                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                              </div>
                              <span className="text-xs text-shark-400 w-8 text-right">{pct}%</span>
                            </Link>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
                {consumableCategoryChart && consumableCategoryChart.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Consumables by Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {consumableCategoryChart.map((item, idx) => {
                          const maxVal = Math.max(...consumableCategoryChart.map((c) => c.value));
                          const pct = maxVal > 0 ? Math.round((item.value / maxVal) * 100) : 0;
                          const colors = ["#06b6d4", "#8b5cf6", "#ec4899", "#f97316", "#14b8a6", "#a855f7", "#f43f5e", "#0ea5e9"];
                          const color = colors[idx % colors.length];
                          return (
                            <Link key={item.name} href={`/consumables?category=${encodeURIComponent(item.name)}`} className="flex items-center gap-3 rounded-lg px-2 py-1.5 -mx-2 hover:bg-shark-50 transition-colors cursor-pointer">
                              <span className="text-sm text-shark-700 flex-1 truncate">{item.name}</span>
                              <span className="text-sm font-semibold text-shark-900">{item.value}</span>
                              <div className="w-28 bg-shark-100 rounded-full h-2 overflow-hidden">
                                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : null;

          case "low-stock":
            return showLowStock ? (
              <Card key="low-stock">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                      <Icon name="alert-triangle" size={14} className="text-red-500" />
                    </div>
                    <CardTitle>Low Stock Alerts</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {lowStockItems.length === 0 ? (
                    <div className="flex items-center gap-3 py-4">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                        <Icon name="check" size={16} className="text-emerald-500" />
                      </div>
                      <p className="text-sm text-shark-500">All stock levels are OK.</p>
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {lowStockItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between py-3 border-b border-shark-50 last:border-0">
                          <div>
                            <p className="text-sm font-medium text-shark-800">{item.name}</p>
                            <p className="text-xs text-shark-400">{item.region.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-red-500">{item.quantityOnHand} {item.unitType}</p>
                            <p className="text-xs text-shark-400">min: {item.minimumThreshold}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null;

          case "regional":
            return regionBreakdown && regionBreakdown.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-action-50 flex items-center justify-center">
              <Icon name="map-pin" size={14} className="text-action-500" />
            </div>
            <h2 className="text-lg font-semibold text-shark-900">Regional Breakdown</h2>
          </div>
          <div className="space-y-3">
            {regionBreakdown.map((region, idx) => {
              const colors = REGION_COLORS[idx % REGION_COLORS.length];
              const isCollapsed = collapsedRegions.has(region.regionId);
              const totalIssues = region.damaged + region.lost + region.pendingRequests + region.pendingPOs;
              return (
                <Card key={region.regionId} className="overflow-hidden">
                  <button
                    onClick={() => toggleRegion(region.regionId)}
                    className="w-full flex items-center justify-between px-5 py-3 hover:bg-shark-25 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center`}>
                        <Icon name="map-pin" size={16} className={colors.color} />
                      </div>
                      <div className="text-left">
                        <span className="font-semibold text-shark-900">{region.regionName}</span>
                        <span className="ml-2 text-xs text-shark-400">{region.stateName}</span>
                      </div>
                      {totalIssues > 0 && (
                        <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-shark-100 text-shark-600 rounded-full">
                          {totalIssues} {totalIssues === 1 ? "issue" : "issues"}
                        </span>
                      )}
                    </div>
                    <Icon
                      name="chevron-down"
                      size={16}
                      className={`text-shark-400 transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                    />
                  </button>
                  {!isCollapsed && (
                    <div className="px-5 pb-4 pt-1 border-t border-shark-50">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <Link href={`/assets?status=DAMAGED&region=${region.regionId}`} className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 hover:bg-red-100 transition-colors">
                          <Icon name="alert-triangle" size={14} className="text-red-500" />
                          <div>
                            <p className="text-lg font-bold text-red-600">{region.damaged}</p>
                            <p className="text-xs text-red-400">Damaged</p>
                          </div>
                        </Link>
                        <Link href={`/assets?status=LOST&region=${region.regionId}`} className="flex items-center gap-2 rounded-lg bg-shark-50 px-3 py-2 hover:bg-shark-100 transition-colors">
                          <Icon name="shield" size={14} className="text-shark-500" />
                          <div>
                            <p className="text-lg font-bold text-shark-700">{region.lost}</p>
                            <p className="text-xs text-shark-400">Lost</p>
                          </div>
                        </Link>
                        <Link href={`/consumables?tab=requests&region=${region.regionId}`} className="flex items-center gap-2 rounded-lg bg-amber-100 px-3 py-2 hover:bg-amber-200 transition-colors">
                          <Icon name="clipboard" size={14} className="text-amber-600" />
                          <div>
                            <p className="text-lg font-bold text-amber-700">{region.pendingRequests}</p>
                            <p className="text-xs text-amber-600">Requests</p>
                          </div>
                        </Link>
                        <Link href={`/purchase-orders?status=PENDING&region=${region.regionId}`} className="flex items-center gap-2 rounded-lg bg-purple-50 px-3 py-2 hover:bg-purple-100 transition-colors">
                          <Icon name="truck" size={14} className="text-purple-500" />
                          <div>
                            <p className="text-lg font-bold text-purple-600">{region.pendingPOs}</p>
                            <p className="text-xs text-purple-400">POs</p>
                          </div>
                        </Link>
                      </div>
                      {region.lowStockItems.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-semibold text-shark-400 uppercase tracking-wider mb-2">Low Stock</p>
                          <div className="space-y-0">
                            {region.lowStockItems.map((item) => (
                              <div key={item.id} className="flex items-center justify-between py-2 border-b border-shark-50 last:border-0">
                                <p className="text-sm text-shark-700">{item.name}</p>
                                <div className="text-right">
                                  <span className="text-sm font-medium text-red-500">{item.quantityOnHand} {item.unitType}</span>
                                  <span className="text-xs text-shark-400 ml-2">min: {item.minimumThreshold}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
            ) : null;

          case "quick-links":
            return showQuickLinks ? (
              <div key="quick-links" className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="block group">
                    <Card className="hover:shadow-md transition-all duration-200 cursor-pointer hover:border-shark-200">
                      <CardContent className="py-6 flex flex-col items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl ${link.iconBg} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                          <Icon name={link.icon} size={20} className={link.iconColor} />
                        </div>
                        <p className="text-sm font-medium text-shark-700">{link.label}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : null;

          case "shortcuts":
            return preferences.customShortcuts.length > 0 ? (
              <div key="shortcuts">
                <h2 className="text-xs font-semibold text-shark-400 uppercase tracking-wider mb-3">My Shortcuts</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {preferences.customShortcuts.map((shortcut) => (
                    <div key={shortcut.id} className="relative group">
                      <Link href={shortcut.href} className="block">
                        <Card className="hover:shadow-md transition-all duration-200 cursor-pointer hover:border-shark-200">
                          <CardContent className="py-6 flex flex-col items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-action-50 flex items-center justify-center group-hover:scale-105 transition-transform">
                              <Icon name={shortcut.icon} size={20} className="text-action-500" />
                            </div>
                            <p className="text-sm font-medium text-shark-700">{shortcut.label}</p>
                          </CardContent>
                        </Card>
                      </Link>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveShortcut(shortcut.id); }}
                        disabled={isPending}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white shadow-sm border border-shark-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-shark-400 hover:text-red-500 hover:border-red-200 disabled:opacity-50"
                      >
                        <Icon name="x" size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null;

          default:
            return null;
        }
      })}

      {/* Storage Locations Map */}
      {isSuperAdmin && mapLocations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-action-500 flex items-center justify-center">
                <Icon name="map-pin" size={16} className="text-white" />
              </div>
              Storage Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LocationMap locations={mapLocations} className="h-[400px]" />
          </CardContent>
        </Card>
      )}

      {/* Settings Modal */}
      <DashboardSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        preferences={preferences}
      />
    </div>
  );
}
