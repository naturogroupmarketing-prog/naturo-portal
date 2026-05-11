import { ScrollReveal } from "./scroll-reveal";

const stats = [
  {
    number: "$18,000+",
    unit: "lost per year",
    title: "Equipment walks out the door",
    detail:
      "No clear owner. No return record. Assets disappear — and you find out months later when you need them.",
  },
  {
    number: "3×",
    unit: "slower restocking",
    title: "Stock runs out with no warning",
    detail:
      "Manual checks miss the drop. By the time someone notices, operations are already stalled.",
  },
  {
    number: "6+ hrs",
    unit: "wasted every week",
    title: "Your team is on the phone, not the job",
    detail:
      "Email chains, WhatsApp groups, and spreadsheet hunts — none of it moves the business forward.",
  },
];

export function ValueSection() {
  return (
    <section style={{ background: "#00175A" }} className="py-20 sm:py-28">
      <div className="max-w-6xl mx-auto px-6">

        {/* Header */}
        <ScrollReveal>
          <div className="max-w-2xl mb-16">
            <p className="text-[11px] font-bold uppercase tracking-widest text-blue-400 mb-4">
              Sound familiar?
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
              The cost of doing nothing.
            </h2>
            <p className="mt-4 text-white/40 text-lg leading-relaxed">
              Untracked assets and manual stock management cost Australian service businesses more than most realise.
            </p>
          </div>
        </ScrollReveal>

        {/* Stats — horizontal columns with dividers, no cards */}
        <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
          {stats.map((stat, i) => (
            <ScrollReveal key={stat.title} delay={i * 120}>
              <div className={`py-10 sm:py-0 ${i === 0 ? "sm:pr-12" : i === 1 ? "sm:px-12" : "sm:pl-12"}`}>
                <p className="text-5xl sm:text-6xl font-extrabold text-white leading-none tracking-tight mb-1">
                  {stat.number}
                </p>
                <p className="text-sm font-medium text-blue-300 mb-6">{stat.unit}</p>
                <p className="text-base font-semibold text-white mb-2">{stat.title}</p>
                <p className="text-sm text-white/35 leading-relaxed">{stat.detail}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Bottom rule + callout */}
        <ScrollReveal delay={400}>
          <div className="mt-16 pt-10 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <p className="text-sm text-white/35 max-w-lg leading-relaxed">
              The average service business loses over <strong className="text-white/60 font-semibold">$18,000 a year</strong> to untracked equipment and emergency restocking. trackio pays for itself in weeks.
            </p>
            <a
              href="#pricing"
              className="shrink-0 inline-flex items-center gap-2 text-sm font-bold px-6 py-3 rounded-full whitespace-nowrap"
              style={{ background: "#FFD700", color: "#001A6B" }}
            >
              See pricing
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </ScrollReveal>

      </div>
    </section>
  );
}
