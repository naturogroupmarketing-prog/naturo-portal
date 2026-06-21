"use client";

import { useState, useRef, useCallback, useEffect, createContext, useContext } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { BottomNav } from "./bottom-nav";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { BreadcrumbProvider } from "@/components/ui/breadcrumb-context";
import { PageCogProvider } from "./page-cog-context";
import { Role } from "@/generated/prisma/browser";
import { QuickActionsFab } from "@/components/ui/quick-actions-fab";

interface AppShellProps {
  children: React.ReactNode;
  role: Role;
  userName?: string | null;
  userImage?: string | null;
  pendingPOCount?: number;
  pendingReturnsCount?: number;
  orgName?: string;
  orgLogo?: string | null;
}

// Context so child pages can know if sidebar is expanded (kept for compatibility)
export const SidebarContext = createContext<{ expanded: boolean; toggle: () => void }>({ expanded: true, toggle: () => {} });
export const useSidebar = () => useContext(SidebarContext);

export function AppShell({ children, role, userName, userImage, pendingPOCount = 0, pendingReturnsCount = 0, orgName, orgLogo }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Desktop contextual nav ──
  // The expanded menu shows ONLY the active rail section's items — and nothing
  // for single-destination sections like Home (which just shows the dashboard).
  // Lifted here so the panel can sit INSIDE the same rounded card as <main>.
  const pathname = usePathname();
  const navSecs = getNavConfig(role, pendingPOCount, pendingReturnsCount).filter((s) => s.roles.includes(role));
  const routeSectionId = navSecs.find((s) =>
    s.sections.flatMap((p) => p.items).some((i) => pathname === i.href || pathname.startsWith(i.href + "/"))
  )?.id ?? "home";
  const [activeRail, setActiveRail] = useState<string | null>(null);
  // Sync the open panel to the current route (deep-links / in-content navigation).
  // Single-destination sections (Home, Staff) open no menu; multi-page sections do.
  useEffect(() => {
    const sec = navSecs.find((s) => s.id === routeSectionId);
    setActiveRail(sec && !sectionIsDirect(sec) ? routeSectionId : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeSectionId]);

  // Swipe-to-close sidebar
  const touchStartX = useRef(0);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta < -60) setSidebarOpen(false);
  }, []);

  // Swipe from left edge to open sidebar
  const mainTouchStartX = useRef(0);
  const handleMainTouchStart = useCallback((e: React.TouchEvent) => {
    mainTouchStartX.current = e.touches[0].clientX;
  }, []);
  const handleMainTouchEnd = useCallback((e: React.TouchEvent) => {
    const startX = mainTouchStartX.current;
    const delta = e.changedTouches[0].clientX - startX;
    if (startX < 20 && delta > 60) setSidebarOpen(true);
  }, []);

  return (
    <BreadcrumbProvider>
    <PageCogProvider>
    <SidebarContext.Provider value={{ expanded: true, toggle: () => {} }}>
    {/* Outermost: solid background */}
    <div
      className="relative h-dvh overflow-hidden bg-[#F7F7F7] lg:bg-[#E6E6E9] dark:bg-shark-950"
    >
      {/* No overlay needed — solid bg */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{ zIndex: 0 }}
      />

      {/* App content */}
      <div
        className="relative flex flex-col h-dvh transition-colors"
        style={{ zIndex: 1 }}
        onTouchStart={handleMainTouchStart}
        onTouchEnd={handleMainTouchEnd}
      >

      {/* Skip to main content — accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-action-500 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>

      {/* Top bar — full width across the entire screen */}
      <Header
        userName={userName}
        userImage={userImage}
        role={role}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        orgName={orgName}
        orgLogo={orgLogo}
      />

      {/* Below header: sidebar + content */}
      {/* ── Workspace row: bordered nav rail + plain content ── */}
      <div className="flex flex-1 overflow-hidden lg:p-2 lg:gap-2">

        {/* Desktop icon rail — separate dark card */}
        <DesktopNav
          role={role}
          activeRail={activeRail}
          setActiveRail={setActiveRail}
          routeSectionId={routeSectionId}
          pendingPOCount={pendingPOCount}
          pendingReturnsCount={pendingReturnsCount}
        />

        {/* Combined content card — secondary nav + main share ONE rounded panel (Sophiie-style) */}
        <div className="flex flex-1 overflow-hidden lg:rounded-[12px] lg:border lg:border-black/[0.05] dark:lg:border-white/[0.06] lg:shadow-[0_2px_8px_rgba(0,0,0,0.06)] lg:bg-white dark:lg:bg-shark-900">

          {/* Desktop secondary nav — contextual: only the active section's items */}
          {activeRail && (
            <DesktopPanel
              role={role}
              activeRail={activeRail}
              pendingPOCount={pendingPOCount}
              pendingReturnsCount={pendingReturnsCount}
            />
          )}

        {/* Main content wrapper — no border, plain bg */}
        <div className="flex flex-1 overflow-hidden">

          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setSidebarOpen(false)}
              />
              <div
                className="fixed inset-y-0 left-0 w-[min(16rem,85vw)] bg-[#1b1b1b] border-r border-white/[0.06] z-50 shadow-[4px_0_32px_rgba(0,0,0,0.30)]"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <Sidebar role={role} pendingPOCount={pendingPOCount} pendingReturnsCount={pendingReturnsCount} orgName={orgName} onClose={() => setSidebarOpen(false)} />
              </div>
            </div>
          )}

          {/* Main content */}
          <main
            id="main-content"
            style={{ paddingBottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))" }}
            className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-5 sm:px-5 sm:py-6 lg:px-6 lg:py-10 lg:pb-12 bg-[#F7F7F7] dark:bg-shark-900"
          >
            <Breadcrumbs />
            {children}
          </main>
        </div>
        </div>
      </div>

      {/* Bottom navigation — all roles, mobile only */}
      <BottomNav role={role} pendingPOCount={pendingPOCount} pendingReturnsCount={pendingReturnsCount} />

      {/* Floating Quick Actions button — admins/managers, desktop only */}
      {(role === "SUPER_ADMIN" || role === "BRANCH_MANAGER") && (
        <div className="hidden lg:block">
          <QuickActionsFab />
        </div>
      )}
      </div>{/* end content layer */}
    </div>{/* end background wrapper */}
    </SidebarContext.Provider>
    </PageCogProvider>
    </BreadcrumbProvider>
  );
}

