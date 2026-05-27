"use client";

import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/icon";

export interface RecentActivityItem {
  id: string;
  type: "request" | "checkout" | "po" | "return" | "assignment";
  staffName: string;
  itemName: string;
  detail: string;
  timeAgo: string;
  href: string;
  status?: string;
}

const TYPE_CONFIG: Record<RecentActivityItem["type"], { icon: IconName; iconBg: string; iconColor: string; verb: string }> = {
  request:    { icon: "clipboard",   iconBg: "bg-action-50",    iconColor: "text-action-500",   verb: "requested" },
  checkout:   { icon: "arrow-right", iconBg: "bg-action-50",  iconColor: "text-action-500", verb: "checked out" },
  po:         { icon: "truck",       iconBg: "bg-action-50",   iconColor: "text-action-500",  verb: "created PO" },
  return:     { icon: "arrow-left",  iconBg: "bg-action-50",   iconColor: "text-action-500",  verb: "returned" },
  assignment: { icon: "package",     iconBg: "bg-action-50",  iconColor: "text-action-500", verb: "assigned" },
};

function timeAgoLabel(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function RecentActivityWidget({ items }: { items: RecentActivityItem[] }) {
  return (
    <div className="rounded-[20px] bg-white dark:bg-shark-900 border border-black/[0.05] dark:border-white/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.07),0_1px_2px_rgba(0,0,0,0.04)] p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Icon name="clock" size={13} className="text-shark-400" />
          <p className="text-[11px] font-bold uppercase tracking-widest text-shark-500 dark:text-shark-400">
            Recent Activity
          </p>
        </div>
        <Link href="/reports" className="text-[11px] font-semibold text-action-600 hover:text-action-700 transition-colors shrink-0">
          View all →
        </Link>
      </div>

        {items.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm text-shark-400">No recent activity yet</p>
          </div>
        ) : (
          <div className="space-y-0 -mx-1">
            {items.map((item, idx) => {
              const cfg = TYPE_CONFIG[item.type];
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-start gap-3 px-3 py-2.5 rounded-[20px] hover:bg-shark-50 dark:hover:bg-shark-800 transition-colors group"
                >
                  {/* Icon */}
                  <div className={`w-8 h-8 rounded-[14px] ${cfg.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Icon name={cfg.icon} size={14} className={cfg.iconColor} />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-shark-800 dark:text-shark-200 leading-snug">
                      <span className="font-semibold">{item.staffName}</span>
                      {" "}{cfg.verb}{" "}
                      <span className="font-medium">{item.itemName}</span>
                    </p>
                    <p className="text-[11px] text-shark-400 mt-0.5 truncate">{item.detail}</p>
                  </div>

                  {/* Time */}
                  <span className="text-[10px] text-shark-400 shrink-0 mt-1">{item.timeAgo}</span>
                </Link>
              );
            })}
          </div>
        )}
    </div>
  );
}

// Helper exported so page.tsx can use it
export { timeAgoLabel };
