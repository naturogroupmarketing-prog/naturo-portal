"use client";

import { useState } from "react";
import Link from "next/link";

const plans = [
  {
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    description: "For small teams getting started with asset tracking.",
    features: [
      "Up to 3 users",
      "50 assets",
      "Basic reporting",
      "Community support",
    ],
    cta: "Get Started Free",
    href: "/login",
    popular: false,
  },
  {
    name: "Admin",
    monthlyPrice: 47,
    annualPrice: 39,
    description: "For growing teams that need more control and visibility.",
    features: [
      "Up to 15 users",
      "500 assets",
      "AI assistant",
      "Advanced reporting",
      "Email support",
    ],
    cta: "Start 14-Day Trial",
    href: "/login",
    popular: false,
  },
  {
    name: "Professional",
    monthlyPrice: 79,
    annualPrice: 65,
    description: "For operations teams managing multiple locations at scale.",
    features: [
      "Up to 75 users",
      "2,000 assets",
      "AI assistant",
      "Full reporting suite",
      "Condition checks",
      "Priority support",
    ],
    cta: "Start 14-Day Trial",
    href: "/login",
    popular: true,
  },
  {
    name: "Enterprise",
    monthlyPrice: -1,
    annualPrice: -1,
    description: "For large organisations with advanced needs.",
    features: [
      "Unlimited users",
      "Unlimited assets",
      "Custom onboarding",
      "Dedicated support",
      "SLA guarantee",
      "API access",
    ],
    cta: "Contact Sales",
    href: "mailto:support@trackio.com.au?subject=Enterprise%20Plan%20Enquiry",
    popular: false,
  },
];

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section
      id="pricing"
      className="relative py-14 sm:py-20 lg:py-28 overflow-hidden"
      style={{ background: "linear-gradient(160deg, #060b1f 0%, #0d1540 40%, #0a1033 70%, #060b1f 100%)" }}
    >
      {/* ── Decorative colour orbs — give glass something to blur against ── */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Top-left indigo */}
        <div
          className="absolute -top-40 -left-40 w-[480px] h-[480px] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, #4f46e5 0%, transparent 70%)", filter: "blur(60px)" }}
        />
        {/* Centre action blue */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[640px] h-[320px] rounded-full opacity-20"
          style={{ background: "radial-gradient(ellipse, #1F3DD9 0%, transparent 70%)", filter: "blur(80px)" }}
        />
        {/* Bottom-right violet */}
        <div
          className="absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full opacity-25"
          style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)", filter: "blur(60px)" }}
        />
        {/* Top-right cyan accent */}
        <div
          className="absolute top-10 right-20 w-[200px] h-[200px] rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #06b6d4 0%, transparent 70%)", filter: "blur(50px)" }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-xs font-semibold text-action-400 uppercase tracking-widest mb-4">
            Pricing
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-exo leading-tight">
            <span className="text-white">Simple, </span>
            <span className="bg-gradient-to-r from-action-400 to-indigo-400 bg-clip-text text-transparent">transparent</span>
            <span className="text-white"> pricing.</span>
          </h2>
          <p className="mt-4 text-white/50 text-lg">
            Start free and upgrade as your team grows. All paid plans include a
            14-day free trial.
          </p>
        </div>

        {/* Annual / Monthly toggle */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className={`text-sm font-medium transition-colors ${!isAnnual ? "text-white" : "text-white/40"}`}>
            Monthly
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${
              isAnnual ? "bg-action-500" : "bg-white/20"
            }`}
            aria-label="Toggle annual pricing"
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                isAnnual ? "translate-x-[22px]" : "translate-x-0"
              }`}
            />
          </button>
          <span className={`text-sm font-medium transition-colors ${isAnnual ? "text-white" : "text-white/40"}`}>
            Annual
          </span>
          {isAnnual && (
            <span className="text-xs font-semibold text-green-300 bg-green-500/15 px-2.5 py-1 rounded-full border border-green-500/25">
              Save up to 18%
            </span>
          )}
        </div>

        {/* Plan cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((plan) => {
            const price =
              plan.monthlyPrice === -1
                ? "Custom"
                : isAnnual
                  ? `$${plan.annualPrice}`
                  : `$${plan.monthlyPrice}`;
            const period =
              plan.monthlyPrice === -1
                ? ""
                : plan.monthlyPrice === 0
                  ? ""
                  : "/month";

            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl flex flex-col transition-all duration-300 ${
                  plan.popular
                    ? /* Popular: slightly more opaque + action border glow */
                      "border border-action-400/50 hover:border-action-400/80"
                    : /* Others: subtle white glass border */
                      "border border-white/10 hover:border-white/20"
                }`}
                style={{
                  background: plan.popular
                    ? "rgba(255,255,255,0.12)"
                    : "rgba(255,255,255,0.06)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  boxShadow: plan.popular
                    ? "0 4px 32px rgba(31,61,217,0.25), 0 1px 0 rgba(255,255,255,0.08) inset"
                    : "0 4px_24px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.06) inset",
                }}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-action-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-lg whitespace-nowrap">
                    Most Popular
                  </span>
                )}

                <div className="p-6 flex flex-col flex-1">
                  {/* Plan name + description */}
                  <div className="mb-5">
                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    <p className="text-sm text-white/50 mt-1 leading-snug">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white">{price}</span>
                    {period && <span className="text-sm text-white/40">{period}</span>}
                    {isAnnual && plan.monthlyPrice > 0 && plan.monthlyPrice !== plan.annualPrice && (
                      <p className="text-xs text-white/25 mt-1 line-through">${plan.monthlyPrice}/month</p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-white/70">
                        <svg
                          width="16" height="16" viewBox="0 0 24 24" fill="none"
                          stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                          className="shrink-0 mt-0.5"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* CTA button */}
                  <Link
                    href={plan.href}
                    className={`block w-full text-center text-sm font-semibold py-3 rounded-xl transition-all duration-200 ${
                      plan.popular
                        ? "bg-action-500 text-white hover:bg-action-600 shadow-[0_4px_20px_rgba(31,61,217,0.4)] hover:shadow-[0_6px_28px_rgba(31,61,217,0.55)] hover:-translate-y-px"
                        : "bg-white/10 text-white border border-white/15 hover:bg-white/18 hover:border-white/25"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust badges */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-8">
          {[
            {
              icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
              label: "No credit card required",
            },
            {
              icon: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
              label: "14-day free trial",
            },
            {
              icon: <polyline points="22 4 12 14.01 9 11.01" />,
              label: "Cancel anytime",
            },
            {
              icon: <><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></>,
              label: "Secure & encrypted",
            },
          ].map((badge) => (
            <div key={badge.label} className="flex items-center gap-1.5 text-white/35">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {badge.icon}
              </svg>
              <span className="text-xs font-medium">{badge.label}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-white/30 mt-6">
          All prices in AUD. Need help choosing?{" "}
          <a href="mailto:support@trackio.com.au" className="text-action-400 hover:text-action-300 transition-colors">
            Contact our team
          </a>
        </p>
      </div>
    </section>
  );
}
