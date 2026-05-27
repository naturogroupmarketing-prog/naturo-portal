import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "flat" | "elevated" | "ghost";
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({ className, variant = "default", padding = "md", children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        // iOS 17 widget glass — large radius, strong translucency, top-light inset highlight
        "rounded-[28px] transition-colors",
        {
          "bg-white dark:bg-shark-900 border border-black/[0.05] dark:border-white/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.07),0_1px_2px_rgba(0,0,0,0.04)]": variant === "default",
          "bg-white dark:bg-shark-900 border border-black/[0.04] dark:border-white/[0.05] shadow-[0_1px_4px_rgba(0,0,0,0.05)]": variant === "flat",
          "bg-white dark:bg-shark-900 border border-black/[0.05] dark:border-white/[0.07] shadow-[0_4px_20px_rgba(0,0,0,0.10),0_1px_4px_rgba(0,0,0,0.06)]": variant === "elevated",
          "bg-transparent": variant === "ghost",
        },
        {
          "p-0": padding === "none",
          "p-4 sm:p-5": padding === "sm",
          "p-5 sm:p-6": padding === "md",
          "p-6 sm:p-8": padding === "lg",
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
    <h3 className={cn("text-base font-bold text-shark-900 dark:text-white tracking-tight", className)} {...props}>
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
