import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "flat" | "elevated" | "ghost";
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({ className, variant = "default", padding = "md", children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        // Glassmorphism: frosted surface, white-edge border, inset highlight
        "rounded-[28px] transition-colors",
        {
          "backdrop-blur-xl bg-white/78 dark:bg-shark-900/70 border border-white/80 dark:border-white/[0.07] shadow-[0_2px_24px_rgba(100,140,220,0.14),0_1px_0_rgba(255,255,255,0.95)] dark:shadow-[0_1px_0_rgba(255,255,255,0.04),0_4px_16px_rgba(0,0,0,0.20)]": variant === "default",
          "backdrop-blur-md bg-white/65 dark:bg-shark-900/50 border border-white/72 dark:border-white/[0.06]": variant === "flat",
          "backdrop-blur-xl bg-white/88 dark:bg-shark-900/80 border border-white/88 dark:border-white/[0.08] shadow-[0_2px_32px_rgba(100,140,220,0.16),0_1px_0_rgba(255,255,255,1)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.20),0_8px_28px_rgba(0,0,0,0.30),inset_0_1px_0_rgba(255,255,255,0.06)]": variant === "elevated",
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
