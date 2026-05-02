"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { Role } from "@/generated/prisma/browser";
import { usePageCog } from "./page-cog-context";

// ─── Types ──────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  badge?: number;
}

interface QuickAction {
  label: string;
  href: string;
  icon: IconName;
  color: string;
}

export interface BottomNavProps {
  role: Role;
  pendingPOCount?: number;
  pendingReturnsCount?: number;
}

// ─── Nav items per role (3 links — 2 left of FAB, 1 right; cog takes 4th slot) ──

function getNavItems(role: Role, po: number, returns: number): NavItem[] {
  switch (role) {
    case "STAFF":
      return [
        { label: "Home",     href: "/dashboard",      icon: "dashboard" },
        { label: "Assets",   href: "/my-assets",      icon: "package" },
        { label: "Supplies", href: "/my-consumables", icon: "droplet" },
      ];
    case "SUPER_ADMIN":
      return [
        { label: "Home",   href: "/dashboard",       icon: "dashboard" },
        { label: "Stock",  href: "/inventory",       icon: "droplet" },
        { label: "Orders", href: "/purchase-orders", icon: "truck", badge: po },
      ];
    case "BRANCH_MANAGER":
      return [
        { label: "Home",    href: "/dashboard",  icon: "dashboard" },
        { label: "Stock",   href: "/consumables", icon: "droplet" },
        { label: "Returns", href: "/returns",    icon: "arrow-left", badge: returns },
      ];
    case "AUDITOR":
      return [
        { label: "Home",     href: "/dashboard", icon: "dashboard" },
        { label: "Reports",  href: "/reports",   icon: "clipboard" },
        { label: "Activity", href: "/activity",  icon: "clock" },
      ];
    default:
      return [
        { label: "Home",     href: "/dashboard",      icon: "dashboard" },
        { label: "Assets",   href: "/my-assets",      icon: "package" },
        { label: "Supplies", href: "/my-consumables", icon: "droplet" },
      ];
  }
}

// ─── Quick actions (context-aware, mirrors QuickActionsFab) ─────────────────

const STAFF_QUICK_ACTIONS: QuickAction[] = [
  { label: "Scan QR",        href: "/scan",                   icon: "qr-code",        color: "bg-shark-700" },
  { label: "Request Supply", href: "/request-consumables",    icon: "droplet",        color: "bg-action-500" },
  { label: "Report Damage",  href: "/report-damage",          icon: "alert-triangle", color: "bg-[#E8532E]" },
];

const PAGE_QUICK_ACTIONS: Record<string, QuickAction[]> = {
  "/dashboard": [
    { label: "Scan QR",   href: "/scan",                          icon: "qr-code", color: "bg-shark-700" },
    { label: "Create PO", href: "/purchase-orders?action=create", icon: "truck",   color: "bg-action-500" },
    { label: "Add Supply",href: "/consumables?action=add",        icon: "droplet", color: "bg-action-500" },
    { label: "Add Asset", href: "/assets?action=add",             icon: "package", color: "bg-action-500" },
  ],
  "/assets": [
    { label: "Scan QR",       href: "/scan",          icon: "qr-code",        color: "bg-shark-700" },
    { label: "Report Damage", href: "/report-damage", icon: "alert-triangle", color: "bg-[#E8532E]" },
    { label: "Add Asset",     href: "/assets?action=add", icon: "package",    color: "bg-action-500" },
  ],
  "/consumables": [
    { label: "Scan QR",   href: "/scan",                          icon: "qr-code", color: "bg-shark-700" },
    { label: "Create PO", href: "/purchase-orders?action=create", icon: "truck",   color: "bg-action-500" },
    { label: "Add Supply",href: "/consumables?action=add",        icon: "droplet", color: "bg-action-500" },
  ],
  "/inventory": [
    { label: "Scan QR",   href: "/scan",                  icon: "qr-code", color: "bg-shark-700" },
    { label: "Add Supply",href: "/consumables?action=add", icon: "droplet", color: "bg-action-500" },
  ],
  "/purchase-orders": [
    { label: "Scan QR",   href: "/scan",                          icon: "qr-code", color: "bg-shark-700" },
    { label: "Create PO", href: "/purchase-orders?action=create", icon: "truck",   color: "bg-action-500" },
  ],
  "/staff": [
    { label: "Issue Kit", href: "/starter-kits?action=new", icon: "box",  color: "bg-action-500" },
    { label: "Add Staff", href: "/staff?action=add",        icon: "user", color: "bg-action-500" },
  ],
  "/returns": [
    { label: "Scan QR",       href: "/scan",    icon: "qr-code",   color: "bg-shark-700" },
    { label: "Process Return",href: "/returns", icon: "arrow-left",color: "bg-action-500" },
  ],
};

