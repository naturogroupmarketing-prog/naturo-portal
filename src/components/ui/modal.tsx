"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useCallback } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const hasAutoFocused = useRef(false);
  const titleId = useRef(`modal-title-${Math.random().toString(36).slice(2, 9)}`).current;

  // Keep onClose ref in sync without causing re-renders
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const getFocusableElements = useCallback(() => {
    if (!contentRef.current) return [];
    return Array.from(contentRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  }, []);

  // Stable keydown handler that reads onClose from ref
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }

      if (e.key === "Tab") {
        const focusable = getFocusableElements();
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [getFocusableElements]
  );

  // Only run on open/close transitions — not on every re-render
  useEffect(() => {
    if (open) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleKeyDown);

      // Auto-focus the first focusable element only once when modal opens
      if (!hasAutoFocused.current) {
        hasAutoFocused.current = true;
        requestAnimationFrame(() => {
          const focusable = getFocusableElements();
          if (focusable.length > 0) {
            focusable[0].focus();
          } else {
            contentRef.current?.focus();
          }
        });
      }
    } else {
      document.body.style.overflow = "";
      hasAutoFocused.current = false;
      // Restore focus to previously focused element
      previouslyFocusedRef.current?.focus();
    }
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, handleKeyDown, getFocusableElements]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        ref={contentRef}
        className={cn(
          "w-[calc(100vw-1rem)] sm:max-w-lg rounded-2xl bg-white dark:bg-shark-900 shadow-2xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto safe-bottom transition-all duration-200",
          className
        )}
      >
        <div className="flex items-center justify-between border-b border-shark-100 dark:border-shark-800 px-4 sm:px-6 py-4">
          <h2 id={titleId} className="text-lg font-semibold text-shark-900 dark:text-shark-100 truncate pr-2">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-shark-400 hover:text-shark-600 dark:hover:text-shark-200 hover:bg-shark-50 dark:hover:bg-shark-800 rounded-lg p-2 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors text-xl leading-none"
          >
            &times;
          </button>
        </div>
        <div className="px-4 sm:px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
