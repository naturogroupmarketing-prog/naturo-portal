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
    style: "bg-white border-shark-200",
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
    style: "bg-white border-shark-200",
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
    style: "bg-white border-action-300 ring-2 ring-action-100",
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
    style: "bg-white border-shark-200",
  },
];

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section id="pricing" className="py-14 sm:py-20 lg:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-xs font-semibold text-action-500 uppercase tracking-widest mb-4">
            Pricing
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-exo leading-tight">
            <span className="text-shark-900">Simple, </span>
            <span className="bg-gradient-to-r from-action-500 to-indigo-500 bg-clip-text text-transparent">transparent</span>
            <span className="text-shark-900"> pricing.</span>
          </h2>
          <p className="mt-4 text-shark-400 text-lg">
            Start free and upgrade as your team grows. All paid plans include a
            14-day free trial.
          </p>
        </div>

        {/* Annual / Monthly toggle */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <span
            className={`text-sm font-medium ${!isAnnual ? "text-shark-900" : "text-shark-400"}`}
          >
            Monthly
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${
              isAnnual ? "bg-action-500" : "bg-shark-200"
            }`}
            aria-label="Toggle annual pricing"
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                isAnnual ? "translate-x-[22px]" : "translate-x-0"
              }`}
            />
          </button>
          <span
            className={`text-sm font-medium ${isAnnual ? "text-shark-900" : "text-shark-400"}`}
          >
            Annual
          </span>
          {isAnnual && (
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
              Save up to 18%
            </span>
          )}
        </div>

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
                className={`relative rounded-2xl border p-6 flex flex-col transition-shadow hover:shadow-lg ${plan.style}`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-action-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}

                <div className="mb-5">
                  <h3 className="text-lg font-bold text-shark-900">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-shark-400 mt-1 leading-snug">
                    {plan.description}
                  </p>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-shark-900">
                    {price}
                  </span>
                  {period && (
                    <span className="text-sm text-shark-400">{period}</span>
                  )}
                  {isAnnual &&
                    plan.monthlyPrice > 0 &&
                    plan.monthlyPrice !== plan.annualPrice && (
                      <p className="text-xs text-shark-300 mt-1 line-through">
                        ${plan.monthlyPrice}/month
                      </p>
                    )}
                </div>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-shark-600 dark:text-shark-400"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#3b5bdb"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="shrink-0 mt-0.5"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`block w-full text-center text-sm font-medium py-3 rounded-full transition-all ${
                    plan.popular
                      ? "bg-action-500 text-white hover:bg-action-600 hover:-translate-y-px hover:shadow-md"
                      : "bg-shark-50 text-shark-700 border border-shark-200 hover:bg-shark-100"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            );
          })}
        </div>

        {/* Trust badges under pricing */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-8">
          {[
            {
              icon: (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              ),
              label: "No credit card required",
            },
            {
              icon: (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              ),
              label: "14-day free trial",
            },
            {
              icon: (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              ),
              label: "Cancel anytime",
            },
            {
              icon: (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect
                    x="3"
                    y="11"
                    width="18"
                    height="11"
                    rx="2"
                    ry="2"
                  />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              ),
              label: "Secure & encrypted",
            },
          ].map((badge) => (
            <div
              key={badge.label}
              className="flex items-center gap-1.5 text-shark-400"
            >
              {badge.icon}
              <span className="text-xs font-medium">{badge.label}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-shark-400 mt-6">
          All prices in AUD. Need help choosing?{" "}
          <a
            href="mailto:support@trackio.com.au"
            className="text-action-500 hover:underline"
          >
            Contact our team
          </a>
        </p>
      </div>
    </section>
  );
}
