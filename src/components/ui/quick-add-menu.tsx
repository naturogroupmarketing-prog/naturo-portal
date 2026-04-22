"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Icon } from "@/components/ui/icon";
import type { IconName } from "@/components/ui/icon";

interface QuickAddMenuProps {
  role: string;
  onClose: () => void;
}

interface MenuItem {
  label: string;
  href: string;
  icon: IconName;
  roles: string[];
}

const MENU_ITEMS: MenuItem[] = [
  {
    label: "New Asset",
    href: "/assets?action=new",
    icon: "package",
    roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
  },
  {
    label: "Add Stock",
    href: "/inventory?tab=consumables",
    icon: "droplet",
    roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
  },
  {
    label: "Create Purchase Order",
    href: "/purchase-orders?action=new",
    icon: "truck",
    roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
  },
  {
    label: "Request Supplies",
    href: "/request-consumables",
    icon: "inbox",
    roles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF"],
  },
  {
    label: "Report Damage",
    href: "/report-damage",
    icon: "alert-triangle",
    roles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF"],
  },
  {
    label: "Add Staff Member",
    href: "/staff?action=new",
    icon: "users",
    roles: ["SUPER_ADMIN"],
  },
];

export function QuickAddMenu({ role, onClose }: QuickAddMenuProps) {
  const visible = MENU_ITEMS.filter((item) => item.roles.includes(role));

  // Split into two groups: admin actions and general actions
  const adminActions = visible.filter((item) =>
    ["New Asset", "Add Stock", "Create Purchase Order", "Add Staff Member"].includes(item.label)
  );
  const generalActions = visible.filter((item) =>
    ["Request Supplies", "Report Damage"].includes(item.label)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className="w-52 bg-white dark:bg-shark-800 rounded-xl shadow-xl border border-shark-200 dark:border-shark-700 py-1.5 overflow-hidden"
    >
      {adminActions.length > 0 && (
        <div>
          {adminActions.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-shark-700 dark:text-shark-200 hover:bg-shark-50 dark:hover:bg-shark-700 transition-colors"
            >
              <Icon name={item.icon} size={15} className="text-shark-400 dark:text-shark-300 shrink-0" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      )}

      {adminActions.length > 0 && generalActions.length > 0 && (
        <div className="my-1 border-t border-shark-100 dark:border-shark-700" />
      )}

      {generalActions.length > 0 && (
        <div>
          {generalActions.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-shark-700 dark:text-shark-200 hover:bg-shark-50 dark:hover:bg-shark-700 transition-colors"
            >
              <Icon name={item.icon} size={15} className="text-shark-400 dark:text-shark-300 shrink-0" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      )}
    </motion.div>
  );
}
