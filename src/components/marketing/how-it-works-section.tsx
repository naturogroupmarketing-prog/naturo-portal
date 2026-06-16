import Link from "next/link";
import { ScrollReveal } from "./scroll-reveal";

export function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Set up your locations",
      description: "Add your branches, assign managers, and define the assets and supplies each location needs.",
    },
    {
      number: "02",
      title: "Issue and track items",
      description: "Assign equipment to staff, log consumables by location, and track everything with a clear audit trail.",
    },
    {
      number: "03",
      title: "Monitor and restock",
      description: "See real-time stock levels, get low-stock alerts, manage returns, and keep every branch accountable.",
    },
  ];

  return (
    <section id="how-it-works" className="py-14 sm:py-20 lg:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#002FA0" }}>
              How It Works
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight" style={{ color: "#111827" }}>
              Up and running{" "}
              <span style={{ color: "#FFD700" }}>in minutes.</span>
            </h2>
            <p className="mt-4 text-shark-500 text-lg">
              No complex setup. No training manuals. Just a clear system that works.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid sm:grid-cols-3 gap-8 sm:gap-12">
          {steps.map((step, i) => (
            <ScrollReveal key={step.number} delay={i * 200}>
              <div className="relative text-center sm:text-left">
                {i < steps.length - 1 && (
                  <div className="hidden sm:block absolute top-6 left-[calc(50%+40px)] w-[calc(100%-40px)] h-px border-t border-dashed border-shark-200" />
                )}
                <div
                  className="inline-flex items-center justify-center w-12 h-12 rounded-[20px] text-white text-sm font-bold mb-5"
                  style={{ background: "linear-gradient(135deg, #002FA0 0%, #0055DD 100%)" }}
                >
                  {step.number}
                </div>
                <h3 className="text-lg font-semibold text-shark-900 mb-2">{step.title}</h3>
                <p className="text-sm text-shark-400 leading-relaxed">{step.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <div className="mt-14 text-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center text-sm font-semibold text-white px-8 py-3.5 rounded-full transition-all hover:-translate-y-px hover:shadow-lg active:scale-[0.97]"
            style={{ background: "#1432CC", boxShadow: "0 4px 20px rgba(20,50,204,0.30)" }}
          >
            Start Your Free Trial
            <svg className="ml-2 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
          <p className="mt-3 text-xs text-shark-300">
            Up and running in under 15 minutes. No credit card required.
          </p>
        </div>
      </div>
    </section>
  );
}
