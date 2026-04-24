import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-lg border border-shark-200 dark:border-shark-600 bg-white dark:bg-shark-800 px-3.5 py-2.5 text-base sm:text-sm min-h-[44px] text-shark-800 dark:text-white placeholder-shark-300 dark:placeholder-shark-400 shadow-[0_1px_2px_rgba(60,66,87,0.06),0_0_0_1px_rgba(60,66,87,0.08)] focus:border-action-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-action-500/20 focus:shadow-[0_0_0_3px_rgba(99,91,255,0.12),0_1px_2px_rgba(60,66,87,0.06)] disabled:bg-shark-50 dark:disabled:bg-shark-900 disabled:text-shark-400 transition-all duration-150",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
export { Input };
