"use client";

import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/icon";

interface QuickNavItem {
  label: string;
  description?: string;
  href: string;
  icon: IconName;
  color: string;       // icon colour
  bg: string;          // icon tile bg
}

const ITEMS: QuickNavItem[] = [
  {
    label: "Supplies",
    description: "Stock levels & inventory",
    href: "/inventory",
    icon: "droplet",
    color: "text-action-600",
    bg: "bg-action-100 dark:bg-action-900/30",
  },
  {
    label: "Purchase Orders",
    description: "Approvals & procurement",
    href: "/purchase-orders",
    icon: "truck",
    color: "text-action-600",
    bg: "bg-action-100 dark:bg-action-900/30",
  },
  {
    label: "Staff",
    description: "Team members & roles",
    href: "/staff",
    icon: "users",
    color: "text-action-600",
    bg: "bg-action-100 dark:bg-action-900/30",
  },
  {
    label: "Starter Kits",
    description: "Kit templates & issuing",
    href: "/starter-kits",
    icon: "box",
    color: "text-action-600",
    bg: "bg-action-100 dark:bg-action-900/30",
  },
  {
    label: "Returns",
    description: "Pending & overdue returns",
    href: "/returns",
    icon: "arrow-left",
    color: "text-action-600",
    bg: "bg-action-100 dark:bg-action-900/30",
  },
  {
    label: "Maintenance",
    description: "Repairs & servicing",
    href: "/maintenance",
    icon: "wrench",
    color: "text-shark-500 dark:text-shark-400",
    bg: "bg-shark-100 dark:bg-shark-800",
  },
  {
    label: "Reports",
    description: "Analytics & exports",
    href: "/reports",
    icon: "bar-chart",
    color: "text-action-600",
    bg: "bg-action-100 dark:bg-action-900/30",
  },
  {
    label: "Inspections",
    description: "Condition checks due",
    href: "/condition-checks",
    icon: "search",
    color: "text-action-600",
    bg: "bg-action-100 dark:bg-action-900/30",
  },
  {
    label: "Anomalies",
    description: "Alerts & unusual activity",
    href: "/alerts/anomalies",
    icon: "alert-triangle",
    color: "text-red-500",
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

      {/* 3-column app-icon grid */}
      <div className="grid grid-cols-3 gap-x-4 gap-y-6">
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex flex-col items-center gap-2.5 active:scale-[0.94] transition-transform duration-150"
          >
            {/* Icon tile */}
            <div className={`w-full aspect-square rounded-[22px] flex items-center justify-center ${item.bg} transition-opacity group-hover:opacity-80`}>
              <Icon name={item.icon} size={36} className={item.color} />
            </div>

            {/* Label */}
            <span className="text-[13px] font-semibold text-shark-800 dark:text-shark-200 text-center leading-tight">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
