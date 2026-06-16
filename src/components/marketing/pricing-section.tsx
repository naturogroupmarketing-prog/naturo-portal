"use client";

import { useState } from "react";
import Link from "next/link";

const plans = [
  {
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    description: "For small teams getting started with asset tracking.",
    users: { label: "Users included", value: "3" },
    assets: { label: "Assets tracked", value: "50" },
    features: ["Basic reporting", "Community support"],
    cta: "Get Started Free",
    href: "/login",
    popular: false,
    badge: null as string | null,
  },
  {
    name: "Admin",
    monthlyPrice: 47,
    annualPrice: 39,
    description: "For growing teams that need more control and visibility.",
    users: { label: "Users included", value: "15" },
    assets: { label: "Assets tracked", value: "500" },
    features: ["AI assistant", "Advanced reporting", "Email support"],
    cta: "Start 14-Day Trial",
    href: "/login",
    popular: false,
    badge: null as string | null,
  },
  {
    name: "Professional",
    monthlyPrice: 79,
    annualPrice: 65,
    description: "For operations teams managing multiple locations at scale.",
    users: { label: "Users included", value: "75" },
    assets: { label: "Assets tracked", value: "2,000" },
    features: ["AI assistant", "Full reporting suite", "Condition checks", "Priority support"],
    cta: "Start 14-Day Trial",
    href: "/login",
    popular: true,
    badge: "Most Popular" as string | null,
  },
  {
    name: "Enterprise",
    monthlyPrice: -1,
    annualPrice: -1,
    description: "For large organisations with advanced needs.",
    users: { label: "Users included", value: "Unlimited" },
    assets: { label: "Assets tracked", value: "Unlimited" },
    features: ["Custom onboarding", "Dedicated support", "SLA guarantee", "API access"],
    cta: "Contact Sales",
    href: "mailto:support@trackio.com.au?subject=Enterprise%20Plan%20Enquiry",
    popular: false,
    badge: null as string | null,
  },
];

const NAVY = "#002FA0";

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section id="pricing" className="relative py-14 sm:py-20 lg:py-28 bg-white overflow-hidden">
      <div className="relative max-w-6xl mx-auto px-6">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: NAVY }}>
            Pricing
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-exo leading-tight text-shark-900">
            Simple,{" "}
            <span style={{ color: NAVY }}>transparent</span>
            {" "}pricing.
          </h2>
          <p className="mt-4 text-shark-500 text-lg">
            Start free and upgrade as your team grows. All paid plans include a 14-day free trial.
          </p>
        </div>

        {/* Toggle — AGL pill style */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          <div
            className="inline-flex rounded-full overflow-hidden"
            style={{ border: `1.5px solid ${NAVY}` }}
          >
            <button
              onClick={() => setIsAnnual(false)}
              className="px-5 py-2 text-sm font-semibold transition-colors"
              style={!isAnnual ? { background: NAVY, color: "#fff" } : { background: "#fff", color: NAVY }}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className="px-5 py-2 text-sm font-semibold transition-colors"
              style={isAnnual ? { background: NAVY, color: "#fff" } : { background: "#fff", color: NAVY }}
            >
              Annual
            </button>
          </div>
          {isAnnual && (
            <span className="text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
              Save up to 18%
            </span>
          )}
        </div>

        {/* Plan cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
          {plans.map((plan) => {
            const monthlyAmt = plan.monthlyPrice;
            const displayPrice = isAnnual ? plan.annualPrice : plan.monthlyPrice;
            const isPaid = monthlyAmt > 0;
            const isCustom = monthlyAmt === -1;

            return (
              <div key={plan.name} className="flex flex-col">

                {/* Featured banner above card (only for popular) */}
                {plan.badge ? (
                  <div
                    className="text-white text-xs font-bold text-center py-2.5 rounded-t-2xl tracking-wide uppercase"
                    style={{ background: NAVY }}
                  >
                    {plan.badge}
                  </div>
                ) : (
                  <div className="h-0" />
                )}

                {/* Card */}
                <div
                  className={`flex flex-col flex-1 bg-white border ${
                    plan.popular
                      ? "border-[#002FA0] rounded-b-2xl rounded-tr-2xl shadow-lg"
                      : "border-shark-200 rounded-2xl"
                  }`}
                >
                  <div className="p-6 flex flex-col flex-1">

                    {/* Plan name */}
                    <h3 className="text-xl font-extrabold text-shark-900 mb-1">{plan.name}</h3>
                    <p className="text-sm text-shark-500 leading-snug mb-6">{plan.description}</p>

                    {/* Price */}
                    <div className="mb-2">
                      {isCustom ? (
                        <span className="text-5xl font-extrabold" style={{ color: NAVY }}>Custom</span>
                      ) : (
                        <div className="flex items-start gap-0.5">
                          {isPaid && (
                            <span className="text-2xl font-bold mt-1.5" style={{ color: NAVY }}>$</span>
                          )}
                          <span className="text-6xl font-extrabold leading-none" style={{ color: NAVY }}>
                            {isPaid ? displayPrice : "0"}
                          </span>
                        </div>
                      )}
                      {isPaid && (
                        <p className="text-sm text-shark-500 mt-1">
                          per month{isAnnual ? ", billed annually" : ""}
                        </p>
                      )}
                      {!isPaid && !isCustom && (
                        <p className="text-sm text-shark-500 mt-1">Free forever</p>
                      )}
                      {isAnnual && isPaid && plan.monthlyPrice !== plan.annualPrice && (
                        <p className="text-xs text-shark-400 mt-0.5">
                          <span className="line-through">${plan.monthlyPrice}/mo</span>
                          {" "}if billed monthly
                        </p>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-shark-100 my-5" />

                    {/* Users & Assets — AGL-style metric rows */}
                    <div className="mb-4 space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-shark-400 uppercase tracking-wider mb-0.5">
                          {plan.users.label}
                        </p>
                        <p className="text-2xl font-extrabold" style={{ color: NAVY }}>
                          {plan.users.value}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-shark-400 uppercase tracking-wider mb-0.5">
                          {plan.assets.label}
                        </p>
                        <p className="text-2xl font-extrabold" style={{ color: NAVY }}>
                          {plan.assets.value}
                        </p>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-shark-100 my-5" />

                    {/* Features */}
                    <ul className="space-y-2.5 mb-8 flex-1">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm text-shark-700">
                          <svg
                            width="16" height="16" viewBox="0 0 24 24" fill="none"
                            stroke={NAVY} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                            className="shrink-0 mt-0.5"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {/* CTA — full-width dark navy pill (AGL style) */}
                    <Link
                      href={plan.href}
                      className="block w-full text-center text-sm font-bold py-3.5 rounded-full text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
                      style={{ background: NAVY }}
                    >
                      {plan.cta}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-8">
          {[
            { icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />, label: "No credit card required" },
            { icon: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>, label: "14-day free trial" },
            { icon: <polyline points="22 4 12 14.01 9 11.01" />, label: "Cancel anytime" },
            { icon: <><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></>, label: "Secure & encrypted" },
          ].map((badge) => (
            <div key={badge.label} className="flex items-center gap-1.5 text-shark-400">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {badge.icon}
              </svg>
              <span className="text-xs font-medium">{badge.label}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-shark-400 mt-6">
          All prices in AUD. Need help choosing?{" "}
          <a
            href="mailto:support@trackio.com.au"
            className="hover:underline transition-colors"
            style={{ color: NAVY }}
          >
            Contact our team
          </a>
        </p>
      </div>
    </section>
  );
}
