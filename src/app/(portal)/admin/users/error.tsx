"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

export default function UsersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Users page error:", error);
  }, [error]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-shark-900 dark:text-shark-100 tracking-tight">User Management</h1>
        <p className="text-sm text-shark-400 mt-1">An error occurred</p>
      </div>
      <Card>
        <div className="px-6 py-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <Icon name="alert-triangle" size={24} className="text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-shark-900 dark:text-shark-100 mb-2">Something went wrong</h3>
          <p className="text-sm text-shark-500 dark:text-shark-400 mb-6 max-w-md mx-auto">
            {error.message || "Failed to load user management. Please try again."}
          </p>
          <Button onClick={reset}>Try Again</Button>
        </div>
      </Card>
    </div>
  );
}
