import Link from "next/link";

export default function PortalNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-action-50 dark:bg-action-950 flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl font-bold text-action-500 dark:text-action-400">404</span>
        </div>
        <h1 className="text-2xl font-bold text-shark-900 dark:text-shark-100 mb-2">
          Page not found
        </h1>
        <p className="text-sm text-shark-500 dark:text-shark-400 mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-action-400 rounded-xl hover:bg-action-500 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
