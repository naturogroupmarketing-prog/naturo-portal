import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-action-300 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
          {
            "bg-action-400 text-white hover:bg-action-500 shadow-sm hover:shadow": variant === "primary",
            "bg-shark-50 text-shark-700 hover:bg-shark-100 border border-shark-200": variant === "secondary",
            "bg-red-500 text-white hover:bg-red-600 shadow-sm": variant === "danger",
            "hover:bg-shark-50 text-shark-600": variant === "ghost",
            "border border-shark-200 bg-white text-shark-700 hover:bg-shark-50": variant === "outline",
          },
          {
            "px-3 py-1.5 text-xs": size === "sm",
            "px-4 py-2 text-sm": size === "md",
            "px-6 py-2.5 text-sm": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
export { Button };
