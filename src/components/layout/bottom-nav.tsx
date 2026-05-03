"use client";

import { useState, useEffect, useRef } from "react";
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
  bg: string;   // tailwind bg class for icon box
  fg: string;   // tailwind text class for icon
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

// All tiles use the same uniform grey tile (like ClickUp) — only icon colour varies
const TILE = "bg-[#EBEBEB] dark:bg-[#3D3D3D]";

function getMoreItems(role: Role): MoreGridItem[] {
  switch (role) {
    case "STAFF":
      return [
        { label: "Scan QR",        href: "/scan",                icon: "qr-code",        bg: TILE, fg: "text-shark-600 dark:text-shark-300" },
        { label: "Request Supply", href: "/request-consumables", icon: "droplet",        bg: TILE, fg: "text-blue-500" },
        { label: "Report Damage",  href: "/report-damage",       icon: "alert-triangle", bg: TILE, fg: "text-red-500" },
        { label: "My Assets",      href: "/my-assets",           icon: "package",        bg: TILE, fg: "text-purple-500" },
        { label: "My Supplies",    href: "/my-consumables",      icon: "droplet",        bg: TILE, fg: "text-cyan-500" },
        { label: "Dashboard",      href: "/dashboard",           icon: "dashboard",      bg: TILE, fg: "text-indigo-500" },
        { label: "Settings",       href: "/settings",            icon: "settings",       bg: TILE, fg: "text-shark-500 dark:text-shark-400" },
      ];
    case "SUPER_ADMIN":
      return [
        { label: "Supplies",        href: "/consumables",      icon: "droplet",        bg: TILE, fg: "text-blue-500" },
        { label: "Purchase Orders", href: "/purchase-orders",  icon: "truck",          bg: TILE, fg: "text-green-500" },
        { label: "Staff",           href: "/staff",            icon: "users",          bg: TILE, fg: "text-indigo-500" },
        { label: "Starter Kits",    href: "/starter-kits",     icon: "box",            bg: TILE, fg: "text-amber-500" },
        { label: "Returns",         href: "/returns",          icon: "arrow-left",     bg: TILE, fg: "text-orange-500" },
        { label: "Maintenance",     href: "/maintenance",      icon: "wrench",         bg: TILE, fg: "text-shark-500 dark:text-shark-400" },
        { label: "Reports",         href: "/reports",          icon: "clipboard",      bg: TILE, fg: "text-teal-500" },
        { label: "Inspections",     href: "/condition-checks", icon: "search",         bg: TILE, fg: "text-violet-500" },
        { label: "Anomalies",       href: "/alerts/anomalies", icon: "alert-triangle", bg: TILE, fg: "text-red-500" },
      ];
    case "BRANCH_MANAGER":
      return [
        { label: "Supplies",        href: "/consumables",      icon: "droplet",        bg: TILE, fg: "text-blue-500" },
        { label: "Purchase Orders", href: "/purchase-orders",  icon: "truck",          bg: TILE, fg: "text-green-500" },
        { label: "Staff",           href: "/staff",            icon: "users",          bg: TILE, fg: "text-indigo-500" },
        { label: "Starter Kits",    href: "/starter-kits",     icon: "box",            bg: TILE, fg: "text-amber-500" },
        { label: "Returns",         href: "/returns",          icon: "arrow-left",     bg: TILE, fg: "text-orange-500" },
        { label: "Maintenance",     href: "/maintenance",      icon: "wrench",         bg: TILE, fg: "text-shark-500 dark:text-shark-400" },
        { label: "Reports",         href: "/reports",          icon: "clipboard",      bg: TILE, fg: "text-teal-500" },
        { label: "Inspections",     href: "/condition-checks", icon: "search",         bg: TILE, fg: "text-violet-500" },
        { label: "Anomalies",       href: "/alerts/anomalies", icon: "alert-triangle", bg: TILE, fg: "text-red-500" },
      ];
    case "AUDITOR":
      return [
        { label: "Dashboard", href: "/dashboard", icon: "dashboard",      bg: TILE, fg: "text-shark-600 dark:text-shark-300" },
        { label: "Reports",   href: "/reports",   icon: "clipboard",      bg: TILE, fg: "text-teal-500" },
        { label: "Activity",  href: "/activity",  icon: "clock",          bg: TILE, fg: "text-violet-500" },
        { label: "Scan QR",   href: "/scan",      icon: "qr-code",        bg: TILE, fg: "text-shark-600 dark:text-shark-300" },
        { label: "Settings",  href: "/settings",  icon: "settings",       bg: TILE, fg: "text-shark-500 dark:text-shark-400" },
      ];
    default:
      return [
        { label: "Scan QR",        href: "/scan",                icon: "qr-code",        bg: TILE, fg: "text-shark-600 dark:text-shark-300" },
        { label: "Request Supply", href: "/request-consumables", icon: "droplet",        bg: TILE, fg: "text-blue-500" },
        { label: "Report Damage",  href: "/report-damage",       icon: "alert-triangle", bg: TILE, fg: "text-red-500" },
        { label: "Settings",       href: "/settings",            icon: "settings",       bg: TILE, fg: "text-shark-500 dark:text-shark-400" },
      ];
  }
}

