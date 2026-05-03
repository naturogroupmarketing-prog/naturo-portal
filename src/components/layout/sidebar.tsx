"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/icon";
import { MenuWalkthrough } from "@/components/ui/menu-walkthrough";
import { Role } from "@/generated/prisma/browser";

interface SidebarProps {
  role: Role;
  onClose?: () => void;
  pendingPOCount?: number;
  pendingReturnsCount?: number;
}

interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  roles: Role[];
}

interface NavSection {
  heading?: string;
  roles: Role[];
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    roles: ["SUPER_ADMIN", "BRANCH_MANAGER"],
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "dashboard", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
    ],
  },
  {
    heading: "Management",
    roles: ["SUPER_ADMIN", "BRANCH_MANAGER"],
    items: [
      { label: "Supplies", href: "/consumables", icon: "package", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
      { label: "Purchase Orders", href: "/purchase-orders", icon: "truck", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
      { label: "Staff", href: "/staff", icon: "users", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
      { label: "Starter Kits", href: "/starter-kits", icon: "box", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
      { label: "Returns", href: "/returns", icon: "arrow-left", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
      { label: "Maintenance", href: "/maintenance", icon: "settings", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
      { label: "Reports", href: "/reports", icon: "clipboard", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
      { label: "Inspections", href: "/condition-checks", icon: "search", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
      { label: "Anomalies", href: "/alerts/anomalies", icon: "alert-triangle", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
    ],
  },
  {
    heading: "Admin",
    roles: ["SUPER_ADMIN"],
    items: [
      { label: "Permissions", href: "/admin/permissions", icon: "lock", roles: ["SUPER_ADMIN"] },
      { label: "Import Data", href: "/admin/import", icon: "upload", roles: ["SUPER_ADMIN"] },
      { label: "Activity Log", href: "/activity", icon: "clock", roles: ["SUPER_ADMIN"] },
      { label: "Support Access", href: "/settings/support-access", icon: "shield", roles: ["SUPER_ADMIN"] },
      { label: "Workflows", href: "/admin/workflows", icon: "settings", roles: ["SUPER_ADMIN"] },
    ],
  },
  // ── Auditor: read-only executive view ──
  {
    roles: ["AUDITOR"],
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "dashboard", roles: ["AUDITOR"] },
    ],
  },
  {
    heading: "View",
    roles: ["AUDITOR"],
    items: [
      { label: "Reports", href: "/reports", icon: "clipboard", roles: ["AUDITOR"] },
      { label: "Activity Log", href: "/activity", icon: "clock", roles: ["AUDITOR"] },
    ],
  },
  {
    roles: ["STAFF"],
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "dashboard", roles: ["STAFF"] },
    ],
  },
  {
    heading: "My Items",
    roles: ["STAFF"],
    items: [
      { label: "My Assets", href: "/my-assets", icon: "package", roles: ["STAFF"] },
      { label: "My Supplies", href: "/my-consumables", icon: "droplet", roles: ["STAFF"] },
    ],
  },
  {
    heading: "Actions",
    roles: ["STAFF"],
    items: [
      { label: "Request & Confirm", href: "/request-consumables", icon: "plus", roles: ["STAFF"] },
      { label: "Report Damage", href: "/report-damage", icon: "alert-triangle", roles: ["STAFF"] },
      { label: "Recent Activity", href: "/my-activity", icon: "clock", roles: ["STAFF"] },
    ],
  },
];

export function Sidebar({ role, onClose, pendingPOCount = 0, pendingReturnsCount = 0 }: SidebarProps) {
  const pathname = usePathname();

  // Branch Managers can switch to staff view from dashboard
  const [bmStaffView, setBmStaffView] = useState(false);

  useEffect(() => {
    if (role !== "BRANCH_MANAGER") return;

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setBmStaffView(detail?.view === "staff");
    };
    window.addEventListener("bm-dashboard-view", handler);
    return () => window.removeEventListener("bm-dashboard-view", handler);
  }, [role]);

  // Reset to manager menu when navigating away from dashboard
  useEffect(() => {
    if (role === "BRANCH_MANAGER" && pathname !== "/dashboard") {
      setBmStaffView(false);
    }
  }, [pathname, role]);

  // When BM is in staff view, show staff menu items
  const effectiveRole = role === "BRANCH_MANAGER" && bmStaffView ? "STAFF" : role;

  return (
    <nav aria-label="Main navigation" className="flex flex-col h-full bg-white dark:bg-shark-900 transition-colors">
      {/* Close button for mobile */}
      {onClose && (
        <div className="flex items-center justify-end px-3 py-2 lg:hidden">
          <button onClick={onClose} className="text-shark-400 hover:text-shark-700 dark:hover:text-shark-200 p-2">
            <Icon name="x" size={20} />
          </button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto py-3 px-3">
        {navSections
          .filter((section) => section.roles.includes(effectiveRole))
          .map((section, sIdx) => {
            const visibleItems = section.items.filter((item) => item.roles.includes(effectiveRole));
            if (visibleItems.length === 0) return null;

            return (
              <CollapsibleSection key={sIdx} heading={section.heading} className={sIdx > 0 ? "mt-4" : ""}>
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl min-h-[44px] transition-all duration-200",
                          active
                            ? "bg-action-50 text-action-600 font-medium dark:bg-transparent dark:text-action-400"
                            : "text-shark-600 dark:text-shark-300 hover:bg-shark-50 dark:hover:bg-shark-800 dark:bg-transparent dark:hover:bg-shark-800/40 hover:text-shark-900 dark:hover:text-white"
                        )}
                      >
                        <Icon name={item.icon} size={18} className={active ? "text-action-600 dark:text-action-400" : "text-shark-400 dark:text-shark-400"} />
                        <span className="flex-1">{item.label}</span>
                        {item.href === "/purchase-orders" && pendingPOCount > 0 && (
                          <span className="min-w-[20px] h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5">
                            {pendingPOCount}
                          </span>
                        )}
                        {item.href === "/returns" && pendingReturnsCount > 0 && (
                          <span className="min-w-[20px] h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5">
                            {pendingReturnsCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </CollapsibleSection>
            );
          })}

      </div>

      {/* Keyboard shortcut hint */}
      <div className="hidden lg:flex items-center gap-2 px-4 py-3 border-t border-shark-100 dark:border-shark-800 dark:border-transparent">
        <button
          onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-shark-400 dark:text-shark-300 hover:text-shark-600 dark:text-shark-400 dark:hover:text-shark-100 hover:bg-shark-50 dark:hover:bg-shark-800 transition-colors text-xs"
        >
          <Icon name="search" size={13} />
          <span className="flex-1 text-left">Quick search</span>
          <kbd className="text-[10px] bg-shark-100 dark:bg-shark-700 border border-shark-200 dark:border-shark-600 px-1 py-0.5 rounded font-mono">⌘K</kbd>
        </button>
      </div>
      <MenuWalkthrough role={effectiveRole} />
    </nav>
  );
}

/* ── Collapsible sidebar section ── */
function CollapsibleSection({ heading, children, className }: { heading?: string; children: React.ReactNode; className?: string }) {
  const [collapsed, setCollapsed] = useState(false);

  // Sections without a heading (e.g. Dashboard) are always open
  if (!heading) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={className}>
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between px-3 mb-1.5 group cursor-pointer"
      >
        <span className="text-[11px] font-semibold uppercase tracking-wider text-shark-400 dark:text-shark-300 group-hover:text-shark-600 dark:text-shark-400 dark:group-hover:text-shark-100 transition-colors">
          {heading}
        </span>
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={cn("text-shark-400 transition-transform duration-200", collapsed ? "-rotate-90" : "")}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          collapsed ? "max-h-0 opacity-0" : "max-h-[600px] opacity-100"
        )}
      >
        {children}
      </div>
    </div>
  );
}
