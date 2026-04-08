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
  // Apple-style: 4 colors only — blue (active), orange (pending), red (alert), grey (neutral)
  const colors: Record<string, string> = {
    // Asset/item statuses
    AVAILABLE: "bg-action-50 text-action-700 ring-1 ring-action-500/20",
    ASSIGNED: "bg-action-50 text-action-700 ring-1 ring-action-500/20",
    CHECKED_OUT: "bg-action-50 text-action-700 ring-1 ring-action-500/20",
    PENDING_RETURN: "bg-amber-50 text-[#E8532E] ring-1 ring-[#E8532E]/20",
    DAMAGED: "bg-red-50 text-red-700 ring-1 ring-red-600/20",
    LOST: "bg-red-50 text-red-700 ring-1 ring-red-600/20",
    UNAVAILABLE: "bg-shark-100 text-shark-500 ring-1 ring-shark-400/20",
    // PO / request statuses
    PENDING: "bg-amber-50 text-[#E8532E] ring-1 ring-[#E8532E]/20",
    APPROVED: "bg-action-50 text-action-700 ring-1 ring-action-500/20",
    REJECTED: "bg-red-50 text-red-700 ring-1 ring-red-600/20",
    ISSUED: "bg-action-50 text-action-700 ring-1 ring-action-500/20",
    ORDERED: "bg-action-50 text-action-700 ring-1 ring-action-500/20",
    RECEIVED: "bg-shark-100 text-shark-500 ring-1 ring-shark-400/20",
    CLOSED: "bg-shark-100 text-shark-500 ring-1 ring-shark-400/20",
    // Roles
    SUPER_ADMIN: "bg-shark-900 text-white",
    BRANCH_MANAGER: "bg-action-50 text-action-700 ring-1 ring-action-500/20",
    STAFF: "bg-shark-100 text-shark-600 ring-1 ring-shark-400/20",
    // Subscription
    ACTIVE: "bg-action-50 text-action-700 ring-1 ring-action-500/20",
    TRIALING: "bg-amber-50 text-[#E8532E] ring-1 ring-[#E8532E]/20",
    CANCELED: "bg-red-50 text-red-700 ring-1 ring-red-600/20",
    PAST_DUE: "bg-red-50 text-red-700 ring-1 ring-red-600/20",
  };
  return colors[status] || "bg-shark-100 text-shark-600 ring-1 ring-shark-400/20";
}
