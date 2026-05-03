"use client";

import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/icon";

interface QuickNavItem {
  label: string;
  description: string;
  href: string;
  icon: IconName;
  color: string;       // icon colour
  bg: string;          // card accent / icon bg
}

const ITEMS: QuickNavItem[] = [
  {
    label: "Supplies",
    description: "Stock levels & inventory",
    href: "/consumables",
    icon: "droplet",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-500/10",
  },
  {
    label: "Purchase Orders",
    description: "Approvals & procurement",
    href: "/purchase-orders",
    icon: "truck",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-500/10",
  },
  {
    label: "Staff",
    description: "Team members & roles",
    href: "/staff",
    icon: "users",
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-500/10",
  },
  {
    label: "Returns",
    description: "Pending & overdue returns",
    href: "/returns",
    icon: "arrow-left",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-500/10",
  },
  {
    label: "Starter Kits",
    description: "Kit templates & issuing",
    href: "/starter-kits",
    icon: "box",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-500/10",
  },
  {
    label: "Reports",
    description: "Analytics & exports",
    href: "/reports",
    icon: "clipboard",
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-50 dark:bg-teal-500/10",
  },
  {
    label: "Inspections",
    description: "Condition checks due",
    href: "/condition-checks",
    icon: "search",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-500/10",
  },
  {
    label: "Anomalies",
    description: "Alerts & unusual activity",
    href: "/alerts/anomalies",
    icon: "alert-triangle",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-500/10",
  },
];

interface AdminQuickNavProps {
  userName?: string | null;
}

export function AdminQuickNav({ userName }: AdminQuickNavProps) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = userName?.split(" ")[0] ?? null;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-shark-900 dark:text-shark-100">
          {greeting}{firstName ? `, ${firstName}` : ""}.
        </h1>
        <p className="text-sm text-shark-400 mt-1">
          What would you like to manage today?
        </p>
      </div>

      {/* 2-column grid on mobile → 4-column on desktop */}
      <div className="grid grid-cols-4 gap-3">
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex flex-col gap-3 p-4 sm:p-5 bg-white dark:bg-shark-900 rounded-2xl border border-shark-100 dark:border-shark-800 hover:border-shark-200 dark:hover:border-shark-700 hover:shadow-md transition-all duration-150 active:scale-[0.98]"
          >
            {/* Icon */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.bg}`}>
              <Icon name={item.icon} size={20} className={item.color} />
            </div>

            {/* Text */}
            <div>
              <p className="text-sm font-semibold text-shark-900 dark:text-shark-100 group-hover:text-action-600 dark:group-hover:text-action-400 transition-colors leading-tight">
                {item.label}
              </p>
              <p className="text-[11px] text-shark-400 mt-0.5 leading-snug hidden sm:block">
                {item.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
