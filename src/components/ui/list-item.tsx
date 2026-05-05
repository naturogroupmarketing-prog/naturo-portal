import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/icon";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * ListItem — Samsung One UI–style list row.
 *
 * Anatomy:
 *   [icon tile] | [bold label]        | [right slot] [chevron?]
 *               | [subtitle]
 *
 * Use <ListGroup> to wrap multiple items with automatic hairline separators.
 */

interface ListItemProps {
  /** Lucide icon name for the left tile */
  icon?: IconName;
  /** Tailwind text colour class for the icon, e.g. "text-blue-600" */
  iconColor?: string;
  /** Tailwind bg class for the icon tile, e.g. "bg-blue-400/15" */
  iconBg?: string;
  /** Primary label — bold */
  label: string;
  /** Secondary line — muted */
  subtitle?: string;
  /** Navigate on click */
  href?: string;
  /** Click handler (ignored when href is set) */
  onClick?: () => void;
  /** Arbitrary right-side content (badge, toggle, value) */
  right?: ReactNode;
  /** Show a right-pointing chevron — default true when href/onClick present */
  showChevron?: boolean;
  className?: string;
  disabled?: boolean;
}

function ItemShell({
  icon,
  iconColor,
  iconBg,
  label,
  subtitle,
  right,
  showChevron,
  className,
}: Omit<ListItemProps, "href" | "onClick" | "disabled">) {
  return (
    <div className={cn("flex items-center gap-3.5 px-4 py-3.5 min-h-[64px]", className)}>
      {/* Icon tile */}
      {icon && (
        <div
          className={cn(
            "w-11 h-11 rounded-[14px] flex items-center justify-center flex-shrink-0",
            "backdrop-blur-sm border border-white/55",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_1px_4px_rgba(100,140,220,0.08)]",
            iconBg ?? "bg-white/30"
          )}
        >
          <Icon name={icon} size={20} className={cn("flex-shrink-0", iconColor ?? "text-shark-600")} />
        </div>
      )}

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-shark-900 dark:text-white leading-snug">
          {label}
        </p>
        {subtitle && (
          <p className="text-xs text-shark-500 dark:text-shark-400 mt-0.5 leading-snug truncate">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right slot */}
      {right && <div className="shrink-0">{right}</div>}

      {/* Chevron */}
      {showChevron && (
        <svg
          width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          className="text-shark-300 dark:text-shark-600 flex-shrink-0"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      )}
    </div>
  );
}

export function ListItem({
  href,
  onClick,
  showChevron,
  disabled,
  className,
  ...rest
}: ListItemProps) {
  const autoChevron = showChevron ?? (!!href || !!onClick);
  const shell = <ItemShell showChevron={autoChevron} className={className} {...rest} />;

  if (href && !disabled) {
    return (
      <Link
        href={href}
        className="block hover:bg-white/40 dark:hover:bg-white/[0.04] active:bg-white/60 transition-colors"
      >
        {shell}
      </Link>
    );
  }

  if (onClick && !disabled) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left hover:bg-white/40 dark:hover:bg-white/[0.04] active:bg-white/60 transition-colors"
      >
        {shell}
      </button>
    );
  }

  return shell;
}

/**
 * ListGroup — wraps ListItems with hairline separators and optional section title.
 */
interface ListGroupProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function ListGroup({ title, children, className }: ListGroupProps) {
  return (
    <div className={className}>
      {title && (
        <p className="px-4 pt-5 pb-1.5 text-[11px] font-bold uppercase tracking-[0.10em] text-[#1259C3]/70 dark:text-[#5b9cf8]/60">
          {title}
        </p>
      )}
      <div className="divide-y divide-white/50 dark:divide-white/[0.06]">
        {children}
      </div>
    </div>
  );
}
