"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Icon, type IconName } from "@/components/ui/icon";

interface QuickLinksProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  icon: IconName;
  label: string;
  href: string;
  shortcut: string;
}

const LINKS: NavItem[] = [
  { icon: "dashboard",      label: "Dashboard",      href: "/dashboard",        shortcut: "G then D" },
  { icon: "package",        label: "Assets",         href: "/assets",           shortcut: "G then A" },
  { icon: "droplet",        label: "Consumables",    href: "/consumables",      shortcut: "G then C" },
  { icon: "users",          label: "Staff",          href: "/staff",            shortcut: "G then S" },
  { icon: "truck",          label: "Purchase Orders",href: "/purchase-orders",  shortcut: "G then O" },
  { icon: "arrow-left",     label: "Returns",        href: "/returns",          shortcut: "G then R" },
  { icon: "clipboard",      label: "Reports",        href: "/reports",          shortcut: "" },
  { icon: "alert-triangle", label: "Anomalies",      href: "/alerts/anomalies", shortcut: "" },
];

export function QuickLinks({ open, onClose }: QuickLinksProps) {
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleNavigate = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <div className="fixed inset-0 z-[61] flex items-start justify-center pt-[10vh] px-4 pointer-events-none">
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-sm bg-white dark:bg-shark-900 rounded-2xl shadow-2xl border border-shark-200 dark:border-shark-700 overflow-hidden pointer-events-auto"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-shark-100 dark:border-shark-800">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-shark-400">
                  Quick Links
                </p>
                <kbd className="text-[10px] text-shark-400 bg-shark-100 dark:bg-shark-800 border border-shark-200 dark:border-shark-700 px-1.5 py-0.5 rounded font-mono">
                  Esc
                </kbd>
              </div>

              <div className="p-2">
                {LINKS.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => handleNavigate(item.href)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-shark-50 dark:bg-transparent dark:hover:bg-shark-800/40 transition-colors text-left group"
                  >
                    <Icon
                      name={item.icon}
                      size={16}
                      className="text-shark-400 group-hover:text-action-500 transition-colors shrink-0"
                    />
                    <span className="flex-1 text-sm font-medium text-shark-700 dark:text-shark-200 group-hover:text-shark-900 dark:group-hover:text-white transition-colors">
                      {item.label}
                    </span>
                    {item.shortcut && (
                      <kbd className="text-[10px] text-shark-400 bg-shark-100 dark:bg-shark-800 px-1.5 py-0.5 rounded font-mono shrink-0">
                        {item.shortcut}
                      </kbd>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
