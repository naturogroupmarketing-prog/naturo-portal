import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-shark-100 dark:border-shark-800 bg-white">
      <div className="max-w-6xl mx-auto px-6 py-10 sm:py-12">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          {/* Logo + tagline */}
          <div className="text-center sm:text-left">
            <Link href="/welcome" className="inline-block">
              <img
                src="/Logotrackio.svg"
                alt="trackio"
                className="h-6 w-auto"
              />
            </Link>
            <p className="mt-2 text-xs text-shark-400">
              Asset & supply tracking for operational teams.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-shark-400">
            <Link href="/privacy-policy" className="hover:text-shark-700 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="hover:text-shark-700 transition-colors">
              Terms of Service
            </Link>
            <Link href="/login" className="hover:text-shark-700 transition-colors">
              Sign In
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-shark-100 dark:border-shark-800 text-center">
          <p className="text-[11px] text-shark-300">
            &copy; {new Date().getFullYear()} trackio. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
