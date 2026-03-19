import type { IconName } from "@/components/ui/icon";

export interface CustomShortcut {
  id: string;
  label: string;
  href: string;
  icon: IconName;
}

export interface DashboardPreferences {
  hiddenWidgets: string[];
  customShortcuts: CustomShortcut[];
}

export const WIDGET_IDS = {
  STAT_TOTAL_ASSETS: "stat-total-assets",
  STAT_CHECKED_OUT: "stat-checked-out",
  STAT_OVERDUE: "stat-overdue",
  STAT_DAMAGED: "stat-damaged",
  STAT_LOST: "stat-lost",
  STAT_PENDING_REQUESTS: "stat-pending-requests",
  STAT_PENDING_POS: "stat-pending-pos",
  LOW_STOCK_ALERTS: "low-stock-alerts",
  QUICK_LINKS: "quick-links",
  PORTFOLIO_VALUATION: "portfolio-valuation",
} as const;

export type WidgetId = (typeof WIDGET_IDS)[keyof typeof WIDGET_IDS];

export const WIDGET_LABELS: Record<WidgetId, string> = {
  "stat-total-assets": "Total Assets",
  "stat-checked-out": "Checked Out",
  "stat-overdue": "Overdue",
  "stat-damaged": "Damaged",
  "stat-lost": "Lost",
  "stat-pending-requests": "Pending Requests",
  "stat-pending-pos": "Pending POs",
  "low-stock-alerts": "Low Stock Alerts",
  "quick-links": "Quick Links",
  "portfolio-valuation": "Portfolio Valuation",
};

export const DEFAULT_PREFERENCES: DashboardPreferences = {
  hiddenWidgets: [],
  customShortcuts: [],
};

export function parsePreferences(raw: unknown): DashboardPreferences {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_PREFERENCES, customShortcuts: [] };
  const obj = raw as Record<string, unknown>;
  return {
    hiddenWidgets: Array.isArray(obj.hiddenWidgets) ? obj.hiddenWidgets : [],
    customShortcuts: Array.isArray(obj.customShortcuts) ? obj.customShortcuts : [],
  };
}

export const SHORTCUT_ICON_OPTIONS: IconName[] = [
  "package", "droplet", "users", "clipboard", "settings",
  "map-pin", "bar-chart", "lock", "star", "truck",
  "file-text", "shield", "clock", "box", "download",
  "upload", "dashboard",
];