/* ── Desktop two-panel nav (ClickUp style) ── */
import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

interface PanelNavItem { label: string; href: string; icon: IconName; badge?: number }
interface PanelSection { heading?: string; items: PanelNavItem[] }
interface RailSection { id: string; icon: IconName; label: string; short?: string; sections: PanelSection[]; roles: Role[] }

function getNavConfig(role: Role, pendingPOCount: number, pendingReturnsCount: number): RailSection[] {
  return [
    {
      id: "home",
      icon: "home",
      label: "Home",
      roles: ["SUPER_ADMIN", "BRANCH_MANAGER", "STAFF", "AUDITOR"],
      sections: [{ items: [{ label: "Dashboard", href: "/dashboard", icon: "home" }] }],
    },
    {
      id: "supplies",
      icon: "droplet",
      label: "Supplies",
      roles: ["SUPER_ADMIN", "BRANCH_MANAGER"],
      sections: [{ items: [{ label: "Supplies", href: "/inventory", icon: "droplet" }] }],
    },
    {
      id: "returns",
      icon: "arrow-left",
      label: "Returns",
      roles: ["SUPER_ADMIN", "BRANCH_MANAGER"],
      sections: [{ items: [{ label: "Returns", href: "/returns", icon: "arrow-left", badge: pendingReturnsCount }] }],
    },
    {
      id: "starter-kits",
      icon: "box",
      label: "Starter Kits",
      short: "Kits",
      roles: ["SUPER_ADMIN", "BRANCH_MANAGER"],
      sections: [{ items: [{ label: "Starter Kits", href: "/starter-kits", icon: "box" }] }],
    },
    {
      id: "purchase-orders",
      icon: "truck",
      label: "Purchase Orders",
      short: "Orders",
      roles: ["SUPER_ADMIN", "BRANCH_MANAGER"],
      sections: [{ items: [{ label: "Purchase Orders", href: "/purchase-orders", icon: "truck", badge: pendingPOCount }] }],
    },
    {
      id: "staff",
      icon: "users",
      label: "Staff",
      roles: ["SUPER_ADMIN", "BRANCH_MANAGER"],
      sections: [{ items: [{ label: "Staff", href: "/staff", icon: "users" }] }],
    },
    {
      id: "training",
      icon: "graduation-cap",
      label: "Training",
      roles: ["SUPER_ADMIN", "BRANCH_MANAGER"],
      sections: [{ items: [{ label: "Staff Induction & Training", href: "/training", icon: "graduation-cap" }] }],
    },
    {
      // Managers & auditors reach reports directly from the rail; for super
      // admins these live inside the Admin menu (below).
      id: "reports",
      icon: "bar-chart",
      label: "Reports",
      roles: ["BRANCH_MANAGER", "AUDITOR"],
      sections: [
        {
          items: [
            { label: "Reports", href: "/reports", icon: "bar-chart" },
            { label: "Activity Log", href: "/activity", icon: "clock" },
            { label: "Inspections", href: "/condition-checks", icon: "search" },
            { label: "Anomalies", href: "/alerts/anomalies", icon: "alert-triangle" },
          ],
        },
      ],
    },
    {
      id: "admin",
      icon: "shield",
      label: "Admin",
      roles: ["SUPER_ADMIN"],
      sections: [
        {
          heading: "Reports",
          items: [
            { label: "Reports", href: "/reports", icon: "bar-chart" },
            { label: "Activity Log", href: "/activity", icon: "clock" },
            { label: "Inspections", href: "/condition-checks", icon: "search" },
            { label: "Anomalies", href: "/alerts/anomalies", icon: "alert-triangle" },
          ],
        },
        {
          heading: "Administration",
          items: [
            { label: "Permissions", href: "/admin/permissions", icon: "lock" },
            { label: "Import Data", href: "/admin/import", icon: "upload" },
            { label: "Maintenance", href: "/maintenance", icon: "wrench" },
            { label: "Support Access", href: "/settings/support-access", icon: "shield" },
            { label: "Workflows", href: "/admin/workflows", icon: "git-branch" },
          ],
        },
      ],
    },
    // Staff sections
    {
      id: "my-items",
      icon: "package",
      label: "My Items",
      roles: ["STAFF"],
      sections: [
        {
          items: [
            { label: "My Assets", href: "/my-assets", icon: "package" },
            { label: "My Supplies", href: "/my-consumables", icon: "droplet" },
          ],
        },
      ],
    },
    {
      id: "actions",
      icon: "plus",
      label: "Actions",
      roles: ["STAFF"],
      sections: [
        {
          items: [
            { label: "Request & Confirm", href: "/request-consumables", icon: "plus" },
            { label: "Report Damage", href: "/report-damage", icon: "alert-triangle" },
            { label: "Recent Activity", href: "/my-activity", icon: "clock" },
          ],
        },
      ],
    },
    {
      id: "settings",
      icon: "settings",
      label: "Settings",
      roles: ["SUPER_ADMIN", "BRANCH_MANAGER"],
      sections: [{ items: [{ label: "Settings", href: "/settings", icon: "settings" }] }],
    },
  ];
}

