import { cn } from "@/lib/utils";
import { SelectHTMLAttributes, forwardRef } from "react";

const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "w-full rounded-[14px] border border-white/62 dark:border-white/[0.10] bg-white/52 dark:bg-shark-800/60 backdrop-blur-md px-3.5 py-2.5 text-base sm:text-sm min-h-[44px] text-shark-900 dark:text-white focus:border-[#8B9FE8]/60 focus:bg-white/72 dark:focus:bg-shark-800/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B9FE8]/20 focus:shadow-[0_0_0_4px_rgba(139,159,232,0.12)] disabled:bg-white/30 dark:disabled:bg-shark-900/50 disabled:text-shark-400 shadow-[inset_0_1px_2px_rgba(100,140,220,0.08)] transition-all duration-200",
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
