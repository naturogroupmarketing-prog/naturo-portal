"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { Role } from "@/generated/prisma/browser";

// ─── Types ───────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  badge?: number;
}

interface MoreGridItem {
  label: string;
  href: string;
  icon: IconName;
  bg: string;
  fg: string;
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
        { label: "Home",    href: "/dashboard",   icon: "dashboard" },
        { label: "Stock",   href: "/consumables", icon: "droplet" },
        { label: "Returns", href: "/returns",     icon: "arrow-left", badge: returns },
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

// ─── More grid items per role ─────────────────────────────────────────────────

function getMoreItems(role: Role): MoreGridItem[] {
  switch (role) {
    case "STAFF":
      return [
        { label: "Scan QR",        href: "/scan",                icon: "qr-code",        bg: "bg-shark-100 dark:bg-shark-700",   fg: "text-shark-600 dark:text-shark-300" },
        { label: "Request Supply", href: "/request-consumables", icon: "droplet",        bg: "bg-blue-50 dark:bg-blue-500/15",   fg: "text-blue-500" },
        { label: "Report Damage",  href: "/report-damage",       icon: "alert-triangle", bg: "bg-red-50 dark:bg-red-500/15",     fg: "text-red-500" },
        { label: "My Assets",      href: "/my-assets",           icon: "package",        bg: "bg-purple-50 dark:bg-purple-500/15", fg: "text-purple-500" },
        { label: "My Supplies",    href: "/my-consumables",      icon: "droplet",        bg: "bg-cyan-50 dark:bg-cyan-500/15",   fg: "text-cyan-500" },
        { label: "Dashboard",      href: "/dashboard",           icon: "dashboard",      bg: "bg-indigo-50 dark:bg-indigo-500/15", fg: "text-indigo-500" },
        { label: "Settings",       href: "/settings",            icon: "settings",       bg: "bg-shark-100 dark:bg-shark-700",   fg: "text-shark-500 dark:text-shark-400" },
      ];
    case "SUPER_ADMIN":
      return [
        { label: "Supplies",        href: "/consumables",      icon: "droplet",        bg: "bg-blue-50 dark:bg-blue-500/15",     fg: "text-blue-500" },
        { label: "Purchase Orders", href: "/purchase-orders",  icon: "truck",          bg: "bg-green-50 dark:bg-green-500/15",   fg: "text-green-500" },
        { label: "Staff",           href: "/staff",            icon: "users",          bg: "bg-indigo-50 dark:bg-indigo-500/15", fg: "text-indigo-500" },
        { label: "Starter Kits",    href: "/starter-kits",     icon: "box",            bg: "bg-amber-50 dark:bg-amber-500/15",   fg: "text-amber-500" },
        { label: "Returns",         href: "/returns",          icon: "arrow-left",     bg: "bg-orange-50 dark:bg-orange-500/15", fg: "text-orange-500" },
        { label: "Maintenance",     href: "/maintenance",      icon: "wrench",         bg: "bg-shark-100 dark:bg-shark-700",     fg: "text-shark-500 dark:text-shark-400" },
        { label: "Reports",         href: "/reports",          icon: "clipboard",      bg: "bg-teal-50 dark:bg-teal-500/15",     fg: "text-teal-500" },
        { label: "Inspections",     href: "/condition-checks", icon: "search",         bg: "bg-violet-50 dark:bg-violet-500/15", fg: "text-violet-500" },
        { label: "Anomalies",       href: "/alerts/anomalies", icon: "alert-triangle", bg: "bg-red-50 dark:bg-red-500/15",       fg: "text-red-500" },
      ];
    case "BRANCH_MANAGER":
      return [
        { label: "Supplies",        href: "/consumables",      icon: "droplet",        bg: "bg-blue-50 dark:bg-blue-500/15",     fg: "text-blue-500" },
        { label: "Purchase Orders", href: "/purchase-orders",  icon: "truck",          bg: "bg-green-50 dark:bg-green-500/15",   fg: "text-green-500" },
        { label: "Staff",           href: "/staff",            icon: "users",          bg: "bg-indigo-50 dark:bg-indigo-500/15", fg: "text-indigo-500" },
        { label: "Starter Kits",    href: "/starter-kits",     icon: "box",            bg: "bg-amber-50 dark:bg-amber-500/15",   fg: "text-amber-500" },
        { label: "Returns",         href: "/returns",          icon: "arrow-left",     bg: "bg-orange-50 dark:bg-orange-500/15", fg: "text-orange-500" },
        { label: "Maintenance",     href: "/maintenance",      icon: "wrench",         bg: "bg-shark-100 dark:bg-shark-700",     fg: "text-shark-500 dark:text-shark-400" },
        { label: "Reports",         href: "/reports",          icon: "clipboard",      bg: "bg-teal-50 dark:bg-teal-500/15",     fg: "text-teal-500" },
        { label: "Inspections",     href: "/condition-checks", icon: "search",         bg: "bg-violet-50 dark:bg-violet-500/15", fg: "text-violet-500" },
        { label: "Anomalies",       href: "/alerts/anomalies", icon: "alert-triangle", bg: "bg-red-50 dark:bg-red-500/15",       fg: "text-red-500" },
      ];
    case "AUDITOR":
      return [
        { label: "Dashboard", href: "/dashboard", icon: "dashboard",      bg: "bg-indigo-50 dark:bg-indigo-500/15", fg: "text-indigo-500" },
        { label: "Reports",   href: "/reports",   icon: "clipboard",      bg: "bg-teal-50 dark:bg-teal-500/15",     fg: "text-teal-500" },
        { label: "Activity",  href: "/activity",  icon: "clock",          bg: "bg-violet-50 dark:bg-violet-500/15", fg: "text-violet-500" },
        { label: "Scan QR",   href: "/scan",      icon: "qr-code",        bg: "bg-shark-100 dark:bg-shark-700",     fg: "text-shark-600 dark:text-shark-300" },
        { label: "Settings",  href: "/settings",  icon: "settings",       bg: "bg-shark-100 dark:bg-shark-700",     fg: "text-shark-500 dark:text-shark-400" },
      ];
    default:
      return [
        { label: "Scan QR",        href: "/scan",                icon: "qr-code",        bg: "bg-shark-100 dark:bg-shark-700",   fg: "text-shark-600 dark:text-shark-300" },
        { label: "Request Supply", href: "/request-consumables", icon: "droplet",        bg: "bg-blue-50 dark:bg-blue-500/15",   fg: "text-blue-500" },
        { label: "Report Damage",  href: "/report-damage",       icon: "alert-triangle", bg: "bg-red-50 dark:bg-red-500/15",     fg: "text-red-500" },
        { label: "Settings",       href: "/settings",            icon: "settings",       bg: "bg-shark-100 dark:bg-shark-700",   fg: "text-shark-500 dark:text-shark-400" },
      ];
  }
}

// ─── Quick action items per role ─────────────────────────────────────────────

interface QuickAction {
  label: string;
  href: string;
  icon: IconName;
  color: string;
}

function getQuickActions(role: Role): QuickAction[] {
  switch (role) {
    case "SUPER_ADMIN":
    case "BRANCH_MANAGER":
      return [
        { label: "New User",    href: "/staff?action=add",              icon: "users",   color: "bg-indigo-500" },
        { label: "Add Stock",   href: "/consumables?action=add",        icon: "droplet", color: "bg-blue-500" },
        { label: "Starter Kit", href: "/starter-kits?action=new",      icon: "box",     color: "bg-amber-500" },
        { label: "New Order",   href: "/purchase-orders?action=create", icon: "truck",   color: "bg-green-500" },
      ];
    case "STAFF":
      return [
        { label: "Request Supply", href: "/request-consumables", icon: "droplet",        color: "bg-blue-500"   },
        { label: "Report Damage",  href: "/report-damage",       icon: "alert-triangle", color: "bg-red-500"    },
        { label: "Scan QR",        href: "/scan",                icon: "qr-code",        color: "bg-shark-700"  },
      ];
    default:
      return [
        { label: "Scan QR", href: "/scan", icon: "qr-code", color: "bg-shark-700" },
      ];
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BottomNav({ role, pendingPOCount = 0, pendingReturnsCount = 0 }: BottomNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [installReady, setInstallReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Elastic pill animation state ─────────────────────────────────────────
  const slotPct0 = 100 / (getNavItems(role, pendingPOCount, pendingReturnsCount).length + 1);
  const [pillLeft, setPillLeft]       = useState<string>("0%");
  const [pillWidth, setPillWidth]     = useState<string>(`${slotPct0}%`);
  const [pillLeftTx, setPillLeftTx]   = useState<string>("none");
  const [pillWidthTx, setPillWidthTx] = useState<string>("none");
  const mountedRef  = useRef<boolean>(false);
  const prevSlotRef = useRef<number>(-1);
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Close More sheet on outside tap
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close sheets on navigation
  useEffect(() => { setMoreOpen(false); setQuickOpen(false); }, [pathname]);

  // Cleanup animation timer on unmount
  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const allItems     = getNavItems(role, pendingPOCount, pendingReturnsCount);
  const numSlots     = allItems.length + 1;
  const moreItems    = getMoreItems(role);
  const quickActions = getQuickActions(role);

  const navActiveIdx = allItems.findIndex(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );

  const pillSlot = moreOpen || navActiveIdx === -1
    ? allItems.length
    : navActiveIdx;

  // ── Elastic pill: 2-phase rubber-band animation ───────────────────────────
  // useLayoutEffect fires synchronously before paint — no visible flash on tap
  useLayoutEffect(() => {
    const curr = pillSlot;
    const prev = prevSlotRef.current;
    const slotPct  = 100 / numSlots;
    const SPRING   = "cubic-bezier(0.34, 1.56, 0.64, 1)";
    const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";
    const STRETCH_MS = 110;
    const SNAP_MS    = 220;

    if (timerRef.current) clearTimeout(timerRef.current);

    // Initial render — place pill instantly, no animation
    if (!mountedRef.current) {
      mountedRef.current = true;
      setPillLeft(`${(curr / numSlots) * 100}%`);
      setPillWidth(`${slotPct}%`);
      setPillLeftTx("none");
      setPillWidthTx("none");
      prevSlotRef.current = curr;
      return;
    }

    if (prev === curr) return;

    const movingRight = curr > prev;

    if (movingRight) {
      // Phase 1: stretch pill rightward instantly
      setPillLeftTx("none");
      setPillWidthTx("none");
      setPillLeft(`${(prev / numSlots) * 100}%`);
      setPillWidth(`${(curr - prev + 1) * slotPct}%`);
      // Phase 2: snap left edge + contract width with spring
      timerRef.current = setTimeout(() => {
        setPillLeftTx(`left ${SNAP_MS}ms ${SPRING}`);
        setPillWidthTx(`width ${SNAP_MS}ms ${SPRING}`);
        setPillLeft(`${(curr / numSlots) * 100}%`);
        setPillWidth(`${slotPct}%`);
      }, STRETCH_MS);
    } else {
      // Phase 1: move left edge instantly, extend rightward
      const prevRightPct = (prev + 1) * slotPct;
      const newLeftPct   = (curr / numSlots) * 100;
      setPillLeftTx("none");
      setPillWidthTx("none");
      setPillLeft(`${newLeftPct}%`);
      setPillWidth(`${prevRightPct - newLeftPct}%`);
      // Phase 2: contract width with spring
      timerRef.current = setTimeout(() => {
        setPillLeftTx("none");
        setPillWidthTx(`width ${SNAP_MS}ms ${SPRING}`);
        setPillWidth(`${slotPct}%`);
      }, STRETCH_MS);
    }

    prevSlotRef.current = curr;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pillSlot]);

  return (
    <>
      {/* Backdrop */}
      {(moreOpen || quickOpen) && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          onClick={() => { setMoreOpen(false); setQuickOpen(false); }}
          aria-hidden="true"
        />
      )}

      {/* ── Main nav container ────────────────────────────────────────────── */}
      <div
        className="fixed bottom-0 inset-x-0 z-40 lg:hidden"
        style={{ paddingBottom: "max(10px, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-3 flex items-end gap-2.5">

          {/* Unified nav card — glassmorphism */}
          <div
            ref={containerRef}
            className="flex-1 overflow-hidden rounded-[26px] backdrop-blur-2xl bg-white/75 dark:bg-shark-900/70 border border-white/60 dark:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.40),0_2px_8px_rgba(0,0,0,0.20),inset_0_1px_0_rgba(255,255,255,0.06)]"
          >
            {/* More grid — expands upward */}
            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-300",
                moreOpen
                  ? "grid-rows-[1fr] ease-[cubic-bezier(0.32,0.72,0,1)]"
                  : "grid-rows-[0fr] ease-in"
              )}
            >
              <div className="overflow-hidden min-h-0">
                <div className="grid grid-cols-3 gap-y-5 gap-x-3 px-5 pt-6 pb-4">
                  {moreItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className="flex flex-col items-center gap-2 touch-manipulation select-none"
                    >
                      <div className={cn(
                        "w-[62px] h-[62px] rounded-[20px] flex items-center justify-center",
                        item.bg
                      )}>
                        <Icon name={item.icon} size={27} className={item.fg} />
                      </div>
                      <span className="text-[11px] font-medium text-shark-700 dark:text-shark-300 text-center leading-tight">
                        {item.label}
                      </span>
                    </Link>
                  ))}
                </div>
                {/* Divider */}
                <div className="mx-4 h-px bg-shark-100 dark:bg-shark-800" />
              </div>
            </div>

            {/* Nav row — always visible */}
            <nav
              aria-label="Mobile navigation"
              className="relative flex items-center py-2.5"
            >
              {/* One UI–style active pill — soft blue tint */}
              <div
                aria-hidden="true"
                className="absolute inset-y-1 rounded-full bg-action-50 dark:bg-action-500/12 pointer-events-none"
                style={{
                  left:       pillLeft,
                  width:      pillWidth,
                  transition: [pillLeftTx, pillWidthTx].filter(t => t !== "none").join(", ") || "none",
                }}
              />

              {allItems.map((item, idx) => (
                <NavButton
                  key={item.href}
                  item={item}
                  active={!moreOpen && navActiveIdx === idx}
                  onSelect={() => setMoreOpen(false)}
                />
              ))}

              {/* More button */}
              <button
                onClick={() => setMoreOpen((p) => !p)}
                aria-label={moreOpen ? "Close more menu" : "Open more menu"}
                className="relative z-10 flex flex-col items-center justify-center flex-1 gap-1 py-2 px-3 min-h-[52px] touch-manipulation select-none"
              >
                <div className="relative flex items-center justify-center">
                  <Icon
                    name="grid"
                    size={23}
                    filled
                    className={cn(
                      "transition-colors duration-200",
                      moreOpen || navActiveIdx === -1 ? "text-action-600" : "text-shark-400 dark:text-shark-500"
                    )}
                  />
                  {installReady && !moreOpen && (
                    <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-green-500 border-2 border-white dark:border-shark-900" />
                  )}
                </div>
                <span className={cn(
                  "text-[10px] leading-none transition-colors duration-200",
                  moreOpen || navActiveIdx === -1
                    ? "font-bold text-action-600"
                    : "font-medium text-shark-400 dark:text-shark-500"
                )}>
                  More
                </span>
              </button>
            </nav>
          </div>

          {/* ── FAB speed-dial ─────────────────────────────────────────────── */}
          <div className="relative shrink-0">

            {/* Speed-dial actions — stacked above FAB */}
            <div className="absolute bottom-[72px] right-0 flex flex-col items-end gap-3 pointer-events-none">
              {quickActions.map((action, i) => {
                const openDelay  = (quickActions.length - 1 - i) * 50;
                const closeDelay = i * 35;
                return (
                  <div
                    key={action.label}
                    className={cn(
                      "flex items-center gap-2.5 transition-all",
                      quickOpen
                        ? "opacity-100 translate-y-0 pointer-events-auto"
                        : "opacity-0 translate-y-4 pointer-events-none"
                    )}
                    style={{
                      transitionDuration: `${quickOpen ? 200 : 150}ms`,
                      transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                      transitionDelay: `${quickOpen ? openDelay : closeDelay}ms`,
                    }}
                  >
                    {/* Label chip */}
                    <div className="bg-white dark:bg-shark-800 rounded-full px-3.5 py-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.12)] border border-shark-100 dark:border-shark-700">
                      <span className="text-[12px] font-semibold text-shark-800 dark:text-shark-100 whitespace-nowrap">
                        {action.label}
                      </span>
                    </div>
                    {/* Mini FAB */}
                    <Link
                      href={action.href}
                      onClick={() => setQuickOpen(false)}
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-[0_4px_16px_rgba(0,0,0,0.2)] touch-manipulation select-none",
                        action.color
                      )}
                    >
                      <Icon name={action.icon} size={19} className="text-white" />
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Main FAB — glassmorphism */}
            <button
              onClick={() => setQuickOpen((p) => !p)}
              aria-label={quickOpen ? "Close quick actions" : "Quick actions"}
              className="w-[62px] h-[62px] rounded-full flex items-center justify-center touch-manipulation select-none transition-all duration-200 backdrop-blur-2xl bg-white/75 dark:bg-shark-900/70 border border-white/60 dark:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.40),0_2px_8px_rgba(0,0,0,0.20),inset_0_1px_0_rgba(255,255,255,0.06)]"
            >
              <Icon
                name="plus"
                size={27}
                className={cn(
                  "transition-transform duration-200 text-shark-700 dark:text-shark-200",
                  quickOpen && "rotate-45"
                )}
              />
            </button>
          </div>

        </div>
      </div>
    </>
  );
}

// ─── Nav button ───────────────────────────────────────────────────────────────

function NavButton({ item, active, onSelect }: { item: NavItem; active: boolean; onSelect?: () => void }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      onClick={onSelect}
      className="relative z-10 flex flex-col items-center justify-center flex-1 gap-1 py-2 px-3 min-h-[52px] touch-manipulation select-none"
    >
      <div className="relative flex items-center justify-center">
        <Icon
          name={item.icon}
          size={23}
          filled={active}
          className={cn(
            "transition-all duration-220",
            active ? "text-action-600 dark:text-action-400 scale-110" : "text-shark-400 dark:text-shark-500"
          )}
        />
        {item.badge != null && item.badge > 0 && (
          <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold px-0.5 leading-none shadow-sm">
            {item.badge > 99 ? "99+" : item.badge}
          </span>
        )}
      </div>
      <span className={cn(
        "text-[10px] leading-none transition-all duration-220",
        active
          ? "font-bold text-action-600 dark:text-action-400"
          : "font-medium text-shark-400 dark:text-shark-500"
      )}>
        {item.label}
      </span>
    </Link>
  );
}