const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  { label: "Scan QR",   href: "/scan",                          icon: "qr-code", color: "bg-shark-700" },
  { label: "Create PO", href: "/purchase-orders?action=create", icon: "truck",   color: "bg-action-500" },
  { label: "Add Supply",href: "/consumables?action=add",        icon: "droplet", color: "bg-action-500" },
  { label: "Add Asset", href: "/assets?action=add",             icon: "package", color: "bg-action-500" },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function BottomNav({ role, pendingPOCount = 0, pendingReturnsCount = 0 }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { cogAction } = usePageCog();
  const [fabOpen, setFabOpen] = useState(false);
  const [installReady, setInstallReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track whether native PWA install prompt is available
  useEffect(() => {
    // Already installed
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    ) return;

    const captured = (window as any).__pwaPrompt;
    if (captured) setInstallReady(true);

    const handler = (e: Event) => {
      e.preventDefault();
      (window as any).__pwaPrompt = e;
      setInstallReady(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstallReady(false));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Close on outside tap
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFabOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on navigation
  useEffect(() => { setFabOpen(false); }, [pathname]);

  const allItems = getNavItems(role, pendingPOCount, pendingReturnsCount);
  const leftItems  = allItems.slice(0, 2);
  const rightItems = allItems.slice(2, 3); // 1 link on the right; cog takes the 4th slot

  const handleCogTap = () => {
    if (cogAction) {
      cogAction();
    } else {
      router.push("/settings");
    }
  };

  // Pick quick actions for the current page
  const matchedKey = Object.keys(PAGE_QUICK_ACTIONS).find((p) => pathname.startsWith(p));
  const quickActions =
    role === "STAFF"    ? STAFF_QUICK_ACTIONS :
    role === "AUDITOR"  ? [] :
    matchedKey          ? PAGE_QUICK_ACTIONS[matchedKey] :
    DEFAULT_QUICK_ACTIONS;

  const hasFab = quickActions.length > 0;

  return (
    <div ref={containerRef} className="fixed bottom-0 inset-x-0 z-40 lg:hidden">
      {/* Quick-actions radial list */}
      {fabOpen && hasFab && (
        <div className="absolute bottom-[72px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2.5 pb-1 pointer-events-none">
          {[...quickActions].reverse().map((action, idx) => (
            <div
              key={action.label}
              className="flex items-center gap-2 pointer-events-auto"
              style={{ animation: `fabItemUp 150ms ease-out ${idx * 50}ms both` }}
            >
              <span className="bg-shark-900 dark:bg-shark-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                {action.label}
              </span>
              <Link
                href={action.href}
                onClick={() => setFabOpen(false)}
                className={cn(
                  "w-11 h-11 rounded-full text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform",
                  action.color
                )}
              >
                <Icon name={action.icon} size={17} />
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Scrim — tapping outside closes the popup */}
      {fabOpen && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => setFabOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Nav bar */}
      <nav
        aria-label="Mobile navigation"
        className="relative bg-white/95 dark:bg-shark-900/95 backdrop-blur-md border-t border-shark-100 dark:border-shark-800 safe-bottom"
      >
        <div className="flex items-stretch h-16">
          {/* Left items */}
          {leftItems.map((item) => (
            <NavButton key={item.href} item={item} pathname={pathname} />
          ))}

          {/* Centre FAB slot */}
          <div className="flex-1 flex items-center justify-center relative">
            {hasFab ? (
              <button
                onClick={() => setFabOpen((p) => !p)}
                aria-label={fabOpen ? "Close quick actions" : "Open quick actions"}
                className={cn(
                  "absolute -top-6 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-200 active:scale-95",
                  fabOpen
                    ? "bg-shark-800 dark:bg-shark-700 scale-90"
                    : "bg-action-500 hover:bg-action-600 hover:scale-105"
                )}
              >
                <Icon
                  name="plus"
                  size={24}
                  className={cn("text-white transition-transform duration-200", fabOpen && "rotate-45")}
                />
              </button>
            ) : (
              /* Auditor — inert spacer so layout stays symmetric */
              <div className="w-14 h-14" />
            )}
          </div>

          {/* Right link */}
          {rightItems.map((item) => (
            <NavButton key={item.href} item={item} pathname={pathname} />
          ))}

          {/* Cog — context-aware page settings */}
          <button
            onClick={handleCogTap}
            aria-label="Page settings"
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 px-1 transition-colors",
              cogAction ? "text-action-500" : "text-shark-400 dark:text-shark-500"
            )}
          >
            <div className="relative">
              <Icon name="settings" size={20} />
              {installReady && !cogAction && (
                <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-green-500 border border-white dark:border-shark-900" />
              )}
            </div>
            <span className="text-[10px] font-medium leading-none">Settings</span>
          </button>
        </div>
      </nav>

      <style>{`
        @keyframes fabItemUp {
          from { opacity: 0; transform: translateY(12px) scale(0.88); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
    </div>
  );
}

// ─── Shared nav-button ───────────────────────────────────────────────────────

function NavButton({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = pathname === item.href || pathname.startsWith(item.href + "/");
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-col items-center justify-center gap-1 flex-1 px-1 transition-colors",
        active ? "text-action-500" : "text-shark-400 dark:text-shark-500"
      )}
    >
      <div className="relative">
        <Icon name={item.icon} size={20} />
        {item.badge != null && item.badge > 0 && (
          <span className="absolute -top-1 -right-1.5 min-w-[14px] h-3.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold px-0.5 leading-none">
            {item.badge > 99 ? "99+" : item.badge}
          </span>
        )}
      </div>
      <span className="text-[10px] font-medium leading-none">{item.label}</span>
    </Link>
  );
}
