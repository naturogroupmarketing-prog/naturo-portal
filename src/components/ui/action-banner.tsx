import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import type { IconName } from "@/components/ui/icon";

type BannerVariant = "success" | "error" | "warning" | "info";

const CONFIG: Record<BannerVariant, {
  container: string;
  icon: IconName;
  iconClass: string;
}> = {
  success: {
    container: "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-200",
    icon: "check-circle",
    iconClass: "text-emerald-500 dark:text-emerald-400 shrink-0",
  },
  error: {
    container: "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-200",
    icon: "alert-triangle",
    iconClass: "text-red-500 dark:text-red-400 shrink-0",
  },
  warning: {
    container: "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-200",
    icon: "alert-triangle",
    iconClass: "text-amber-500 dark:text-amber-400 shrink-0",
  },
  info: {
    container: "bg-action-50 dark:bg-action-950/30 border border-action-100 dark:border-action-800/50 text-action-800 dark:text-action-200",
    icon: "info",
    iconClass: "text-action-500 dark:text-action-400 shrink-0",
  },
};

interface ActionBannerProps {
  variant: BannerVariant;
  message: string;
  className?: string;
  onDismiss?: () => void;
}

export function ActionBanner({ variant, message, className, onDismiss }: ActionBannerProps) {
  const { container, icon, iconClass } = CONFIG[variant];
  return (
    <div className={cn("flex items-start gap-3 px-4 py-3 rounded-[14px] text-sm", container, className)}>
      <Icon name={icon} size={16} className={iconClass} />
      <span className="flex-1 leading-relaxed">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="text-current opacity-50 hover:opacity-100 transition-opacity min-h-[20px] min-w-[20px] flex items-center justify-center"
        >
          <Icon name="x" size={14} />
        </button>
      )}
    </div>
  );
}
