export function BenefitsSection() {
  const benefits = [
    {
      metric: "Less equipment loss",
      description: "Every asset has an owner. Nothing slips through the cracks.",
    },
    {
      metric: "Faster restocking",
      description: "Low-stock alerts mean you order before you run out.",
    },
    {
      metric: "Clear accountability",
      description: "Know who has what, when it was issued, and when it's due back.",
    },
    {
      metric: "Fewer manual errors",
      description: "Replace spreadsheets and paper logs with a single source of truth.",
    },
    {
      metric: "Easier branch oversight",
      description: "One dashboard for all locations. No chasing managers for updates.",
    },
    {
      metric: "Stronger operational control",
      description: "Real-time visibility into assets, stock, damage, and requests.",
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
