"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useCallback } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const titleId = useRef(`modal-title-${Math.random().toString(36).slice(2, 9)}`).current;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className={cn(
          "w-full max-w-lg rounded-2xl bg-white dark:bg-shark-900 shadow-2xl max-h-[90vh] overflow-y-auto transition-colors",
          className
        )}
      >
        <div className="flex items-center justify-between border-b border-shark-100 dark:border-shark-800 px-6 py-4">
          <h2 id={titleId} className="text-lg font-semibold text-shark-900 dark:text-shark-100">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-shark-400 hover:text-shark-600 dark:hover:text-shark-200 hover:bg-shark-50 dark:hover:bg-shark-800 rounded-lg p-1 transition-colors text-xl leading-none"
          >
            &times;
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
