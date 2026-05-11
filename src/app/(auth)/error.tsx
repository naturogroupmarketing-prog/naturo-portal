"use client";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-shark-50 p-6">
      <div className="text-center max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-shark-900 mb-2">Authentication Error</h2>
        <p className="text-sm text-shark-500 mb-6">
          {error.message || "Something went wrong during authentication."}
        </p>
        <button
          onClick={reset}
          className="px-5 py-2.5 text-sm font-semibold text-white bg-action-400 rounded-lg hover:bg-action-500 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
