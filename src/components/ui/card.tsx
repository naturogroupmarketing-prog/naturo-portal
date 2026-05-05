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
          "backdrop-blur-2xl backdrop-saturate-150 bg-white/52 dark:bg-shark-900/55 border border-white/70 dark:border-white/[0.10] shadow-[0_4px_32px_rgba(18,89,195,0.18),inset_0_1px_0_rgba(255,255,255,0.95)] dark:shadow-[0_1px_0_rgba(255,255,255,0.06),0_4px_24px_rgba(0,0,0,0.30)]": variant === "default",
          "backdrop-blur-xl backdrop-saturate-125 bg-white/38 dark:bg-shark-900/40 border border-white/60 dark:border-white/[0.08]": variant === "flat",
          "backdrop-blur-2xl backdrop-saturate-200 bg-white/65 dark:bg-shark-900/65 border border-white/80 dark:border-white/[0.12] shadow-[0_8px_40px_rgba(18,89,195,0.24),inset_0_1px_0_rgba(255,255,255,0.98)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.20),0_12px_40px_rgba(0,0,0,0.40),inset_0_1px_0_rgba(255,255,255,0.08)]": variant === "elevated",
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
