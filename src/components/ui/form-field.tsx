import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  hint?: string;
  className?: string;
}

export function FormField({
  label,
  error,
  required,
  children,
  hint,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="block text-sm font-semibold text-shark-700 dark:text-shark-200">
        {label}
        {required && (
          <span className="ml-0.5 text-red-400 dark:text-red-500">*</span>
        )}
      </label>

      {children}

      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}

      {!error && hint && (
        <p className="text-sm text-shark-400 dark:text-shark-500 dark:text-shark-400">{hint}</p>
      )}
    </div>
  );
}
