"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";

interface CommandItem {
  label: string;
  href: string;
  icon: IconName;
  section: string;
  keywords?: string;
}

const RECENT_PAGES_KEY = "trackio-recent-pages";
const MAX_RECENT = 3;

interface RecentPage {
  label: string;
  href: string;
  visitedAt: number;
}

const QUICK_ACTIONS: CommandItem[] = [
  { label: "Add Asset", href: "/assets?action=add", icon: "plus", section: "Quick Actions", keywords: "new asset create" },
  { label: "Add Supply", href: "/consumables?action=add", icon: "plus", section: "Quick Actions", keywords: "new supply create" },
  { label: "Create Purchase Order", href: "/purchase-orders?action=create", icon: "plus", section: "Quick Actions", keywords: "new PO buy order create" },
  { label: "Manage Staff", href: "/staff", icon: "users", section: "Quick Actions", keywords: "employees team manage" },
];

const COMMANDS: CommandItem[] = [
  // Navigation
  { label: "Dashboard", href: "/dashboard", icon: "dashboard", section: "Navigation", keywords: "home overview" },
  { label: "Inventory", href: "/inventory", icon: "package", section: "Navigation", keywords: "assets supplies equipment items stock inventory locations regions" },
  { label: "Supplies", href: "/consumables", icon: "droplet", section: "Navigation", keywords: "supplies consumables stock PPE items manage" },
  { label: "Staff", href: "/staff", icon: "users", section: "Navigation", keywords: "employees team" },
  { label: "Purchase Orders", href: "/purchase-orders", icon: "truck", section: "Navigation", keywords: "PO buy order" },
  { label: "Returns", href: "/returns", icon: "arrow-left", section: "Navigation", keywords: "return verify" },
  { label: "Reports", href: "/reports", icon: "clipboard", section: "Navigation", keywords: "export csv" },
  { label: "Inspections", href: "/condition-checks", icon: "search", section: "Navigation", keywords: "condition check photo" },
  { label: "Starter Kits", href: "/starter-kits", icon: "box", section: "Navigation", keywords: "kit onboard" },
  { label: "Maintenance", href: "/maintenance", icon: "settings", section: "Navigation", keywords: "schedule service" },
  // Admin
  { label: "Permissions", href: "/admin/permissions", icon: "lock", section: "Admin", keywords: "role access" },
  { label: "Import Data", href: "/admin/import", icon: "upload", section: "Admin", keywords: "csv bulk" },
  { label: "Activity Log", href: "/activity", icon: "clock", section: "Admin", keywords: "audit trail history" },
  { label: "Billing", href: "/admin/billing", icon: "star", section: "Admin", keywords: "plan subscription upgrade" },
  // Settings
  { label: "Settings", href: "/settings", icon: "settings", section: "Account", keywords: "profile preferences password" },
];

function getRecentPages(): RecentPage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_PAGES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentPage[];
  } catch {
    return [];
  }
}

