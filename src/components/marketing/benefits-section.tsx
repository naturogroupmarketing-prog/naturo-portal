import { ScrollReveal } from "./scroll-reveal";

export function BenefitsSection() {
  const benefits = [
    {
      metric: "Up to 40% less equipment loss",
      description: "Every asset has a clear owner, status, and location. Nothing slips through the cracks.",
    },
    {
      metric: "3x faster restocking",
      description: "Automatic low-stock alerts mean you reorder before you run out — not after.",
    },
    {
      metric: "100% accountability",
      description: "Every item, every handover, every return — logged with timestamps and names.",
    },
    {
      metric: "Zero spreadsheet errors",
      description: "Replace manual tracking with a single source of truth your whole team trusts.",
    },
    {
      metric: "All branches, one view",
      description: "See every location's stock, staff, and alerts from a single dashboard.",
    },
    {
      metric: "Real-time operational control",
      description: "Instant visibility into assets, stock levels, damage reports, and open requests.",
    },
  ];

  return (
    <section className="py-14 sm:py-20 lg:py-28 bg-shark-900 text-white">
      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-semibold text-action-300 uppercase tracking-widest mb-4">
              Why trackio
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-exo leading-tight">
              <span className="text-white">The results that </span>
              <span className="bg-gradient-to-r from-action-300 to-indigo-400 bg-clip-text text-transparent">matter.</span>
            </h2>
            <p className="mt-4 text-shark-300 text-lg">
              trackio gives operations teams the visibility and control they&apos;ve been missing.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, i) => (
            <ScrollReveal key={benefit.metric} delay={i * 100}>
            <div
              className="p-6 rounded-xl bg-shark-800/60 border border-shark-700/50 hover:border-shark-600 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 h-full"
            >
              <h3 className="text-base font-semibold text-white mb-2">
                {benefit.metric}
              </h3>
              <p className="text-sm text-shark-400 leading-relaxed">
                {benefit.description}
              </p>
            </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
