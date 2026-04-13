"use client";

import { useState } from "react";
import { ScrollReveal } from "./scroll-reveal";

const faqs = [
  {
    question: "How long does it take to set up?",
    answer:
      "Most teams are up and running within 15 minutes. Add your locations, import your assets via CSV or manually, invite your team, and you're ready to go. No technical skills required.",
  },
  {
    question: "Can I migrate from spreadsheets?",
    answer:
      "Absolutely. trackio has a built-in CSV import tool that lets you bring in your existing asset and supply data in minutes. We support bulk imports for assets, consumables, staff, and locations.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes. trackio uses 256-bit SSL encryption, role-based access controls, and full activity logging. Your data is hosted on secure, SOC 2 compliant infrastructure with automated backups.",
  },
  {
    question: "What happens when my free trial ends?",
    answer:
      "After your 14-day trial, you can choose a plan that fits your team or continue with our free tier (up to 3 users, 50 assets). No credit card is required to start, and you can cancel anytime.",
  },
  {
    question: "Can I manage multiple branches?",
    answer:
      "Yes — multi-location management is a core feature. You can group branches by state or region, see stock across all locations at a glance, and drill into any branch for detail.",
  },
  {
    question: "Do you offer customer support?",
    answer:
      "All paid plans include email support with fast response times. Professional and Enterprise plans include priority support with dedicated assistance. Our team is based in Australia.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-20 sm:py-28 bg-shark-50/40">
      <div className="max-w-3xl mx-auto px-6">
        <ScrollReveal>
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-action-500 uppercase tracking-widest mb-4">
              FAQ
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-exo leading-tight">
              <span className="text-shark-900">Common questions, </span>
              <span className="bg-gradient-to-r from-action-500 to-indigo-500 bg-clip-text text-transparent">clear answers.</span>
            </h2>
            <p className="mt-4 text-shark-400 text-lg">
              Everything you need to know before getting started.
            </p>
          </div>
        </ScrollReveal>

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={faq.question}
                className={`bg-white rounded-2xl border transition-all ${
                  isOpen
                    ? "border-action-200 shadow-sm"
                    : "border-shark-100 hover:border-shark-200"
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                >
                  <span
                    className={`text-sm font-semibold pr-4 ${
                      isOpen ? "text-action-600" : "text-shark-800"
                    }`}
                  >
                    {faq.question}
                  </span>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className={`shrink-0 text-shark-400 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 -mt-1">
                    <p className="text-sm text-shark-500 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-shark-400">
            Still have questions?{" "}
            <a
              href="mailto:support@trackio.com.au"
              className="text-action-500 font-medium hover:underline"
            >
              Contact our team
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
