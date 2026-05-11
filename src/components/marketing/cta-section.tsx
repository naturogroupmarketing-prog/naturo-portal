import Link from "next/link";
import { ScrollReveal } from "./scroll-reveal";

export function CTASection() {
  return (
    <section className="py-14 sm:py-20 lg:py-28" style={{ background: "linear-gradient(135deg, #002FA0 0%, #0050CC 55%, #0070F0 100%)" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-white">
              Ready to take control of{" "}
              <span style={{ color: "#FFD700" }}>your operations?</span>
            </h2>
            <p className="mt-5 text-white/70 text-lg max-w-xl mx-auto">
              Stop losing track of equipment and supplies. Start managing every location, every item, and every team member in one place.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center text-sm font-semibold px-8 py-3.5 rounded-full transition-all hover:-translate-y-px hover:shadow-lg active:scale-[0.97]"
                style={{ background: "#ffffff", color: "#002FA0", boxShadow: "0 4px 20px rgba(0,0,0,0.20)" }}
              >
                Start Your Free Trial
                <svg className="ml-2 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center text-sm font-semibold text-white px-8 py-3.5 rounded-full transition-all hover:bg-white/15"
                style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)" }}
              >
                Sign In
              </Link>
            </div>
            <p className="mt-6 text-xs text-white/40">
              Free 14-day trial · No credit card required · Cancel anytime
            </p>
            <p className="mt-2 text-xs text-white/60 font-medium">
              Join 500+ teams already tracking smarter with trackio.
            </p>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
