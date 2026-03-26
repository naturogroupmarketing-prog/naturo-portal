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
      { label: "Assets", href: "/assets", icon: "package", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
      { label: "Consumables", href: "/consumables", icon: "droplet", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
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
      { label: "Locations", href: "/admin/locations", icon: "map-pin", roles: ["SUPER_ADMIN"] },
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
      { label: "Help", href: "/help", icon: "help-circle", roles: ["STAFF", "SUPER_ADMIN", "BRANCH_MANAGER"] },
    ],
  },
];

export function Sidebar({ role, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col h-full bg-white dark:bg-shark-900 transition-colors">
      <div className="flex items-center justify-between px-5 py-5 border-b border-shark-100 dark:border-shark-800">
        <button
          onClick={() => { window.location.href = "/dashboard"; }}
          className="flex items-center gap-1 hover:opacity-80 transition-opacity"
          title="Go to Dashboard"
        >
          <Logo size={36} />
          <p className="text-[10px] text-shark-400 leading-tight mt-1">Asset Tracker</p>
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
                            ? "bg-action-50 dark:bg-action-900/30 text-action-600 dark:text-action-400 font-medium"
                            : "text-shark-600 dark:text-shark-400 hover:bg-shark-50 dark:hover:bg-shark-800 hover:text-shark-900 dark:hover:text-shark-100"
                        )}
                      >
                        <Icon name={item.icon} size={18} className={active ? "text-action-500 dark:text-action-400" : "text-shark-400"} />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>
      {/* Upgrade Card — collapsed by default, expands on hover */}
      <div className="px-3 pb-3 group/upgrade">
        {/* Expanded content — hidden by default, shown on hover */}
        <div className="max-h-0 group-hover/upgrade:max-h-40 overflow-hidden transition-all duration-300 ease-in-out">
          <div className="rounded-t-2xl pt-4 px-4 pb-3 text-center" style={{ background: "linear-gradient(135deg, #5759E5 0%, #7C5CFC 100%)" }}>
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
              <Icon name="award" size={24} className="text-white" />
            </div>
            <p className="text-sm font-semibold text-white">Upgrade Your</p>
            <p className="text-sm font-semibold text-white">Account To Pro</p>
          </div>
        </div>
        {/* Always visible button */}
        <button
          onClick={() => window.open("/admin/billing", "_self")}
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 border-2 group-hover/upgrade:rounded-t-none group-hover/upgrade:rounded-b-2xl group-hover/upgrade:bg-white group-hover/upgrade:border-transparent"
          style={{ color: "#5759E5", borderColor: "#5759E5" }}
        >
          Upgrade Now
        </button>
      </div>
    </nav>
  );
}
