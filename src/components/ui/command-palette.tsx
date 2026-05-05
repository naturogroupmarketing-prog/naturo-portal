"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";

// ── Static navigation items ───────────────────────────────────────────────

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
  { label: "Add Asset",             href: "/assets?action=add",           icon: "plus",      section: "Quick Actions", keywords: "new asset create" },
  { label: "Add Supply",            href: "/consumables?action=add",       icon: "plus",      section: "Quick Actions", keywords: "new supply create" },
  { label: "Create Purchase Order", href: "/purchase-orders?action=create",icon: "plus",      section: "Quick Actions", keywords: "new PO buy order create" },
  { label: "Manage Staff",          href: "/staff",                        icon: "users",     section: "Quick Actions", keywords: "employees team manage" },
];

const COMMANDS: CommandItem[] = [
  { label: "Dashboard",       href: "/dashboard",         icon: "dashboard", section: "Navigation", keywords: "home overview" },
  { label: "Inventory",       href: "/inventory",         icon: "package",   section: "Navigation", keywords: "assets supplies equipment items stock inventory locations regions" },
  { label: "Supplies",        href: "/consumables",       icon: "droplet",   section: "Navigation", keywords: "supplies consumables stock PPE items manage" },
  { label: "Staff",           href: "/staff",             icon: "users",     section: "Navigation", keywords: "employees team" },
  { label: "Purchase Orders", href: "/purchase-orders",   icon: "truck",     section: "Navigation", keywords: "PO buy order" },
  { label: "Returns",         href: "/returns",           icon: "arrow-left",section: "Navigation", keywords: "return verify" },
  { label: "Reports",         href: "/reports",           icon: "clipboard", section: "Navigation", keywords: "export csv" },
  { label: "Inspections",     href: "/condition-checks",  icon: "search",    section: "Navigation", keywords: "condition check photo" },
  { label: "Starter Kits",    href: "/starter-kits",      icon: "box",       section: "Navigation", keywords: "kit onboard" },
  { label: "Maintenance",     href: "/maintenance",       icon: "settings",  section: "Navigation", keywords: "schedule service" },
  { label: "Permissions",     href: "/admin/permissions", icon: "lock",      section: "Admin",       keywords: "role access" },
  { label: "Import Data",     href: "/admin/import",      icon: "upload",    section: "Admin",       keywords: "csv bulk" },
  { label: "Activity Log",    href: "/activity",          icon: "clock",     section: "Admin",       keywords: "audit trail history" },
  { label: "Support Access",  href: "/settings/support-access", icon: "shield", section: "Admin",  keywords: "support access security audit agent session" },
  { label: "Billing",         href: "/admin/billing",     icon: "star",      section: "Admin",       keywords: "plan subscription upgrade" },
  { label: "Settings",        href: "/settings",          icon: "settings",  section: "Account",     keywords: "profile preferences password" },
];

// ── Search result types ───────────────────────────────────────────────────

interface SearchAsset {
  id: string;
  name: string;
  assetCode: string;
  status: string;
  category: string;
  region: { name: string } | null;
  assignments: { user: { name: string | null } }[];
}

interface SearchConsumable {
  id: string;
  name: string;
  quantityOnHand: number;
  minimumThreshold: number;
  unitType: string;
  category: string;
  region: { name: string } | null;
}

interface SearchUser {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  region: { name: string } | null;
}

interface SearchResults {
  assets: SearchAsset[];
  consumables: SearchConsumable[];
  users: SearchUser[];
}

// ── Status helpers ────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE:     "Available",
  ASSIGNED:      "Assigned",
  CHECKED_OUT:   "Checked Out",
  PENDING_RETURN:"Pending Return",
  DAMAGED:       "Damaged",
  LOST:          "Lost",
  UNAVAILABLE:   "Unavailable",
};

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE:     "bg-green-100 text-green-700",
  ASSIGNED:      "bg-blue-100 text-blue-700",
  CHECKED_OUT:   "bg-orange-100 text-orange-700",
  PENDING_RETURN:"bg-yellow-100 text-yellow-700",
  DAMAGED:       "bg-red-100 text-red-700",
  LOST:          "bg-red-100 text-red-700",
  UNAVAILABLE:   "bg-shark-100 text-shark-500",
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN:   "Super Admin",
  BRANCH_MANAGER:"Manager",
  STAFF:         "Staff",
  AUDITOR:       "Auditor",
};

function stockBadge(c: SearchConsumable) {
  if (c.quantityOnHand === 0)
    return { label: "Out of stock", cls: "bg-red-100 text-red-700" };
  if (c.quantityOnHand <= c.minimumThreshold)
    return { label: "Low stock",    cls: "bg-amber-100 text-amber-700" };
  return { label: `${c.quantityOnHand} ${c.unitType}`, cls: "bg-green-100 text-green-700" };
}

// ── Recent-page helpers ───────────────────────────────────────────────────

function getRecentPages(): RecentPage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_PAGES_KEY);
    return raw ? (JSON.parse(raw) as RecentPage[]) : [];
  } catch { return []; }
}

