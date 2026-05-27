"use client";

import { useState, useRef, useCallback, createContext, useContext } from "react";
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
      className="relative h-dvh overflow-hidden bg-[#F7F7F7] dark:bg-shark-950"
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
      <div className="flex flex-1 overflow-hidden lg:p-2 lg:pt-0 lg:gap-2">

        {/* Desktop two-panel nav */}
        <DesktopNav
          role={role}
          orgName={orgName}
          pendingPOCount={pendingPOCount}
          pendingReturnsCount={pendingReturnsCount}
        />

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
            className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-5 sm:px-5 sm:py-6 lg:px-6 lg:py-10 lg:pb-12 bg-[#F7F7F7] dark:bg-shark-950"
          >
            <Breadcrumbs />
            {children}
          </main>
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
interface RailSection { id: string; icon: IconName; label: string; sections: PanelSection[]; roles: Role[] }

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
      id: "manage",
      icon: "package",
      label: "Manage",
      roles: ["SUPER_ADMIN", "BRANCH_MANAGER"],
      sections: [
        {
          heading: "Inventory",
          items: [
            { label: "Assets", href: "/assets", icon: "package" },
            { label: "Supplies", href: "/inventory", icon: "droplet" },
            { label: "Returns", href: "/returns", icon: "arrow-left", badge: pendingReturnsCount },
            { label: "Starter Kits", href: "/starter-kits", icon: "box" },
            { label: "Maintenance", href: "/maintenance", icon: "wrench" },
          ],
        },
        {
          heading: "Procurement",
          items: [
            { label: "Purchase Orders", href: "/purchase-orders", icon: "truck", badge: pendingPOCount },
          ],
        },
      ],
    },
    {
      id: "people",
      icon: "users",
      label: "People",
      roles: ["SUPER_ADMIN", "BRANCH_MANAGER"],
      sections: [{ items: [{ label: "Staff", href: "/staff", icon: "users" }] }],
    },
    {
      id: "reports",
      icon: "bar-chart",
      label: "Reports",
      roles: ["SUPER_ADMIN", "BRANCH_MANAGER", "AUDITOR"],
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
          items: [
            { label: "Permissions", href: "/admin/permissions", icon: "lock" },
            { label: "Import Data", href: "/admin/import", icon: "upload" },
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

function DesktopNav({ role, orgName, pendingPOCount = 0, pendingReturnsCount = 0 }: {
  role: Role; orgName?: string; pendingPOCount?: number; pendingReturnsCount?: number;
}) {
  const pathname = usePathname();
  const allSections = getNavConfig(role, pendingPOCount, pendingReturnsCount);
  const visibleSections = allSections.filter((s) => s.roles.includes(role));

  // Panel open/close — toggled by clicking any rail item
  const [panelOpen, setPanelOpen] = useState(true);

  // Which rail item is highlighted (the one whose path is currently active)
  const activeRailId = visibleSections.find((s) =>
    s.sections.flatMap((p) => p.items).some((i) => pathname === i.href || pathname.startsWith(i.href + "/"))
  )?.id ?? "home";

  return (
    <aside className={cn(
      "hidden lg:flex flex-shrink-0 border border-black/[0.08] dark:border-white/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden",
      panelOpen ? "rounded-l-[12px]" : "rounded-[12px]"
    )}>
      {/* ── Dark icon rail ── */}
      <div className="w-[68px] bg-[#1b1b1b] flex flex-col border-r border-white/[0.05]">
        {/* Rail nav items — clicking any item toggles the panel */}
        <nav className="flex flex-col items-center gap-0.5 px-2 pt-1 flex-1 overflow-y-auto">
          {visibleSections.map((section) => {
            const isCurrent = section.id === activeRailId;
            return (
              <button
                key={section.id}
                type="button"
                title={section.label}
                onClick={() => setPanelOpen((p) => !p)}
                className={cn(
                  "w-full flex flex-col items-center gap-1 py-2 rounded-[10px] transition-colors duration-150",
                  isCurrent && panelOpen
                    ? "bg-white/[0.10] text-white"
                    : "text-white/45 hover:bg-white/[0.06] hover:text-white/80"
                )}
              >
                <Icon
                  name={section.icon}
                  size={18}
                  className={isCurrent ? "text-action-400" : "text-white/40"}
                />
                <span className="text-[9px] font-semibold leading-none tracking-wide">
                  {section.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Settings pinned at bottom */}
        <div className="pb-3 flex justify-center">
          <Link
            href="/settings"
            title="Settings"
            className={cn(
              "w-11 h-11 flex flex-col items-center justify-center gap-1 rounded-[10px] transition-colors duration-150",
              pathname.startsWith("/settings")
                ? "bg-white/[0.10] text-action-400"
                : "text-white/35 hover:bg-white/[0.06] hover:text-white/70"
            )}
          >
            <Icon name="settings" size={17} />
          </Link>
        </div>
      </div>

      {/* ── Secondary panel — ClickUp style ── */}
      {panelOpen && (
        <div className="w-[220px] bg-white dark:bg-shark-900 flex flex-col overflow-hidden flex-shrink-0">
          <div className="flex-1 overflow-y-auto pt-3 pb-4">
            {visibleSections.map((railSection, rIdx) => (
              <div key={railSection.id} className={rIdx > 0 ? "mt-5" : ""}>
                {/* Section heading — ClickUp style: small, medium weight, muted */}
                <p className="px-3 mb-1 text-[11px] font-medium text-shark-400 dark:text-shark-500">
                  {railSection.label}
                </p>

                {railSection.sections.map((sub, sIdx) => (
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
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
