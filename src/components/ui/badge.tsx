import { cn, statusColor } from "@/lib/utils";

interface BadgeProps {
  status: string;
  className?: string;
}

const STATUS_LABELS: Record<string, string> = {
  AWAITING_CONFIRMATION: "Awaiting Confirmation",
  PENDING_RETURN: "Pending Return",
  CHECKED_OUT: "Checked Out",
  SUPER_ADMIN: "Super Admin",
  BRANCH_MANAGER: "Branch Manager",
  PAST_DUE: "Past Due",
};

export function Badge({ status, className }: BadgeProps) {
  const label = STATUS_LABELS[status] ?? status.replace(/_/g, " ");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusColor(status),
        className
      )}
    >
      {label}
    </span>
  );
}
