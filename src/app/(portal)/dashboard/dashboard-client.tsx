"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon, type IconName } from "@/components/ui/icon";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import dynamic from "next/dynamic";
import { DashboardSettingsModal } from "./dashboard-settings-modal";
import { OnboardingOverlay } from "@/components/ui/onboarding";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/ui/page-transition";
import { OperationsWidget } from "./widgets/operations-widget";
import { removeCustomShortcut } from "@/app/actions/dashboard";
import type { DashboardPreferences } from "@/lib/dashboard-types";
import { SmartActionsPanel, type SmartActionItem } from "./smart-actions-panel";
import { AiForecastWidget, type DepletionForecastItem } from "./ai-forecast-widget";
import { RecentActivityWidget, type RecentActivityItem } from "./recent-activity-widget";

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
  trend?: { direction: "up" | "down" | "neutral"; label: string };
}

interface LowStockItem {
  id: string;
  name: string;
  unitType: string;
  quantityOnHand: number;
  minimumThreshold: number;
  region: { id: string; name: string };
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
  overdueReturns: number;
  lowStockCount: number;
  healthScore: number;
  lowStockItems: { id: string; name: string; unitType: string; quantityOnHand: number; minimumThreshold: number; region?: { id: string; name: string } }[];
}

const REGION_COLORS = [
  { color: "text-blue-600", bg: "bg-blue-50" },
  { color: "text-action-600", bg: "bg-action-50" },
  { color: "text-[#E8532E]", bg: "bg-amber-50" },
  { color: "text-cyan-600", bg: "bg-cyan-50" },
  { color: "text-red-600", bg: "bg-red-50" },
  { color: "text-shark-600", bg: "bg-shark-50" },
  { color: "text-pink-600", bg: "bg-pink-50" },
  { color: "text-orange-600", bg: "bg-orange-50" },
];

interface ChartItem {
  name: string;
  value: number;
  color?: string;
}

function RecalcPredictionsButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const router = useRouter();

  const handleRecalc = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/predictions", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setStatus("done");
        router.refresh();
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        console.error(data.error);
        setStatus("error");
        setTimeout(() => setStatus("idle"), 3000);
      }
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <button
      onClick={handleRecalc}
      disabled={status === "loading"}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border text-xs sm:text-sm transition-all ${
        status === "done"
          ? "border-action-300 bg-action-50 text-action-600"
          : status === "error"
          ? "border-red-300 bg-red-50 text-red-600"
          : "border-shark-200 bg-white text-shark-600 hover:border-action-300 hover:text-action-600 hover:shadow-sm"
      }`}
      title="Recalculate AI predictions from consumption history"
    >
      <Icon
        name={status === "loading" ? "clock" : status === "done" ? "check" : "bar-chart"}
        size={12}
        className={status === "loading" ? "animate-spin" : status === "done" ? "text-action-500" : "text-action-500"}
      />
      {status === "loading" ? "Calculating…" : status === "done" ? "Updated!" : status === "error" ? "Failed" : "AI Predict"}
    </button>
  );
}

interface PredictedShortageItem {
  id: string;
  name: string;
  unitType: string;
  quantityOnHand: number;
  avgDailyUsage: number;
  daysRemaining: number | null;
  riskLevel: "critical" | "warning" | "ok";
  regionName: string;
  predictedDepletionDate: string | null;
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
  activityChartData?: { month: string; consumablesUsed: number; staff: number }[];
  operationsOverview?: { healthScore: number; ordersAwaitingApproval: number; ordersAwaitingReceival: number; overdueReturns: number; incompleteInspections: number; unresolvedDamage: number; lostItems: number; totalStaff: number; pendingRequests: number; lowStockCount: number };
  upcomingMaintenance?: number;
  isSuperAdmin?: boolean;
  mapLocations?: { id: string; name: string; stateName: string; latitude: number; longitude: number; assetCount: number; consumableCount: number; staffCount: number }[];
  predictedShortages?: PredictedShortageItem[];
  actionItems?: SmartActionItem[];
  depletionForecast?: DepletionForecastItem[];
  recentActivity?: RecentActivityItem[];
  procurementCost?: number;
}

function fmtAUD(n: number) {
  return n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
}

export function DashboardClient({ stats, lowStockItems, quickLinks, preferences, subtitle, regionBreakdown, assetStatusChart, categoryChart, consumableStatusChart, consumableCategoryChart, portfolioValue, portfolioChartData, activityChartData, operationsOverview, upcomingMaintenance, isSuperAdmin, mapLocations = [], predictedShortages = [], actionItems = [], depletionForecast = [], recentActivity = [], procurementCost }: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [collapsedRegions, setCollapsedRegions] = useState<Set<string>>(() => {
    // Auto-collapse regions with no actionable items
    if (!regionBreakdown) return new Set();
    return new Set(
      regionBreakdown
        .filter((r) => r.lowStockCount === 0 && r.pendingRequests === 0 && r.pendingPOs === 0)
        .map((r) => r.regionId)
    );
  });
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem("trackio-onboarding-complete");
  });

  const completeOnboarding = () => {
    localStorage.setItem("trackio-onboarding-complete", "true");
    setShowOnboarding(false);
  };

  const h = preferences.hiddenWidgets;
  const visibleStats = stats.filter((s) => !h.includes(s.widgetId));
  const showLowStock = !h.includes("low-stock-alerts");
  const showQuickLinks = !h.includes("quick-links");
  const showPortfolio = !h.includes("portfolio-valuation");
  const showOperations = !h.includes("operations-overview");
  const showMaintenance = !h.includes("maintenance-due");
  const showAssetCharts = !h.includes("asset-charts");
  const showConsumableCharts = !h.includes("consumable-charts");
  const showRegional = !h.includes("regional-breakdown");
  const showMap = !h.includes("location-map");
  const showPredictions = !h.includes("predicted-shortages");
  const showAiForecast = !h.includes("ai-forecast");
  const showRecentActivity = !h.includes("recent-activity");

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
    <div>
      {/* Onboarding overlay */}
      {showOnboarding && <OnboardingOverlay onComplete={completeOnboarding} />}

      <PageTransition className="space-y-6 sm:space-y-8 lg:space-y-10">

      {/* Mobile action panel — shown inline on smaller screens, hidden on md+ where it sits next to Finance */}
      {actionItems.length > 0 && (
        <div className="md:hidden">
          <SmartActionsPanel items={actionItems} />
        </div>
      )}

      {/* Header with settings gear */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-shark-900 tracking-tight">Dashboard</h1>
        <button
          onClick={() => setSettingsOpen(true)}
          className="p-2 rounded-full text-shark-400 hover:text-shark-600 hover:bg-shark-100 transition-colors"
          title="Dashboard settings"
        >
          <Icon name="settings" size={18} />
        </button>
      </div>

      {/* Quick Actions */}
      {isSuperAdmin && (
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <Link href="/assets?action=add" className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-shark-200 bg-white text-xs sm:text-sm text-shark-600 hover:border-action-300 hover:text-action-600 hover:shadow-sm transition-all">
            <Icon name="plus" size={12} className="text-action-500" />
            Add Asset
          </Link>
          <Link href="/consumables?action=add" className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-shark-200 bg-white text-xs sm:text-sm text-shark-600 hover:border-action-300 hover:text-action-600 hover:shadow-sm transition-all">
            <Icon name="plus" size={12} className="text-action-500" />
            Add Supply
          </Link>
          <Link href="/purchase-orders?action=create" className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-shark-200 bg-white text-xs sm:text-sm text-shark-600 hover:border-action-300 hover:text-action-600 hover:shadow-sm transition-all">
            <Icon name="truck" size={12} className="text-action-500" />
            Create PO
          </Link>
          <Link href="/staff" className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-shark-200 bg-white text-xs sm:text-sm text-shark-600 hover:border-action-300 hover:text-action-600 hover:shadow-sm transition-all">
            <Icon name="users" size={12} className="text-action-500" />
            Staff
          </Link>
          <Link href="/admin/import" className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-shark-200 bg-white text-xs sm:text-sm text-shark-600 hover:border-action-300 hover:text-action-600 hover:shadow-sm transition-all">
            <Icon name="upload" size={12} className="text-action-500" />
            Import
          </Link>
          <RecalcPredictionsButton />
        </div>
      )}

      {preferences.sectionOrder.map((sectionId) => {
        switch (sectionId) {
          case "stats":
            return visibleStats.length > 0 ? (
              <div key="stats" className="space-y-4">
              <p className="text-[11px] font-semibold text-shark-400 uppercase tracking-widest">Overview</p>
              <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                {visibleStats.map((s) => (
                  <StaggerItem key={s.label}>
                  <Link href={s.href} className="block group">
                    <Card className="hover:shadow-md transition-all duration-200 cursor-pointer">
                      <CardContent className="px-3 py-3 sm:px-5 sm:py-5">
                        <div className="flex items-center gap-2 sm:gap-4">
                          <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl ${s.iconBg} flex items-center justify-center flex-shrink-0`}>
                            <Icon name={s.icon} size={16} className={`${s.iconColor} sm:hidden`} />
                            <Icon name={s.icon} size={22} className={`${s.iconColor} hidden sm:block`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm text-shark-500 truncate">{s.label}</p>
                            <div className="flex items-center gap-1 sm:gap-2">
                              <AnimatedCounter value={s.value} className="text-lg sm:text-2xl font-bold text-shark-900" />
                              {s.trend && (
                                <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                                  s.trend.direction === "down" ? "bg-green-50 text-green-600" :
                                  s.trend.direction === "up" ? "text-red-500" :
                                  "text-shark-400"
                                }`}>
                                  {s.trend.direction === "up" && "↑"}
                                  {s.trend.direction === "down" && "↓"}
                                  {s.trend.label}
                                </span>
                              )}
                            </div>
                          </div>
                          <Icon name="arrow-right" size={14} className="text-shark-400 group-hover:text-action-500 transition-colors flex-shrink-0 sm:hidden" />
                          <Icon name="arrow-right" size={18} className="text-shark-400 group-hover:text-action-500 transition-colors flex-shrink-0 hidden sm:block" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                  </StaggerItem>
                ))}
              </StaggerContainer>
              {/* Procurement cost banner — only when there are active POs with costing */}
              {isSuperAdmin && procurementCost !== undefined && procurementCost > 0 && (
                <Link href="/purchase-orders" className="block group">
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-action-100 bg-gradient-to-r from-action-50/50 to-transparent hover:border-action-300 hover:shadow-sm transition-all">
                    <div className="w-8 h-8 rounded-lg bg-action-100 flex items-center justify-center shrink-0">
                      <Icon name="truck" size={15} className="text-action-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-shark-500">Active Procurement Budget</p>
                      <p className="text-[11px] text-shark-400">Total committed across all regions (pending · approved · ordered)</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-bold text-shark-900">{fmtAUD(procurementCost)}</p>
                    </div>
                    <Icon name="arrow-right" size={16} className="text-shark-400 group-hover:text-action-500 transition-colors shrink-0" />
                  </div>
                </Link>
              )}
              </div>
            ) : null;

          case "portfolio":
            return (showPortfolio || showOperations || !isSuperAdmin) ? (
              <div key="portfolio" className={`grid grid-cols-1 gap-4 ${actionItems.length > 0 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
                {/* LEFT — Operations Overview */}
                {operationsOverview && showOperations && (
                  <OperationsWidget data={operationsOverview} />
                )}

                {/* CENTRE — Portfolio Line Chart (Assets vs Consumables value) */}
                {showPortfolio && portfolioValue && (portfolioValue.purchase > 0 || portfolioValue.consumableValue > 0) && (
                  <Card>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h2 className="text-lg font-bold text-shark-900">Finance</h2>
                          <p className="text-sm text-shark-400">Asset &amp; Supply Value</p>
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
                            <span className="text-xs text-shark-500">Supplies</span>
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
                                        const name = p.dataKey === "assets" ? "Assets" : p.dataKey === "consumables" ? "Supplies" : "Depreciation";
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

                {/* RIGHT — Smart Action Panel (desktop only, hidden on mobile where it shows at top) */}
                {actionItems.length > 0 && (
                  <div className="hidden md:flex flex-col">
                    <SmartActionsPanel items={actionItems} />
                  </div>
                )}
              </div>
            ) : null;

          case "maintenance":
            return showMaintenance && upcomingMaintenance !== undefined && upcomingMaintenance > 0 ? (
              <div key="maintenance" className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/maintenance">
                  <Card className="hover:border-amber-300 transition-colors cursor-pointer">
                    <CardContent className="pt-5">
                      <p className="text-xs font-medium text-shark-400 uppercase tracking-wider">Maintenance Due</p>
                      <p className="text-2xl font-bold text-[#E8532E] mt-1">{upcomingMaintenance}</p>
                      <p className="text-xs text-shark-400 mt-1">Due within 7 days</p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            ) : null;

          case "asset-charts":
            return showAssetCharts && ((assetStatusChart && assetStatusChart.length > 0) || (categoryChart && categoryChart.length > 0)) ? (
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
            return showConsumableCharts && ((consumableStatusChart && consumableStatusChart.length > 0) || (consumableCategoryChart && consumableCategoryChart.length > 0)) ? (
              <div key="consumable-charts" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {consumableStatusChart && consumableStatusChart.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Supply Status</CardTitle>
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
                      <CardTitle>Supplies by Category</CardTitle>
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
            return (showLowStock || !isSuperAdmin) ? (
              <Card key="low-stock">
                <Link href={isSuperAdmin ? "/alerts/low-stock" : "/purchase-orders"}>
                  <CardHeader className="hover:bg-shark-50/50 transition-colors cursor-pointer rounded-t-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                          <Icon name="alert-triangle" size={14} className="text-red-500" />
                        </div>
                        <CardTitle>Low Stock Alerts</CardTitle>
                      </div>
                      <Icon name="arrow-right" size={16} className="text-shark-400" />
                    </div>
                  </CardHeader>
                </Link>
                <CardContent>
                  {lowStockItems.length === 0 ? (
                    <div className="flex items-center gap-3 py-4">
                      <div className="w-8 h-8 rounded-full bg-action-50 flex items-center justify-center">
                        <Icon name="check" size={16} className="text-action-500" />
                      </div>
                      <p className="text-sm text-shark-500">All stock levels are OK.</p>
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {lowStockItems.map((item) => (
                        <Link key={item.id} href={isSuperAdmin ? `/alerts/low-stock${item.region?.id ? `?region=${item.region.id}` : ""}` : "/purchase-orders"} className="flex items-center justify-between py-3 border-b border-shark-50 last:border-0 hover:bg-shark-50/50 px-1 -mx-1 rounded-lg transition-colors cursor-pointer">
                          <div>
                            <p className="text-sm font-medium text-shark-800">{item.name}</p>
                            <p className="text-xs text-shark-400">{item.region?.name || ""}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-16">
                              <div className="h-1.5 rounded-full bg-shark-100 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    item.quantityOnHand === 0 ? "bg-red-500" : item.quantityOnHand <= item.minimumThreshold / 2 ? "bg-red-400" : "bg-amber-400"
                                  }`}
                                  style={{ width: `${Math.min(100, (item.quantityOnHand / Math.max(item.minimumThreshold * 2, 1)) * 100)}%` }}
                                />
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-red-500">{item.quantityOnHand} {item.unitType}</p>
                              <p className="text-xs text-shark-400">min: {item.minimumThreshold}</p>
                            </div>
                            <Icon name="arrow-right" size={14} className="text-shark-400" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null;

          case "predicted-shortages":
            return showPredictions && predictedShortages.length > 0 ? (
              <Card key="predicted-shortages">
                <Link href="/purchase-orders">
                  <CardHeader className="hover:bg-shark-50/50 transition-colors cursor-pointer rounded-t-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#E8532E]/10 flex items-center justify-center">
                          <Icon name="bar-chart" size={14} className="text-[#E8532E]" />
                        </div>
                        <CardTitle>Predicted Shortages</CardTitle>
                        <span className="text-[10px] font-medium bg-action-50 text-action-600 px-1.5 py-0.5 rounded-full">AI</span>
                      </div>
                      <Icon name="arrow-right" size={16} className="text-shark-400" />
                    </div>
                  </CardHeader>
                </Link>
                <CardContent>
                  <div className="space-y-0">
                    {predictedShortages.map((item) => (
                      <Link key={item.id} href={`/purchase-orders`} className="flex items-center justify-between py-3 border-b border-shark-50 last:border-0 hover:bg-shark-50/50 px-1 -mx-1 rounded-lg transition-colors cursor-pointer">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-shark-800 truncate">{item.name}</p>
                          <p className="text-xs text-shark-400">{item.regionName} · {item.avgDailyUsage.toFixed(1)}/day usage</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-bold text-shark-900">{item.quantityOnHand} <span className="text-xs font-normal text-shark-400">{item.unitType}</span></p>
                            {item.daysRemaining !== null && (
                              <span className={`text-xs font-semibold ${item.riskLevel === "critical" ? "text-red-500" : "text-amber-500"}`}>
                                {item.daysRemaining === 0 ? "Depleted today" : `~${item.daysRemaining}d left`}
                              </span>
                            )}
                          </div>
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.riskLevel === "critical" ? "bg-red-500" : "bg-amber-400"}`} />
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : null;

          case "ai-forecast":
            return showAiForecast ? (
              <div key="ai-forecast">
                <AiForecastWidget items={depletionForecast} />
              </div>
            ) : null;

          case "recent-activity":
            return showRecentActivity ? (
              <div key="recent-activity">
                <RecentActivityWidget items={recentActivity} />
              </div>
            ) : null;

          case "regional":
            return showRegional && regionBreakdown && regionBreakdown.length > 0 ? (
              <div key="regional" className="space-y-4">
                <p className="text-[11px] font-semibold text-shark-400 uppercase tracking-widest">Regions</p>
                <div className="space-y-3">
                  {[...regionBreakdown].sort((a, b) => a.healthScore - b.healthScore).map((region, idx) => {
              const colors = REGION_COLORS[idx % REGION_COLORS.length];
              const isCollapsed = collapsedRegions.has(region.regionId);
              const hasActions = region.lowStockCount > 0 || region.pendingRequests > 0 || region.pendingPOs > 0;
              const totalIssues = (region.damaged + region.lost) + region.pendingRequests + region.pendingPOs;
              return (
                <Card key={region.regionId} className="overflow-hidden">
                  <button
                    onClick={() => toggleRegion(region.regionId)}
                    className="w-full flex items-center justify-between px-5 py-3 hover:bg-shark-25 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-left">
                        <span className="font-semibold text-shark-900">{region.regionName}</span>
                        <span className="ml-2 text-xs text-shark-400">{region.stateName}</span>
                      </div>
                      {hasActions ? (
                        <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-red-50 text-red-500 rounded-full">
                          {totalIssues} {totalIssues === 1 ? "issue" : "issues"}
                        </span>
                      ) : (
                        <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-green-50 text-green-600 rounded-full">
                          All clear
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
                      <div className="grid grid-cols-3 gap-3">
                        <Link href={isSuperAdmin ? `/alerts/low-stock?region=${region.regionId}` : "/purchase-orders"} className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 hover:bg-red-100 transition-colors">
                          <Icon name="alert-triangle" size={14} className="text-red-500" />
                          <div>
                            <p className="text-lg font-bold text-red-600">{region.lowStockCount}</p>
                            <p className="text-xs text-red-400">Low Stock</p>
                          </div>
                        </Link>
                        <Link href={`/consumables?tab=requests&region=${region.regionId}`} className="flex items-center gap-2 rounded-lg bg-amber-100 px-3 py-2 hover:bg-amber-200 transition-colors">
                          <Icon name="clipboard" size={14} className="text-[#E8532E]" />
                          <div>
                            <p className="text-lg font-bold text-[#E8532E]">{region.pendingRequests}</p>
                            <p className="text-xs text-[#E8532E]">Requests</p>
                          </div>
                        </Link>
                        <Link href={`/purchase-orders?status=PENDING&region=${region.regionId}`} className="flex items-center gap-2 rounded-lg bg-action-50 px-3 py-2 hover:bg-action-100 transition-colors">
                          <Icon name="truck" size={14} className="text-action-500" />
                          <div>
                            <p className="text-lg font-bold text-action-600">{region.pendingPOs}</p>
                            <p className="text-xs text-action-400">POs</p>
                          </div>
                        </Link>
                      </div>
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
              <div key="quick-links" className="space-y-4">
              <p className="text-[11px] font-semibold text-shark-400 uppercase tracking-widest">Quick Links</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="block group">
                    <Card className="hover:shadow-md transition-all duration-200 cursor-pointer hover:border-shark-200">
                      <CardContent className="py-5 flex flex-col items-center gap-2.5">
                        <div className={`w-11 h-11 rounded-xl ${link.iconBg} flex items-center justify-center transition-transform`}>
                          <Icon name={link.icon} size={20} className={link.iconColor} />
                        </div>
                        <p className="text-sm font-medium text-shark-700">{link.label}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
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
      {isSuperAdmin && showMap && mapLocations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-action-50 flex items-center justify-center">
                <Icon name="map-pin" size={18} className="text-action-600" />
              </div>
              Storage Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Google Maps embed — no API key needed */}
            <div className="h-[250px] sm:h-[300px] lg:h-[350px] rounded-xl overflow-hidden border border-shark-100">
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?q=${mapLocations.map((l) => `${l.latitude},${l.longitude}`).join("|")}&z=5&output=embed&ll=${mapLocations.length > 0 ? `${mapLocations.reduce((s, l) => s + l.latitude, 0) / mapLocations.length},${mapLocations.reduce((s, l) => s + l.longitude, 0) / mapLocations.length}` : "-33.8688,151.2093"}`}
              />
            </div>
            {/* Location list */}
            <div className="mt-3 space-y-1">
              {mapLocations.map((loc) => (
                <a
                  key={loc.id}
                  href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-shark-50 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-action-50 flex items-center justify-center">
                      <Icon name="map-pin" size={18} className="text-action-600" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-shark-700 group-hover:text-action-500 transition-colors">{loc.name}</span>
                      <span className="text-xs text-shark-400 ml-2">{loc.stateName}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-shark-400">
                    <span>{loc.assetCount} assets</span>
                    <span>{loc.consumableCount} supplies</span>
                    <span>{loc.staffCount} staff</span>
                  </div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings Modal */}
      <DashboardSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        preferences={preferences}
      />
      </PageTransition>
    </div>
  );
}
