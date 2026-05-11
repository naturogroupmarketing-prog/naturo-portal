import { ScrollReveal } from "./scroll-reveal";

const NAVY = "#002FA0";

const pains = [
  {
    stat: "$18,000+",
    statLabel: "lost per year",
    pain: "Equipment walks out the door",
    solution: "Every asset has a clear owner, location, and status — tracked from issue to return. Teams report 40% less equipment loss within 90 days.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
      </svg>
    ),
  },
  {
    stat: "3× slower",
    statLabel: "restocking",
    pain: "Stock runs out — nobody saw it coming",
    solution: "Real-time stock levels across every location. Auto-alerts before you run out. Restock 3× faster with proactive low-stock notifications.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
  {
    stat: "6+ hrs/week",
    statLabel: "wasted on admin",
    pain: "Your team is on the phone instead of on the job",
    solution: "Replace email chains, WhatsApp groups, and spreadsheet hunts with a single dashboard. Every request, return, and handover — done in seconds.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
];

export function ValueSection() {
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal>
          <div className="max-w-3xl mx-auto text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: NAVY }}>
              Sound familiar?
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-gray-900">
              Your current system{" "}
              <span style={{ color: "#FFD700" }}>is costing you</span>{" "}
              more than you think.
            </h2>
            <p className="mt-5 text-gray-500 text-lg leading-relaxed max-w-2xl mx-auto">
              Whether you&apos;re running spreadsheets, paper logs, or an app your team hates — untracked assets and missing stock add up fast.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid sm:grid-cols-3 gap-6">
          {pains.map((item, i) => (
            <ScrollReveal key={item.pain} delay={i * 120}>
              <div className="relative bg-white rounded-[24px] border border-gray-100 hover:border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden h-full">
                {/* Top accent */}
                <div className="h-1 w-full" style={{ background: NAVY }} />

                <div className="p-7">
                  {/* Cost stat */}
                  <div className="flex items-baseline gap-1.5 mb-4">
                    <span className="text-3xl font-extrabold" style={{ color: "#DC2626" }}>{item.stat}</span>
                    <span className="text-sm text-gray-400 font-medium">{item.statLabel}</span>
                  </div>

                  {/* Icon + pain */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(0,47,160,0.07)", color: NAVY }}>
                      {item.icon}
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 leading-snug pt-1.5">{item.pain}</h3>
                  </div>

                  {/* Solution */}
                  <p className="text-sm text-gray-500 leading-relaxed">{item.solution}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Bottom callout */}
        <ScrollReveal delay={400}>
          <div className="mt-10 rounded-[20px] border border-gray-100 bg-gray-50 px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600 max-w-lg">
              <span className="font-bold text-gray-900">The average service business</span> loses over $18,000 a year to untracked equipment and emergency restocking. trackio pays for itself in weeks.
            </p>
            <a
              href="#pricing"
              className="shrink-0 inline-flex items-center gap-2 text-sm font-bold px-6 py-3 rounded-full transition-all hover:opacity-90"
              style={{ background: NAVY, color: "#fff" }}
            >
              See pricing
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
