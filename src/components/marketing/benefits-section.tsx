import { ScrollReveal } from "./scroll-reveal";

const NAVY = "#002FA0";

const benefits = [
  { metric: "Up to 40% less equipment loss", description: "Every asset has a clear owner, status, and location. Nothing slips through the cracks." },
  { metric: "3× faster restocking", description: "Automatic low-stock alerts mean you reorder before you run out — not after." },
  { metric: "100% accountability", description: "Every item, every handover, every return — logged with timestamps and names." },
  { metric: "Zero spreadsheet errors", description: "Replace manual tracking with a single source of truth your whole team trusts." },
  { metric: "All branches, one view", description: "See every location's stock, staff, and alerts from a single dashboard." },
  { metric: "Real-time operational control", description: "Instant visibility into assets, stock levels, damage reports, and open requests." },
];

export function BenefitsSection() {
  return (
    <section className="py-16 sm:py-24" style={{ background: "#001575" }}>
      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-bold text-action-300 uppercase tracking-widest mb-4">
              Why teams switch to trackio
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-white">
              The results that{" "}
              <span style={{ color: "#FFD700" }}>actually matter.</span>
            </h2>
            <p className="mt-4 text-white/50 text-lg">
              trackio gives operations teams the visibility and control they&apos;ve been missing.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {benefits.map((benefit, i) => (
            <ScrollReveal key={benefit.metric} delay={i * 100}>
              <div className="p-6 rounded-[20px] border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 h-full">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-5 h-5 mt-0.5 shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold text-white">{benefit.metric}</h3>
                </div>
                <p className="text-sm text-white/50 leading-relaxed pl-8">{benefit.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
