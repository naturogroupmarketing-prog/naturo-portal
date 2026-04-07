import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-xl border border-shark-200 dark:border-shark-700 bg-white dark:bg-shark-800 px-3.5 py-2.5 text-base sm:text-sm min-h-[44px] text-shark-900 dark:text-shark-100 placeholder-shark-400 dark:placeholder-shark-500 focus:border-action-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-action-400/20 disabled:bg-shark-50 dark:disabled:bg-shark-900 disabled:text-shark-400 transition-colors",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
export { Input };
