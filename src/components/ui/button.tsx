import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spinner", className)}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
    >
      <circle
        cx="8"
        cy="8"
        r="6.5"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="2.5"
      />
      <path
        d="M8 1.5a6.5 6.5 0 016.5 6.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-action-400/40 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-shark-900 disabled:opacity-50 disabled:pointer-events-none cursor-pointer active:scale-[0.97] hover:-translate-y-px",
          {
            "bg-action-400 text-white hover:bg-action-500 shadow-sm hover:shadow": variant === "primary",
            "bg-shark-50 dark:bg-shark-800 text-shark-700 dark:text-shark-300 hover:bg-shark-100 dark:hover:bg-shark-700 border border-shark-200 dark:border-shark-700": variant === "secondary",
            "bg-red-500 text-white hover:bg-red-600 shadow-sm": variant === "danger",
            "hover:bg-shark-50 dark:hover:bg-shark-800 text-shark-600 dark:text-shark-400": variant === "ghost",
            "border border-shark-200 dark:border-shark-700 bg-white dark:bg-shark-800 text-shark-700 dark:text-shark-300 hover:bg-shark-50 dark:hover:bg-shark-700": variant === "outline",
          },
          {
            "px-3 py-2 text-xs min-h-[36px] sm:min-h-[32px]": size === "sm",
            "px-4 py-2.5 text-sm min-h-[44px] sm:min-h-[40px]": size === "md",
            "px-6 py-3 text-sm min-h-[48px] sm:min-h-[44px]": size === "lg",
          },
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Spinner className="mr-2 shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button, Spinner };
