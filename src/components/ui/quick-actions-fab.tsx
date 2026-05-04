"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/icon";
import { useFloatingTools } from "@/components/layout/floating-tools-context";

interface QuickAction {
  label: string;
  href: string;
  icon: IconName;
  color: string;
}

// Context-aware actions per page prefix
const PAGE_ACTIONS: Record<string, QuickAction[]> = {
  "/dashboard": [
    { label: "Scan QR", href: "/scan", icon: "qr-code", color: "bg-shark-700" },
    { label: "Create PO", href: "/purchase-orders?action=create", icon: "truck", color: "bg-action-500" },
    { label: "Add Supply", href: "/consumables?action=add", icon: "droplet", color: "bg-action-500" },
    { label: "Add Asset", href: "/assets?action=add", icon: "package", color: "bg-action-500" },
  ],
  "/assets": [
    { label: "Scan QR", href: "/scan", icon: "qr-code", color: "bg-shark-700" },
    { label: "Report Damage", href: "/report-damage", icon: "alert-triangle", color: "bg-[#E8532E]" },
    { label: "Add Asset", href: "/assets?action=add", icon: "package", color: "bg-action-500" },
  ],
  "/consumables": [
    { label: "Scan QR", href: "/scan", icon: "qr-code", color: "bg-shark-700" },
    { label: "Create PO", href: "/purchase-orders?action=create", icon: "truck", color: "bg-action-500" },
    { label: "Add Supply", href: "/consumables?action=add", icon: "droplet", color: "bg-action-500" },
  ],
  "/purchase-orders": [
    { label: "Scan QR", href: "/scan", icon: "qr-code", color: "bg-shark-700" },
    { label: "Add Supply", href: "/consumables?action=add", icon: "droplet", color: "bg-action-500" },
    { label: "Create PO", href: "/purchase-orders?action=create", icon: "truck", color: "bg-action-500" },
  ],
  "/staff": [
    { label: "Issue Kit", href: "/starter-kits?action=new", icon: "box", color: "bg-action-500" },
    { label: "Add Staff", href: "/staff?action=add", icon: "user", color: "bg-action-500" },
  ],
  "/returns": [
    { label: "Scan QR", href: "/scan", icon: "qr-code", color: "bg-shark-700" },
    { label: "Process Return", href: "/returns", icon: "arrow-left", color: "bg-action-500" },
  ],
  "/inventory": [
    { label: "Scan QR", href: "/scan", icon: "qr-code", color: "bg-shark-700" },
    { label: "Add Supply", href: "/consumables?action=add", icon: "droplet", color: "bg-action-500" },
  ],
  "/alerts": [
    { label: "Create PO", href: "/purchase-orders?action=create", icon: "truck", color: "bg-action-500" },
    { label: "Scan QR", href: "/scan", icon: "qr-code", color: "bg-shark-700" },
  ],
};

const DEFAULT_ACTIONS: QuickAction[] = [
  { label: "Scan QR", href: "/scan", icon: "qr-code", color: "bg-shark-700" },
  { label: "Create PO", href: "/purchase-orders?action=create", icon: "truck", color: "bg-action-500" },
  { label: "Add Supply", href: "/consumables?action=add", icon: "droplet", color: "bg-action-500" },
  { label: "Add Asset", href: "/assets?action=add", icon: "package", color: "bg-action-500" },
];

export function QuickActionsFab() {
  const [open, setOpen] = useState(false);
  const { revealed } = useFloatingTools();
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Pick actions for current page
  const matchedKey = Object.keys(PAGE_ACTIONS).find((p) => pathname.startsWith(p));
  const actions = matchedKey ? PAGE_ACTIONS[matchedKey] : DEFAULT_ACTIONS;

  if (!revealed) return null;

  return (
    <div ref={ref} className="fixed bottom-[80px] right-4 sm:bottom-24 sm:right-6 z-50 flex flex-col items-end gap-2.5">
      {/* Action items — stagger up from FAB */}
      {open && (
        <div className="flex flex-col items-end gap-2">
          {[...actions].reverse().map((action, idx) => (
            <div
              key={action.label}
              className="flex items-center gap-2"
              style={{
                animation: `fabItem 150ms ease-out ${idx * 50}ms both`,
              }}
            >
              {/* Label pill */}
              <span className="bg-shark-900/90 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1.5 rounded-[10px] shadow-lg whitespace-nowrap pointer-events-none">
                {action.label}
              </span>
              {/* Icon button */}
              <Link
                href={action.href}
                onClick={() => setOpen(false)}
                className={`w-11 h-11 rounded-[14px] ${action.color} text-white flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.18)] hover:scale-110 active:scale-95 transition-transform`}
              >
                <Icon name={action.icon} size={17} />
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={() => setOpen((p) => !p)}
        aria-label={open ? "Close quick actions" : "Quick actions"}
        className={`w-14 h-14 rounded-[20px] flex items-center justify-center transition-all duration-200 active:scale-95 ${
          open
            ? "bg-[#252640] scale-90 shadow-[0_4px_20px_rgba(20,21,40,0.30)]"
            : "bg-[#1c1d2e] hover:bg-[#282a40] hover:scale-105 shadow-[0_4px_20px_rgba(20,21,40,0.36),0_2px_8px_rgba(20,21,40,0.20)]"
        }`}
      >
        <Icon
          name="plus"
          size={24}
          className={`text-white transition-transform duration-200 ${open ? "rotate-45" : ""}`}
        />
      </button>

      {/* Inline keyframes */}
      <style>{`
        @keyframes fabItem {
          from { opacity: 0; transform: translateY(10px) scale(0.9); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
