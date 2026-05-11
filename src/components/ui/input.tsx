import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-full border border-white/60 dark:border-white/[0.10] bg-white/50 dark:bg-shark-800/60 backdrop-blur-[20px] px-4 py-2.5 text-base sm:text-sm min-h-[44px] text-shark-900 dark:text-white placeholder-shark-400 dark:placeholder-shark-500 focus:border-[#0071e3]/40 focus:bg-white/80 dark:focus:bg-shark-800/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/20 focus:shadow-[0_0_0_4px_rgba(0,113,227,0.08)] disabled:bg-white/30 dark:disabled:bg-shark-900/50 disabled:text-shark-400 shadow-[inset_0_1px_2px_rgba(0,113,227,0.06)] transition-all duration-200",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
export { Input };
