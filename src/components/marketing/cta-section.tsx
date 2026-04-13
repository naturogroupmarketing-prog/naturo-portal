import Link from "next/link";

export function CTASection() {
  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="relative max-w-3xl mx-auto text-center">
          {/* Subtle background accent */}
          <div className="absolute -inset-8 bg-gradient-to-b from-action-50/40 to-transparent rounded-3xl pointer-events-none" />

          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold text-shark-900 tracking-tight font-exo leading-tight">
              Ready to take control of your operations?
            </h2>
            <p className="mt-5 text-shark-400 text-lg max-w-xl mx-auto">
              Stop losing track of equipment and supplies. Start managing
              every location, every item, and every team member in one place.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center text-sm font-medium bg-action-500 text-white px-8 py-3.5 rounded-full hover:bg-action-600 transition-all hover:-translate-y-px hover:shadow-lg active:scale-[0.97]"
              >
                Start Your Free Trial
                <svg className="ml-2 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center text-sm font-medium text-shark-600 bg-white border border-shark-200 px-8 py-3.5 rounded-full hover:bg-shark-50 hover:border-shark-300 transition-all"
              >
                Sign In
              </Link>
            </div>

            <p className="mt-6 text-xs text-shark-300">
              Free 14-day trial. No credit card required. Cancel anytime.
            </p>
            <p className="mt-2 text-xs text-shark-400 font-medium">
              Join 500+ teams already tracking smarter with Trackio.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
