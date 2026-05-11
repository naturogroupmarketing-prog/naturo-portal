"use client";

import { ScrollReveal } from "./scroll-reveal";

export function CTASection() {
  return (
    <section className="py-16 sm:py-24" style={{ background: "linear-gradient(135deg, #001A80 0%, #002FA0 50%, #0050CC 100%)" }}>
      <div className="max-w-4xl mx-auto px-6">
        <ScrollReveal>
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-300 mb-4">
              Start today — free for 14 days
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-white">
              Stop losing equipment.<br />
              <span style={{ color: "#FFD700" }}>Start tracking smarter.</span>
            </h2>
            <p className="mt-5 text-white/60 text-lg max-w-xl mx-auto">
              Join 500+ Australian service businesses that switched from spreadsheets and clunky apps to trackio. Setup takes 15 minutes.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={150}>
          {/* Email capture */}
          <form
            className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const email = (form.elements.namedItem("email") as HTMLInputElement).value;
              window.location.href = `/login?email=${encodeURIComponent(email)}`;
            }}
          >
            <input
              type="email"
              name="email"
              required
              placeholder="Enter your work email"
              className="flex-1 px-5 py-4 rounded-full text-sm font-medium text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-white/30"
              style={{ background: "rgba(255,255,255,0.97)" }}
            />
            <button
              type="submit"
              className="shrink-0 inline-flex items-center justify-center text-sm font-bold px-7 py-4 rounded-full transition-all hover:-translate-y-px active:scale-[0.97]"
              style={{ background: "#FFD700", color: "#001A6B", boxShadow: "0 4px 20px rgba(255,215,0,0.30)" }}
            >
              Start Free Trial →
            </button>
          </form>

          {/* Trust row */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {[
              "No credit card required",
              "14-day free trial",
              "Cancel anytime",
              "Australian-built & supported",
            ].map((t) => (
              <span key={t} className="flex items-center gap-1.5 text-xs text-white/40">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                {t}
              </span>
            ))}
          </div>

          {/* Risk reversal */}
          <p className="mt-6 text-center text-xs text-white/30">
            Not happy after your trial? We&apos;ll help you export your data — no questions asked.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
