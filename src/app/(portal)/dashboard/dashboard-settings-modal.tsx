"use client";

import {
  useState, useTransition, useRef, useCallback, useEffect, type RefCallback,
} from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { updateWidgetVisibility, reorderSections } from "@/app/actions/dashboard";
import {
  WIDGET_LABELS, DASHBOARD_SECTIONS,
  type DashboardPreferences, type WidgetId,
} from "@/lib/dashboard-types";
import type { IconName } from "@/components/ui/icon";

/* ─── Toggle ────────────────────────────────────────────────────────────────── */

function Toggle({ checked, onChange, disabled }: {
  checked: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <button
      type="button" role="switch" aria-checked={checked} disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-[30px] w-[52px] flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        checked ? "bg-action-500" : "bg-shark-200 dark:bg-shark-700",
      )}
    >
      <span className={cn(
        "inline-block h-[24px] w-[24px] rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.22)] transition-transform duration-200",
        checked ? "translate-x-[25px]" : "translate-x-[3px]",
      )} />
    </button>
  );
}

/* ─── Helpers ───────────────────────────────────────────────────────────────── */

const SECTION_LABELS: Record<string, string> = Object.fromEntries(
  DASHBOARD_SECTIONS.map(s => [s.id, s.label])
);

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/* ─── Drag-to-reorder list ──────────────────────────────────────────────────── */

