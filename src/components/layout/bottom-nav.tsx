"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { Role } from "@/generated/prisma/browser";
import { usePageCog } from "./page-cog-context";

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Nav items per role ───────────────────────────────────────────────────────

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

// ─── Quick actions ────────────────────────────────────────────────────────────

const STAFF_QUICK_ACTIONS: QuickAction[] = [
  { label: "Scan QR",        href: "/scan",                   icon: "qr-code",        color: "bg-shark-700" },
  { label: "Request Supply", href: "/request-consumables",    icon: "droplet",        color: "bg-action-500" },
  { label: "Report Damage",  href: "/report-damage",          icon: "alert-triangle", color: "bg-[#E8532E]" },
];

const PAGE_QUICK_ACTIONS: Record<string, QuickAction[]> = {
  "/dashboard": [
    { label: "Scan QR",    href: "/scan",                          icon: "qr-code", color: "bg-shark-700" },
    { label: "Create PO",  href: "/purchase-orders?action=create", icon: "truck",   color: "bg-action-500" },
    { label: "Add Supply", href: "/consumables?action=add",        icon: "droplet", color: "bg-action-500" },
    { label: "Add Asset",  href: "/assets?action=add",             icon: "package", color: "bg-action-500" },
  ],
  "/assets": [
    { label: "Scan QR",       href: "/scan",               icon: "qr-code",        color: "bg-shark-700" },
    { label: "Report Damage", href: "/report-damage",      icon: "alert-triangle", color: "bg-[#E8532E]" },
    { label: "Add Asset",     href: "/assets?action=add",  icon: "package",        color: "bg-action-500" },
  ],
  "/consumables": [
    { label: "Scan QR",    href: "/scan",                          icon: "qr-code", color: "bg-shark-700" },
    { label: "Create PO",  href: "/purchase-orders?action=create", icon: "truck",   color: "bg-action-500" },
    { label: "Add Supply", href: "/consumables?action=add",        icon: "droplet", color: "bg-action-500" },
  ],
  "/inventory": [
    { label: "Scan QR",    href: "/scan",                   icon: "qr-code", color: "bg-shark-700" },
    { label: "Add Supply", href: "/consumables?action=add", icon: "droplet", color: "bg-action-500" },
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
    { label: "Scan QR",        href: "/scan",    icon: "qr-code",    color: "bg-shark-700" },
    { label: "Process Return", href: "/returns", icon: "arrow-left", color: "bg-action-500" },
  ],
};

