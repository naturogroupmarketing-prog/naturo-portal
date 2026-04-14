import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-xl border border-shark-200 dark:border-shark-600 bg-white dark:bg-shark-800 px-3.5 py-2.5 text-base sm:text-sm min-h-[44px] text-shark-900 dark:text-white placeholder-shark-400 dark:placeholder-shark-400 focus:border-action-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-action-400/20 focus:shadow-[0_0_0_3px_rgba(31,61,217,0.08)] disabled:bg-shark-50 dark:disabled:bg-shark-900 disabled:text-shark-400 transition-all duration-200",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
export { Input };
