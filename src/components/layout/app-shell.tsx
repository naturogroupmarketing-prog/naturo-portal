"use client";

import { useState, useRef, useCallback, createContext, useContext } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { BottomNav } from "./bottom-nav";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { BreadcrumbProvider } from "@/components/ui/breadcrumb-context";
import { Role } from "@/generated/prisma/browser";
import { QuickActionsFab } from "@/components/ui/quick-actions-fab";

interface AppShellProps {
  children: React.ReactNode;
  role: Role;
  userName?: string | null;
  userImage?: string | null;
  pendingPOCount?: number;
  pendingReturnsCount?: number;
}

// Context so child pages can know if sidebar is expanded
export const SidebarContext = createContext<{ expanded: boolean; toggle: () => void }>({ expanded: false, toggle: () => {} });
export const useSidebar = () => useContext(SidebarContext);

export function AppShell({ children, role, userName, userImage, pendingPOCount = 0, pendingReturnsCount = 0 }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Desktop sidebar: expanded by default, collapsible
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

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
    <SidebarContext.Provider value={{ expanded: sidebarExpanded, toggle: () => setSidebarExpanded((p) => !p) }}>
    <div
      className="flex flex-col h-dvh bg-shark-50 dark:bg-shark-950 transition-colors"
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
        sidebarExpanded={sidebarExpanded}
        onSidebarToggle={() => setSidebarExpanded((p) => !p)}
      />

      {/* Below header: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar — collapsible with toggle arrow */}
        <aside className="hidden lg:flex flex-shrink-0 relative">
          <div
            className={`flex flex-col bg-white dark:bg-shark-900 border-r border-shark-100 dark:border-shark-800 dark:border-transparent transition-all duration-300 overflow-hidden ${
              sidebarExpanded ? "w-64" : "w-[68px]"
            }`}
          >
            {sidebarExpanded ? (
              <Sidebar role={role} pendingPOCount={pendingPOCount} pendingReturnsCount={pendingReturnsCount} />
            ) : (
              <SidebarRail role={role} pendingPOCount={pendingPOCount} pendingReturnsCount={pendingReturnsCount} />
            )}
          </div>
          {/* Collapse/expand — edge tab with hover label */}
          <div
            className="group absolute -right-3 top-1/2 -translate-y-1/2 z-10 flex items-center cursor-pointer"
            onClick={() => setSidebarExpanded((p) => !p)}
            title={sidebarExpanded ? "Collapse menu" : "Expand menu"}
          >
            {/* Vertical track bar */}
            <div className="w-1.5 h-10 bg-shark-200 dark:bg-shark-700 group-hover:bg-shark-400 dark:group-hover:bg-shark-500 rounded-full transition-colors duration-150" />
            {/* Floating label — slides in on hover */}
            <div className="absolute left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
              <div className="flex items-center gap-1 bg-shark-800 dark:bg-shark-700 text-white text-[11px] font-medium px-2 py-1 rounded-md shadow-lg whitespace-nowrap">
                <svg
                  width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  className={`transition-transform duration-300 ${sidebarExpanded ? "rotate-180" : ""}`}
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
                {sidebarExpanded ? "Collapse" : "Expand"}
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <div
              className="fixed inset-y-0 left-0 w-[min(16rem,85vw)] bg-white dark:bg-shark-900 border-r border-shark-100 dark:border-shark-800 dark:border-transparent z-50 shadow-xl transition-colors"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <Sidebar role={role} pendingPOCount={pendingPOCount} pendingReturnsCount={pendingReturnsCount} onClose={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Main content */}
        <main
          id="main-content"
          style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom, 0px))" }}
          className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-6 sm:px-4 sm:py-6 lg:px-6 lg:py-10 lg:pb-12"
        >
          <div className="hidden lg:flex mb-4">
            <Breadcrumbs />
          </div>
          {children}
        </main>
      </div>

      {/* Bottom navigation — all roles, mobile only */}
      <BottomNav role={role} pendingPOCount={pendingPOCount} pendingReturnsCount={pendingReturnsCount} />

      {/* Floating Quick Actions button — admins/managers, desktop only */}
      {(role === "SUPER_ADMIN" || role === "BRANCH_MANAGER") && (
        <div className="hidden lg:block">
          <QuickActionsFab />
        </div>
      )}
    </div>
    </SidebarContext.Provider>
    </BreadcrumbProvider>
  );
}

/* ── Collapsed icon rail ── */
import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/icon";

interface RailItem { icon: IconName; href: string; label: string; badge?: number }

function SidebarRail({ role, pendingPOCount = 0, pendingReturnsCount = 0 }: { role: Role; pendingPOCount?: number; pendingReturnsCount?: number }) {
  const pathname = usePathname();

  const items: RailItem[] = role === "STAFF"
    ? [
        { icon: "dashboard", href: "/dashboard", label: "Home" },
        { icon: "package", href: "/my-assets", label: "Assets" },
        { icon: "droplet", href: "/my-consumables", label: "Supplies" },
        { icon: "plus", href: "/request-consumables", label: "Request" },
      ]
    : role === "AUDITOR"
    ? [
        { icon: "dashboard", href: "/dashboard", label: "Home" },
        { icon: "clipboard", href: "/reports", label: "Reports" },
        { icon: "clock", href: "/activity", label: "Activity" },
      ]
    : [
        { icon: "dashboard", href: "/dashboard", label: "Home" },
        { icon: "package", href: "/inventory", label: "Stock" },
        { icon: "truck", href: "/purchase-orders", label: "Orders", badge: pendingPOCount },
        { icon: "users", href: "/staff", label: "Staff" },
        { icon: "arrow-left", href: "/returns", label: "Returns", badge: pendingReturnsCount },
        { icon: "clipboard", href: "/reports", label: "Reports" },
        { icon: "settings", href: "/settings", label: "Settings" },
      ];

  return (
    <nav className="flex flex-col items-center h-full">
      {/* Rail items */}
      <div className="flex flex-col items-center gap-1 py-3 flex-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`relative w-11 h-11 flex items-center justify-center rounded-xl transition-all ${
                active
                  ? "bg-action-50 text-action-600 dark:bg-transparent dark:text-action-400"
                  : "text-shark-400 hover:bg-shark-50 dark:hover:bg-shark-800 dark:bg-transparent dark:hover:bg-shark-800/40 hover:text-shark-700 dark:hover:text-white"
              }`}
            >
              <Icon name={item.icon} size={20} />
              {item.badge && item.badge > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold px-1">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
