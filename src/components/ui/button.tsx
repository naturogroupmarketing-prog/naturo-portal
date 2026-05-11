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
          "inline-flex items-center justify-center rounded-full font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0057FF]/40 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-shark-900 disabled:opacity-50 disabled:pointer-events-none cursor-pointer active:scale-[0.97]",
          {
            "bg-[#0057FF] text-white hover:bg-[#1A6BFF] active:bg-[#004DE0]": variant === "primary",
            "bg-[#f5f5f7] dark:bg-shark-800 text-[#1d1d1f] dark:text-shark-100 hover:bg-[#e8e8ed] dark:hover:bg-shark-700 border border-black/[0.07] dark:border-white/[0.08]": variant === "secondary",
            "bg-red-500 text-white hover:bg-red-600": variant === "danger",
            "hover:bg-[#f5f5f7] dark:hover:bg-shark-800 text-shark-600 dark:text-shark-400": variant === "ghost",
            "border border-[#d2d2d7] dark:border-white/[0.10] bg-white dark:bg-shark-800/50 text-[#1d1d1f] dark:text-shark-200 hover:bg-[#f5f5f7] dark:hover:bg-shark-700": variant === "outline",
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
