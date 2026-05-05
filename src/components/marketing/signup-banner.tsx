"use client";

import Link from "next/link";
import { ScrollReveal } from "./scroll-reveal";

export function SignupBanner() {
  return (
    <section className="py-16 sm:py-20">
      <div className="max-w-6xl mx-auto px-6">
      <div className="relative overflow-hidden rounded-xl">
      {/* Gradient background — warm coral/orange to deep purple/blue */}
      <div className="absolute inset-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-rose-500 to-indigo-600" />

        {/* Layered color washes for depth */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 100% at 0% 50%, rgba(249,115,22,0.8) 0%, transparent 60%), " +
              "radial-gradient(ellipse 60% 120% at 50% 100%, rgba(225,29,72,0.5) 0%, transparent 50%), " +
              "radial-gradient(ellipse 80% 100% at 100% 50%, rgba(79,70,229,0.9) 0%, transparent 60%)",
          }}
        />

        {/* Soft diagonal light streak */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background:
              "linear-gradient(135deg, transparent 20%, rgba(255,255,255,0.15) 40%, transparent 60%)",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 px-8 sm:px-12 py-10 sm:py-14">
        <ScrollReveal>
          <div className="text-center">
            {/* Eyebrow */}
            <p className="text-xs font-semibold text-white/70 uppercase tracking-widest mb-2">
              Limited Time Offer
            </p>

            {/* Divider */}
            <div className="w-10 h-px bg-white/30 mx-auto mb-4" />

            {/* Headline */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white font-exo tracking-tight leading-tight">
              Start tracking smarter today.
            </h2>

            <p className="mt-3 text-base sm:text-lg text-white/80 max-w-xl mx-auto leading-relaxed">
              Join 500+ teams already saving time and cutting losses with trackio. Your first 14 days are free.
            </p>

            {/* Buttons */}
            <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/login"
                className="group relative inline-flex items-center justify-center text-sm font-semibold bg-white text-indigo-600 px-7 py-3 rounded-full hover:bg-white/90 transition-all hover:-translate-y-px hover:shadow-xl active:scale-[0.97]"
              >
                Start Free Trial
                <svg
                  className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M13 5l7 7-7 7" />
                  <path d="M20 12H4" />
                </svg>
              </Link>

              <Link
                href="/login"
                className="inline-flex items-center justify-center text-sm font-semibold text-white border-2 border-white/40 px-7 py-3 rounded-full hover:bg-white/10 hover:border-white/60 transition-all"
              >
                Sign In
              </Link>
            </div>

            {/* Trust line */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-5">
              {[
                "No credit card required",
                "Set up in minutes",
                "Cancel anytime",
              ].map((item) => (
                <span
                  key={item}
                  className="flex items-center gap-1.5 text-[11px] text-white/60 font-medium"
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
      </div>
      </div>
    </section>
  );
}
