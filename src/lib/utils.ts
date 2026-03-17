import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function generateAssetCode(): string {
  const prefix = "NAT";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    AVAILABLE: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
    ASSIGNED: "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20",
    CHECKED_OUT: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
    PENDING_RETURN: "bg-orange-50 text-orange-700 ring-1 ring-orange-600/20",
    DAMAGED: "bg-red-50 text-red-700 ring-1 ring-red-600/20",
    LOST: "bg-shark-50 text-shark-600 ring-1 ring-shark-500/20",
    UNAVAILABLE: "bg-shark-100 text-shark-500 ring-1 ring-shark-400/20",
    PENDING: "bg-amber-100 text-amber-800 ring-1 ring-amber-600/30",
    APPROVED: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
    REJECTED: "bg-red-50 text-red-700 ring-1 ring-red-600/20",
    ISSUED: "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20",
    ORDERED: "bg-purple-50 text-purple-700 ring-1 ring-purple-600/20",
    CLOSED: "bg-shark-100 text-shark-500 ring-1 ring-shark-400/20",
    // Role badges
    SUPER_ADMIN: "bg-action-50 text-action-700 ring-1 ring-action-500/20",
    BRANCH_MANAGER: "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20",
    STAFF: "bg-shark-50 text-shark-600 ring-1 ring-shark-500/20",
  };
  return colors[status] || "bg-shark-50 text-shark-600 ring-1 ring-shark-500/20";
}
