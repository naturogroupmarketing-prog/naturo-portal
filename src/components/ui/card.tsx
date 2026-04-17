import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "flat" | "elevated" | "ghost";
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({ className, variant = "default", padding = "md", children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl transition-colors",
        {
          "bg-white dark:bg-shark-900 border border-shark-100 dark:border-shark-800 shadow-sm": variant === "default",
          "bg-shark-50 dark:bg-shark-900 border border-shark-100 dark:border-shark-800": variant === "flat",
          "bg-white dark:bg-shark-900 shadow-md border border-shark-100 dark:border-shark-800": variant === "elevated",
          "bg-transparent": variant === "ghost",
        },
        {
          "p-0": padding === "none",
          "p-3": padding === "sm",
          "p-5": padding === "md",
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
