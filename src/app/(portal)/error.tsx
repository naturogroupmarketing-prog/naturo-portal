"use client";

import { useEffect } from "react";

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error tracking service (Sentry etc.)
    console.error("Portal error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-shark-900 dark:text-shark-100 mb-2">Something went wrong</h2>
        <p className="text-sm text-shark-500 dark:text-shark-400 mb-1">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        {error.digest && (
          <p className="text-xs text-shark-400 mb-6">Error ID: {error.digest}</p>
        )}
        <div className="flex gap-3 justify-center mt-5">
          <button
            onClick={reset}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-action-500 rounded-xl hover:bg-action-600 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="px-5 py-2.5 text-sm font-semibold text-shark-700 dark:text-shark-200 bg-shark-100 dark:bg-shark-800 rounded-xl hover:bg-shark-200 dark:hover:bg-shark-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
