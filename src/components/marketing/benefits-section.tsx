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
      description: "See every location's inventory, staff, and alerts from a single dashboard.",
    },
    {
      metric: "Real-time operational control",
      description: "Instant visibility into assets, stock levels, damage reports, and open requests.",
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-shark-900 text-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs font-semibold text-action-300 uppercase tracking-widest mb-4">
            Why Trackio
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-exo leading-tight">
            The results that matter.
          </h2>
          <p className="mt-4 text-shark-300 text-lg">
            Trackio gives operations teams the visibility and control they&apos;ve been missing.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit) => (
            <div
              key={benefit.metric}
              className="p-6 rounded-2xl bg-shark-800/60 border border-shark-700/50 hover:border-shark-600 transition-colors"
            >
              <h3 className="text-base font-semibold text-white mb-2">
                {benefit.metric}
              </h3>
              <p className="text-sm text-shark-400 leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
