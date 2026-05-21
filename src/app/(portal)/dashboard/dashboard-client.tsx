"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon, type IconName } from "@/components/ui/icon";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import dynamic from "next/dynamic";
import { DashboardSettingsModal } from "./dashboard-settings-modal";
import { useRegisterPageCog } from "@/components/layout/page-cog-context";
import { OnboardingOverlay } from "@/components/ui/onboarding";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/ui/page-transition";
import { OperationsWidget, PriorityAlertsPanel } from "./widgets/operations-widget";
import { removeCustomShortcut } from "@/app/actions/dashboard";
import type { DashboardPreferences } from "@/lib/dashboard-types";
import { type SmartActionItem } from "./smart-actions-panel";
import { AiForecastWidget, type DepletionForecastItem } from "./ai-forecast-widget";
import { RecentActivityWidget, type RecentActivityItem } from "./recent-activity-widget";
import { SmartReorderPanel, type ReorderRecommendation } from "./smart-reorder-panel";
import { AssetHealthWidget } from "./asset-health-widget";
import { type SmartInsight } from "./smart-insights-ticker";
import { SystemHealthBar } from "./system-health-bar";
import { ErrorBoundary } from "@/components/ui/error-boundary";

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
  { ssr: false, loading: () => <div className="flex items-center justify-center bg-shark-50 dark:bg-shark-800 rounded-[20px] text-shark-400 text-sm" style={{ minHeight: 300 }}>Loading map...</div> }
);

