import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-xl border border-shark-200 bg-white px-3.5 py-2 text-sm text-shark-900 placeholder-shark-400 focus:border-action-400 focus:outline-none focus:ring-2 focus:ring-action-400/20 disabled:bg-shark-50 disabled:text-shark-400 transition-colors",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
export { Input };
