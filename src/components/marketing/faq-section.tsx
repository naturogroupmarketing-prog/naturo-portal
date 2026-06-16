"use client";

import { useState } from "react";
import { ScrollReveal } from "./scroll-reveal";

const faqs = [
  { question: "How long does it take to set up?", answer: "Most teams are up and running within 15 minutes. Add your locations, import your assets via CSV or manually, invite your team, and you're ready to go. No technical skills required." },
  { question: "Can I migrate from spreadsheets?", answer: "Absolutely. trackio has a built-in CSV import tool that lets you bring in your existing asset and supply data in minutes. We support bulk imports for assets, consumables, staff, and locations." },
  { question: "Is my data secure?", answer: "Yes. trackio uses 256-bit SSL encryption, role-based access controls, and full activity logging. Your data is hosted on secure, SOC 2 compliant infrastructure with automated backups." },
  { question: "What happens when my free trial ends?", answer: "After your 14-day trial, you can choose a plan that fits your team or continue with our free tier (up to 3 users, 50 assets). No credit card is required to start, and you can cancel anytime." },
  { question: "Can I manage multiple branches?", answer: "Yes — multi-location management is a core feature. You can group branches by state or region, see stock across all locations at a glance, and drill into any branch for detail." },
  { question: "Do you offer customer support?", answer: "All paid plans include email support with fast response times. Professional and Enterprise plans include priority support with dedicated assistance. Our team is based in Australia." },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-14 sm:py-20 lg:py-28 bg-white">
      <div className="max-w-3xl mx-auto px-6">
        <ScrollReveal>
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#002FA0" }}>
              FAQ
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight" style={{ color: "#111827" }}>
              Common questions, clear answers.
            </h2>
            <p className="mt-4 text-shark-500 text-lg">
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
                className="bg-white rounded-[20px] border transition-all"
                style={{ borderColor: isOpen ? "rgba(0,47,160,0.25)" : "#e5e7eb", boxShadow: isOpen ? "0 1px 8px rgba(0,47,160,0.08)" : "none" }}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                >
                  <span className="text-sm font-semibold pr-4" style={{ color: isOpen ? "#002FA0" : "#111827" }}>
                    {faq.question}
                  </span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                    className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    style={{ color: isOpen ? "#002FA0" : "#9ca3af" }}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 -mt-1">
                    <p className="text-sm text-shark-500 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-shark-400">
            Still have questions?{" "}
            <a href="mailto:support@trackio.com.au" className="font-medium hover:underline" style={{ color: "#002FA0" }}>
              Contact our team
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
