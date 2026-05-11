"use client";

import { useState } from "react";
import { ScrollReveal } from "./scroll-reveal";

const NAVY = "#002FA0";

const industries = [
  {
    label: "Cleaning & Facilities",
    tracks: [
      "Chemicals & cleaning products by site",
      "Vacuums, mops & floor equipment with assigned staff",
      "PPE — gloves, masks & uniforms per worker",
      "Linen & consumable stock levels across locations",
    ],
    quote: "\"We had 3 vacuums double-booked for the same shift. Nobody knew who had them.\"",
    outcome: "200+ assets tracked across 12 sites",
  },
  {
    label: "Construction & Trades",
    tracks: [
      "Power tools & hand tools issued to workers",
      "Safety harnesses & PPE compliance logs",
      "Job site consumables and material usage",
      "Plant hire & machinery location tracking",
    ],
    quote: "\"$12,000 of tools went missing last year. We had no way to trace them.\"",
    outcome: "Tool loss down 40% in first 90 days",
  },
  {
    label: "Field Service",
    tracks: [
      "Van inventory per technician",
      "Spare parts & consumables issued pre-job",
      "Personal gear returned after job completion",
      "Return condition notes and damage flags",
    ],
    quote: "\"Techs kept turning up on-site without the right gear. The warehouse had zero visibility.\"",
    outcome: "3+ hrs per week saved on chasing gear",
  },
  {
    label: "Healthcare & Aged Care",
    tracks: [
      "PPE stock levels per ward or facility",
      "Shared medical equipment check-out log",
      "Consumable usage tracked by department",
      "Compliance-ready audit trail — always up to date",
    ],
    quote: "\"PPE checks were done on paper. During a compliance audit, we had no reliable records.\"",
    outcome: "Full audit trail updated in real time",
  },
  {
    label: "Hospitality",
    tracks: [
      "Linen & room amenities by venue or floor",
      "Kitchen equipment and utensil inventory",
      "Event hire equipment — issued and returned",
      "Bar & beverage stock with reorder alerts",
    ],
    quote: "\"We kept buying new equipment because we had no idea it was sitting unused in storage.\"",
    outcome: "Idle asset recovery saves $4,000+/year",
  },
];

export function UseCasesSection() {
  const [active, setActive] = useState(0);
  const ind = industries[active];

  return (
    <section id="use-cases" className="py-16 sm:py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: NAVY }}>
              Who it&apos;s for
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-gray-900">
              Built for your{" "}
              <span style={{ color: "#FFD700" }}>industry.</span>
            </h2>
            <p className="mt-4 text-gray-500 text-lg">
              Select your sector to see exactly how trackio fits your operation.
            </p>
          </div>
        </ScrollReveal>

        {/* Industry tabs */}
        <ScrollReveal delay={100}>
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {industries.map((ind, i) => (
              <button
                key={ind.label}
                onClick={() => setActive(i)}
                className="text-sm font-semibold px-5 py-2.5 rounded-full transition-all duration-200"
                style={
                  active === i
                    ? { background: NAVY, color: "#fff", boxShadow: "0 2px 12px rgba(0,47,160,0.25)" }
                    : { background: "#fff", color: "#6b7280", border: "1px solid #e5e7eb" }
                }
              >
                {ind.label}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* Content */}
        <div className="grid lg:grid-cols-2 gap-6 items-start">

          {/* Left — What they track */}
          <div className="bg-white rounded-[24px] border border-gray-100 p-8 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: NAVY }}>
              What {ind.label} teams track
            </p>
            <ul className="space-y-4">
              {ind.tracks.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <svg className="shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="#FFD700" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-sm text-gray-700 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right — Quote + Outcome */}
          <div className="space-y-5">
            {/* Quote */}
            <div className="bg-white rounded-[24px] border border-gray-100 p-8 shadow-sm">
              <svg className="mb-4" width="24" height="18" viewBox="0 0 24 18" fill={NAVY} opacity="0.12">
                <path d="M0 18V11.143C0 4.286 4.571 1.143 13.714 0l1.143 2.286C10.572 3.429 8.286 5.143 7.714 8H11V18H0zm13 0V11.143C13 4.286 17.571 1.143 26.714 0l1.143 2.286C23.572 3.429 21.286 5.143 20.714 8H24V18H13z"/>
              </svg>
              <p className="text-gray-700 italic leading-relaxed text-[15px]">{ind.quote}</p>
            </div>

            {/* Outcome stat */}
            <div className="rounded-[24px] p-7 flex items-center gap-5" style={{ background: NAVY }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,215,0,0.15)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                  <polyline points="16 7 22 7 22 13" />
                </svg>
              </div>
              <p className="text-white font-bold text-base leading-snug">{ind.outcome}</p>
            </div>

            {/* CTA nudge */}
            <a
              href="#cta"
              className="flex items-center justify-between bg-white rounded-[24px] border border-gray-100 px-7 py-5 hover:border-gray-300 hover:shadow-md transition-all duration-200 group shadow-sm"
            >
              <span className="text-sm font-semibold text-gray-900">Start your free 14-day trial</span>
              <svg className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>

        </div>
      </div>
    </section>
  );
}