interface StatCard {
  widgetId: string;
  label: string;
  value: number;
  icon: IconName;
  borderColor: string;
  iconBg: string;
  iconColor: string;
  buttonBg: string;
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
  { color: "text-action-600", bg: "bg-action-50" },
  { color: "text-action-600", bg: "bg-action-50" },
  { color: "text-action-600", bg: "bg-action-50" },
  { color: "text-action-600", bg: "bg-action-50" },
  { color: "text-red-600", bg: "bg-red-50" },
  { color: "text-shark-600 dark:text-shark-400", bg: "bg-shark-50 dark:bg-shark-800" },
  { color: "text-action-600", bg: "bg-action-50" },
  { color: "text-action-600", bg: "bg-action-50" },
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
    { label: "Assign Item", href: "/inventory", icon: "package" },
    { label: "Add Stock", href: "/inventory?tab=consumables", icon: "droplet" },
    { label: "Report Issue", href: "/report-damage", icon: "alert-triangle" },
    { label: "New Order", href: "/purchase-orders?action=create", icon: "truck" },
    { label: "View Returns", href: "/returns", icon: "arrow-left" },
    { label: "Quick Return", href: "/returns/quick", icon: "check-circle" },
  ];

  return (
    <>
      {actions.map((action) => (
        <Link key={action.label} href={action.href} className="block group">
          <Card className="hover:shadow-md transition-all duration-200 cursor-pointer">
            <CardContent className="px-3 py-3">
              <div className="flex items-center gap-2 min-h-[44px]">
                <div className="w-9 h-9 rounded-[14px] bg-shark-50 dark:bg-shark-800 flex items-center justify-center flex-shrink-0 group-hover:bg-action-50 transition-colors">
                  <Icon name={action.icon} size={16} className="text-shark-500 dark:text-shark-400 group-hover:text-action-500 transition-colors" />
                </div>
                <span className="text-xs font-medium text-shark-600 dark:text-shark-400 group-hover:text-shark-800 dark:group-hover:text-shark-200 transition-colors leading-tight">{action.label}</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </>
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
  userName?: string;
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
  briefingWidget?: React.ReactNode;
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

export function DashboardClient({ stats, lowStockItems, quickLinks, preferences, subtitle, userName, regionBreakdown, assetStatusChart, categoryChart, consumableStatusChart, consumableCategoryChart, portfolioValue, portfolioChartData, activityChartData, operationsOverview, upcomingMaintenance, isSuperAdmin, mapLocations = [], predictedShortages = [], actionItems = [], depletionForecast = [], recentActivity = [], procurementCost, activePOCount = 0, reorderRecommendations = [], recentAnomalyCount = 0, briefingWidget, assetHealthSummary = null }: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  // Register the dashboard settings action with the bottom-nav cog
  useRegisterPageCog(() => setSettingsOpen(true), []);

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

  // ── Smart insights: generated from real data, rotate in the ticker ──────────
  const insights = useMemo<SmartInsight[]>(() => {
    const list: SmartInsight[] = [];
    const ops = operationsOverview;

    if (ops) {
      const { healthScore, overdueReturns, lowStockCount, unresolvedDamage, pendingRequests, totalStaff } = ops;

      if (healthScore >= 90) {
        list.push({ text: `System running at ${healthScore}% health — all operations are nominal`, type: "success" });
      } else if (healthScore >= 70) {
        list.push({ text: `System health at ${healthScore}% — a few items need attention to get back to full efficiency`, type: "warning" });
      } else {
        list.push({ text: `System health at ${healthScore}% — multiple issues are affecting operations`, type: "warning" });
      }

      if (overdueReturns > 0) {
        list.push({ text: `${overdueReturns} asset${overdueReturns !== 1 ? "s" : ""} overdue for return — follow up with staff to close these out`, type: "warning" });
      }

      if (lowStockCount > 0) {
        list.push({ text: `${lowStockCount} item${lowStockCount !== 1 ? "s" : ""} below minimum stock threshold — consider raising purchase orders`, type: "warning" });
      }

      if (unresolvedDamage > 0) {
        list.push({ text: `${unresolvedDamage} unresolved damage or loss report${unresolvedDamage !== 1 ? "s" : ""} pending review`, type: "warning" });
      }

      if (pendingRequests === 0 && lowStockCount === 0 && overdueReturns === 0) {
        list.push({ text: "No pending requests or stock issues — great day to focus on forward planning", type: "success" });
      }

      if (totalStaff > 0) {
        list.push({ text: `${totalStaff} active staff member${totalStaff !== 1 ? "s" : ""} across your operations`, type: "info" });
      }
    }

    if (predictedShortages.length > 0) {
      const critical = predictedShortages.filter((s) => s.riskLevel === "critical");
      if (critical.length > 0) {
        const first = critical[0];
        const days = first.daysRemaining;
        list.push({
          text: `${first.name} predicted to run out${days != null ? ` in ${days} day${days !== 1 ? "s" : ""}` : " soon"} at current usage rate`,
          type: "warning",
        });
      }
    }

    if (recentAnomalyCount > 0) {
      list.push({
        text: `${recentAnomalyCount} unusual consumption pattern${recentAnomalyCount !== 1 ? "s" : ""} detected — review the AI forecast for details`,
        type: "tip",
      });
    }

    if (reorderRecommendations.length > 0) {
      list.push({
        text: `${reorderRecommendations.length} AI reorder suggestion${reorderRecommendations.length !== 1 ? "s" : ""} ready — automate restocking before stock runs low`,
        type: "tip",
      });
    }

    return list;
  }, [operationsOverview, predictedShortages, recentAnomalyCount, reorderRecommendations]);

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

      {/* ── Hero Banner ───────────────────────────────────────────── */}
      <div className="relative rounded-[20px] overflow-hidden" style={{ minHeight: 90 }}>
        {/* Hero image */}
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/hero.png')" }} />
        {/* Dark gradient overlay so text is always readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#001832]/90 via-[#003d7d]/70 to-transparent" />
        {/* Content */}
        <div className="relative px-5 py-4 sm:px-10 sm:py-7">
          <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-2.5 py-1 mb-2 sm:mb-3 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-action-400" />
            <span className="text-[9px] font-bold text-white/80 tracking-widest uppercase">Enterprise Standard</span>
          </div>
          <h1 className="text-lg sm:text-3xl font-bold text-white tracking-tight">
            Asset &amp; Inventory Management
          </h1>
          <p className="text-[11px] sm:text-xs text-white/50 mt-1 sm:mt-1.5 font-medium">{subtitle}</p>
        </div>
        {/* Settings gear in hero corner */}
        <button
          onClick={() => setSettingsOpen(true)}
          className="absolute top-4 right-4 p-2.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white/90 hover:text-white hover:bg-white/30 transition-colors"
          aria-label="Dashboard settings"
          title="Dashboard settings"
        >
          <Icon name="settings" size={18} />
        </button>
      </div>

      {/* ── AI Briefing (1/2) | Stat cards stacked (1/2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:items-stretch">
        {/* Col 1 — AI Briefing + Operations Performance merged */}
        {(briefingWidget || (operationsOverview && showOperations)) && (
          <ErrorBoundary fallback={<div className="rounded-[20px] border border-shark-100 dark:border-shark-800 bg-shark-50 dark:bg-shark-900 p-6 text-center text-sm text-shark-400">Briefing unavailable</div>}>
            <div className="flex flex-col gap-4 h-full">
              {briefingWidget && <div>{briefingWidget}</div>}
              {operationsOverview && showOperations && (
                <OperationsWidget data={operationsOverview} className="flex-1" />
              )}
            </div>
          </ErrorBoundary>
        )}

        {/* Col 2 — Stat cards (3-across on mobile, stacked on desktop) */}
        {visibleStats.length > 0 && (
          <ErrorBoundary fallback={<div className="rounded-[20px] border border-shark-100 dark:border-shark-800 bg-shark-50 dark:bg-shark-900 p-6 text-center text-sm text-shark-400">Stats unavailable</div>}>
            <StaggerContainer className="flex flex-col gap-2 h-full">
              <div className="grid grid-cols-4 gap-2 lg:grid-cols-1 lg:h-full">
              {(["stat-low-stock", "stat-pending-requests", "stat-pending-returns", "stat-pending-pos"] as const).map(id => stats.find(s => s.widgetId === id)).filter((s): s is NonNullable<typeof s> => !!s).map((s) => (
                <StaggerItem key={s.label}>
                  <Link href={s.href} className="block group aspect-square lg:aspect-auto lg:h-full">
                    <div className={`h-full rounded-[20px] backdrop-blur-[20px] border border-white/60 dark:border-white/10 ${s.buttonBg} shadow-[inset_0_1px_0_rgba(255,255,255,0.80),0_2px_8px_rgba(0,113,227,0.08)] active:scale-95 transition-transform cursor-pointer`}>
                      <div className="p-2 lg:px-4 lg:py-0 h-full">
                        {/* Mobile: centered column; Desktop: left-aligned row */}
                        <div className="flex flex-col items-center justify-center text-center gap-1 h-full lg:flex-row lg:items-center lg:justify-start lg:text-left lg:gap-3">
                          {/* Icon: bare on mobile, glass chip on desktop */}
                          <div className="flex items-center justify-center flex-shrink-0">
                            <Icon name={s.icon} size={20} className={s.iconColor} />
                          </div>
                          {/* Number + label */}
                          <div className="min-w-0 lg:flex-1 lg:text-center">
                            <AnimatedCounter value={s.value} className="text-base lg:text-2xl font-bold text-shark-900 dark:text-shark-100 leading-none" />
                            <p className="text-[11px] font-semibold text-shark-700 dark:text-shark-300 truncate leading-tight">{s.label}</p>
                          </div>
                          <Icon name="arrow-right" size={14} className="text-shark-400 group-hover:text-action-500 transition-colors flex-shrink-0 hidden lg:block" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </StaggerItem>
              ))}
              </div>
            </StaggerContainer>
          </ErrorBoundary>
        )}
      </div>

      {preferences.sectionOrder.map((sectionId) => (
        <ErrorBoundary key={sectionId} fallback={<div className="rounded-[20px] border border-shark-100 dark:border-shark-800 bg-shark-50 dark:bg-shark-900 p-4 text-center text-sm text-shark-400">Widget unavailable</div>}>
          {(() => { switch (sectionId) {
          case "stats":
            return null; // rendered above briefing — see explicit block after briefingWidget

          case "portfolio":
            return null; // Finance panel hidden

          case "portfolio-hidden":
            return (showPortfolio || !isSuperAdmin) ? (
              <div key="portfolio" className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Portfolio Line Chart (Assets vs Consumables value) */}
                {showPortfolio && portfolioValue && (portfolioValue.purchase > 0 || portfolioValue.consumableValue > 0) && (
                  <Card padding="none">
                    <div className="px-5 py-4">
                      <h2 className="text-lg font-bold text-shark-900 dark:text-shark-100 mb-4">Finance</h2>

                      {/* Summary cards */}
                      <div className="bg-white dark:bg-shark-900 rounded-[20px] border border-shark-100 dark:border-shark-800 overflow-hidden mb-4">
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
                            <span className="text-[10px] text-action-600 font-medium">
                              ↓ ${portfolioValue.depreciation.toLocaleString("en-AU", { maximumFractionDigits: 0 })}
                            </span>
                          )}
                        </div>
                        <div className="px-3.5 py-2.5">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="w-2 h-2 rounded-full" style={{ background: "#0057FF" }} />
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
                                  <stop offset="0%" stopColor="#0057FF" stopOpacity={0.12} />
                                  <stop offset="100%" stopColor="#0057FF" stopOpacity={0.01} />
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
                                        const color = p.dataKey === "assets" ? "#1F3DD9" : p.dataKey === "consumables" ? "#0057FF" : "#8b8f96";
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
                              <Area type="monotone" dataKey="consumables" stroke="#0057FF" strokeWidth={2} fill="url(#gradConsumables)" dot={false} activeDot={{ r: 4, fill: "#0057FF", stroke: "#fff", strokeWidth: 2 }} />
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

              </div>
            ) : null;

          case "maintenance":
            return showMaintenance && upcomingMaintenance !== undefined && upcomingMaintenance > 0 ? (
              <div key="maintenance" className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/maintenance">
                  <Card className="hover:border-action-300 transition-colors cursor-pointer">
                    <CardContent className="pt-5">
                      <p className="text-xs font-medium text-shark-400 uppercase tracking-wider">Maintenance Due</p>
                      <p className="text-2xl font-bold text-action-600 mt-1">{upcomingMaintenance}</p>
                      <p className="text-xs text-shark-400 mt-1">Due within 7 days</p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            ) : null;

          case "asset-charts":
            return showAssetCharts && ((assetStatusChart && assetStatusChart.length > 0) || (categoryChart && categoryChart.length > 0)) ? (
              <div key="asset-charts" className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
                {assetStatusChart && assetStatusChart.length > 0 && (
                  <Card padding="none">
                    <div className="px-5 py-4">
                      <h3 className="text-lg font-bold text-shark-900 dark:text-shark-100 mb-4">Asset Status</h3>
                      <div className="bg-white dark:bg-shark-900 rounded-[20px] border border-shark-100 dark:border-shark-800 divide-y divide-shark-50 dark:divide-shark-800 overflow-hidden">
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
                    <div className="px-5 py-4">
                      <h3 className="text-lg font-bold text-shark-900 dark:text-shark-100 mb-4">Assets by Category</h3>
                      <div className="bg-white dark:bg-shark-900 rounded-[20px] border border-shark-100 dark:border-shark-800 divide-y divide-shark-50 dark:divide-shark-800 overflow-hidden">
                        {categoryChart.map((item, idx) => {
                          const maxVal = Math.max(...categoryChart.map((c) => c.value));
                          const pct = maxVal > 0 ? Math.round((item.value / maxVal) * 100) : 0;
                          const colors = ["#0057FF", "#4d83ff", "#80a8ff", "#b3c9ff", "#003fba", "#1A6BFF", "#dde6ff", "#6b7280"];
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
                    <div className="px-5 py-4">
                      <h3 className="text-lg font-bold text-shark-900 dark:text-shark-100 mb-4">Supply Status</h3>
                      <div className="bg-white dark:bg-shark-900 rounded-[20px] border border-shark-100 dark:border-shark-800 divide-y divide-shark-50 dark:divide-shark-800 overflow-hidden">
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
                    <div className="px-5 py-4">
                      <h3 className="text-lg font-bold text-shark-900 dark:text-shark-100 mb-4">Supplies by Category</h3>
                      <div className="bg-white dark:bg-shark-900 rounded-[20px] border border-shark-100 dark:border-shark-800 divide-y divide-shark-50 dark:divide-shark-800 overflow-hidden">
                        {consumableCategoryChart.map((item, idx) => {
                          const maxVal = Math.max(...consumableCategoryChart.map((c) => c.value));
                          const pct = maxVal > 0 ? Math.round((item.value / maxVal) * 100) : 0;
                          const colors = ["#0057FF", "#4d83ff", "#80a8ff", "#b3c9ff", "#003fba", "#1A6BFF", "#dde6ff", "#6b7280"];
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
            return null; // Low Stock Alerts hidden
            return (showLowStock || !isSuperAdmin) ? (
              <Card key="low-stock">
                <div className="p-4 sm:p-5">
                  {/* Header */}
                  <Link href={isSuperAdmin ? "/alerts/low-stock" : "/purchase-orders"} className="flex items-center justify-between mb-4 group cursor-pointer">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-[14px] bg-red-50 flex items-center justify-center shrink-0">
                        <Icon name="alert-triangle" size={14} className="text-red-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-shark-900 dark:text-shark-100">Low Stock Alerts</h3>
                        <p className="text-xs text-shark-400">Items below minimum threshold</p>
                      </div>
                    </div>
                    <Icon name="arrow-right" size={16} className="text-shark-400 group-hover:text-action-500 transition-colors" />
                  </Link>
                  {/* Content */}
                  {lowStockItems.length === 0 ? (
                    <div className="bg-white dark:bg-shark-900 rounded-[20px] border border-shark-100 dark:border-shark-800 overflow-hidden">
                      <div className="flex items-center gap-3 px-4 py-3.5">
                        <div className="w-7 h-7 rounded-[14px] bg-action-50 flex items-center justify-center shrink-0">
                          <Icon name="check" size={14} className="text-action-500" />
                        </div>
                        <p className="text-sm text-shark-500 dark:text-shark-400">All stock levels are OK.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-shark-900 rounded-[20px] border border-shark-100 dark:border-shark-800 divide-y divide-shark-50 dark:divide-shark-800 overflow-hidden">
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
                                    item.quantityOnHand === 0 ? "bg-red-500" : item.quantityOnHand <= item.minimumThreshold / 2 ? "bg-red-400" : "bg-action-400"
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
            return null; // Predicted Shortages hidden
            return showPredictions && predictedShortages.length > 0 ? (
              <Card key="predicted-shortages" className="border-action-100">
                <div className="px-5 py-4">
                  {/* Header */}
                  <Link href="/purchase-orders" className="flex items-center justify-between mb-4 group cursor-pointer">
                    <h3 className="text-lg font-bold text-shark-900 dark:text-shark-100">Predicted Shortages</h3>
                    <Icon name="arrow-right" size={16} className="text-shark-400 group-hover:text-action-500 transition-colors shrink-0" />
                  </Link>
                  {/* Items */}
                  <div className="bg-white dark:bg-shark-900 rounded-[20px] border border-shark-100 dark:border-shark-800 divide-y divide-shark-50 dark:divide-shark-800 overflow-hidden">
                    {predictedShortages.map((item) => (
                      <Link key={item.id} href={`/purchase-orders`} className="flex items-center justify-between px-3 py-2.5 hover:bg-shark-50 dark:hover:bg-shark-800 transition-colors cursor-pointer">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.riskLevel === "critical" ? "bg-red-500" : "bg-action-400"}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-shark-800 dark:text-shark-200 truncate">{item.name}</p>
                            <p className="text-xs text-shark-400">{item.regionName} · {item.avgDailyUsage.toFixed(1)}/day usage</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <p className="text-sm font-bold text-shark-900 dark:text-shark-100">{item.quantityOnHand} <span className="text-xs font-normal text-shark-400">{item.unitType}</span></p>
                            {item.daysRemaining !== null && (
                              <span className={`text-xs font-semibold ${item.riskLevel === "critical" ? "text-red-500" : "text-action-500"}`}>
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
            return null; // AI Stock Forecast hidden

          case "recent-activity":
            return showRecentActivity ? (
              <div key="recent-activity">
                <RecentActivityWidget items={recentActivity} />
              </div>
            ) : null;

          case "regional":
            return showRegional && regionBreakdown && regionBreakdown.length > 0 ? (
              <div key="regional" className="space-y-4 mt-10">
                <h3 className="text-lg font-bold text-shark-900 dark:text-shark-100 pl-5">Locations</h3>
                {[...regionBreakdown].sort((a, b) => a.regionName.localeCompare(b.regionName)).map((region) => {
                  const isCollapsed = collapsedRegions.has(region.regionId);
                  return (
                    <div key={region.regionId}>
                      {/* Tappable region label row */}
                      <button
                        onClick={() => toggleRegion(region.regionId)}
                        className="flex items-center gap-1.5 mb-2 pl-5 group"
                      >
                        <p className="text-xs font-semibold text-shark-500 dark:text-shark-400 group-hover:text-shark-700 dark:group-hover:text-shark-200 transition-colors">{region.regionName}</p>
                        <Icon
                          name="chevron-down"
                          size={12}
                          className={`text-shark-400 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`}
                        />
                      </button>
                      {!isCollapsed && (
                        <div className="grid grid-cols-4 gap-2">
                          {([
                            { href: isSuperAdmin ? `/alerts/low-stock?region=${region.regionId}` : "/alerts/low-stock", icon: "alert-triangle" as const, iconColor: "text-red-500",    bg: "bg-red-400/15",    value: region.lowStockCount,   label: "Low Stock" },
                            { href: `/consumables?tab=requests&region=${region.regionId}`,                                                                   icon: "clipboard"      as const, iconColor: "text-action-600", bg: "bg-action-400/15", value: region.pendingRequests, label: "Requests"  },
                            { href: `/returns?region=${region.regionId}`,                                                                                    icon: "arrow-left"     as const, iconColor: "text-action-600", bg: "bg-action-400/15", value: region.overdueReturns,  label: "Returns"   },
                            { href: `/purchase-orders?status=PENDING&region=${region.regionId}`,                                                             icon: "truck"          as const, iconColor: "text-action-600", bg: "bg-action-400/15", value: region.pendingPOs,      label: "POs"       },
                          ] as const).map((tile) => (
                            <Link key={tile.label} href={tile.href} className="block group aspect-square lg:aspect-auto lg:h-24">
                              <div className={`h-full rounded-[20px] backdrop-blur-[20px] border border-white/60 dark:border-white/10 ${tile.bg} shadow-[inset_0_1px_0_rgba(255,255,255,0.80),0_2px_8px_rgba(0,113,227,0.08)] active:scale-95 transition-transform cursor-pointer`}>
                                <div className="p-2 lg:px-4 lg:py-0 h-full">
                                  <div className="flex flex-col items-center justify-center text-center gap-1 h-full lg:flex-row lg:items-center lg:justify-start lg:gap-3">
                                    <div className="flex items-center justify-center flex-shrink-0">
                                      <Icon name={tile.icon} size={20} className={tile.iconColor} />
                                    </div>
                                    <div className="min-w-0 lg:flex-1 lg:text-center">
                                      <AnimatedCounter value={tile.value} className="text-base lg:text-2xl font-bold text-shark-900 dark:text-shark-100 leading-none" />
                                      <p className="text-[11px] font-semibold text-shark-700 dark:text-shark-300 truncate leading-tight">{tile.label}</p>
                                    </div>
                                    <Icon name="arrow-right" size={14} className="text-shark-400 group-hover:text-action-500 transition-colors flex-shrink-0 hidden lg:block" />
                                  </div>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : null;

          case "quick-links":
            return showQuickLinks ? (
              <div key="quick-links" className="grid grid-cols-3 gap-x-5 gap-y-7">
                {quickLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group flex flex-col items-center gap-3 active:scale-[0.94] transition-transform duration-150"
                  >
                    {/* Icon tile — square, fills column width */}
                    <div
                      className={`w-full aspect-square rounded-[22px] flex items-center justify-center ${link.iconBg} group-hover:opacity-80 transition-opacity`}
                    >
                      <Icon name={link.icon} size={40} className={link.iconColor} />
                    </div>
                    {/* Label below tile */}
                    <span className="text-[13px] font-semibold text-shark-800 dark:text-shark-200 text-center leading-tight">
                      {link.label}
                    </span>
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
                            <div className="w-11 h-11 rounded-[20px] bg-action-50 flex items-center justify-center group-hover:scale-105 transition-transform">
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
          } })()}
        </ErrorBoundary>
      ))}

      {/* Storage Locations Map */}
      {isSuperAdmin && showMap && mapLocations.length > 0 && (
        <ErrorBoundary fallback={<div className="rounded-[20px] border border-shark-100 dark:border-shark-800 bg-shark-50 dark:bg-shark-900 p-6 text-center text-sm text-shark-400">Map unavailable</div>}>
        <Card padding="none">
          <div className="px-5 py-4">
            {/* Header */}
            <h3 className="text-lg font-bold text-shark-900 dark:text-shark-100 mb-4">Storage Locations</h3>
            {/* Google Maps embed — no API key needed */}
            <div className="h-[250px] sm:h-[300px] lg:h-[350px] rounded-[20px] overflow-hidden border border-shark-100 dark:border-shark-800 mb-3">
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
            <div className="bg-white dark:bg-shark-900 rounded-[20px] border border-shark-100 dark:border-shark-800 divide-y divide-shark-50 dark:divide-shark-800 overflow-hidden">
              {mapLocations.map((loc) => (
                <a
                  key={loc.id}
                  href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2.5 hover:bg-shark-50 dark:hover:bg-shark-800 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-[14px] bg-action-50 flex items-center justify-center shrink-0">
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
        </ErrorBoundary>
      )}

      {/* ── ZONE 3: MOMENTUM LAYER — System Performance ───────────────── */}
      {operationsOverview && (
        <ErrorBoundary fallback={null}>
        <SystemHealthBar
          healthScore={operationsOverview.healthScore}
          lowStockCount={operationsOverview.lowStockCount}
          overdueReturns={operationsOverview.overdueReturns}
          pendingRequests={operationsOverview.pendingRequests}
          totalStaff={operationsOverview.totalStaff}
          unresolvedDamage={operationsOverview.unresolvedDamage}
        />
        </ErrorBoundary>
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
