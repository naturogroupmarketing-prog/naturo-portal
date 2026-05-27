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
          "inline-flex items-center justify-center rounded-full font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-action-500/40 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-shark-900 disabled:opacity-50 disabled:pointer-events-none cursor-pointer active:scale-[0.97]",
          {
            "bg-action-500 text-white hover:bg-[#1A6BFF] active:bg-[#004DE0]": variant === "primary",
            "bg-white dark:bg-shark-800 text-shark-900 dark:text-shark-100 hover:bg-shark-50 dark:hover:bg-shark-700 border border-black/[0.08] dark:border-white/[0.10] shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)]": variant === "secondary",
            "bg-red-500 text-white hover:bg-red-600": variant === "danger",
            "hover:bg-[#f5f5f7] dark:hover:bg-shark-800 text-shark-600 dark:text-shark-400": variant === "ghost",
            "border border-black/[0.08] dark:border-white/[0.10] bg-white dark:bg-shark-800 text-shark-900 dark:text-shark-200 hover:bg-shark-50 dark:hover:bg-shark-700 shadow-[0_1px_3px_rgba(0,0,0,0.06)]": variant === "outline",
          },
          {
            "px-4 py-2 text-xs min-h-[44px] sm:min-h-[34px]": size === "sm",
            "px-5 py-2.5 text-sm min-h-[44px] sm:min-h-[42px]": size === "md",
            "px-7 py-3 text-sm min-h-[52px] sm:min-h-[48px]": size === "lg",
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
