"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/icon";
import { Logo } from "@/components/ui/logo";
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
      { label: "Inventory", href: "/inventory", icon: "package", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
      { label: "Purchase Orders", href: "/purchase-orders", icon: "truck", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
      { label: "Staff", href: "/staff", icon: "users", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
      { label: "Starter Kits", href: "/starter-kits", icon: "box", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
      { label: "Returns", href: "/returns", icon: "arrow-left", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
      { label: "Maintenance", href: "/maintenance", icon: "settings", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
      { label: "Reports", href: "/reports", icon: "clipboard", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
      { label: "Inspections", href: "/condition-checks", icon: "search", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
    ],
  },
  {
    heading: "Admin",
    roles: ["SUPER_ADMIN"],
    items: [
      { label: "Permissions", href: "/admin/permissions", icon: "lock", roles: ["SUPER_ADMIN"] },
      { label: "Import Data", href: "/admin/import", icon: "upload", roles: ["SUPER_ADMIN"] },
      { label: "Activity Log", href: "/activity", icon: "clock", roles: ["SUPER_ADMIN"] },
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
      { label: "My Consumables", href: "/my-consumables", icon: "droplet", roles: ["STAFF"] },
      { label: "My Requests", href: "/my-requests", icon: "clipboard", roles: ["STAFF"] },
    ],
  },
  {
    heading: "Actions",
    roles: ["STAFF"],
    items: [
      { label: "Request Consumables", href: "/request-consumables", icon: "plus", roles: ["STAFF"] },
      { label: "Report Damage", href: "/report-damage", icon: "alert-triangle", roles: ["STAFF"] },
      { label: "Recent Activity", href: "/my-activity", icon: "clock", roles: ["STAFF"] },
    ],
  },
  {
    roles: ["STAFF", "SUPER_ADMIN", "BRANCH_MANAGER"],
    items: [
      { label: "Settings", href: "/settings", icon: "settings", roles: ["STAFF", "SUPER_ADMIN", "BRANCH_MANAGER"] },
      { label: "What's New", href: "/changelog", icon: "star", roles: ["STAFF", "SUPER_ADMIN", "BRANCH_MANAGER"] },
      { label: "Help", href: "/help", icon: "help-circle", roles: ["STAFF", "SUPER_ADMIN", "BRANCH_MANAGER"] },
    ],
  },
];

export function Sidebar({ role, onClose, pendingPOCount = 0, pendingReturnsCount = 0 }: SidebarProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col h-full bg-white dark:bg-shark-900 transition-colors">
      <div className="flex items-center justify-between px-5 py-8 border-b border-shark-100 dark:border-shark-800">
        <button
          onClick={() => { window.location.href = "/dashboard"; }}
          className="flex items-center gap-1 hover:opacity-80 transition-opacity"
          title="Go to Dashboard"
        >
          <Logo size={56} />
        </button>
        {onClose && (
          <button onClick={onClose} className="text-shark-400 hover:text-shark-700 dark:hover:text-shark-200 lg:hidden">
            <Icon name="x" size={20} />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto py-3 px-3">
        {navSections
          .filter((section) => section.roles.includes(role))
          .map((section, sIdx) => {
            const visibleItems = section.items.filter((item) => item.roles.includes(role));
            if (visibleItems.length === 0) return null;

            return (
              <div key={sIdx} className={sIdx > 0 ? "mt-4" : ""}>
                {section.heading && (
                  <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-shark-400">
                    {section.heading}
                  </p>
                )}
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-150",
                          active
                            ? "bg-action-500 text-white font-medium shadow-sm"
                            : "text-shark-600 dark:text-shark-400 hover:bg-shark-50 dark:hover:bg-shark-800 hover:text-shark-900 dark:hover:text-shark-100"
                        )}
                      >
                        <Icon name={item.icon} size={18} className={active ? "text-white" : "text-shark-400"} />
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
              </div>
            );
          })}
      </div>

      {/* Upgrade Card — bottom of sidebar, like Edaly */}
      {role === "SUPER_ADMIN" && (
        <div className="px-3 pb-4 pt-2 border-t border-shark-100">
          <Link href="/admin/billing" onClick={onClose}>
            <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #1F3DD9 0%, #3B5BF5 100%)" }}>
              <div className="pt-5 pb-4 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2.5">
                  <Icon name="award" size={24} className="text-white" />
                </div>
                <p className="text-xs font-semibold text-white">Upgrade Your</p>
                <p className="text-xs font-semibold text-white mb-3">Account To Pro</p>
                <div className="bg-white rounded-xl py-2 px-4 text-xs font-semibold" style={{ color: "#1F3DD9" }}>
                  Upgrade Now
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}
    </nav>
  );
}
