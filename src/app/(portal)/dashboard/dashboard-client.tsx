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

interface Props {
  stats: StatCard[];
  lowStockItems: LowStockItem[];
  quickLinks: QuickLink[];
  preferences: DashboardPreferences;
  subtitle: string;
  regionBreakdown?: RegionBreakdownItem[];
}

export function DashboardClient({ stats, lowStockItems, quickLinks, preferences, subtitle, regionBreakdown }: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [collapsedRegions, setCollapsedRegions] = useState<Set<string>>(new Set());

  const visibleStats = stats.filter((s) => !preferences.hiddenWidgets.includes(s.widgetId));
  const showLowStock = !preferences.hiddenWidgets.includes("low-stock-alerts");
  const showQuickLinks = !preferences.hiddenWidgets.includes("quick-links");

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

      {/* Stats grid */}
      {visibleStats.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
      )}

      {/* Low stock alerts */}
      {showLowStock && (
        <Card>
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
      )}

      {/* Regional breakdown (Super Admin only) */}
      {regionBreakdown && regionBreakdown.length > 0 && (
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
      )}

      {/* Quick links */}
      {showQuickLinks && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
      )}

      {/* Custom shortcuts */}
      {preferences.customShortcuts.length > 0 && (
        <div>
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
