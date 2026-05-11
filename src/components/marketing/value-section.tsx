import { ScrollReveal } from "./scroll-reveal";

const BLUE = "#001b94";
const YELLOW = "#ffe344";

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
    <section
      className="py-24 px-6 border-b border-gray-200 text-[#191c1f]"
      style={{ background: "#f4f5f8" }}
    >
      <div className="max-w-7xl mx-auto">

        <ScrollReveal>
          <div className="mb-16">
            <p className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: BLUE }}>
              Sound Familiar?
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
              The cost of doing nothing.
            </h2>
            <p className="text-gray-700 max-w-3xl text-xl leading-relaxed font-light">
              Untracked assets and manual stock management cost Australian service businesses more than most realise.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {stats.map((stat, i) => (
            <ScrollReveal key={stat.title} delay={i * 100}>
              <div
                className="bg-white p-10 rounded-lg border border-gray-100 hover:shadow-lg transition-shadow"
                style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
              >
                <div className="text-5xl font-bold mb-3" style={{ color: BLUE }}>
                  {stat.number}
                </div>
                <div className="text-xs font-bold text-gray-500 mb-6 uppercase tracking-widest">
                  {stat.unit}
                </div>
                <h4 className="font-bold text-2xl mb-4 leading-snug">{stat.title}</h4>
                <p className="text-gray-600 leading-relaxed text-lg font-light">{stat.detail}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={350}>
          <div
            className="bg-white p-10 rounded-lg border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-10"
            style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
          >
            <p className="text-xl text-gray-700 max-w-3xl font-light leading-relaxed">
              The average service business loses over{" "}
              <strong className="text-[#191c1f] font-bold">$18,000 a year</strong> to untracked equipment and
              emergency restocking. trackio pays for itself in weeks.
            </p>
            <a
              href="#pricing"
              className="shrink-0 inline-flex items-center gap-2 font-bold px-10 py-4 whitespace-nowrap text-lg hover:bg-yellow-400 transition-colors shadow-sm"
              style={{ background: YELLOW, color: BLUE, borderRadius: "24px" }}
            >
              See pricing →
            </a>
          </div>
        </ScrollReveal>

      </div>
    </section>
  );
}