// ─── Quick action items per role ─────────────────────────────────────────────

interface QuickAction {
  label: string;
  href: string;
  icon: IconName;
}

function getQuickActions(role: Role): QuickAction[] {
  switch (role) {
    case "SUPER_ADMIN":
    case "BRANCH_MANAGER":
      return [
        { label: "New User",    href: "/staff?action=add",              icon: "users"   },
        { label: "Add Stock",   href: "/consumables?action=add",        icon: "droplet" },
        { label: "Starter Kit", href: "/starter-kits?action=new",      icon: "box"     },
        { label: "New Order",   href: "/purchase-orders?action=create", icon: "truck"   },
      ];
    case "STAFF":
      return [
        { label: "Request Supply", href: "/request-consumables", icon: "droplet"        },
        { label: "Report Damage",  href: "/report-damage",       icon: "alert-triangle" },
        { label: "Scan QR",        href: "/scan",                icon: "qr-code"        },
      ];
    default:
      return [
        { label: "Scan QR", href: "/scan", icon: "qr-code" },
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
  const [pillLeft, setPillLeft]       = useState<string>("0%");
  const [pillWidth, setPillWidth]     = useState<string>("25%");
  const [pillLeftTx, setPillLeftTx]   = useState<string>("none");
  const [pillWidthTx, setPillWidthTx] = useState<string>("none");
  const prevSlotRef = useRef<number>(-1); // -1 = uninitialized
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
  const numSlots     = allItems.length + 1; // nav items + More
  const moreItems    = getMoreItems(role);
  const quickActions = getQuickActions(role);

  // Active nav item index (0…allItems.length-1), -1 if none matches
  const navActiveIdx = allItems.findIndex(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );

  // The slot that drives the pill: More slot if sheet is open OR no nav item matched
  const pillSlot = moreOpen || navActiveIdx === -1
    ? allItems.length   // More slot = last index
    : navActiveIdx;

  // ── Elastic pill: 2-phase rubber-band animation ───────────────────────────
  useEffect(() => {
    const curr = pillSlot;
    const prev = prevSlotRef.current;
    const slotPct  = 100 / numSlots;
    const SPRING   = "cubic-bezier(0.34, 1.56, 0.64, 1)";
    const EASE_OUT = "cubic-bezier(0.25, 1, 0.5, 1)";
    const STRETCH_MS = 140;
    const SNAP_MS    = 260;

    if (timerRef.current) clearTimeout(timerRef.current);

    if (prev === -1) {
      // First render — snap to position instantly
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
      // Phase 1: right edge leaps to destination (pill stretches right)
      setPillLeftTx("none");
      setPillWidthTx(`width ${STRETCH_MS}ms ${EASE_OUT}`);
      setPillLeft(`${(prev / numSlots) * 100}%`);
      setPillWidth(`${(curr - prev + 1) * slotPct}%`);
      // Phase 2: left edge catches up, width contracts
      timerRef.current = setTimeout(() => {
        setPillLeftTx(`left ${SNAP_MS}ms ${SPRING}`);
        setPillWidthTx(`width ${SNAP_MS}ms ${SPRING}`);
        setPillLeft(`${(curr / numSlots) * 100}%`);
        setPillWidth(`${slotPct}%`);
      }, STRETCH_MS);
    } else {
      // Phase 1: left edge leaps to destination (pill stretches left)
      const prevRightPct = (prev + 1) * slotPct;
      const newLeftPct   = (curr / numSlots) * 100;
      setPillLeftTx(`left ${STRETCH_MS}ms ${EASE_OUT}`);
      setPillWidthTx("none");
      setPillLeft(`${newLeftPct}%`);
      setPillWidth(`${prevRightPct - newLeftPct}%`);
      // Phase 2: right edge snaps in, width contracts
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
      {/* Tap outside to close More / speed-dial */}
      {(moreOpen || quickOpen) && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          onClick={() => { setMoreOpen(false); setQuickOpen(false); }}
          aria-hidden="true"
        />
      )}

      {/* ── Unified nav bar — panel expands upward to reveal More grid ──────── */}
      <div
        className="fixed bottom-0 inset-x-0 z-40 lg:hidden"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-8 flex items-end gap-2.5">

          {/*
            Single unified card — nav buttons always visible at the bottom.
            The More grid lives above them and is revealed by expanding the card
            upward using grid-template-rows: 0fr → 1fr animation.
            overflow-hidden ensures nothing peeks out when collapsed.
          */}
          <div
            ref={containerRef}
            className="flex-1 overflow-hidden rounded-[28px] bg-white/60 dark:bg-shark-950/60 backdrop-blur-2xl backdrop-saturate-150 border border-white/50 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)]"
          >
            {/*
              Grid wrapper — height animates from 0 → natural height via
              grid-template-rows trick (no fixed pixel value needed).
            */}
            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-300",
                moreOpen
                  ? "grid-rows-[1fr] ease-[cubic-bezier(0.32,0.72,0,1)]"
                  : "grid-rows-[0fr] ease-in"
              )}
            >
              <div className="overflow-hidden min-h-0">
                <div className="grid grid-cols-3 gap-y-5 gap-x-2 px-4 pt-5 pb-3">
                  {moreItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className="flex flex-col items-center gap-2 active:opacity-60 transition-opacity"
                    >
                      <div className={cn(
                        "w-[60px] h-[60px] rounded-[18px] flex items-center justify-center",
                        item.bg
                      )}>
                        <Icon name={item.icon} size={26} className={item.fg} />
                      </div>
                      <span className="text-[11px] font-medium text-shark-700 dark:text-shark-300 text-center leading-tight">
                        {item.label}
                      </span>
                    </Link>
                  ))}
                </div>
                {/* Divider between grid and nav row */}
                <div className="mx-3 h-px bg-shark-100 dark:bg-shark-800" />
              </div>
            </div>

            {/* Nav row — always visible */}
            <nav
              aria-label="Mobile navigation"
              className="relative flex items-center py-2"
            >
              {/* Elastic sliding pill */}
              <div
                aria-hidden="true"
                className="absolute inset-y-1.5 rounded-full bg-[#E8E8E8] dark:bg-[#3D3D3D] pointer-events-none"
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
                />
              ))}

              {/* More — last slot */}
              <button
                onClick={() => setMoreOpen((p) => !p)}
                aria-label={moreOpen ? "Close more menu" : "Open more menu"}
                className="relative z-10 flex flex-col items-center justify-center flex-1 gap-1 py-1.5 px-3"
              >
                <div className="relative flex items-center justify-center">
                  <Icon
                    name="grid"
                    size={20}
                    filled
                    className={cn(
                      "transition-colors duration-200",
                      moreOpen ? "text-action-500" : "text-shark-400 dark:text-shark-500"
                    )}
                  />
                  {installReady && !moreOpen && (
                    <span className="absolute -top-1.5 -right-2 w-2 h-2 rounded-full bg-green-500 border-2 border-white dark:border-shark-950" />
                  )}
                </div>
                <span className={cn(
                  "text-[10px] leading-none transition-colors duration-200",
                  moreOpen
                    ? "font-semibold text-action-500"
                    : "font-medium text-shark-400 dark:text-shark-500"
                )}>
                  More
                </span>
              </button>
            </nav>
          </div>

          {/* ── FAB speed-dial ───────────────────────────────────────────── */}
          <div className="relative shrink-0">

            {/* Speed-dial action buttons — stacked above the FAB */}
            <div className="absolute bottom-[68px] right-0 flex flex-col items-end gap-3 pointer-events-none">
              {quickActions.map((action, i) => {
                // Bottom-most action (last in array) animates in first
                const openDelay  = (quickActions.length - 1 - i) * 55;
                const closeDelay = i * 40;
                return (
                  <div
                    key={action.label}
                    className={cn(
                      "flex items-center gap-2.5 transition-all duration-200",
                      quickOpen
                        ? "opacity-100 translate-y-0 pointer-events-auto"
                        : "opacity-0 translate-y-3 pointer-events-none"
                    )}
                    style={{ transitionDelay: `${quickOpen ? openDelay : closeDelay}ms` }}
                  >
                    {/* Label pill */}
                    <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 shadow-sm border border-shark-200/60">
                      <span className="text-[11px] font-semibold text-shark-700 whitespace-nowrap">
                        {action.label}
                      </span>
                    </div>
                    {/* Mini circular FAB */}
                    <Link
                      href={action.href}
                      onClick={() => setQuickOpen(false)}
                      className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 bg-black border border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.25)] active:scale-90 transition-transform duration-150"
                    >
                      <Icon name={action.icon} size={18} className="text-white" />
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Main FAB button */}
            <button
              onClick={() => setQuickOpen((p) => !p)}
              aria-label={quickOpen ? "Close quick actions" : "Quick actions"}
              className="w-[60px] h-[60px] rounded-full flex items-center justify-center bg-white/60 dark:bg-shark-950/60 backdrop-blur-2xl backdrop-saturate-150 border border-white/50 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)] active:scale-95 transition-all duration-200"
            >
              <Icon
                name="plus"
                size={26}
                className={cn(
                  "transition-transform duration-300 text-shark-700 dark:text-shark-300",
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

function NavButton({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className="relative z-10 flex flex-col items-center justify-center flex-1 gap-1 py-1.5 px-3"
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
