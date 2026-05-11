import { ScrollReveal } from "./scroll-reveal";

const NAVY = "#002FA0";

type Mark = "yes" | "no" | "partial";

const rows: { feature: string; sheet: Mark; other: Mark; trackio: Mark }[] = [
  { feature: "Real-time low-stock alerts",     sheet: "no",      other: "no",      trackio: "yes" },
  { feature: "Multi-location dashboard",       sheet: "no",      other: "partial", trackio: "yes" },
  { feature: "Asset check-out with owner log", sheet: "no",      other: "partial", trackio: "yes" },
  { feature: "Damage reporting & photos",      sheet: "no",      other: "no",      trackio: "yes" },
  { feature: "Mobile app for field staff",     sheet: "no",      other: "yes",     trackio: "yes" },
  { feature: "Request & approval workflow",    sheet: "no",      other: "no",      trackio: "yes" },
  { feature: "Australian-based support",       sheet: "no",      other: "no",      trackio: "yes" },
  { feature: "Setup in under 15 minutes",      sheet: "partial", other: "no",      trackio: "yes" },
  { feature: "Starts at $0 — no lock-in",      sheet: "yes",     other: "no",      trackio: "yes" },
];

function MarkIcon({ type, gold = false }: { type: Mark; gold?: boolean }) {
  if (type === "yes") {
    return (
      <span className="flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke={gold ? "#FFD700" : "#86efac"} strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
    );
  }
  if (type === "partial") {
    return (
      <span className="flex items-center justify-center">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="#d1d5db" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </span>
    );
  }
  return (
    <span className="flex items-center justify-center">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="#e5e7eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </span>
  );
}

export function FeaturesSection() {
  const colWidth = "w-[110px] sm:w-[130px]";

  return (
    <section id="features" className="py-16 sm:py-24 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: NAVY }}>
              How we compare
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-gray-900">
              See how we{" "}
              <span style={{ color: "#FFD700" }}>stack up.</span>
            </h2>
            <p className="mt-4 text-gray-500 text-lg">
              Most teams are still tracking with tools that weren&apos;t built for this work.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div className="overflow-x-auto -mx-2">
            <div className="min-w-[500px] px-2">

              {/* Header */}
              <div className="flex items-end gap-0 mb-0">
                <div className="flex-1 pr-4" />
                <div className={`${colWidth} text-center pb-3 px-2`}>
                  <p className="text-xs font-semibold text-gray-500">Spreadsheets</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Excel / Sheets</p>
                </div>
                <div className={`${colWidth} text-center pb-3 px-2`}>
                  <p className="text-xs font-semibold text-gray-500">Other apps</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">ServiceM8 · Simpro</p>
                </div>
                <div className={`${colWidth} px-2`}>
                  <div className="rounded-t-2xl px-3 pt-4 pb-3 text-center" style={{ background: NAVY }}>
                    <p className="text-sm font-bold text-white">trackio</p>
                    <p className="text-[10px] text-blue-300 mt-0.5">Built for service teams</p>
                  </div>
                </div>
              </div>

              {/* Rows */}
              {rows.map((row, i) => (
                <div key={row.feature} className={`flex items-center gap-0 ${i % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
                  <div className="flex-1 pr-4 py-3.5 pl-3 text-sm text-gray-700 font-medium">{row.feature}</div>
                  <div className={`${colWidth} py-3.5 px-2`}>
                    <MarkIcon type={row.sheet} />
                  </div>
                  <div className={`${colWidth} py-3.5 px-2`}>
                    <MarkIcon type={row.other} />
                  </div>
                  <div className={`${colWidth} py-3.5 px-2`} style={{ background: "rgba(0,47,160,0.06)" }}>
                    <MarkIcon type={row.trackio} gold />
                  </div>
                </div>
              ))}

              {/* Footer CTA */}
              <div className="flex items-center gap-0">
                <div className="flex-1 pr-4 py-4 pl-3 text-xs text-gray-400 italic">
                  14-day free trial · no credit card required
                </div>
                <div className={`${colWidth} px-2`} />
                <div className={`${colWidth} px-2`} />
                <div className={`${colWidth} px-2`}>
                  <div className="rounded-b-2xl px-3 pb-4 pt-3" style={{ background: NAVY }}>
                    <a
                      href="#cta"
                      className="block text-center text-[11px] font-bold py-2 rounded-full"
                      style={{ background: "#FFD700", color: "#001A6B" }}
                    >
                      Start Free Trial →
                    </a>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
