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
          "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/40 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-shark-900 disabled:opacity-50 disabled:pointer-events-none cursor-pointer active:scale-[0.96]",
          {
            "bg-[#0071e3] text-white hover:bg-[#0068d0] shadow-[0_2px_12px_rgba(0,113,227,0.35),0_1px_2px_rgba(0,113,227,0.20)] hover:shadow-[0_4px_20px_rgba(0,113,227,0.45)]": variant === "primary",
            "backdrop-blur-md bg-white/70 dark:bg-shark-800/60 text-shark-700 dark:text-shark-300 hover:bg-white/90 dark:hover:bg-shark-700/70 border border-white/80 dark:border-white/[0.10] shadow-[0_1px_4px_rgba(0,0,0,0.10)]": variant === "secondary",
            "bg-red-500 text-white hover:bg-red-600 shadow-[0_2px_8px_rgba(239,68,68,0.28)] hover:shadow-[0_4px_16px_rgba(239,68,68,0.36)]": variant === "danger",
            "hover:bg-white/60 dark:hover:bg-shark-800/50 text-shark-600 dark:text-shark-400": variant === "ghost",
            "backdrop-blur-md border border-white/80 dark:border-white/[0.10] bg-white/70 dark:bg-shark-800/50 text-shark-700 dark:text-shark-300 hover:bg-white/90 dark:hover:bg-shark-700/60 shadow-[0_1px_4px_rgba(0,0,0,0.10)]": variant === "outline",
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
