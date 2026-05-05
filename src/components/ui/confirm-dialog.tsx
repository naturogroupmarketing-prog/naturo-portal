"use client";

import { useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
  loading?: boolean;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  loading = false,
}: ConfirmDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const getFocusableElements = useCallback(() => {
    if (!contentRef.current) return [];
    return Array.from(contentRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  }, []);

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

  useEffect(() => {
    if (open) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleKeyDown);

      requestAnimationFrame(() => {
        cancelRef.current?.focus();
      });
    } else {
      document.body.style.overflow = "";
      previouslyFocusedRef.current?.focus();
    }
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  const iconName = variant === "default" ? "help-circle" : "alert-triangle";

  const iconColor = {
    danger: "text-red-500",
    warning: "text-amber-500",
    default: "text-action-400",
  }[variant];

  const iconBg = {
    danger: "bg-red-50 dark:bg-red-500/10",
    warning: "bg-amber-50 dark:bg-amber-500/10",
    default: "bg-action-50 dark:bg-action-400/10",
  }[variant];

  const confirmButtonVariant = variant === "danger" ? "danger" : "primary";
  const confirmButtonClass =
    variant === "warning"
      ? "bg-amber-500 text-white hover:bg-amber-600 shadow-sm"
      : undefined;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        ref={contentRef}
        className="w-full max-w-sm rounded-[32px] backdrop-blur-2xl bg-white/72 dark:bg-shark-800/80 border border-white/68 dark:border-white/[0.08] shadow-[0_2px_40px_rgba(0,0,0,0.08),0_1px_0_rgba(255,255,255,0.95)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.20),0_12px_40px_rgba(0,0,0,0.40),inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-200 animate-fade-in"
      >
        <div className="px-6 pt-6 pb-4 text-center">
          <div
            className={cn(
              "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[18px]",
              iconBg
            )}
          >
            <Icon name={iconName} size={24} className={iconColor} />
          </div>

          <h2
            id="confirm-dialog-title"
            className="text-lg font-semibold text-shark-900 dark:text-shark-100"
          >
            {title}
          </h2>

          <p className="mt-2 text-sm text-shark-500 dark:text-shark-400">
            {description}
          </p>
        </div>

        <div className="flex gap-3 px-6 pb-6 pt-2">
          <Button
            ref={cancelRef}
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={confirmButtonVariant}
            className={cn("flex-1", confirmButtonClass)}
            onClick={onConfirm}
            loading={loading}
            disabled={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