function saveRecentPage(pathname: string) {
  if (typeof window === "undefined") return;
  const allCommands = [...COMMANDS, ...QUICK_ACTIONS];
  const basePath = pathname.split("?")[0];
  const match = allCommands.find((c) => c.href.split("?")[0] === basePath);
  const label =
    match?.label ??
    (basePath.replace(/^\//, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Home");
  try {
    const existing = getRecentPages().filter((p) => p.href !== pathname);
    const updated: RecentPage[] = [{ label, href: pathname, visitedAt: Date.now() }, ...existing].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_PAGES_KEY, JSON.stringify(updated));
  } catch {}
}

// ── Main component ────────────────────────────────────────────────────────

export function CommandPalette() {
  const [open, setOpen]               = useState(false);
  const [query, setQuery]             = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentPages, setRecentPages] = useState<RecentPage[]>([]);

  // AI search state
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const router   = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);

  // Track page visits
  useEffect(() => {
    if (pathname && pathname !== "/") saveRecentPage(pathname);
  }, [pathname]);

  // Load recent pages when palette opens
  useEffect(() => {
    if (open) setRecentPages(getRecentPages());
  }, [open]);

  // Cmd+K / Ctrl+K global shortcut
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
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  // Clear results when closed
  useEffect(() => {
    if (!open) {
      setSearchResults(null);
      setSearchLoading(false);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    }
  }, [open]);

  // Debounced AI search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/ai/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json() as SearchResults;
          setSearchResults(data);
        }
      } catch {}
      setSearchLoading(false);
    }, 280);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const isSearching = query.trim().length > 0;

  // Filtered navigation items
  const filtered = isSearching
    ? [...COMMANDS, ...QUICK_ACTIONS].filter((c) => {
        const q = query.toLowerCase();
        return c.label.toLowerCase().includes(q) || c.keywords?.toLowerCase().includes(q);
      })
    : COMMANDS;

  const recentItems: CommandItem[] = !isSearching
    ? recentPages
        .filter((r) => r.href !== pathname)
        .map((r) => ({ label: r.label, href: r.href, icon: "clock" as IconName, section: "Recent" }))
    : [];

  const grouped: Record<string, CommandItem[]> = {};
  if (recentItems.length > 0) grouped["Recent"] = recentItems;
  if (!isSearching) grouped["Quick Actions"] = QUICK_ACTIONS;
  for (const item of filtered) {
    if (!grouped[item.section]) grouped[item.section] = [];
    grouped[item.section].push(item);
  }

  const flatList = Object.values(grouped).flat();

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router]
  );

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

  const hasResults =
    searchResults &&
    (searchResults.assets.length > 0 ||
      searchResults.consumables.length > 0 ||
      searchResults.users.length > 0);

  let flatIdx = -1;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[12vh]">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/35 backdrop-blur-md"
        onClick={() => setOpen(false)}
      />

      {/* Panel */}
      <div className="relative w-full max-w-xl backdrop-blur-2xl bg-white/72 dark:bg-shark-800/80 rounded-[24px] border border-white/65 dark:border-white/[0.08] shadow-[0_2px_40px_rgba(100,140,220,0.26),0_1px_0_rgba(255,255,255,0.90)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.20),0_16px_48px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)] overflow-hidden animate-fade-in">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/60 dark:border-white/[0.08]">
          {searchLoading ? (
            <svg className="animate-spin w-[18px] h-[18px] shrink-0 text-action-500" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" />
              <path d="M8 1.5a6.5 6.5 0 016.5 6.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          ) : (
            <Icon name="search" size={18} className="text-shark-400 shrink-0" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search assets, staff, supplies… or any page"
            className="flex-1 bg-transparent text-sm text-shark-900 dark:text-shark-100 placeholder-shark-400 outline-none"
          />
          {isSearching && (
            <span className="hidden sm:flex items-center gap-1 text-[10px] text-shark-400 bg-action-50 text-action-600 px-1.5 py-0.5 rounded-full font-medium shrink-0">
              AI
            </span>
          )}
          <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] text-shark-400 bg-shark-100 dark:bg-shark-800 px-1.5 py-0.5 rounded font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[56vh] overflow-y-auto">

          {/* ── AI search results ── */}
          {isSearching && (hasResults || searchLoading) && (
            <div className="p-2 border-b border-white/60 dark:border-white/[0.08]">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-action-500 px-3 py-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-action-400 animate-pulse" />
                Live Results
              </p>

              {searchLoading && !hasResults && (
                <div className="px-3 py-4 text-sm text-shark-400 text-center">Searching…</div>
              )}

              {/* Assets */}
              {searchResults && searchResults.assets.map((asset) => (
                <button
                  key={`a-${asset.id}`}
                  onClick={() => navigate(`/assets?search=${encodeURIComponent(asset.name)}`)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-[10px] hover:bg-white/60 dark:hover:bg-white/[0.06] transition-colors text-left group"
                >
                  {/* Icon */}
                  <div className="w-7 h-7 rounded-lg bg-white/70 border border-white/80 flex items-center justify-center shrink-0">
                    <Icon name="package" size={13} className="text-action-500" />
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-shark-800 dark:text-shark-200 truncate">{asset.name}</p>
                    <p className="text-[11px] text-shark-400 truncate">
                      {asset.assetCode}
                      {asset.category && ` · ${asset.category}`}
                      {asset.region?.name && ` · ${asset.region.name}`}
                      {asset.assignments[0]?.user?.name && ` · ${asset.assignments[0].user.name}`}
                    </p>
                  </div>
                  {/* Status badge */}
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[asset.status] ?? "bg-shark-100 text-shark-500"}`}>
                    {STATUS_LABELS[asset.status] ?? asset.status}
                  </span>
                  <Icon name="arrow-right" size={12} className="text-shark-300 group-hover:text-action-500 transition-colors shrink-0" />
                </button>
              ))}

              {/* Consumables */}
              {searchResults && searchResults.consumables.map((c) => {
                const badge = stockBadge(c);
                return (
                  <button
                    key={`c-${c.id}`}
                    onClick={() => navigate(`/consumables?search=${encodeURIComponent(c.name)}`)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-[10px] hover:bg-white/60 dark:hover:bg-white/[0.06] transition-colors text-left group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-white/70 border border-white/80 flex items-center justify-center shrink-0">
                      <Icon name="droplet" size={13} className="text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-shark-800 dark:text-shark-200 truncate">{c.name}</p>
                      <p className="text-[11px] text-shark-400 truncate">
                        {c.category}
                        {c.region?.name && ` · ${c.region.name}`}
                      </p>
                    </div>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${badge.cls}`}>
                      {badge.label}
                    </span>
                    <Icon name="arrow-right" size={12} className="text-shark-300 group-hover:text-action-500 transition-colors shrink-0" />
                  </button>
                );
              })}

              {/* Users */}
              {searchResults && searchResults.users.map((u) => (
                <button
                  key={`u-${u.id}`}
                  onClick={() => navigate(`/staff?search=${encodeURIComponent(u.name ?? u.email ?? "")}`)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-[10px] hover:bg-white/60 dark:hover:bg-white/[0.06] transition-colors text-left group"
                >
                  <div className="w-7 h-7 rounded-full bg-white/70 border border-white/80 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-indigo-500">
                      {(u.name ?? u.email ?? "?").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-shark-800 dark:text-shark-200 truncate">{u.name ?? "—"}</p>
                    <p className="text-[11px] text-shark-400 truncate">
                      {u.email}
                      {u.region?.name && ` · ${u.region.name}`}
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 bg-indigo-50 text-indigo-600">
                    {ROLE_LABELS[u.role] ?? u.role}
                  </span>
                  <Icon name="arrow-right" size={12} className="text-shark-300 group-hover:text-action-500 transition-colors shrink-0" />
                </button>
              ))}

              {/* No results */}
              {searchResults && !hasResults && !searchLoading && (
                <p className="px-3 py-3 text-sm text-shark-400">
                  No assets, supplies, or staff matched &ldquo;{query}&rdquo;
                </p>
              )}
            </div>
          )}

          {/* ── Navigation items ── */}
          <div className="p-2">
            {flatList.length === 0 && !isSearching ? (
              <p className="text-sm text-shark-400 text-center py-8">No results found</p>
            ) : (
              Object.entries(grouped).map(([section, items]) => (
                <div key={section}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-shark-400 px-3 py-2">
                    {section}
                  </p>
                  {items.map((item) => {
                    flatIdx++;
                    const idx = flatIdx;
                    return (
                      <button
                        key={`${section}-${item.href}`}
                        onClick={() => navigate(item.href)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm transition-colors ${
                          selectedIndex === idx
                            ? "bg-[#1c1d2e] text-white shadow-[0_2px_8px_rgba(20,21,40,0.22)]"
                            : "text-shark-700 dark:text-shark-300 hover:bg-white/60 dark:hover:bg-white/[0.06]"
                        }`}
                      >
                        <Icon
                          name={item.icon}
                          size={16}
                          className={selectedIndex === idx ? "text-white" : "text-shark-400"}
                        />
                        <span className="flex-1 text-left">{item.label}</span>
                        {selectedIndex === idx && <span className="text-xs opacity-60">Enter</span>}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/60 dark:border-white/[0.08] px-4 py-2 flex items-center gap-4 text-[10px] text-shark-400">
          <span className="flex items-center gap-1">
            <kbd className="bg-white/70 dark:bg-white/[0.07] border border-white/80 dark:border-white/[0.10] px-1 rounded-md">&uarr;</kbd>
            <kbd className="bg-white/70 dark:bg-white/[0.07] border border-white/80 dark:border-white/[0.10] px-1 rounded-md">&darr;</kbd> Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-white/70 dark:bg-white/[0.07] border border-white/80 dark:border-white/[0.10] px-1 rounded-md">Enter</kbd> Open
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-white/70 dark:bg-white/[0.07] border border-white/80 dark:border-white/[0.10] px-1 rounded-md">Esc</kbd> Close
          </span>
          {isSearching && (
            <span className="ml-auto text-action-400 font-medium">Powered by AI</span>
          )}
        </div>
      </div>
    </div>
  );
}
