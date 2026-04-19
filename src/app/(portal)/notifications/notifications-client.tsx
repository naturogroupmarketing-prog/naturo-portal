"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  LOW_STOCK: { icon: "alert-triangle", color: "text-[#E8532E]", bg: "bg-amber-50" },
  OVERDUE_RETURN: { icon: "clock", color: "text-red-500", bg: "bg-red-50" },
  PENDING_REQUEST: { icon: "inbox", color: "text-blue-500", bg: "bg-blue-50" },
  DAMAGE_REPORT: { icon: "alert-triangle", color: "text-red-500", bg: "bg-red-50" },
  ASSET_ASSIGNED: { icon: "package", color: "text-action-500", bg: "bg-action-50" },
  ASSET_RETURNED: { icon: "arrow-left", color: "text-cyan-500", bg: "bg-cyan-50" },
  REQUEST_APPROVED: { icon: "check", color: "text-action-500", bg: "bg-action-50" },
  REQUEST_REJECTED: { icon: "x", color: "text-red-500", bg: "bg-red-50" },
  MAINTENANCE_DUE: { icon: "settings", color: "text-[#E8532E]", bg: "bg-amber-50" },
  WARRANTY_EXPIRING: { icon: "shield", color: "text-[#E8532E]", bg: "bg-amber-50" },
  GENERAL: { icon: "bell", color: "text-shark-500", bg: "bg-shark-50" },
};

export function NotificationsClient({ notifications }: { notifications: Notification[] }) {
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead && !acknowledgedIds.has(n.id);
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead && !acknowledgedIds.has(n.id)).length;

  const handleAcknowledge = async (id: string) => {
    setAcknowledgedIds((prev) => new Set([...prev, id]));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  };

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
    setAcknowledgedIds((prev) => new Set([...prev, ...unreadIds]));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-shark-900 dark:text-shark-100 tracking-tight">Notifications</h1>
          <p className="text-sm text-shark-400 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              Mark all read
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-1 bg-shark-50 rounded-xl p-1">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filter === f
                ? "bg-action-500 text-white shadow-sm"
                : "text-shark-500 hover:bg-shark-100 hover:text-shark-700 dark:text-shark-300"
            }`}
          >
            {f === "all" ? "All" : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <Icon name="bell" size={32} className="text-shark-300 mx-auto mb-3" />
            <p className="text-sm text-shark-400">
              {filter === "unread" ? "No unread notifications." : "No notifications yet."}
            </p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-shark-100 dark:divide-shark-700">
            {filtered.map((n) => {
              const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.GENERAL;
              const isAcked = n.isRead || acknowledgedIds.has(n.id);

              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 transition-all ${
                    !isAcked ? "bg-action-50/10" : ""
                  }`}
                >
                  {/* Checkbox to acknowledge */}
                  <input
                    type="checkbox"
                    checked={isAcked}
                    disabled={isAcked}
                    onChange={() => handleAcknowledge(n.id)}
                    className="w-5 h-5 rounded border-shark-300 text-action-500 focus:ring-action-400 cursor-pointer shrink-0 mt-0.5"
                  />

                  {/* Icon */}
                  <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                    <Icon name={config.icon as "bell"} size={16} className={config.color} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium ${isAcked ? "text-shark-500" : "text-shark-900 dark:text-shark-100"}`}>
                        {n.title}
                      </p>
                      {!isAcked && (
                        <span className="w-2 h-2 bg-action-500 rounded-full shrink-0" />
                      )}
                    </div>
                    <p className={`text-sm mt-0.5 ${isAcked ? "text-shark-400" : "text-shark-600"}`}>
                      {n.message}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-shark-300">{timeAgo(n.createdAt)}</span>
                      {n.link && (
                        <a
                          href={n.link}
                          className="text-xs text-action-500 hover:text-action-600 font-medium"
                        >
                          View →
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  {isAcked && (
                    <span className="text-xs text-action-500 font-medium shrink-0 mt-1">
                      <Icon name="check" size={14} className="text-action-400" />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
