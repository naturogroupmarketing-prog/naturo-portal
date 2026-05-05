import { ScrollReveal } from "./scroll-reveal";

export function ValueSection() {
  return (
    <section className="py-14 sm:py-20 lg:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs font-semibold text-action-500 uppercase tracking-widest mb-4">
              The Problem
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-exo leading-tight">
              <span className="text-shark-900">Spreadsheets </span>
              <span className="bg-gradient-to-r from-action-500 to-indigo-500 bg-clip-text text-transparent">
                weren&apos;t built
              </span>
              <span className="text-shark-900"> for this.</span>
            </h2>
            <p className="mt-5 text-shark-400 text-lg leading-relaxed max-w-2xl mx-auto">
              The average operations team loses thousands each year to untracked
              equipment and emergency restocking. When no one knows who has what,
              it&apos;s not a people problem &mdash; it&apos;s a system problem.
              trackio replaces the chaos with clarity.
            </p>
          </div>
        </ScrollReveal>

        {/* Pain → Solution cards */}
        <div className="mt-16 grid sm:grid-cols-3 gap-6">
          {[
            {
              pain: "Equipment vanishes without a trace",
              solution: "Every asset tracked with a clear owner, location, and status. Teams report up to 40% less loss.",
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              ),
            },
            {
              pain: "Stock runs out — nobody noticed",
              solution: "Real-time stock levels by location with automatic alerts. Restock 3x faster with proactive notifications.",
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              ),
            },
            {
              pain: "Nobody knows who had it last",
              solution: "Every issue, return, and handover logged and visible. Full audit trail means zero finger-pointing.",
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              ),
            },
          ].map((card, i) => (
            <ScrollReveal key={card.pain} delay={i * 150}>
              <div
                className="bg-shark-50/50 dark:bg-shark-800/50 rounded-xl p-7 border border-shark-100 dark:border-shark-800/80 hover:border-shark-200 hover:-translate-y-1 hover:shadow-md transition-all duration-300 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-action-50 flex items-center justify-center text-action-500 mb-5">
                  {card.icon}
                </div>
                <h3 className="text-base font-semibold text-shark-900 mb-2">
                  {card.pain}
                </h3>
                <p className="text-sm text-shark-400 leading-relaxed">
                  {card.solution}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
