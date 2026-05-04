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
        "backdrop-blur-xl bg-white/52 dark:bg-shark-900/70 border border-white/65 dark:border-white/[0.07]",
        !flush && "rounded-[20px]",
        shadow && "shadow-[0_2px_24px_rgba(100,120,200,0.13),0_1px_0_rgba(255,255,255,0.95)] dark:shadow-[0_1px_0_rgba(255,255,255,0.04),0_4px_16px_rgba(0,0,0,0.20)]",
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
        "px-4 py-3 border-b border-shark-100 dark:border-shark-800",
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
        "px-4 py-3",
        divided && "border-t border-shark-100 dark:border-shark-800",
        className
      )}
    >
      {children}
    </div>
  );
}
