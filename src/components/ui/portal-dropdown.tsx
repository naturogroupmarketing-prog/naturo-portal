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
 * Usage:
 *   <PortalDropdown
 *     trigger={<button ref={...}>Open</button>}
 *     triggerRef={ref}
 *     open={open}
 *     onClose={() => setOpen(false)}
 *     align="right"      // "left" | "right" | "center"
 *     width={220}        // min-width of the menu in px
 *   >
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
  /** Alignment relative to the trigger. Default: "right". */
  align?: "left" | "right" | "center";
  /** Min-width of the menu in px. Default: 180. */
  width?: number;
  /** Extra classes applied to the menu container. */
  className?: string;
}

export function PortalDropdown({
  triggerRef,
  open,
  onClose,
  children,
  align = "right",
  width = 180,
  className,
}: PortalDropdownProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  const getPos = useCallback(() => {
    if (!triggerRef.current) return { top: 0, left: 0 };
    const rect = triggerRef.current.getBoundingClientRect();
    let left: number;
    if (align === "right") {
      left = Math.max(8, rect.right - width);
    } else if (align === "left") {
      left = Math.max(8, rect.left);
    } else {
      left = Math.max(8, rect.left + rect.width / 2 - width / 2);
    }
    return { top: rect.bottom + 4, left };
  }, [triggerRef, align, width]);

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

  const { top, left } = getPos();

  return createPortal(
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        top,
        left,
        zIndex: 9999,
        minWidth: width,
      }}
      className={cn(
        "bg-white dark:bg-shark-800 rounded-xl shadow-lg border border-shark-100 dark:border-shark-700 py-1",
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
        "hover:bg-shark-50 dark:hover:bg-shark-700",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      {children}
    </button>
  );
}