// Single-destination sections (Home, Staff) navigate straight to their page —
// no expanded menu. Multi-page sections (Manage/Reports/Admin) open a menu.
function sectionIsDirect(section: RailSection): boolean {
  const itemCount = section.sections.reduce((n, sub) => n + sub.items.length, 0);
  const hasHeadings = section.sections.some((sub) => !!sub.heading);
  return itemCount <= 1 && !hasHeadings;
}

function DesktopNav({ role, activeRail, setActiveRail, routeSectionId, pendingPOCount = 0, pendingReturnsCount = 0 }: {
  role: Role;
  activeRail: string | null;
  setActiveRail: (value: string | null | ((prev: string | null) => string | null)) => void;
  routeSectionId: string;
  pendingPOCount?: number; pendingReturnsCount?: number;
}) {
  const pathname = usePathname();
  const allSections = getNavConfig(role, pendingPOCount, pendingReturnsCount);
  const visibleSections = allSections.filter((s) => s.roles.includes(role));

  // Highlight the open panel's section, else the section that owns the current route
  const highlightId = activeRail ?? routeSectionId;

  // Settings is pinned at the bottom (Sophiie layout), so keep it out of the top list
  const topSections = visibleSections.filter((s) => s.id !== "settings");
  const settingsActive = pathname.startsWith("/settings");

  // Dark icon rail — replicates Sophiie's gradient strip (62px, white active tile, 8.5px labels)
  return (
      <aside className="hidden lg:flex flex-shrink-0 w-[62px] flex-col overflow-hidden rounded-[8px] bg-gradient-to-b from-[#2e2e2e] via-[#191919] to-[#080808] shadow-[0_10px_34px_rgba(0,0,0,0.30)]">
        {/* Rail nav items — clicking any item toggles the panel */}
        <nav className="flex flex-1 flex-col items-center gap-1.5 overflow-y-auto px-1 pt-2.5">
          {topSections.map((section) => {
            const active = section.id === highlightId;
            // Single-destination sections (Home, Staff) navigate straight to their
            // page; multi-page sections open their contextual menu.
            const isDirect = sectionIsDirect(section);
            const firstHref = section.sections.flatMap((p) => p.items)[0]?.href ?? "/dashboard";
            const railBadge = section.sections.flatMap((p) => p.items).reduce((n, i) => n + (i.badge ?? 0), 0);
            const railClass = "group flex w-full flex-col items-center gap-0.5 rounded-lg px-0.5";
            const inner = (
              <>
                <span
                  className={cn(
                    "relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-150",
                    active ? "bg-white shadow-sm" : "group-hover:bg-white/15"
                  )}
                >
                  <Icon name={section.icon} size={20} className={active ? "text-[#2d2d2d]" : "text-white"} />
                  {railBadge > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-red-500 px-1 text-[8px] font-bold leading-none text-white ring-2 ring-[#191919]">
                      {railBadge > 99 ? "99+" : railBadge}
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "w-full truncate text-center text-[8.5px] leading-tight",
                    active ? "font-semibold text-white" : "font-medium text-white/80 group-hover:text-white"
                  )}
                >
                  {section.short ?? section.label}
                </span>
              </>
            );
            // Home navigates straight to the dashboard; all other sections open
            // their contextual menu in the shared card.
            return isDirect ? (
              <Link
                key={section.id}
                href={firstHref}
                title={section.label}
                aria-current={active ? "page" : undefined}
                onClick={() => setActiveRail(null)}
                className={railClass}
              >
                {inner}
              </Link>
            ) : (
              <button
                key={section.id}
                type="button"
                title={section.label}
                aria-current={active ? "page" : undefined}
                onClick={() => setActiveRail((prev) => (prev === section.id ? null : section.id))}
                className={railClass}
              >
                {inner}
              </button>
            );
          })}
        </nav>

        {/* Settings pinned at bottom — divider above, same tile style */}
        <div className="mt-1 border-t border-white/15 px-1 pb-2.5 pt-2">
          <Link
            href="/settings"
            title="Settings"
            aria-current={settingsActive ? "page" : undefined}
            className="group flex w-full flex-col items-center gap-0.5 rounded-lg px-0.5"
          >
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-150",
                settingsActive ? "bg-white shadow-sm" : "group-hover:bg-white/15"
              )}
            >
              <Icon name="settings" size={20} className={settingsActive ? "text-[#2d2d2d]" : "text-white"} />
            </span>
            <span
              className={cn(
                "w-full truncate text-center text-[8.5px] leading-tight",
                settingsActive ? "font-semibold text-white" : "font-medium text-white/80 group-hover:text-white"
              )}
            >
              Settings
            </span>
          </Link>
        </div>
      </aside>
  );
}

