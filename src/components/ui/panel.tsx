import { type ReactNode, type ElementType } from "react";
import { cn } from "@/lib/utils";

/**
 * Panel — a layout container with correct dark mode built in.
 *
 * Fills the gap between the opinionated <Card> (with CardHeader, CardContent
 * sub-components) and a raw <div>. Use Panel whenever you need a card-like
 * surface without the Card component's padding/hover behaviours.
 *
 * Automatically applies:
 *   bg-white dark:bg-shark-900
 *   border border-shark-100 dark:border-shark-800
 *   rounded-xl
 *
 * Pass `shadow` for an explicit shadow (default: none).
 * Pass `flush` to remove the border radius (e.g. full-width mobile panels).
 */

interface PanelProps {
  children: ReactNode;
  className?: string;
  /** Add a subtle box shadow. Default: false. */
  shadow?: boolean;
  /** Remove border radius — useful for edge-to-edge mobile sections. */
  flush?: boolean;
  /** HTML element to render. Default: "div". */
  as?: ElementType;
  [key: string]: unknown;
}

export function Panel({
  children,
  className,
  shadow = false,
  flush = false,
  as: Tag = "div",
  ...rest
}: PanelProps) {
  return (
    <Tag
      className={cn(
        "backdrop-blur-xl bg-white/78 dark:bg-shark-900/70 border border-white/80 dark:border-white/[0.07]",
        !flush && "rounded-[28px]",
        shadow && "shadow-[0_2px_24px_rgba(0,0,0,0.06),0_1px_0_rgba(255,255,255,0.95)] dark:shadow-[0_1px_0_rgba(255,255,255,0.04),0_4px_16px_rgba(0,0,0,0.20)]",
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/**
 * PanelHeader — a padded section header for use inside <Panel>.
 * Adds a bottom border automatically.
 */
interface PanelHeaderProps {
  children: ReactNode;
  className?: string;
}

export function PanelHeader({ children, className }: PanelHeaderProps) {
  return (
    <div
      className={cn(
        "px-5 py-4 border-b border-white/55 dark:border-white/[0.07]",
        "[&_h2]:text-base [&_h2]:font-bold [&_h2]:tracking-tight",
        "[&_h3]:text-base [&_h3]:font-bold [&_h3]:tracking-tight",
        "[&_p]:text-xs [&_p]:text-shark-500",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * PanelSection — a padded content area inside <Panel>.
 * Use multiple sections to build divided layouts.
 */
interface PanelSectionProps {
  children: ReactNode;
  className?: string;
  /** Add a top border (useful for dividing stacked sections). */
  divided?: boolean;
}

export function PanelSection({
  children,
  className,
  divided = false,
}: PanelSectionProps) {
  return (
    <div
      className={cn(
        "px-5 py-4",
        divided && "border-t border-white/55 dark:border-white/[0.07]",
        className
      )}
    >
      {children}
    </div>
  );
}
