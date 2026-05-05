import { cn, statusColor } from "@/lib/utils";

interface BadgeProps {
  status: string;
  className?: string;
}

const STATUS_LABELS: Record<string, string> = {
  AWAITING_CONFIRMATION: "Awaiting",
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
        "inline-flex items-center rounded-md px-3 py-1 text-xs font-semibold tracking-wide",
        statusColor(status),
        className
      )}
    >
      {label}
    </span>
  );
}
