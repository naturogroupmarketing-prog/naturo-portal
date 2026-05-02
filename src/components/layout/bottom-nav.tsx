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

function getMoreItems(role: Role): MoreGridItem[] {
  switch (role) {
    case "STAFF":
      return [
        { label: "Scan QR",        href: "/scan",                icon: "qr-code",        bg: "bg-shark-100 dark:bg-shark-800",      fg: "text-shark-600 dark:text-shark-300" },
        { label: "Request Supply", href: "/request-consumables", icon: "droplet",        bg: "bg-blue-100 dark:bg-blue-900/40",     fg: "text-blue-600 dark:text-blue-400" },
        { label: "Report Damage",  href: "/report-damage",       icon: "alert-triangle", bg: "bg-red-100 dark:bg-red-900/40",       fg: "text-red-600 dark:text-red-400" },
        { label: "My Assets",      href: "/my-assets",           icon: "package",        bg: "bg-purple-100 dark:bg-purple-900/40", fg: "text-purple-600 dark:text-purple-400" },
        { label: "My Supplies",    href: "/my-consumables",      icon: "droplet",        bg: "bg-cyan-100 dark:bg-cyan-900/40",     fg: "text-cyan-600 dark:text-cyan-400" },
        { label: "Dashboard",      href: "/dashboard",           icon: "dashboard",      bg: "bg-indigo-100 dark:bg-indigo-900/40", fg: "text-indigo-600 dark:text-indigo-400" },
        { label: "Settings",       href: "/settings",            icon: "settings",       bg: "bg-shark-100 dark:bg-shark-800",      fg: "text-shark-600 dark:text-shark-300" },
      ];
    case "SUPER_ADMIN":
      return [
        { label: "Scan QR",    href: "/scan",                          icon: "qr-code",      bg: "bg-shark-100 dark:bg-shark-800",      fg: "text-shark-600 dark:text-shark-300" },
        { label: "Create PO",  href: "/purchase-orders?action=create", icon: "truck",        bg: "bg-green-100 dark:bg-green-900/40",   fg: "text-green-600 dark:text-green-400" },
        { label: "Add Supply", href: "/consumables?action=add",        icon: "droplet",      bg: "bg-blue-100 dark:bg-blue-900/40",     fg: "text-blue-600 dark:text-blue-400" },
        { label: "Add Asset",  href: "/assets?action=add",             icon: "package",      bg: "bg-purple-100 dark:bg-purple-900/40", fg: "text-purple-600 dark:text-purple-400" },
        { label: "Staff",      href: "/staff",                         icon: "user",         bg: "bg-indigo-100 dark:bg-indigo-900/40", fg: "text-indigo-600 dark:text-indigo-400" },
        { label: "Issue Kit",  href: "/starter-kits?action=new",       icon: "box",          bg: "bg-amber-100 dark:bg-amber-900/40",   fg: "text-amber-600 dark:text-amber-400" },
        { label: "Returns",    href: "/returns",                       icon: "arrow-left",   bg: "bg-orange-100 dark:bg-orange-900/40", fg: "text-orange-600 dark:text-orange-400" },
        { label: "Reports",    href: "/reports",                       icon: "clipboard",    bg: "bg-teal-100 dark:bg-teal-900/40",     fg: "text-teal-600 dark:text-teal-400" },
        { label: "Settings",   href: "/settings",                      icon: "settings",     bg: "bg-shark-100 dark:bg-shark-800",      fg: "text-shark-600 dark:text-shark-300" },
      ];
    case "BRANCH_MANAGER":
      return [
        { label: "Scan QR",        href: "/scan",                    icon: "qr-code",      bg: "bg-shark-100 dark:bg-shark-800",      fg: "text-shark-600 dark:text-shark-300" },
        { label: "Add Supply",     href: "/consumables?action=add",  icon: "droplet",      bg: "bg-blue-100 dark:bg-blue-900/40",     fg: "text-blue-600 dark:text-blue-400" },
        { label: "Process Return", href: "/returns",                 icon: "arrow-left",   bg: "bg-orange-100 dark:bg-orange-900/40", fg: "text-orange-600 dark:text-orange-400" },
        { label: "Staff",          href: "/staff",                   icon: "user",         bg: "bg-indigo-100 dark:bg-indigo-900/40", fg: "text-indigo-600 dark:text-indigo-400" },
        { label: "Issue Kit",      href: "/starter-kits?action=new", icon: "box",          bg: "bg-amber-100 dark:bg-amber-900/40",   fg: "text-amber-600 dark:text-amber-400" },
        { label: "Reports",        href: "/reports",                 icon: "clipboard",    bg: "bg-teal-100 dark:bg-teal-900/40",     fg: "text-teal-600 dark:text-teal-400" },
        { label: "Activity",       href: "/activity",                icon: "clock",        bg: "bg-violet-100 dark:bg-violet-900/40", fg: "text-violet-600 dark:text-violet-400" },
        { label: "Dashboard",      href: "/dashboard",               icon: "dashboard",    bg: "bg-shark-100 dark:bg-shark-800",      fg: "text-shark-600 dark:text-shark-300" },
        { label: "Settings",       href: "/settings",                icon: "settings",     bg: "bg-shark-100 dark:bg-shark-800",      fg: "text-shark-600 dark:text-shark-300" },
      ];
    case "AUDITOR":
      return [
        { label: "Dashboard",  href: "/dashboard", icon: "dashboard",      bg: "bg-shark-100 dark:bg-shark-800",      fg: "text-shark-600 dark:text-shark-300" },
        { label: "Reports",    href: "/reports",   icon: "clipboard",      bg: "bg-teal-100 dark:bg-teal-900/40",     fg: "text-teal-600 dark:text-teal-400" },
        { label: "Activity",   href: "/activity",  icon: "clock",          bg: "bg-violet-100 dark:bg-violet-900/40", fg: "text-violet-600 dark:text-violet-400" },
        { label: "Scan QR",    href: "/scan",      icon: "qr-code",        bg: "bg-shark-100 dark:bg-shark-800",      fg: "text-shark-600 dark:text-shark-300" },
        { label: "Settings",   href: "/settings",  icon: "settings",       bg: "bg-shark-100 dark:bg-shark-800",      fg: "text-shark-600 dark:text-shark-300" },
      ];
    default:
      return [
        { label: "Scan QR",        href: "/scan",                icon: "qr-code",        bg: "bg-shark-100 dark:bg-shark-800",      fg: "text-shark-600 dark:text-shark-300" },
        { label: "Request Supply", href: "/request-consumables", icon: "droplet",        bg: "bg-blue-100 dark:bg-blue-900/40",     fg: "text-blue-600 dark:text-blue-400" },
        { label: "Report Damage",  href: "/report-damage",       icon: "alert-triangle", bg: "bg-red-100 dark:bg-red-900/40",       fg: "text-red-600 dark:text-red-400" },
        { label: "Settings",       href: "/settings",            icon: "settings",       bg: "bg-shark-100 dark:bg-shark-800",      fg: "text-shark-600 dark:text-shark-300" },
      ];
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BottomNav({ role, pendingPOCount = 0, pendingReturnsCount = 0 }: BottomNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [installReady, setInstallReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Elastic pill animation state ─────────────────────────────────────────
  const [pillLeft, setPillLeft]     = useState<string>("0%");
  const [pillWidth, setPillWidth]   = useState<string>("25%");
  const [pillLeftTx, setPillLeftTx] = useState<string>("none");
  const [pillWidthTx, setPillWidthTx] = useState<string>("none");
  const prevSlotRef = useRef<number>(-1); // -1 = uninitialized
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Close More sheet on navigation
  useEffect(() => { setMoreOpen(false); }, [pathname]);

  // Cleanup animation timer on unmount
  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const allItems = getNavItems(role, pendingPOCount, pendingReturnsCount);
  const numSlots  = allItems.length + 1; // nav items + More
  const moreItems = getMoreItems(role);

  // Active nav item index (0…allItems.length-1), -1 if none matches
  let navActiveIdx = allItems.findIndex(
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
    const SPRING   = "cubic-bezier(0.34, 1.56, 0.64, 1)"; // more overshoot = bouncier
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

  // Top quick-action for the + FAB (first More item)
  const fabItem = moreItems[0];

  return (
    <>
      {/* ── More bottom sheet ──────────────────────────────────────────────── */}
      {/* Backdrop */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 dark:bg-black/40"
          onClick={() => setMoreOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sheet — bottom edge sits flush with the top of the nav bar */}
      <div
        className={cn(
          "fixed inset-x-0 z-[35] transition-transform duration-300",
          moreOpen
            ? "translate-y-0 ease-out"
            : "translate-y-full ease-in pointer-events-none"
        )}
        style={{ bottom: "calc(60px + max(12px, env(safe-area-inset-bottom)))" }}
      >
        <div className="bg-white dark:bg-shark-900 rounded-t-[28px] shadow-[0_-4px_24px_rgba(0,0,0,0.12)] overflow-hidden">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-9 h-1 rounded-full bg-shark-200 dark:bg-shark-700" />
          </div>

          {/* Grid */}
          <div className="grid grid-cols-3 gap-y-5 gap-x-2 px-6 pt-4 pb-6">
            {moreItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className="flex flex-col items-center gap-2 active:opacity-70 transition-opacity"
              >
                <div className={cn("w-16 h-16 rounded-[20px] flex items-center justify-center", item.bg)}>
                  <Icon name={item.icon} size={26} className={item.fg} />
                </div>
                <span className="text-[11px] font-medium text-shark-700 dark:text-shark-300 text-center leading-tight">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Nav bar ────────────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="fixed bottom-0 inset-x-0 z-40 lg:hidden"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        {/* Floating bar */}
        <div className="mx-8 flex items-center gap-2.5">

          {/* Frosted glass nav pill — full capsule shape like ClickUp */}
          <nav
            aria-label="Mobile navigation"
            className="relative flex-1 flex items-center bg-white/80 dark:bg-shark-950/80 backdrop-blur-2xl rounded-full border border-white/60 dark:border-shark-700/50 shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)] py-2"
          >
            {/* Elastic sliding pill — solid grey like ClickUp */}
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
                  size={22}
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

          {/* Plus circle — quick shortcut to primary action */}
          <Link
            href={fabItem?.href ?? "/scan"}
            aria-label={fabItem?.label ?? "Scan QR"}
            className="w-[60px] h-[60px] rounded-full flex items-center justify-center shrink-0 bg-white/80 dark:bg-shark-950/80 backdrop-blur-2xl border border-white/60 dark:border-shark-700/50 shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)] active:scale-95 transition-transform duration-200"
          >
            <Icon
              name="plus"
              size={26}
              className="text-shark-700 dark:text-shark-300"
            />
          </Link>
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
