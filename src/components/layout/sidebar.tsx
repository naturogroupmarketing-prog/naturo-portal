"use client";

import { useState, useEffect, useRef } from "react";
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
  orgName?: string;
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
      { label: "Dashboard", href: "/dashboard", icon: "home", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
    ],
  },
  {
    heading: "Management",
    roles: ["SUPER_ADMIN", "BRANCH_MANAGER"],
    items: [
      { label: "Assets", href: "/assets", icon: "package", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
      { label: "Supplies", href: "/inventory", icon: "droplet", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
      { label: "Purchase Orders", href: "/purchase-orders", icon: "truck", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
      { label: "Staff", href: "/staff", icon: "users", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
      { label: "Training", href: "/training", icon: "graduation-cap", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
      { label: "Starter Kits", href: "/starter-kits", icon: "box", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
      { label: "Returns", href: "/returns", icon: "arrow-left", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
      { label: "Maintenance", href: "/maintenance", icon: "wrench", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
      { label: "Reports", href: "/reports", icon: "bar-chart", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
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
      { label: "Workflows", href: "/admin/workflows", icon: "git-branch", roles: ["SUPER_ADMIN"] },
    ],
  },
  // ── Auditor: read-only executive view ──
  {
    roles: ["AUDITOR"],
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "home", roles: ["AUDITOR"] },
    ],
  },
  {
    heading: "View",
    roles: ["AUDITOR"],
    items: [
      { label: "Reports", href: "/reports", icon: "bar-chart", roles: ["AUDITOR"] },
      { label: "Activity Log", href: "/activity", icon: "clock", roles: ["AUDITOR"] },
    ],
  },
  {
    roles: ["STAFF"],
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "home", roles: ["STAFF"] },
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

export function Sidebar({ role, onClose, pendingPOCount = 0, pendingReturnsCount = 0, orgName }: SidebarProps) {
  const pathname = usePathname();
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const workspaceRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (role === "BRANCH_MANAGER" && pathname !== "/dashboard") {
      setBmStaffView(false);
    }
  }, [pathname, role]);

  // Close workspace dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (workspaceRef.current && !workspaceRef.current.contains(e.target as Node)) {
        setWorkspaceOpen(false);
      }
    };
    if (workspaceOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [workspaceOpen]);

  const effectiveRole = role === "BRANCH_MANAGER" && bmStaffView ? "STAFF" : role;

  const initial = (orgName ?? "W").charAt(0).toUpperCase();

  return (
    <nav aria-label="Main navigation" className="flex flex-col h-full">

      {/* ── Workspace header ── */}
      <div className="px-3 pt-3 pb-2" ref={workspaceRef}>
        <button
          type="button"
          onClick={() => setWorkspaceOpen((p) => !p)}
          className="w-full flex items-center gap-2.5 px-2 py-2 rounded-[12px] hover:bg-white/[0.06] transition-colors group"
        >
          {/* Coloured initial badge */}
          <span className="w-7 h-7 rounded-[8px] bg-action-500 flex items-center justify-center flex-shrink-0 text-white text-[13px] font-bold shadow-[0_1px_4px_rgba(0,87,255,0.40)]">
            {initial}
          </span>
          {/* Org name */}
          <span className="flex-1 text-left text-[13px] font-semibold text-white/90 truncate leading-none">
            {orgName ?? "Workspace"}
          </span>
          {/* Chevron */}
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className={cn("text-white/30 group-hover:text-white/60 transition-all duration-200 flex-shrink-0", workspaceOpen ? "rotate-180" : "")}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {/* Workspace dropdown */}
        {workspaceOpen && (
          <div className="mt-1 mx-1 bg-[#2a2a2a] border border-white/[0.08] rounded-[14px] shadow-[0_8px_24px_rgba(0,0,0,0.40)] overflow-hidden">
            <Link
              href="/settings"
              onClick={() => { setWorkspaceOpen(false); onClose?.(); }}
              className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
            >
              <Icon name="settings" size={14} className="text-white/40" />
              Workspace Settings
            </Link>
            <Link
              href="/admin/company"
              onClick={() => { setWorkspaceOpen(false); onClose?.(); }}
              className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
            >
              <Icon name="shield" size={14} className="text-white/40" />
              Company Profile
            </Link>
            <div className="border-t border-white/[0.06] my-1" />
            <Link
              href="/admin/billing"
              onClick={() => { setWorkspaceOpen(false); onClose?.(); }}
              className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
            >
              <Icon name="award" size={14} className="text-white/40" />
              Billing &amp; Plan
            </Link>
          </div>
        )}
      </div>

      {/* ── Divider ── */}
      <div className="mx-3 mb-1 border-t border-white/[0.06]" />

      {/* Mobile close button */}
      {onClose && (
        <div className="flex items-center justify-end px-3 py-1 lg:hidden">
          <button onClick={onClose} className="text-white/40 hover:text-white/80 p-2 transition-colors" aria-label="Close menu">
            <Icon name="x" size={18} />
          </button>
        </div>
      )}

      {/* ── Nav items ── */}
      <div className="flex-1 overflow-y-auto py-2 px-2.5">
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
                          "flex items-center gap-3 px-3 py-2 text-[13px] rounded-[10px] min-h-[36px] transition-colors duration-150",
                          active
                            ? "bg-white/[0.10] text-white font-medium"
                            : "text-white/55 hover:bg-white/[0.05] hover:text-white/90 font-normal"
                        )}
                      >
                        <Icon
                          name={item.icon}
                          size={16}
                          className={active ? "text-action-400" : "text-white/40"}
                        />
                        <span className="flex-1 leading-none">{item.label}</span>
                        {item.href === "/purchase-orders" && pendingPOCount > 0 && (
                          <span className="min-w-[18px] h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold px-1">
                            {pendingPOCount}
                          </span>
                        )}
                        {item.href === "/returns" && pendingReturnsCount > 0 && (
                          <span className="min-w-[18px] h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold px-1">
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

      <MenuWalkthrough role={effectiveRole} />
    </nav>
  );
}

/* ── Collapsible sidebar section ── */
function CollapsibleSection({ heading, children, className }: { heading?: string; children: React.ReactNode; className?: string }) {
  const [collapsed, setCollapsed] = useState(false);

  if (!heading) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={className}>
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between px-3 mb-1 group cursor-pointer"
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/25 group-hover:text-white/50 transition-colors">
          {heading}
        </span>
        <svg
          width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={cn("text-white/20 group-hover:text-white/40 transition-transform duration-200", collapsed ? "-rotate-90" : "")}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div className={cn("overflow-hidden transition-all duration-200", collapsed ? "max-h-0 opacity-0" : "max-h-[600px] opacity-100")}>
        {children}
      </div>
    </div>
  );
}
