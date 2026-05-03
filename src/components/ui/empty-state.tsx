import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface EmptyStateProps {
  icon: IconName;
  title: string;
  description: string;
  action?: EmptyStateAction;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-6 text-center", className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-shark-100 dark:bg-shark-800/80 mb-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.06)]">
        <Icon name={icon} size={26} className="text-shark-400 dark:text-shark-400" />
      </div>
      <h3 className="text-sm font-semibold text-shark-900 dark:text-shark-100 mb-1">
        {title}
      </h3>
      <p className="text-sm text-shark-500 dark:text-shark-400 max-w-sm mb-5">
        {description}
      </p>
      {action && (
        action.href ? (
          <Link href={action.href}>
            <Button variant="primary" size="sm">
              {action.label}
            </Button>
          </Link>
        ) : (
          <Button variant="primary" size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        )
      )}
    </div>
  );
}