const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  { label: "Scan QR",    href: "/scan",                          icon: "qr-code", color: "bg-shark-700" },
  { label: "Create PO",  href: "/purchase-orders?action=create", icon: "truck",   color: "bg-action-500" },
  { label: "Add Supply", href: "/consumables?action=add",        icon: "droplet", color: "bg-action-500" },
  { label: "Add Asset",  href: "/assets?action=add",             icon: "package", color: "bg-action-500" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function BottomNav({ role, pendingPOCount = 0, pendingReturnsCount = 0 }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { cogAction } = usePageCog();
  const [fabOpen, setFabOpen] = useState(false);
  const [installReady, setInstallReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track native PWA install prompt
  useEffect(() => {
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

  // Close FAB on outside tap
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFabOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close FAB on navigation
  useEffect(() => { setFabOpen(false); }, [pathname]);

  const allItems = getNavItems(role, pendingPOCount, pendingReturnsCount);

  const handleCogTap = () => {
    if (cogAction) cogAction();
    else router.push("/settings");
  };

  const matchedKey = Object.keys(PAGE_QUICK_ACTIONS).find((p) => pathname.startsWith(p));
  const quickActions =
    role === "STAFF"   ? STAFF_QUICK_ACTIONS :
    role === "AUDITOR" ? [] :
    matchedKey         ? PAGE_QUICK_ACTIONS[matchedKey] :
    DEFAULT_QUICK_ACTIONS;

  const hasFab = quickActions.length > 0;

  return (
    <div
      ref={containerRef}
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden"
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
    >
      {/* Quick-actions — float above the + button */}
      {fabOpen && hasFab && (
        <div className="absolute right-8 bottom-full mb-3 flex flex-col items-end gap-2.5">
          {[...quickActions].reverse().map((action, idx) => (
            <div
              key={action.label}
              className="flex items-center gap-2"
              style={{ animation: `fabItemUp 150ms ease-out ${idx * 50}ms both` }}
            >
              <span className="bg-shark-900/90 dark:bg-shark-800 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                {action.label}
              </span>
              <Link
                href={action.href}
                onClick={() => setFabOpen(false)}
                className={cn(
                  "w-11 h-11 rounded-full text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform",
                  action.color
                )}
              >
                <Icon name={action.icon} size={17} />
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Scrim */}
      {fabOpen && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => setFabOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Floating bar */}
      <div className="mx-8 flex items-center gap-2.5">

        {/* Frosted glass nav pill */}
        <nav
          aria-label="Mobile navigation"
          className="flex-1 flex items-center bg-white/80 dark:bg-shark-950/80 backdrop-blur-2xl rounded-[22px] border border-white/60 dark:border-shark-700/50 shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)] px-2 py-2 gap-1"
        >
          {allItems.map((item) => (
            <NavButton key={item.href} item={item} pathname={pathname} />
          ))}

          {/* Settings — 4th slot */}
          <button
            onClick={handleCogTap}
            aria-label="Settings"
            className="flex flex-col items-center gap-1 flex-1 px-1"
          >
            <div className="relative flex items-center justify-center">
              <Icon
                name="settings"
                size={22}
                className={cn(
                  "transition-colors duration-200",
                  cogAction ? "text-action-500" : "text-shark-400 dark:text-shark-500"
                )}
              />
              {installReady && !cogAction && (
                <span className="absolute -top-1.5 -right-2 w-2 h-2 rounded-full bg-green-500 border-2 border-white dark:border-shark-950" />
              )}
            </div>
            <span className={cn(
              "text-[10px] leading-none transition-colors duration-200",
              cogAction
                ? "font-semibold text-action-500"
                : "font-medium text-shark-400 dark:text-shark-500"
            )}>
              Settings
            </span>
          </button>
        </nav>

        {/* Plus circle — separate frosted glass button */}
        {hasFab ? (
          <button
            onClick={() => setFabOpen((p) => !p)}
            aria-label={fabOpen ? "Close quick actions" : "Open quick actions"}
            className={cn(
              "w-[60px] h-[60px] rounded-full flex items-center justify-center shrink-0 transition-all duration-200 active:scale-95 shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)] border backdrop-blur-2xl",
              fabOpen
                ? "bg-shark-900/90 dark:bg-shark-800/90 border-shark-700/50"
                : "bg-white/80 dark:bg-shark-950/80 border-white/60 dark:border-shark-700/50"
            )}
          >
            <Icon
              name="plus"
              size={26}
              className={cn(
                "transition-all duration-200",
                fabOpen
                  ? "rotate-45 text-white"
                  : "text-shark-700 dark:text-shark-300"
              )}
            />
          </button>
        ) : (
          <div className="w-[60px] h-[60px] shrink-0" />
        )}
      </div>

      <style>{`
        @keyframes fabItemUp {
          from { opacity: 0; transform: translateY(10px) scale(0.9); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
    </div>
  );
}

// ─── Nav button ───────────────────────────────────────────────────────────────

function NavButton({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = pathname === item.href || pathname.startsWith(item.href + "/");
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className="flex flex-col items-center gap-1 flex-1 px-1"
    >
      <div className="relative flex items-center justify-center">
        <Icon
          name={item.icon}
          size={22}
          className={cn(
            "transition-colors duration-200",
            active ? "text-action-500" : "text-shark-400 dark:text-shark-500"
          )}
        />
        {item.badge != null && item.badge > 0 && (
          <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold px-0.5 leading-none">
            {item.badge > 99 ? "99+" : item.badge}
          </span>
        )}
      </div>
      <span className={cn(
        "text-[10px] leading-none transition-colors duration-200",
        active ? "font-semibold text-action-500" : "font-medium text-shark-400 dark:text-shark-500"
      )}>
        {item.label}
      </span>
    </Link>
  );
}
