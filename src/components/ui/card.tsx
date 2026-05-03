import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "flat" | "elevated" | "ghost";
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({ className, variant = "default", padding = "md", children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        // One UI-inspired: 20px radius, layered shadow, clean white surface
        "rounded-[20px] transition-colors",
        {
          "bg-white dark:bg-shark-900 border border-shark-100/80 dark:border-shark-800/60 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)]": variant === "default",
          "bg-shark-50 dark:bg-shark-900 border border-shark-100/80 dark:border-shark-800/60": variant === "flat",
          "bg-white dark:bg-shark-900 shadow-[0_2px_4px_rgba(0,0,0,0.06),0_8px_28px_rgba(0,0,0,0.10)] border border-shark-100/60 dark:border-shark-800/60": variant === "elevated",
          "bg-transparent": variant === "ghost",
        },
        {
          "p-0": padding === "none",
          "p-3.5": padding === "sm",
          "p-4 sm:p-5": padding === "md",
          "p-5 sm:p-8": padding === "lg",
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center justify-between gap-4 mb-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-sm font-semibold text-shark-900 dark:text-white", className)} {...props}>
      {children}
    </h3>
  );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("", className)} {...props}>
      {children}
    </div>
  );
}
