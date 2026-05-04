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
          "inline-flex items-center justify-center rounded-[14px] font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-action-400/40 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-shark-900 disabled:opacity-50 disabled:pointer-events-none cursor-pointer active:scale-[0.96]",
          {
            "bg-action-500 text-white hover:bg-action-600 shadow-[0_2px_8px_rgba(17,19,212,0.22),0_1px_2px_rgba(17,19,212,0.14)] hover:shadow-[0_4px_16px_rgba(17,19,212,0.28),0_2px_4px_rgba(17,19,212,0.16)]": variant === "primary",
            "backdrop-blur-sm bg-white/60 dark:bg-shark-800/60 text-shark-700 dark:text-shark-300 hover:bg-white/80 dark:hover:bg-shark-700/70 border border-white/70 dark:border-white/[0.10]": variant === "secondary",
            "bg-red-500 text-white hover:bg-red-600 shadow-[0_2px_8px_rgba(239,68,68,0.22)] hover:shadow-[0_4px_16px_rgba(239,68,68,0.28)]": variant === "danger",
            "hover:bg-white/50 dark:hover:bg-shark-800/50 text-shark-600 dark:text-shark-400 rounded-[12px]": variant === "ghost",
            "backdrop-blur-sm border border-white/70 dark:border-white/[0.10] bg-white/60 dark:bg-shark-800/50 text-shark-700 dark:text-shark-300 hover:bg-white/80 dark:hover:bg-shark-700/60": variant === "outline",
          },
          {
            "px-3 py-2 text-xs min-h-[44px] sm:min-h-[32px]": size === "sm",
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
