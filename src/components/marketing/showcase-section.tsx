import Link from "next/link";
import { ScrollReveal } from "./scroll-reveal";

const NAVY = "#002FA0";

const steps = [
  {
    num: "1",
    title: "Add your locations",
    desc: "Set up branches in seconds. Assign managers, set stock thresholds, and organise by state or region. No training required.",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    num: "2",
    title: "Import assets & stock",
    desc: "Add equipment and consumables. Assign items to staff or locations. Import from a spreadsheet in minutes — no manual re-entry.",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    num: "3",
    title: "Your team goes live",
    desc: "Staff check out gear, raise supply requests, and report damage — all from their phone. You see everything from one dashboard.",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    ),
  },
];

export function ShowcaseSection() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-6">

        {/* Header */}
        <ScrollReveal>
          <div className="max-w-2xl mb-20">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: NAVY }}>
              How it works
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-gray-900">
              Up and running in{" "}
              <span style={{ color: "#FFD700" }}>an afternoon.</span>
            </h2>
            <p className="mt-4 text-gray-400 text-lg">
              No complex setup. No IT team. No training manuals. Just a clear system your team will actually use.
            </p>
          </div>
        </ScrollReveal>

        {/* Steps */}
        <div className="relative grid sm:grid-cols-3 gap-0">

          {/* Connector lines — desktop only */}
          <div className="hidden sm:block absolute top-[28px] left-[calc(33.333%+28px)] right-[calc(33.333%+28px)] h-px" style={{ background: "linear-gradient(to right, #e5e7eb, #e5e7eb)" }} />
          <div className="hidden sm:block absolute top-[28px] left-[calc(16.666%+28px)] right-[calc(16.666%+28px)] h-px border-t border-dashed border-gray-200" />

          {steps.map((step, i) => (
            <ScrollReveal key={step.title} delay={i * 150}>
              <div className={`relative pb-12 sm:pb-0 ${i < steps.length - 1 ? "sm:pr-12" : ""} ${i > 0 ? "sm:pl-12" : ""}`}>

                {/* Step number circle */}
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-xl"
                    style={{ background: NAVY }}
                  >
                    {step.num}
                  </div>
                  {/* Mobile connector */}
                  {i < steps.length - 1 && (
                    <div className="sm:hidden flex-1 h-px border-t border-dashed border-gray-200" />
                  )}
                </div>

                {/* Icon */}
                <div className="mb-4" style={{ color: NAVY }}>
                  {step.icon}
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>

                {/* Mobile bottom line */}
                {i < steps.length - 1 && (
                  <div className="sm:hidden absolute bottom-0 left-7 top-[56px] w-px border-l border-dashed border-gray-200" />
                )}
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* CTA */}
        <ScrollReveal delay={500}>
          <div className="mt-16 pt-10 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <p className="text-sm text-gray-400">
              Setup takes under 15 minutes. Most teams are fully live within a day.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-bold px-7 py-3.5 rounded-full text-white transition-all hover:-translate-y-px hover:shadow-lg"
              style={{ background: NAVY }}
            >
              Start your free trial
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </ScrollReveal>

      </div>
    </section>
  );
}
