import { cn } from "@/lib/utils";
import { SelectHTMLAttributes, forwardRef } from "react";

const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "w-full rounded-[20px] border border-shark-200 dark:border-white/[0.10] bg-white dark:bg-shark-800 px-3.5 py-2.5 text-base sm:text-sm min-h-[44px] text-shark-900 dark:text-white focus:border-action-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-action-500/20 focus:shadow-[0_0_0_4px_rgba(0,87,255,0.10)] disabled:bg-shark-50 dark:disabled:bg-shark-900/50 disabled:text-shark-400 transition-all duration-200",
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = "Select";
export { Select };
