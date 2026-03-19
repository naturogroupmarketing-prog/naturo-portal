"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon, type IconName } from "@/components/ui/icon";
import { DashboardSettingsModal } from "./dashboard-settings-modal";
import { removeCustomShortcut } from "@/app/actions/dashboard";
import type { DashboardPreferences } from "@/lib/dashboard-types";

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
  upcomingMaintenance?: number;
  isSuperAdmin?: boolean;
}

export function DashboardClient({ stats, lowStockItems, quickLinks, preferences, subtitle, regionBreakdown, assetStatusChart, categoryChart, consumableStatusChart, consumableCategoryChart, portfolioValue, upcomingMaintenance, isSuperAdmin }: Props) {
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
              <div key="stats" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {visibleStats.map((s) => (
                  <Link key={s.label} href={s.href} className="block group">
                    <Card className={`border-l-4 ${s.borderColor} hover:shadow-md transition-all duration-200 cursor-pointer hover:border-shark-200`}>
                      <CardContent className="py-4 px-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-2xl font-bold text-shark-900">{s.value}</p>
                            <p className="text-xs text-shark-400 mt-1">{s.label}</p>
                          </div>
                          <div className={`w-8 h-8 rounded-lg ${s.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                            <Icon name={s.icon} size={16} className={s.iconColor} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : null;

          case "portfolio":
            return isSuperAdmin && showPortfolio && portfolioValue && (portfolioValue.purchase > 0 || portfolioValue.consumableValue > 0) ? (
              <div key="portfolio">
                <h2 className="text-sm font-semibold text-shark-500 uppercase tracking-wider mb-3">Portfolio Valuation</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-5">
                      <p className="text-xs font-medium text-shark-400 uppercase tracking-wider">Asset Purchase Value</p>
                      <p className="text-2xl font-bold text-shark-900 mt-1">${portfolioValue.purchase.toLocaleString("en-AU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-5">
                      <p className="text-xs font-medium text-shark-400 uppercase tracking-wider">Asset Current Value</p>
                      <p className="text-2xl font-bold text-emerald-600 mt-1">${portfolioValue.current.toLocaleString("en-AU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                      <p className="text-xs text-shark-400 mt-1">Depreciation: ${portfolioValue.depreciation.toLocaleString("en-AU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-5">
                      <p className="text-xs font-medium text-shark-400 uppercase tracking-wider">Consumable Stock Value</p>
                      <p className="text-2xl font-bold text-blue-600 mt-1">${portfolioValue.consumableValue.toLocaleString("en-AU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-5">
                      <p className="text-xs font-medium text-shark-400 uppercase tracking-wider">Total Portfolio</p>
                      <p className="text-2xl font-bold text-action-500 mt-1">${(portfolioValue.current + portfolioValue.consumableValue).toLocaleString("en-AU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                    </CardContent>
                  </Card>
                </div>
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
                            <p className="text-xs text-amber-600">Pending Requests</p>
                          </div>
                        </Link>
                        <Link href={`/purchase-orders?status=PENDING&region=${region.regionId}`} className="flex items-center gap-2 rounded-lg bg-purple-50 px-3 py-2 hover:bg-purple-100 transition-colors">
                          <Icon name="truck" size={14} className="text-purple-500" />
                          <div>
                            <p className="text-lg font-bold text-purple-600">{region.pendingPOs}</p>
                            <p className="text-xs text-purple-400">Pending POs</p>
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

      {/* Settings Modal */}
      <DashboardSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        preferences={preferences}
      />
    </div>
  );
}
