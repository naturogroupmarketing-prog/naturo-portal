import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-full border border-shark-200 dark:border-white/[0.10] bg-white dark:bg-shark-800 px-4 py-2.5 text-base sm:text-sm min-h-[44px] text-shark-900 dark:text-white placeholder-shark-400 dark:placeholder-shark-500 focus:border-action-500/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-action-500/20 focus:shadow-[0_0_0_4px_rgba(0,87,255,0.08)] disabled:bg-shark-50 dark:disabled:bg-shark-900/50 disabled:text-shark-400 transition-all duration-200",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
export { Input };
