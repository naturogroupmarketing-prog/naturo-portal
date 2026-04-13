export function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Set up your locations",
      description:
        "Add your branches, assign managers, and define the assets and supplies each location needs.",
    },
    {
      number: "02",
      title: "Issue and track items",
      description:
        "Assign equipment to staff, log consumables by location, and track everything with a clear audit trail.",
    },
    {
      number: "03",
      title: "Monitor and restock",
      description:
        "See real-time stock levels, get low-stock alerts, manage returns, and keep every branch accountable.",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs font-semibold text-action-500 uppercase tracking-widest mb-4">
            How It Works
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-shark-900 tracking-tight font-exo leading-tight">
            Up and running in minutes.
          </h2>
          <p className="mt-4 text-shark-400 text-lg">
            No complex setup. No training manuals. Just a clear system that works.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-8 sm:gap-12">
          {steps.map((step, i) => (
            <div key={step.number} className="relative text-center sm:text-left">
              {/* Connector line (desktop only) */}
              {i < steps.length - 1 && (
                <div className="hidden sm:block absolute top-6 left-[calc(50%+40px)] w-[calc(100%-40px)] h-px border-t border-dashed border-shark-200" />
              )}

              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-action-500 text-white text-sm font-bold mb-5 font-exo">
                {step.number}
              </div>
              <h3 className="text-lg font-semibold text-shark-900 mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-shark-400 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