/* ── Desktop secondary panel — lives INSIDE the shared content card, joined to <main> by a divider ── */
function DesktopPanel({ role, activeRail, pendingPOCount = 0, pendingReturnsCount = 0 }: {
  role: Role; activeRail: string | null; pendingPOCount?: number; pendingReturnsCount?: number;
}) {
  const pathname = usePathname();
  const allSections = getNavConfig(role, pendingPOCount, pendingReturnsCount);
  const section = allSections.find((s) => s.id === activeRail && s.roles.includes(role));
  if (!section) return null;

  return (
        <aside className="hidden lg:flex flex-shrink-0 w-[220px] bg-white dark:bg-shark-900 flex-col border-r border-black/[0.06] dark:border-white/[0.06] overflow-hidden">
          <div className="flex-1 overflow-y-auto pt-3 pb-4">
              <div>
                {/* Section heading — ClickUp style: small, medium weight, muted */}
                <p className="px-3 mb-1 text-[11px] font-medium text-shark-400 dark:text-shark-500">
                  {section.label}
                </p>

                {section.sections.map((sub, sIdx) => (
                  <div key={sIdx} className={sIdx > 0 ? "mt-3" : ""}>
                    {sub.heading && (
                      <p className="px-3 mb-1 mt-2 text-[10px] font-medium text-shark-300 dark:text-shark-600">
                        {sub.heading}
                      </p>
                    )}
                    <div className="px-2 space-y-0.5">
                      {sub.items.map((item) => {
                        const active = pathname === item.href || pathname.startsWith(item.href + "/");
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              "flex items-center gap-2 px-2 py-[6px] rounded-[6px] text-[13px] transition-colors duration-100",
                              active
                                ? "bg-[#ebebeb] dark:bg-white/[0.08] text-shark-900 dark:text-white font-medium"
                                : "text-shark-600 dark:text-shark-400 hover:bg-[#f0f0f0] dark:hover:bg-white/[0.04] hover:text-shark-900 dark:hover:text-shark-100"
                            )}
                          >
                            <Icon
                              name={item.icon}
                              size={14}
                              className={active ? "text-shark-700 dark:text-shark-200" : "text-shark-400 dark:text-shark-500"}
                            />
                            <span className="flex-1 leading-none truncate">{item.label}</span>
                            {item.badge && item.badge > 0 ? (
                              <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold px-1 flex-shrink-0">
                                {item.badge}
                              </span>
                            ) : null}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
          </div>
        </aside>
  );
}
