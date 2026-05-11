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
    color: "text-blue-600",
    bg: "bg-blue-100",
  },
  {
    label: "Purchase Orders",
    description: "Approvals & procurement",
    href: "/purchase-orders",
    icon: "truck",
    color: "text-violet-600",
    bg: "bg-violet-100",
  },
  {
    label: "Staff",
    description: "Team members & roles",
    href: "/staff",
    icon: "users",
    color: "text-teal-600",
    bg: "bg-teal-100",
  },
  {
    label: "Returns",
    description: "Pending & overdue returns",
    href: "/returns",
    icon: "arrow-left",
    color: "text-rose-600",
    bg: "bg-rose-100",
  },
  {
    label: "Starter Kits",
    description: "Kit templates & issuing",
    href: "/starter-kits",
    icon: "box",
    color: "text-amber-600",
    bg: "bg-amber-100",
  },
  {
    label: "Reports",
    description: "Analytics & exports",
    href: "/reports",
    icon: "bar-chart",
    color: "text-emerald-600",
    bg: "bg-emerald-100",
  },
  {
    label: "Inspections",
    description: "Condition checks due",
    href: "/condition-checks",
    icon: "search",
    color: "text-cyan-600",
    bg: "bg-cyan-100",
  },
  {
    label: "Anomalies",
    description: "Alerts & unusual activity",
    href: "/alerts/anomalies",
    icon: "alert-triangle",
    color: "text-red-600",
    bg: "bg-red-100",
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
            className="group flex flex-col gap-3 p-4 sm:p-5 bg-shark-50 dark:bg-shark-900 rounded-[28px] border border-shark-100 dark:border-shark-800 hover:bg-shark-100 dark:hover:border-shark-700 hover:shadow-md transition-all duration-150 active:scale-[0.98]"
          >
            {/* Icon */}
            <div className={`w-10 h-10 rounded-[28px] flex items-center justify-center shrink-0 ${item.bg}`}>
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
