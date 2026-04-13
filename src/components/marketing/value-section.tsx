export function ValueSection() {
  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold text-action-500 uppercase tracking-widest mb-4">
            The Problem
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-shark-900 tracking-tight font-exo leading-tight">
            Spreadsheets weren&apos;t built for this.
          </h2>
          <p className="mt-5 text-shark-400 text-lg leading-relaxed max-w-2xl mx-auto">
            When equipment goes missing, stock runs out without warning, and no
            one knows who has what &mdash; the problem isn&apos;t your team. It&apos;s
            the system. Trackio replaces the chaos with clarity.
          </p>
        </div>

        {/* Pain → Solution cards */}
        <div className="mt-16 grid sm:grid-cols-3 gap-6">
          {[
            {
              pain: "Items go missing",
              solution: "Every asset tracked with a clear owner, location, and status.",
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              ),
            },
            {
              pain: "Stock runs out silently",
              solution: "Real-time stock levels by location with low-stock alerts.",
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              ),
            },
            {
              pain: "No one is accountable",
              solution: "Every issue, return, and handover logged and visible.",
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              ),
            },
          ].map((card) => (
            <div
              key={card.pain}
              className="bg-shark-50/50 rounded-2xl p-7 border border-shark-100/80 hover:border-shark-200 transition-colors"
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
          ))}
        </div>
      </div>
    </section>
  );
}
