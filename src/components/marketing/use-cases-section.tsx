"use client";

import { useState } from "react";
import { ScrollReveal } from "./scroll-reveal";

const BLUE = "#001b94";
const YELLOW = "#ffe344";

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
    <section id="use-cases" className="py-24 px-6 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto">

        <ScrollReveal>
          <div className="text-center md:text-left mb-16">
            <p className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: BLUE }}>
              Who It&apos;s For
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-[#191c1f] leading-tight">
              Built for your industry.
            </h2>
            <p className="text-gray-700 mb-0 text-xl font-light">
              Select your sector to see exactly how trackio fits your operation.
            </p>
          </div>
        </ScrollReveal>

        {/* Industry Tabs */}
        <div className="flex flex-wrap gap-4 mb-12 md:justify-start justify-center">
          {industries.map((industry, i) => (
            <button
              key={industry.label}
              onClick={() => setActive(i)}
              className="px-8 py-3 font-bold text-base transition-all"
              style={{
                borderRadius: "24px",
                border: "2px solid",
                ...(active === i
                  ? { background: BLUE, color: "#fff", borderColor: BLUE }
                  : { background: "#fff", color: BLUE, borderColor: "#e5e7eb" }),
              }}
            >
              {industry.label}
            </button>
          ))}
        </div>

        {/* Content Card */}
        <div className="bg-[#f4f5f8] rounded-2xl p-10 sm:p-12 grid md:grid-cols-2 gap-12 md:gap-16 items-start">

          {/* Left — What they track */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-widest text-gray-500 mb-8">
              What {ind.label} Teams Track
            </h4>
            <ul className="space-y-6">
              {ind.tracks.map((item) => (
                <li key={item} className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-1">
                    <svg
                      className="w-4 h-4 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                    </svg>
                  </div>
                  <span className="text-gray-800 font-medium text-xl leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right — Quote + Outcome + CTA */}
          <div className="space-y-8">
            <blockquote
              className="bg-white p-8 rounded-2xl italic text-gray-800 text-xl font-light border-l-4"
              style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)", borderLeftColor: BLUE }}
            >
              {ind.quote}
            </blockquote>

            <div
              className="text-white p-8 rounded-2xl flex items-center gap-6 shadow-md"
              style={{ background: BLUE }}
            >
              <div className="p-5 rounded-lg shrink-0" style={{ background: "rgba(255,255,255,0.1)" }}>
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <div className="font-bold text-2xl leading-tight">{ind.outcome}</div>
            </div>

            <a
              href="/login"
              className="block text-center border-2 py-4 font-bold hover:bg-gray-50 transition-colors text-lg"
              style={{ borderColor: BLUE, color: BLUE, borderRadius: "24px" }}
            >
              Start your free 14-day trial →
            </a>
          </div>

        </div>
      </div>
    </section>
  );
}
