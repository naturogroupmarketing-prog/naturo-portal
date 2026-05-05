"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
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
  return `${days}d ago`;
}

const TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  LOW_STOCK: { icon: "alert-triangle", color: "text-[#E8532E]" },
  LOW_STOCK_PREDICTION: { icon: "bar-chart", color: "text-[#E8532E]" },
  OVERDUE_RETURN: { icon: "clock", color: "text-red-500" },
  PENDING_REQUEST: { icon: "inbox", color: "text-blue-500" },
  DAMAGE_REPORT: { icon: "alert-triangle", color: "text-red-500" },
  ASSET_ASSIGNED: { icon: "package", color: "text-action-500" },
  ASSET_RETURNED: { icon: "check", color: "text-action-500" },
  REQUEST_APPROVED: { icon: "check", color: "text-action-500" },
  REQUEST_REJECTED: { icon: "x", color: "text-red-500" },
  MAINTENANCE_DUE: { icon: "settings", color: "text-[#E8532E]" },
  WARRANTY_EXPIRING: { icon: "shield", color: "text-[#E8532E]" },
  PO_STATUS_CHANGED: { icon: "file-text", color: "text-blue-500" },
  REPLENISHMENT_SUGGESTION: { icon: "truck", color: "text-action-500" },
  GENERAL: { icon: "bell", color: "text-shark-500 dark:text-shark-400" },
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
        // Update document title with unread badge
        const baseTitle = document.title.replace(/^\(\d+\)\s*/, "");
        document.title = data.unreadCount > 0 ? `(${data.unreadCount}) ${baseTitle}` : baseTitle;
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const markAsRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleClick = (n: Notification) => {
    if (!n.isRead) markAsRead(n.id);
    if (n.link) window.location.href = n.link;
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-shark-100 dark:hover:bg-shark-800 transition-colors"
        title="Notifications"
        aria-label="Notifications"
      >
        <Icon name="bell" size={20} className="text-shark-500 dark:text-shark-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-x-2 top-14 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-80 bg-white dark:bg-shark-900 border border-shark-200 dark:border-shark-700 rounded-[28px] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(80,130,220,0.16)] z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-shark-100 dark:border-shark-800">
            <h3 className="font-semibold text-sm text-shark-900 dark:text-shark-100">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-action-500 hover:text-action-600">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-shark-400 text-center py-8">No notifications</p>
            ) : (
              notifications.map((n) => {
                const typeInfo = TYPE_ICONS[n.type] || TYPE_ICONS.GENERAL;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full text-left px-4 py-3 border-b border-shark-50 dark:border-shark-800 hover:bg-shark-50 dark:hover:bg-shark-800/50 transition-colors ${!n.isRead ? "bg-action-50/20 dark:bg-action-900/20" : ""}`}
                  >
                    <div className="flex gap-3">
                      <Icon name={typeInfo.icon as "bell"} size={16} className={`${typeInfo.color} mt-0.5 shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!n.isRead ? "font-semibold text-shark-900 dark:text-shark-100" : "text-shark-700 dark:text-shark-300"}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-shark-400 mt-0.5 truncate">{n.message}</p>
                        <p className="text-xs text-shark-300 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                      {!n.isRead && (
                        <span className="w-2 h-2 bg-action-500 rounded-full mt-1.5 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
          <Link
            href="/notifications"
            className="block text-center text-xs text-action-500 hover:text-action-600 font-medium py-2.5 border-t border-shark-100 dark:border-shark-800"
            onClick={() => setIsOpen(false)}
          >
            View all notifications →
          </Link>
        </div>
      )}
    </div>
  );
}
