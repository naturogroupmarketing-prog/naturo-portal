import Link from "next/link";
import { ScrollReveal } from "./scroll-reveal";

const BLUE = "#001b94";

const steps = [
  {
    num: "1",
    title: "Add your locations",
    desc: "Set up branches in seconds. Assign managers, set stock thresholds, and organise by state or region. No training required.",
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    num: "2",
    title: "Import assets & stock",
    desc: "Add equipment and consumables. Assign items to staff or locations. Import from a spreadsheet in minutes — no manual re-entry.",
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    num: "3",
    title: "Your team goes live",
    desc: "Staff check out gear, raise supply requests, and report damage — all from their phone. You see everything from one dashboard.",
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
];

export function ShowcaseSection() {
  return (
    <section
      id="how-it-works"
      className="py-24 px-6 border-b border-gray-200"
      style={{ background: "#f4f5f8" }}
    >
      <div className="max-w-6xl mx-auto">

        <ScrollReveal>
          <div className="text-center md:text-left mb-16 max-w-4xl">
            <p className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: BLUE }}>
              How It Works
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-[#191c1f] leading-tight">
              Up and running in an afternoon.
            </h2>
            <p className="text-gray-700 text-xl font-light">
              No complex setup. No IT team. No training manuals. Just a clear system your team will actually use.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-10">
          {steps.map((step, i) => (
            <ScrollReveal key={step.title} delay={i * 150}>
              {/* mt-8 gives space for the floating circle that hangs above */}
              <div
                className="bg-white p-10 rounded-2xl border border-gray-100 flex flex-col items-center text-center relative mt-8"
                style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
              >
                {/* Floating numbered circle */}
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl mb-8 shadow-md absolute -top-8 border-4 border-white text-white"
                  style={{ background: BLUE }}
                >
                  {step.num}
                </div>

                {/* Icon with light blue circle bg */}
                <div
                  className="mb-8 mt-6 p-6 rounded-full"
                  style={{ color: BLUE, background: "rgba(0,27,148,0.06)" }}
                >
                  {step.icon}
                </div>

                <h3 className="text-2xl font-bold mb-4 text-[#191c1f]">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed text-lg font-light">{step.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={500}>
          <div
            className="mt-16 bg-white p-10 rounded-2xl border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-8"
            style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
          >
            <p className="text-gray-700 text-xl font-light">
              Setup takes under 15 minutes. Most teams are fully live within a day.
            </p>
            <Link
              href="/login"
              className="font-bold px-10 py-4 text-white hover:bg-blue-900 transition-colors whitespace-nowrap text-lg shrink-0"
              style={{ background: BLUE, borderRadius: "24px" }}
            >
              Start your free trial →
            </Link>
          </div>
        </ScrollReveal>

      </div>
    </section>
  );
}
