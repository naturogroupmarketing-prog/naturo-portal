"use client";

/**
 * PortalDropdown — reusable portal-rendered dropdown primitive.
 *
 * Renders the menu into document.body (z-9999) so it escapes any
 * parent overflow:hidden or stacking-context constraints. Handles:
 *   - Auto-positioning relative to the trigger element
 *   - Click-outside and scroll-to-close
 *   - Dark mode (no extra classes needed by callers)
 *   - Keyboard: Escape closes
 *
 * Usage (fixed width):
 *   <PortalDropdown
 *     triggerRef={btnRef}
 *     open={open}
 *     onClose={() => setOpen(false)}
 *     align="right"    // "left" | "right" | "center"
 *     width={220}      // min-width in px (default: 180)
 *   >
 *     {menu content}
 *   </PortalDropdown>
 *
 * Usage (full-width — matches trigger element width):
 *   <PortalDropdown triggerRef={btnRef} open={open} onClose={...} matchTriggerWidth>
 *     {menu content}
 *   </PortalDropdown>
 */

import {
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface PortalDropdownProps {
  /** The reference element the menu anchors to (set this ref on your trigger button). */
  triggerRef: RefObject<HTMLElement | null>;
  /** Whether the menu is open. */
  open: boolean;
  /** Called when the menu should close (click-outside, scroll, Escape). */
  onClose: () => void;
  /** Menu content. */
  children: ReactNode;
  /** Alignment relative to the trigger. Default: "right". Ignored when matchTriggerWidth=true. */
  align?: "left" | "right" | "center";
  /** Min-width of the menu in px. Default: 180. Ignored when matchTriggerWidth=true. */
  width?: number;
  /** When true the menu matches the trigger element's width exactly (left-aligned). */
  matchTriggerWidth?: boolean;
  /** Extra classes applied to the menu container. */
  className?: string;
  /** Max-height override (e.g. "max-h-64 overflow-y-auto"). Default: none. */
  maxHeightClass?: string;
}

export function PortalDropdown({
  triggerRef,
  open,
  onClose,
  children,
  align = "right",
  width = 180,
  matchTriggerWidth = false,
  className,
  maxHeightClass,
}: PortalDropdownProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  const getStyle = useCallback((): React.CSSProperties => {
    if (!triggerRef.current) return { top: 0, left: 0, zIndex: 9999 };
    const rect = triggerRef.current.getBoundingClientRect();

    if (matchTriggerWidth) {
      return {
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      };
    }

    let left: number;
    if (align === "right") {
      left = Math.max(8, rect.right - width);
    } else if (align === "left") {
      left = Math.max(8, rect.left);
    } else {
      left = Math.max(8, rect.left + rect.width / 2 - width / 2);
    }
    return { position: "fixed", top: rect.bottom + 4, left, minWidth: width, zIndex: 9999 };
  }, [triggerRef, align, width, matchTriggerWidth]);

  useEffect(() => {
    if (!open) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node)) return;
      if (menuRef.current?.contains(e.target as Node)) return;
      onClose();
    };

    const handleScroll = () => onClose();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("scroll", handleScroll, true);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("scroll", handleScroll, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, triggerRef]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={menuRef}
      style={getStyle()}
      className={cn(
        "backdrop-blur-2xl bg-white/65 dark:bg-shark-800/75 rounded-lg border border-white/62 dark:border-white/[0.09] shadow-[0_4px_32px_rgba(0,0,0,0.07),0_1px_0_rgba(255,255,255,0.88)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.06)] py-1.5",
        maxHeightClass,
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
}

/** A standard action item inside a PortalDropdown menu. */
interface DropdownItemProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

export function DropdownItem({
  onClick,
  disabled,
  className,
  children,
}: DropdownItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2",
        "hover:bg-white/60 dark:hover:bg-white/[0.07]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      {children}
    </button>
  );
}
