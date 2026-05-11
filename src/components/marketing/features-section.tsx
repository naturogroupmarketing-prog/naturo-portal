import Link from "next/link";
import { ScrollReveal } from "./scroll-reveal";

const BLUE = "#001b94";
const YELLOW = "#ffe344";

type CellType = "x" | "dash" | "green-check" | "navy-check" | "cta";

const rows: { feature: string; sheet: CellType; other: CellType; trackio: CellType }[] = [
  { feature: "Real-time low stock alerts",     sheet: "x",           other: "x",           trackio: "navy-check" },
  { feature: "Multi-location dashboard",       sheet: "x",           other: "dash",        trackio: "navy-check" },
  { feature: "Asset check-out with owner log", sheet: "x",           other: "dash",        trackio: "navy-check" },
  { feature: "Damage reporting & photos",      sheet: "x",           other: "dash",        trackio: "navy-check" },
  { feature: "Mobile app for field staff",     sheet: "x",           other: "green-check", trackio: "navy-check" },
  { feature: "Request & approval workflow",    sheet: "x",           other: "dash",        trackio: "navy-check" },
  { feature: "Australian-based support",       sheet: "x",           other: "dash",        trackio: "navy-check" },
  { feature: "Setup in under 15 minutes",      sheet: "x",           other: "dash",        trackio: "navy-check" },
  { feature: "Starts at $0 — no lock-in",      sheet: "green-check", other: "dash",        trackio: "cta" },
];

function XMark() {
  return (
    <svg className="w-6 h-6 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function GreenCheck() {
  return (
    <svg className="w-6 h-6 mx-auto text-green-600" fill="currentColor" viewBox="0 0 20 20">
      <path
        clipRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        fillRule="evenodd"
      />
    </svg>
  );
}

function NavyCheck() {
  return (
    <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20" style={{ color: BLUE }}>
      <path
        clipRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        fillRule="evenodd"
      />
    </svg>
  );
}

function renderCell(type: CellType) {
  if (type === "x") return <XMark />;
  if (type === "green-check") return <GreenCheck />;
  if (type === "navy-check") return <NavyCheck />;
  if (type === "dash") return <span className="text-gray-300 font-bold text-xl">—</span>;
  if (type === "cta") {
    return (
      <Link
        href="/login"
        className="block font-bold px-6 py-4 text-center hover:bg-yellow-400 transition-colors"
        style={{ background: YELLOW, color: BLUE, borderRadius: "24px" }}
      >
        Start free trial →
      </Link>
    );
  }
}

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-6 bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto">

        <ScrollReveal>
          <div className="md:text-left text-center mb-16">
            <p className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: BLUE }}>
              How We Compare
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-[#191c1f] leading-tight">
              See how we stack up.
            </h2>
            <p className="text-gray-700 text-xl font-light">
              Most teams are still tracking with tools that weren&apos;t built for this work.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div
            className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
            style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[640px]">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="p-8 bg-white w-[40%]" />
                    <th className="p-8 bg-[#f4f5f8] text-center w-[20%] font-bold text-gray-800 border-l border-gray-200">
                      Spreadsheets
                      <span className="text-sm font-normal text-gray-500 mt-2 block">(Excel, Sheets)</span>
                    </th>
                    <th className="p-8 bg-[#f4f5f8] text-center w-[20%] font-bold text-gray-800 border-l border-gray-200">
                      Other apps
                      <span className="text-sm font-normal text-gray-500 mt-2 block">(ServiceM8, Simpro)</span>
                    </th>
                    <th
                      className="p-8 text-white text-center w-[20%] border-l"
                      style={{ background: BLUE, borderColor: BLUE }}
                    >
                      <div className="font-bold text-2xl mb-2">trackio</div>
                      <div className="text-sm font-medium text-blue-200">Built for service teams</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="text-lg font-light">
                  {rows.map((row, i) => (
                    <tr
                      key={row.feature}
                      className={`border-b border-gray-200 transition-colors ${
                        i < rows.length - 1 ? "hover:bg-gray-50" : "bg-gray-50/50"
                      }`}
                    >
                      <td className="p-6 pl-10 font-medium text-[#191c1f]">{row.feature}</td>
                      <td className="p-6 text-center border-l border-gray-200">
                        {renderCell(row.sheet)}
                      </td>
                      <td className="p-6 text-center border-l border-gray-200">
                        {renderCell(row.other)}
                      </td>
                      <td
                        className={`p-6 text-center border-l border-gray-200 ${
                          row.trackio === "cta" ? "bg-blue-50/50" : "bg-blue-50/20"
                        }`}
                      >
                        {renderCell(row.trackio)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-center mt-8 text-base text-gray-500 font-medium">
            14-day free trial — No credit card required
          </p>
        </ScrollReveal>

      </div>
    </section>
  );
}