function saveRecentPage(pathname: string) {
  if (typeof window === "undefined") return;
  // Find a matching command to get a nice label
  const allCommands = [...COMMANDS, ...QUICK_ACTIONS];
  const basePath = pathname.split("?")[0];
  const match = allCommands.find((c) => c.href.split("?")[0] === basePath);
  const label = match?.label ?? (basePath.replace(/^\//, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Home");

  try {
    const existing = getRecentPages().filter((p) => p.href !== pathname);
    const updated: RecentPage[] = [{ label, href: pathname, visitedAt: Date.now() }, ...existing].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_PAGES_KEY, JSON.stringify(updated));
  } catch {
    // localStorage may be unavailable
  }
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentPages, setRecentPages] = useState<RecentPage[]>([]);
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);

  // Track page visits
  useEffect(() => {
    if (pathname && pathname !== "/") {
      saveRecentPage(pathname);
    }
  }, [pathname]);

  // Load recent pages when palette opens
  useEffect(() => {
    if (open) {
      setRecentPages(getRecentPages());
    }
  }, [open]);

  // Cmd+K / Ctrl+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
        setQuery("");
        setSelectedIndex(0);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const isSearching = query.trim().length > 0;

  // When searching, include both COMMANDS and QUICK_ACTIONS in the filter
  const filtered = isSearching
    ? [...COMMANDS, ...QUICK_ACTIONS].filter((c) => {
        const q = query.toLowerCase();
        return c.label.toLowerCase().includes(q) || c.keywords?.toLowerCase().includes(q);
      })
    : COMMANDS;

  // Build recent items as CommandItems (only when not searching)
  const recentItems: CommandItem[] = !isSearching
    ? recentPages
        .filter((r) => r.href !== pathname) // Don't show the current page
        .map((r) => ({
          label: r.label,
          href: r.href,
          icon: "clock" as IconName,
          section: "Recent",
        }))
    : [];

  // Build the grouped structure with Recent and Quick Actions first
  const grouped: Record<string, CommandItem[]> = {};

  if (recentItems.length > 0) {
    grouped["Recent"] = recentItems;
  }

  if (!isSearching) {
    grouped["Quick Actions"] = QUICK_ACTIONS;
  }

  // Add the filtered navigation/admin/account groups
  for (const item of filtered) {
    if (!grouped[item.section]) grouped[item.section] = [];
    grouped[item.section].push(item);
  }

  const flatList = Object.values(grouped).flat();

  const navigate = useCallback((href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  }, [router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, flatList.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && flatList[selectedIndex]) {
      e.preventDefault();
      navigate(flatList[selectedIndex].href);
    }
  };

  if (!open) return null;

  let flatIdx = -1;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-white dark:bg-shark-900 rounded-2xl shadow-2xl border border-shark-200 dark:border-shark-700 overflow-hidden animate-fade-in">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-shark-100 dark:border-shark-800">
          <Icon name="search" size={18} className="text-shark-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search pages and actions..."
            className="flex-1 bg-transparent text-sm text-shark-900 dark:text-shark-100 placeholder-shark-400 outline-none"
          />
          <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] text-shark-400 bg-shark-100 dark:bg-shark-800 px-1.5 py-0.5 rounded font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {flatList.length === 0 ? (
            <p className="text-sm text-shark-400 text-center py-8">No results found</p>
          ) : (
            Object.entries(grouped).map(([section, items]) => (
              <div key={section}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-shark-400 px-3 py-2">{section}</p>
                {items.map((item) => {
                  flatIdx++;
                  const idx = flatIdx;
                  return (
                    <button
                      key={`${section}-${item.href}`}
                      onClick={() => navigate(item.href)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        selectedIndex === idx
                          ? "bg-action-500 text-white"
                          : "text-shark-700 dark:text-shark-300 hover:bg-shark-50 dark:hover:bg-shark-800"
                      }`}
                    >
                      <Icon name={item.icon} size={16} className={selectedIndex === idx ? "text-white" : "text-shark-400"} />
                      <span className="flex-1 text-left">{item.label}</span>
                      {selectedIndex === idx && (
                        <span className="text-xs opacity-60">Enter</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-shark-100 dark:border-shark-800 px-4 py-2 flex items-center gap-4 text-[10px] text-shark-400">
          <span className="flex items-center gap-1"><kbd className="bg-shark-100 dark:bg-shark-800 px-1 rounded">&uarr;</kbd><kbd className="bg-shark-100 dark:bg-shark-800 px-1 rounded">&darr;</kbd> Navigate</span>
          <span className="flex items-center gap-1"><kbd className="bg-shark-100 dark:bg-shark-800 px-1 rounded">Enter</kbd> Open</span>
          <span className="flex items-center gap-1"><kbd className="bg-shark-100 dark:bg-shark-800 px-1 rounded">Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  );
}
