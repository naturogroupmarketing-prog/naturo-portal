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
  sectionOrder: string[];
}

export const DASHBOARD_SECTIONS = [
  { id: "stats", label: "Stats Cards" },
  { id: "portfolio", label: "Portfolio Valuation" },
  { id: "maintenance", label: "Maintenance Due" },
  { id: "asset-charts", label: "Asset Charts" },
  { id: "consumable-charts", label: "Consumable Charts" },
  { id: "low-stock", label: "Low Stock Alerts" },
  { id: "regional", label: "Regional Breakdown" },
  { id: "quick-links", label: "Quick Links" },
  { id: "shortcuts", label: "My Shortcuts" },
] as const;

export const DEFAULT_SECTION_ORDER = DASHBOARD_SECTIONS.map((s) => s.id);

export type SectionId = (typeof DASHBOARD_SECTIONS)[number]["id"];

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
  sectionOrder: [...DEFAULT_SECTION_ORDER],
};

export function parsePreferences(raw: unknown): DashboardPreferences {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_PREFERENCES, customShortcuts: [] };
  const obj = raw as Record<string, unknown>;
  const sectionOrder = Array.isArray(obj.sectionOrder) ? obj.sectionOrder as string[] : [...DEFAULT_SECTION_ORDER];
  // Ensure any new sections are appended
  for (const s of DEFAULT_SECTION_ORDER) {
    if (!sectionOrder.includes(s)) sectionOrder.push(s);
  }
  return {
    hiddenWidgets: Array.isArray(obj.hiddenWidgets) ? obj.hiddenWidgets : [],
    customShortcuts: Array.isArray(obj.customShortcuts) ? obj.customShortcuts : [],
    sectionOrder,
  };
}

export const SHORTCUT_ICON_OPTIONS: IconName[] = [
  "package", "droplet", "users", "clipboard", "settings",
  "map-pin", "bar-chart", "lock", "star", "truck",
  "file-text", "shield", "clock", "box", "download",
  "upload", "dashboard",
];
