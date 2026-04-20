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
import { SmartReorderPanel, type ReorderRecommendation } from "./smart-reorder-panel";
import { AssetHealthWidget } from "./asset-health-widget";

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
  { ssr: false, loading: () => <div className="flex items-center justify-center bg-shark-50 dark:bg-shark-800 rounded-xl text-shark-400 text-sm" style={{ minHeight: 300 }}>Loading map...</div> }
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
  { color: "text-shark-600 dark:text-shark-400", bg: "bg-shark-50 dark:bg-shark-800" },
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
          : "border-shark-200 dark:border-shark-700 bg-white dark:bg-shark-800 text-shark-600 dark:text-shark-300 hover:border-action-300 hover:text-action-600 hover:shadow-sm"
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

function QuickActionsBar({ role }: { role: string }) {
  const actions: { label: string; href: string; icon: IconName }[] = [
    { label: "Assign Item", href: "/assets", icon: "package" },
    { label: "Add Stock", href: "/consumables", icon: "droplet" },
    { label: "Report Issue", href: "/report-damage", icon: "alert-triangle" },
    { label: "New Order", href: "/purchase-orders", icon: "truck" },
    { label: "View Returns", href: "/returns", icon: "arrow-left" },
    { label: "Quick Return", href: "/returns/quick", icon: "check-circle" },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
      {actions.map((action) => (
        <Link
          key={action.label}
          href={action.href}
          className="flex flex-col items-center gap-2 p-3 rounded-xl border border-shark-100 dark:border-shark-800 bg-white dark:bg-shark-900 hover:shadow-md transition-all duration-200 group text-center"
        >
          <Icon name={action.icon} size={20} className="text-shark-500 dark:text-shark-400 group-hover:text-action-500 transition-colors duration-150" />
          <span className="text-xs font-medium text-shark-600 dark:text-shark-400 group-hover:text-shark-800 dark:text-shark-200 dark:group-hover:text-shark-200 transition-colors">{action.label}</span>
        </Link>
      ))}
    </div>
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
  activePOCount?: number;
  reorderRecommendations?: ReorderRecommendation[];
  recentAnomalyCount?: number;
  assetHealthSummary?: {
    averageScore: number;
    distribution: { grade: string; count: number }[];
    criticalAssets: Array<{
      assetId: string;
      assetName: string;
      assetCode: string;
      score: number;
      grade: string;
      recommendation: string;
    }>;
    topPerformers: Array<{
      assetId: string;
      assetName: string;
      assetCode: string;
      score: number;
      grade: string;
    }>;
  } | null;
}

function fmtAUD(n: number) {
  return n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
}

export function DashboardClient({ stats, lowStockItems, quickLinks, preferences, subtitle, regionBreakdown, assetStatusChart, categoryChart, consumableStatusChart, consumableCategoryChart, portfolioValue, portfolioChartData, activityChartData, operationsOverview, upcomingMaintenance, isSuperAdmin, mapLocations = [], predictedShortages = [], actionItems = [], depletionForecast = [], recentActivity = [], procurementCost, activePOCount = 0, reorderRecommendations = [], recentAnomalyCount = 0, assetHealthSummary = null }: Props) {
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

      {/* Settings gear */}
      <div className="flex justify-end">
        <button
          onClick={() => setSettingsOpen(true)}
          className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-shark-400 hover:text-shark-600 dark:text-shark-400 hover:bg-shark-100 dark:hover:bg-shark-800 dark:bg-shark-700 transition-colors"
          aria-label="Dashboard settings"
          title="Dashboard settings"
        >
          <Icon name="settings" size={18} />
        </button>
      </div>


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
                      <CardContent className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-9 h-9 rounded-lg ${s.iconBg} flex items-center justify-center flex-shrink-0`}>
                            <Icon name={s.icon} size={16} className={s.iconColor} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-shark-500 dark:text-shark-400 truncate">{s.label}</p>
                            <div className="flex items-center gap-1">
                              <AnimatedCounter value={s.value} className="text-xl font-bold text-shark-900 dark:text-shark-100" />
                              {s.trend && (
                                <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                                  s.trend.direction === "down" ? "bg-green-50 text-green-600" :
                                  s.trend.direction === "up" ? "bg-red-50 text-red-500" :
                                  "bg-shark-50 dark:bg-shark-800 text-shark-400"
                                }`}>
                                  {s.trend.direction === "up" && "↑"}
                                  {s.trend.direction === "down" && "↓"}
                                  {s.trend.label}
                                </span>
                              )}
                            </div>
                          </div>
                          <Icon name="arrow-right" size={14} className="text-shark-400 group-hover:text-action-500 transition-colors flex-shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                  </StaggerItem>
                ))}
              </StaggerContainer>
              {/* Quick Actions bar — below stat cards */}
              <QuickActionsBar role={isSuperAdmin ? "superadmin" : "manager"} />
              {/* Procurement cost banner — shows whenever there are active POs */}
              {isSuperAdmin && activePOCount > 0 && (
                <Link href="/purchase-orders" className="block group">
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-action-200 bg-action-50/60 backdrop-blur-sm hover:shadow-md transition-all duration-200">
                    <div className="w-8 h-8 rounded-lg bg-action-100 flex items-center justify-center shrink-0">
                      <Icon name="truck" size={15} className="text-action-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-action-600">Active Procurement</p>
                      <p className="text-[11px] text-action-400">
                        {activePOCount} order{activePOCount !== 1 ? "s" : ""} in pipeline across all regions
                        {(!procurementCost || procurementCost === 0) && " · Add unit costs to see total value"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {procurementCost && procurementCost > 0 ? (
                        <p className="text-xl font-bold text-action-700">{fmtAUD(procurementCost)}</p>
                      ) : (
                        <p className="text-sm font-semibold text-action-500">{activePOCount} PO{activePOCount !== 1 ? "s" : ""}</p>
                      )}
                    </div>
                    <Icon name="arrow-right" size={16} className="text-action-400 group-hover:text-action-600 transition-colors shrink-0" />
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
                  <Card padding="none">
                    <div className="p-4 sm:p-6">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-7 h-7 rounded-lg bg-action-100 flex items-center justify-center shrink-0">
                          <Icon name="bar-chart" size={14} className="text-action-600" />
                        </div>
                        <div>
                          <h2 className="text-sm font-semibold text-shark-900 dark:text-shark-100">Finance</h2>
                          <p className="text-xs text-shark-400">Asset &amp; Supply Value</p>
                        </div>
                      </div>

                      {/* Summary cards */}
                      <div className="bg-white dark:bg-shark-900 rounded-xl border border-shark-100 dark:border-shark-800 overflow-hidden mb-4">
                        <div className="grid grid-cols-2 divide-x divide-shark-50">
                        <div className="px-3.5 py-2.5">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="w-2 h-2 rounded-full" style={{ background: "#1F3DD9" }} />
                            <span className="text-xs text-shark-500 dark:text-shark-400">Assets</span>
                          </div>
                          <p className="text-xl font-bold text-shark-900 dark:text-shark-100">
                            ${portfolioValue.current.toLocaleString("en-AU", { maximumFractionDigits: 0 })}
                          </p>
                          {portfolioValue.depreciation > 0 && (
                            <span className="text-[10px] text-[#E8532E] font-medium">
                              ↓ ${portfolioValue.depreciation.toLocaleString("en-AU", { maximumFractionDigits: 0 })}
                            </span>
                          )}
                        </div>
                        <div className="px-3.5 py-2.5">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="w-2 h-2 rounded-full" style={{ background: "#E8532E" }} />
                            <span className="text-xs text-shark-500 dark:text-shark-400">Supplies</span>
                          </div>
                          <p className="text-xl font-bold text-shark-900 dark:text-shark-100">
                            ${portfolioValue.consumableValue.toLocaleString("en-AU", { maximumFractionDigits: 0 })}
                          </p>
                        </div>
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
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-shark-100 dark:border-shark-700/60">
                        <span className="text-xs font-medium text-shark-500 dark:text-shark-400">Total Portfolio</span>
                        <span className="text-lg font-bold text-shark-900 dark:text-shark-100">
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
                  <Card padding="none">
                    <div className="p-4 sm:p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-7 h-7 rounded-lg bg-action-100 flex items-center justify-center shrink-0">
                          <Icon name="package" size={14} className="text-action-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-shark-900 dark:text-shark-100">Asset Status</h3>
                          <p className="text-xs text-shark-400">Breakdown by status</p>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-shark-900 rounded-xl border border-shark-100 dark:border-shark-800 divide-y divide-shark-50 dark:divide-shark-800 overflow-hidden">
                        {assetStatusChart.map((item) => {
                          const total = assetStatusChart.reduce((sum, i) => sum + i.value, 0);
                          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                          const statusMap: Record<string, string> = { Available: "AVAILABLE", Assigned: "ASSIGNED", "Checked Out": "CHECKED_OUT", Damaged: "DAMAGED", Lost: "LOST", Unavailable: "UNAVAILABLE" };
                          const statusParam = statusMap[item.name] || "";
                          return (
                            <Link key={item.name} href={`/assets${statusParam ? `?status=${statusParam}` : ""}`} className="flex items-center gap-3 px-3 py-2.5 hover:bg-shark-50 dark:hover:bg-shark-800 transition-colors cursor-pointer">
                              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                              <span className="text-sm text-shark-700 dark:text-shark-300 flex-1">{item.name}</span>
                              <span className="text-sm font-semibold text-shark-900 dark:text-shark-100">{item.value}</span>
                              <div className="w-20 bg-shark-100 dark:bg-shark-700 rounded-full h-1.5 overflow-hidden">
                                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                              </div>
                              <span className="text-xs text-shark-400 w-8 text-right">{pct}%</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </Card>
                )}
                {categoryChart && categoryChart.length > 0 && (
                  <Card padding="none">
                    <div className="p-4 sm:p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-7 h-7 rounded-lg bg-action-100 flex items-center justify-center shrink-0">
                          <Icon name="box" size={14} className="text-action-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-shark-900 dark:text-shark-100">Assets by Category</h3>
                          <p className="text-xs text-shark-400">Distribution across categories</p>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-shark-900 rounded-xl border border-shark-100 dark:border-shark-800 divide-y divide-shark-50 dark:divide-shark-800 overflow-hidden">
                        {categoryChart.map((item, idx) => {
                          const maxVal = Math.max(...categoryChart.map((c) => c.value));
                          const pct = maxVal > 0 ? Math.round((item.value / maxVal) * 100) : 0;
                          const colors = ["#7C3AED", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];
                          const color = colors[idx % colors.length];
                          return (
                            <Link key={item.name} href={`/assets?category=${encodeURIComponent(item.name)}`} className="flex items-center gap-3 px-3 py-2.5 hover:bg-shark-50 dark:hover:bg-shark-800 transition-colors cursor-pointer">
                              <span className="text-sm text-shark-700 dark:text-shark-300 flex-1 truncate">{item.name}</span>
                              <span className="text-sm font-semibold text-shark-900 dark:text-shark-100">{item.value}</span>
                              <div className="w-24 bg-shark-100 dark:bg-shark-700 rounded-full h-1.5 overflow-hidden">
                                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            ) : null;

          case "consumable-charts":
            return showConsumableCharts && ((consumableStatusChart && consumableStatusChart.length > 0) || (consumableCategoryChart && consumableCategoryChart.length > 0)) ? (
              <div key="consumable-charts" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {consumableStatusChart && consumableStatusChart.length > 0 && (
                  <Card padding="none">
                    <div className="p-4 sm:p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-7 h-7 rounded-lg bg-action-100 flex items-center justify-center shrink-0">
                          <Icon name="droplet" size={14} className="text-action-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-shark-900 dark:text-shark-100">Supply Status</h3>
                          <p className="text-xs text-shark-400">Breakdown by stock level</p>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-shark-900 rounded-xl border border-shark-100 dark:border-shark-800 divide-y divide-shark-50 dark:divide-shark-800 overflow-hidden">
                        {consumableStatusChart.map((item) => {
                          const total = consumableStatusChart.reduce((sum, i) => sum + i.value, 0);
                          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                          const stockMap: Record<string, string> = { Adequate: "adequate", "Low Stock": "low", Critical: "critical", "Out of Stock": "out" };
                          const stockParam = stockMap[item.name] || "";
                          return (
                            <Link key={item.name} href={`/consumables${stockParam ? `?stock=${stockParam}` : ""}`} className="flex items-center gap-3 px-3 py-2.5 hover:bg-shark-50 dark:hover:bg-shark-800 transition-colors cursor-pointer">
                              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                              <span className="text-sm text-shark-700 dark:text-shark-300 flex-1">{item.name}</span>
                              <span className="text-sm font-semibold text-shark-900 dark:text-shark-100">{item.value}</span>
                              <div className="w-20 bg-shark-100 dark:bg-shark-700 rounded-full h-1.5 overflow-hidden">
                                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                              </div>
                              <span className="text-xs text-shark-400 w-8 text-right">{pct}%</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </Card>
                )}
                {consumableCategoryChart && consumableCategoryChart.length > 0 && (
                  <Card padding="none">
                    <div className="p-4 sm:p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-7 h-7 rounded-lg bg-action-100 flex items-center justify-center shrink-0">
                          <Icon name="clipboard" size={14} className="text-action-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-shark-900 dark:text-shark-100">Supplies by Category</h3>
                          <p className="text-xs text-shark-400">Distribution across categories</p>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-shark-900 rounded-xl border border-shark-100 dark:border-shark-800 divide-y divide-shark-50 dark:divide-shark-800 overflow-hidden">
                        {consumableCategoryChart.map((item, idx) => {
                          const maxVal = Math.max(...consumableCategoryChart.map((c) => c.value));
                          const pct = maxVal > 0 ? Math.round((item.value / maxVal) * 100) : 0;
                          const colors = ["#06b6d4", "#8b5cf6", "#ec4899", "#f97316", "#14b8a6", "#a855f7", "#f43f5e", "#0ea5e9"];
                          const color = colors[idx % colors.length];
                          return (
                            <Link key={item.name} href={`/consumables?category=${encodeURIComponent(item.name)}`} className="flex items-center gap-3 px-3 py-2.5 hover:bg-shark-50 dark:hover:bg-shark-800 transition-colors cursor-pointer">
                              <span className="text-sm text-shark-700 dark:text-shark-300 flex-1 truncate">{item.name}</span>
                              <span className="text-sm font-semibold text-shark-900 dark:text-shark-100">{item.value}</span>
                              <div className="w-24 bg-shark-100 dark:bg-shark-700 rounded-full h-1.5 overflow-hidden">
                                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            ) : null;

          case "low-stock":
            return (showLowStock || !isSuperAdmin) ? (
              <Card key="low-stock">
                <div className="p-4 sm:p-5">
                  {/* Header */}
                  <Link href={isSuperAdmin ? "/alerts/low-stock" : "/purchase-orders"} className="flex items-center justify-between mb-4 group cursor-pointer">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                        <Icon name="alert-triangle" size={14} className="text-red-500" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-shark-900 dark:text-shark-100">Low Stock Alerts</h3>
                        <p className="text-xs text-shark-400">Items below minimum threshold</p>
                      </div>
                    </div>
                    <Icon name="arrow-right" size={16} className="text-shark-400 group-hover:text-action-500 transition-colors" />
                  </Link>
                  {/* Content */}
                  {lowStockItems.length === 0 ? (
                    <div className="bg-white dark:bg-shark-900 rounded-xl border border-shark-100 dark:border-shark-800 overflow-hidden">
                      <div className="flex items-center gap-3 px-4 py-3.5">
                        <div className="w-7 h-7 rounded-lg bg-action-50 flex items-center justify-center shrink-0">
                          <Icon name="check" size={14} className="text-action-500" />
                        </div>
                        <p className="text-sm text-shark-500 dark:text-shark-400">All stock levels are OK.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-shark-900 rounded-xl border border-shark-100 dark:border-shark-800 divide-y divide-shark-50 dark:divide-shark-800 overflow-hidden">
                      {lowStockItems.map((item) => (
                        <Link key={item.id} href={isSuperAdmin ? `/alerts/low-stock${item.region?.id ? `?region=${item.region.id}` : ""}` : "/purchase-orders"} className="flex items-center justify-between px-3 py-2.5 hover:bg-shark-50 dark:hover:bg-shark-800 transition-colors cursor-pointer">
                          <div className="flex-1 min-w-0 mr-3">
                            <p className="text-sm font-medium text-shark-800 dark:text-shark-200 truncate">{item.name}</p>
                            <p className="text-xs text-shark-400">{item.region?.name || ""}</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="w-16">
                              <div className="h-1.5 rounded-full bg-shark-100 dark:bg-shark-700 overflow-hidden">
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
                </div>
              </Card>
            ) : null;

          case "predicted-shortages":
            return showPredictions && predictedShortages.length > 0 ? (
              <Card key="predicted-shortages" className="border-[#E8532E]/30">
                <div className="p-4 sm:p-5">
                  {/* Header */}
                  <Link href="/purchase-orders" className="flex items-center gap-2 mb-4 group cursor-pointer">
                    <div className="w-7 h-7 rounded-lg bg-[#E8532E]/10 flex items-center justify-center shrink-0">
                      <Icon name="bar-chart" size={14} className="text-[#E8532E]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-shark-900 dark:text-shark-100">Predicted Shortages</h3>
                      <p className="text-xs text-shark-400">AI-powered depletion forecasts</p>
                    </div>
                    <span className="text-[10px] font-medium bg-action-50 text-action-600 px-1.5 py-0.5 rounded-full shrink-0">AI</span>
                    <Icon name="arrow-right" size={16} className="text-shark-400 group-hover:text-action-500 transition-colors shrink-0" />
                  </Link>
                  {/* Items */}
                  <div className="bg-white dark:bg-shark-900 rounded-xl border border-shark-100 dark:border-shark-800 divide-y divide-shark-50 dark:divide-shark-800 overflow-hidden">
                    {predictedShortages.map((item) => (
                      <Link key={item.id} href={`/purchase-orders`} className="flex items-center justify-between px-3 py-2.5 hover:bg-shark-50 dark:hover:bg-shark-800 transition-colors cursor-pointer">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.riskLevel === "critical" ? "bg-red-500" : "bg-amber-400"}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-shark-800 dark:text-shark-200 truncate">{item.name}</p>
                            <p className="text-xs text-shark-400">{item.regionName} · {item.avgDailyUsage.toFixed(1)}/day usage</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <p className="text-sm font-bold text-shark-900 dark:text-shark-100">{item.quantityOnHand} <span className="text-xs font-normal text-shark-400">{item.unitType}</span></p>
                            {item.daysRemaining !== null && (
                              <span className={`text-xs font-semibold ${item.riskLevel === "critical" ? "text-red-500" : "text-amber-500"}`}>
                                {item.daysRemaining === 0 ? "Depleted today" : `~${item.daysRemaining}d left`}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </Card>
            ) : null;

          case "ai-forecast":
            return showAiForecast ? (
              <div key="ai-forecast" className="space-y-4">
                <AiForecastWidget items={depletionForecast} />
                {isSuperAdmin && reorderRecommendations.length > 0 && (
                  <SmartReorderPanel recommendations={reorderRecommendations} canApprove={true} />
                )}
                {isSuperAdmin && assetHealthSummary && (
                  <AssetHealthWidget summary={assetHealthSummary} />
                )}
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
              <div key="regional">
                <Card padding="none">
                  <div className="p-4 sm:p-5">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-lg bg-action-100 flex items-center justify-center shrink-0">
                        <Icon name="map-pin" size={14} className="text-action-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-shark-900 dark:text-shark-100">Regions</h3>
                        <p className="text-xs text-shark-400">Status by region</p>
                      </div>
                    </div>
                    {/* Region cards */}
                    <div className="space-y-2">
                      {[...regionBreakdown].sort((a, b) => a.healthScore - b.healthScore).map((region, idx) => {
                        const colors = REGION_COLORS[idx % REGION_COLORS.length];
                        const isCollapsed = collapsedRegions.has(region.regionId);
                        const hasActions = region.lowStockCount > 0 || region.pendingRequests > 0 || region.pendingPOs > 0;
                        const totalIssues = (region.damaged + region.lost) + region.pendingRequests + region.pendingPOs;
                        return (
                          <div key={region.regionId} className="bg-white dark:bg-shark-900 rounded-xl border border-shark-100 dark:border-shark-800 overflow-hidden">
                            {/* Region header row */}
                            <button
                              onClick={() => toggleRegion(region.regionId)}
                              className="w-full flex items-center gap-2 px-3 py-3 hover:bg-shark-50 dark:hover:bg-shark-800/50 transition-colors"
                            >
                              <div className={`w-7 h-7 rounded-lg ${colors.bg} flex items-center justify-center shrink-0`}>
                                <Icon name="map-pin" size={12} className={colors.color} />
                              </div>
                              <div className="flex-1 min-w-0 text-left overflow-hidden">
                                <p className="text-sm font-semibold text-shark-900 dark:text-shark-100 truncate leading-tight">{region.regionName}</p>
                                {region.stateName && <p className="text-xs text-shark-400 truncate leading-tight">{region.stateName}</p>}
                              </div>
                              {hasActions ? (
                                <span className="shrink-0 inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-semibold bg-red-50 text-red-500 rounded-full border border-red-100">
                                  {totalIssues} {totalIssues === 1 ? "issue" : "issues"}
                                </span>
                              ) : (
                                <span className="shrink-0 inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-semibold bg-green-50 text-green-600 rounded-full border border-green-100">
                                  All clear
                                </span>
                              )}
                              <Icon
                                name="chevron-down"
                                size={14}
                                className={`text-shark-400 transition-transform shrink-0 ${isCollapsed ? "-rotate-90" : ""}`}
                              />
                            </button>
                            {/* Expanded detail */}
                            {!isCollapsed && (
                              <div className="px-3 pb-3 pt-0 border-t border-shark-50 dark:border-shark-800">
                                <div className="grid grid-cols-3 gap-2 mt-3">
                                  <Link href={isSuperAdmin ? `/alerts/low-stock?region=${region.regionId}` : "/purchase-orders"} className="flex flex-col items-center justify-center gap-0.5 rounded-xl bg-red-50 border border-red-100 py-3 hover:bg-red-100 transition-colors">
                                    <Icon name="alert-triangle" size={12} className="text-red-400" />
                                    <span className="text-base font-extrabold text-red-600 leading-none tabular-nums">{region.lowStockCount}</span>
                                    <span className="text-[9px] font-semibold text-red-400 text-center leading-tight">Low Stock</span>
                                  </Link>
                                  <Link href={`/consumables?tab=requests&region=${region.regionId}`} className="flex flex-col items-center justify-center gap-0.5 rounded-xl bg-amber-50 border border-amber-100 py-3 hover:bg-amber-100 transition-colors">
                                    <Icon name="clipboard" size={12} className="text-amber-500" />
                                    <span className="text-base font-extrabold text-[#E8532E] leading-none tabular-nums">{region.pendingRequests}</span>
                                    <span className="text-[9px] font-semibold text-amber-500 text-center leading-tight">Requests</span>
                                  </Link>
                                  <Link href={`/purchase-orders?status=PENDING&region=${region.regionId}`} className="flex flex-col items-center justify-center gap-0.5 rounded-xl bg-action-50 border border-action-100 py-3 hover:bg-action-100 transition-colors">
                                    <Icon name="truck" size={12} className="text-action-400" />
                                    <span className="text-base font-extrabold text-action-600 leading-none tabular-nums">{region.pendingPOs}</span>
                                    <span className="text-[9px] font-semibold text-action-400 text-center leading-tight">POs</span>
                                  </Link>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>
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
                        <p className="text-sm font-medium text-shark-700 dark:text-shark-300">{link.label}</p>
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
                            <p className="text-sm font-medium text-shark-700 dark:text-shark-300">{shortcut.label}</p>
                          </CardContent>
                        </Card>
                      </Link>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveShortcut(shortcut.id); }}
                        disabled={isPending}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white dark:bg-shark-800 shadow-sm border border-shark-100 dark:border-shark-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-shark-400 hover:text-red-500 hover:border-red-200 disabled:opacity-50"
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
        <Card padding="none">
          <div className="p-4 sm:p-5">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-action-100 flex items-center justify-center shrink-0">
                <Icon name="map-pin" size={14} className="text-action-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-shark-900 dark:text-shark-100">Storage Locations</h3>
                <p className="text-xs text-shark-400">Map and location overview</p>
              </div>
            </div>
            {/* Google Maps embed — no API key needed */}
            <div className="h-[250px] sm:h-[300px] lg:h-[350px] rounded-xl overflow-hidden border border-shark-100 dark:border-shark-800 mb-3">
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
            <div className="bg-white dark:bg-shark-900 rounded-xl border border-shark-100 dark:border-shark-800 divide-y divide-shark-50 dark:divide-shark-800 overflow-hidden">
              {mapLocations.map((loc) => (
                <a
                  key={loc.id}
                  href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2.5 hover:bg-shark-50 dark:hover:bg-shark-800 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-action-50 flex items-center justify-center shrink-0">
                      <Icon name="map-pin" size={13} className="text-action-600" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-shark-700 dark:text-shark-300 group-hover:text-action-500 transition-colors">{loc.name}</span>
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
          </div>
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
