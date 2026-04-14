"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-shark-50 dark:bg-shark-950 px-4 transition-colors">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-shark-100 dark:bg-shark-800 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-shark-400 dark:text-shark-500">
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0119 12.55" />
            <path d="M5 12.55a10.94 10.94 0 015.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0122.56 9" />
            <path d="M1.42 9a15.91 15.91 0 014.7-2.88" />
            <path d="M8.53 16.11a6 6 0 016.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-shark-900 dark:text-shark-100 mb-2">You&apos;re Offline</h1>
        <p className="text-sm text-shark-500 dark:text-shark-400 mb-6">
          Check your internet connection and try again. The app needs a connection to load data.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-shark-900 dark:bg-shark-100 dark:text-shark-900 rounded-lg hover:bg-shark-800 dark:hover:bg-shark-200 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