function SectionDragList({ order, onReorder }: {
  order: string[];
  onReorder: (next: string[]) => void;
}) {
  const [liveOrder, setLiveOrder]     = useState(order);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragDeltaY, setDragDeltaY]   = useState(0);

  // Always-current refs (safe to read inside native event listener closures)
  const fromRef      = useRef<number | null>(null);
  const startYRef    = useRef(0);
  const deltaRef     = useRef(0);
  const itemHRef     = useRef(56);
  const liveRef      = useRef(liveOrder);
  liveRef.current    = liveOrder;

  // One ref slot per row element, one per handle element
  const rowEls    = useRef<(HTMLDivElement | null)[]>([]);
  const handleEls = useRef<(HTMLDivElement | null)[]>([]);

  // Sync when parent order changes (modal reopens / server refresh)
  useEffect(() => {
    if (fromRef.current === null) setLiveOrder(order);
  }, [order]);

  /* Commit the drop — shared by touch and mouse paths */
  const commitDrop = useCallback(() => {
    const from = fromRef.current;
    if (from === null) return;
    const to = clamp(
      Math.round(from + deltaRef.current / itemHRef.current),
      0,
      liveRef.current.length - 1,
    );
    fromRef.current = null;
    deltaRef.current = 0;
    setDraggingIdx(null);
    setDragDeltaY(0);
    if (from !== to) {
      const next = [...liveRef.current];
      const [removed] = next.splice(from, 1);
      next.splice(to, 0, removed);
      setLiveOrder(next);
      onReorder(next);
    }
  }, [onReorder]);

  /* ── Mouse drag (desktop) ────────────────────────────────────────────────── */
  const startMouse = useCallback((e: React.MouseEvent<HTMLDivElement>, idx: number) => {
    e.preventDefault();
    itemHRef.current  = rowEls.current[idx]?.getBoundingClientRect().height ?? 56;
    fromRef.current   = idx;
    startYRef.current = e.clientY;
    deltaRef.current  = 0;
    setDraggingIdx(idx);
    setDragDeltaY(0);

    const onMove = (ev: MouseEvent) => {
      const d = ev.clientY - startYRef.current;
      deltaRef.current = d;
      setDragDeltaY(d);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      commitDrop();
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp, { once: true });
  }, [commitDrop]);

  /* ── Touch drag (mobile) — native listeners attached in useEffect ────────── */
  // We capture startTouch in a ref so the useEffect closure stays stable.
  const startTouchRef = useRef<(e: TouchEvent, idx: number) => void>(() => {});
  startTouchRef.current = (e: TouchEvent, idx: number) => {
    e.preventDefault();                       // must be called on non-passive listener
    itemHRef.current  = rowEls.current[idx]?.getBoundingClientRect().height ?? 56;
    fromRef.current   = idx;
    startYRef.current = e.touches[0].clientY;
    deltaRef.current  = 0;
    setDraggingIdx(idx);
    setDragDeltaY(0);
    try { navigator.vibrate?.(8); } catch (_) {}

    const onMove = (ev: TouchEvent) => {
      ev.preventDefault();
      const d = ev.touches[0].clientY - startYRef.current;
      deltaRef.current = d;
      setDragDeltaY(d);
    };
    const onEnd = () => {
      window.removeEventListener("touchmove",   onMove);
      window.removeEventListener("touchend",    onEnd);
      window.removeEventListener("touchcancel", onEnd);
      commitDrop();
    };
    window.addEventListener("touchmove",   onMove, { passive: false });
    window.addEventListener("touchend",    onEnd,  { once: true });
    window.addEventListener("touchcancel", onEnd,  { once: true });
  };

  // Attach one non-passive touchstart listener to each handle element.
  // Re-runs whenever the rendered list order changes so indices stay correct.
  useEffect(() => {
    const cleanups: (() => void)[] = [];
    handleEls.current.forEach((el, idx) => {
      if (!el) return;
      const handler = (e: TouchEvent) => startTouchRef.current(e, idx);
      el.addEventListener("touchstart", handler, { passive: false });
      cleanups.push(() => el.removeEventListener("touchstart", handler));
    });
    return () => cleanups.forEach(fn => fn());
  }, [liveOrder]); // re-bind after every reorder so idx closures are fresh

  /* ── Render ─────────────────────────────────────────────────────────────── */
  const targetIdx = draggingIdx !== null
    ? clamp(Math.round(draggingIdx + dragDeltaY / itemHRef.current), 0, liveOrder.length - 1)
    : null;

  return (
    <div>
      {liveOrder.map((sectionId, idx) => {
        const lifted = idx === draggingIdx;
        let shiftY = 0;
        if (!lifted && draggingIdx !== null && targetIdx !== null) {
          if (draggingIdx < targetIdx && idx > draggingIdx && idx <= targetIdx) shiftY = -itemHRef.current;
          if (draggingIdx > targetIdx && idx < draggingIdx && idx >= targetIdx) shiftY =  itemHRef.current;
        }

        return (
          <div
            key={sectionId}
            ref={(el) => { rowEls.current[idx] = el; }}
            style={{
              transform: lifted
                ? `translateY(${dragDeltaY}px) scale(1.035)`
                : `translateY(${shiftY}px)`,
              transition: lifted
                ? "box-shadow 180ms ease, opacity 150ms ease"
                : "transform 210ms cubic-bezier(0.22,1,0.36,1)",
              zIndex:   lifted ? 20 : 1,
              position: "relative",
            }}
            className={cn(
              "flex items-center gap-3 select-none",
              "border-b border-shark-100 dark:border-shark-800 last:border-0",
              lifted
                ? "rounded-[16px] bg-white dark:bg-shark-800 py-3 px-2 shadow-[0_14px_40px_rgba(0,0,0,0.18),0_3px_8px_rgba(0,0,0,0.10)] opacity-[0.97]"
                : "py-3.5 px-0",
            )}
          >
            {/* Drag handle — big touch target, native touchstart attached above */}
            <div
              ref={(el) => { handleEls.current[idx] = el; }}
              onMouseDown={(e) => startMouse(e, idx)}
              aria-label="Drag to reorder"
              className="flex items-center justify-center w-11 h-11 -my-2 -ml-1 shrink-0 touch-none cursor-grab active:cursor-grabbing"
            >
              <svg width="18" height="14" viewBox="0 0 18 14" aria-hidden="true"
                className="text-shark-300 dark:text-shark-600">
                <rect x="0" y="0"    width="18" height="3" rx="1.5" fill="currentColor" />
                <rect x="0" y="5.5"  width="18" height="3" rx="1.5" fill="currentColor" />
                <rect x="0" y="11"   width="18" height="3" rx="1.5" fill="currentColor" />
              </svg>
            </div>

            <span className="flex-1 text-[15px] font-medium text-shark-900 dark:text-shark-100 leading-none pointer-events-none">
              {SECTION_LABELS[sectionId] ?? sectionId}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Widget map ────────────────────────────────────────────────────────────── */

const WIDGET_ICONS: Record<WidgetId, IconName> = {
  "stat-low-stock": "alert-triangle", "stat-total-assets": "package",
  "stat-checked-out": "check-circle", "stat-overdue": "clock",
  "stat-damaged": "alert-triangle",   "stat-lost": "alert-triangle",
  "stat-pending-requests": "inbox",   "stat-pending-returns": "arrow-left",
  "stat-pending-pos": "truck",        "low-stock-alerts": "alert-triangle",
  "quick-links": "home",              "portfolio-valuation": "bar-chart",
  "operations-overview": "dashboard", "maintenance-due": "wrench",
  "asset-charts": "bar-chart",        "consumable-charts": "droplet",
  "regional-breakdown": "map-pin",    "location-map": "map-pin",
  "predicted-shortages": "clock",     "ai-forecast": "star",
  "recent-activity": "clock",
};

const TILE_WIDGETS: WidgetId[] = [
  "stat-total-assets", "stat-checked-out", "stat-overdue", "stat-damaged",
  "stat-low-stock", "stat-pending-requests", "stat-pending-returns", "stat-pending-pos",
  "operations-overview", "maintenance-due", "asset-charts", "consumable-charts",
  "low-stock-alerts", "predicted-shortages", "recent-activity", "location-map", "quick-links",
];

/* ─── Bottom-sheet modal ─────────────────────────────────────────────────────── */

export function DashboardSettingsModal({ open, onClose, preferences }: {
  open: boolean; onClose: () => void; preferences: DashboardPreferences;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  const handleReorder = useCallback((newOrder: string[]) => {
    startTransition(async () => {
      await reorderSections(newOrder);
      router.refresh();
    });
  }, [router]);

  const handleToggle = (id: WidgetId, visible: boolean) => {
    startTransition(async () => {
      await updateWidgetVisibility(id, !visible);
      router.refresh();
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true" onClick={onClose}
        className={cn(
          "fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
      />

      {/* Sheet */}
      <div
        role="dialog" aria-modal="true" aria-label="Customize Dashboard" aria-hidden={!open}
        className={cn(
          "fixed inset-x-0 bottom-0 z-[61] flex flex-col bg-white dark:bg-shark-900",
          "rounded-t-[28px] max-h-[90dvh] shadow-[0_-4px_40px_rgba(0,0,0,0.16)]",
          "transition-transform duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "translate-y-0" : "translate-y-full",
        )}
        style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}
      >
        {/* Pull handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0" aria-hidden="true">
          <div className="w-10 h-[5px] rounded-full bg-shark-200 dark:bg-shark-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0">
          <h2 className="text-[17px] font-bold text-shark-900 dark:text-white tracking-tight">
            Customize Dashboard
          </h2>
          <button onClick={onClose} aria-label="Close"
            className="w-9 h-9 rounded-full bg-shark-100 dark:bg-shark-800 flex items-center justify-center text-shark-500 dark:text-shark-400 hover:bg-shark-200 dark:hover:bg-shark-700 transition-colors">
            <Icon name="x" size={15} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain">

          {/* Sections */}
          <div className="px-5 pt-2 pb-6">
            <p className="text-[13px] font-semibold text-shark-500 dark:text-shark-400 mb-0.5">
              Customize sections
            </p>
            <p className="text-[12px] text-shark-400 dark:text-shark-500 mb-4">
              Grab the handle and drag to reorder
            </p>
            <SectionDragList order={preferences.sectionOrder} onReorder={handleReorder} />
          </div>

          <div className="h-px bg-shark-100 dark:bg-shark-800" />

          {/* Tiles */}
          <div className="px-5 pt-4 pb-6">
            <p className="text-[13px] font-semibold text-shark-500 dark:text-shark-400 mb-0.5">
              Customize tiles
            </p>
            <p className="text-[12px] text-shark-400 dark:text-shark-500 mb-4">
              Toggle widgets on or off
            </p>
            <div>
              {TILE_WIDGETS.map(id => {
                const visible = !preferences.hiddenWidgets.includes(id);
                return (
                  <div key={id} className="flex items-center gap-3.5 py-2.5 min-h-[52px] border-b border-shark-100 dark:border-shark-800 last:border-0">
                    <div className="w-8 h-8 rounded-[12px] bg-shark-100 dark:bg-shark-800 flex items-center justify-center shrink-0">
                      <Icon name={WIDGET_ICONS[id] ?? "settings"} size={16} className="text-shark-500 dark:text-shark-400" />
                    </div>
                    <span className="text-[15px] font-medium text-shark-900 dark:text-shark-100 flex-1">
                      {WIDGET_LABELS[id]}
                    </span>
                    <Toggle checked={visible} onChange={() => handleToggle(id, visible)} disabled={isPending} />
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
