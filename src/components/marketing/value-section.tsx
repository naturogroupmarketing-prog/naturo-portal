import { ScrollReveal } from "./scroll-reveal";

const BLUE = "#003DB8";
const YELLOW = "#ffe344";

function IllustrationLostEquipment() {
  return (
    <svg width="220" height="140" viewBox="0 0 220 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Floor */}
      <ellipse cx="110" cy="128" rx="90" ry="10" fill="rgba(255,255,255,0.08)" />
      {/* Tool box */}
      <rect x="30" y="70" width="72" height="52" rx="8" fill="rgba(255,255,255,0.15)" />
      <rect x="30" y="70" width="72" height="16" rx="8" fill="rgba(255,255,255,0.22)" />
      <rect x="54" y="63" width="24" height="12" rx="4" fill="rgba(255,255,255,0.20)" />
      <rect x="44" y="94" width="44" height="6" rx="3" fill="rgba(255,255,255,0.12)" />
      <rect x="44" y="106" width="30" height="6" rx="3" fill="rgba(255,255,255,0.10)" />
      {/* Question mark bubble */}
      <circle cx="158" cy="54" r="36" fill="rgba(255,255,255,0.12)" />
      <circle cx="158" cy="54" r="28" fill="rgba(255,255,255,0.15)" />
      <text x="158" y="62" textAnchor="middle" fontSize="28" fontWeight="bold" fill="rgba(255,255,255,0.80)" fontFamily="sans-serif">?</text>
      {/* Dotted line from box to bubble */}
      <line x1="102" y1="90" x2="130" y2="70" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeDasharray="4 4" />
      {/* Small tools scattered */}
      <rect x="130" y="100" width="18" height="6" rx="3" fill="rgba(255,255,255,0.20)" transform="rotate(-20 130 100)" />
      <rect x="155" y="108" width="22" height="5" rx="2.5" fill="rgba(255,255,255,0.15)" transform="rotate(10 155 108)" />
    </svg>
  );
}

function IllustrationStockWarning() {
  return (
    <svg width="200" height="140" viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shelf */}
      <rect x="20" y="110" width="160" height="8" rx="4" fill="#e5e7eb" />
      <rect x="20" y="60" width="160" height="8" rx="4" fill="#e5e7eb" />
      {/* Boxes on shelf */}
      <rect x="30" y="68" width="28" height="42" rx="4" fill="#bfdbfe" />
      <rect x="64" y="68" width="28" height="42" rx="4" fill="#bfdbfe" />
      {/* Empty slots */}
      <rect x="98" y="68" width="28" height="42" rx="4" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1.5" strokeDasharray="4 3" />
      <rect x="132" y="68" width="28" height="42" rx="4" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1.5" strokeDasharray="4 3" />
      {/* Warning triangle */}
      <path d="M100 14 L126 56 L74 56 Z" fill="#fef08a" stroke="#fde047" strokeWidth="2" />
      <text x="100" y="48" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#713f12" fontFamily="sans-serif">!</text>
      {/* Shelf supports */}
      <rect x="22" y="60" width="6" height="58" rx="3" fill="#d1d5db" />
      <rect x="172" y="60" width="6" height="58" rx="3" fill="#d1d5db" />
    </svg>
  );
}

function IllustrationPhoneChain() {
  return (
    <svg width="200" height="140" viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Phone */}
      <rect x="72" y="30" width="56" height="96" rx="12" fill="#1e3a8a" />
      <rect x="76" y="34" width="48" height="80" rx="9" fill="#dbeafe" />
      <circle cx="100" cy="122" r="4" fill="#60a5fa" />
      {/* Chat bubbles on screen */}
      <rect x="82" y="42" width="30" height="10" rx="5" fill="#3b82f6" />
      <rect x="86" y="56" width="22" height="10" rx="5" fill="#93c5fd" />
      <rect x="82" y="70" width="28" height="10" rx="5" fill="#3b82f6" />
      <rect x="86" y="84" width="20" height="10" rx="5" fill="#93c5fd" />
      {/* Left person */}
      <circle cx="30" cy="55" r="14" fill="#dbeafe" />
      <circle cx="30" cy="47" r="6" fill="#93c5fd" />
      <path d="M18 68 Q30 62 42 68" stroke="#93c5fd" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Left chat bubble */}
      <rect x="42" y="44" width="22" height="12" rx="6" fill="#3b82f6" />
      <polygon points="42,50 36,54 42,56" fill="#3b82f6" />
      {/* Right person */}
      <circle cx="170" cy="55" r="14" fill="#dbeafe" />
      <circle cx="170" cy="47" r="6" fill="#93c5fd" />
      <path d="M158 68 Q170 62 182 68" stroke="#93c5fd" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Right chat bubble */}
      <rect x="136" y="44" width="22" height="12" rx="6" fill="#93c5fd" />
      <polygon points="158,50 164,54 158,56" fill="#93c5fd" />
    </svg>
  );
}

export function ValueSection() {
  return (
    <section className="py-16 sm:py-24 px-6 border-b border-shark-200 bg-white text-[#191c1f]">
      <div className="max-w-6xl mx-auto">

        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight">
              The cost of doing nothing.
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid lg:grid-cols-3 gap-6 mb-10">

          {/* Card 1 — Navy highlight */}
          <ScrollReveal>
            <div
              className="relative rounded-2xl overflow-hidden flex flex-col h-full"
              style={{
                background: BLUE,
                minHeight: "460px",
              }}
            >
              {/* Bottom-right corner glow */}
              <div
                className="absolute pointer-events-none"
                style={{
                  bottom: 0,
                  right: 0,
                  width: "260px",
                  height: "260px",
                  background: "radial-gradient(circle at 100% 100%, #4DAAFF 0%, #2580E8 35%, transparent 72%)",
                  opacity: 0.72,
                }}
              />
              <div className="p-8 sm:p-10 flex-1 flex flex-col">
                <h3 className="text-2xl font-bold text-white leading-snug mb-5">
                  $18,000+ lost to equipment you can&apos;t account for
                </h3>
                <p className="text-white/70 leading-relaxed text-lg mb-8 flex-1">
                  No clear owner. No return record. Assets disappear — and you find out months later when you need them.
                </p>
                <a
                  href="#pricing"
                  className="font-bold text-white flex items-center gap-1 hover:opacity-80 transition-opacity text-base"
                >
                  See how trackio fixes this →
                </a>
              </div>
              <div className="flex justify-center pb-6 pt-2 px-6">
                <IllustrationLostEquipment />
              </div>
            </div>
          </ScrollReveal>

          {/* Card 2 — White */}
          <ScrollReveal delay={100}>
            <div
              className="rounded-2xl border border-shark-200 overflow-hidden flex flex-col h-full bg-white"
              style={{ minHeight: "460px" }}
            >
              <div className="p-8 sm:p-10 flex-1 flex flex-col">
                <h3 className="text-2xl font-bold text-[#191c1f] leading-snug mb-5">
                  Stock runs out with no warning
                </h3>
                <p className="text-shark-500 leading-relaxed text-lg mb-8 flex-1">
                  Manual checks miss the drop. By the time someone notices, operations are already stalled.
                </p>
                <a
                  href="#pricing"
                  className="font-bold flex items-center gap-1 hover:opacity-80 transition-opacity text-base"
                  style={{ color: BLUE }}
                >
                  3× slower restocking →
                </a>
              </div>
              <div className="flex justify-center pb-6 pt-2 px-6">
                <IllustrationStockWarning />
              </div>
            </div>
          </ScrollReveal>

          {/* Card 3 — White */}
          <ScrollReveal delay={200}>
            <div
              className="rounded-2xl border border-shark-200 overflow-hidden flex flex-col h-full bg-white"
              style={{ minHeight: "460px" }}
            >
              <div className="p-8 sm:p-10 flex-1 flex flex-col">
                <h3 className="text-2xl font-bold text-[#191c1f] leading-snug mb-5">
                  Your team is on the phone, not the job
                </h3>
                <p className="text-shark-500 leading-relaxed text-lg mb-8 flex-1">
                  Email chains, WhatsApp groups, and spreadsheet hunts — none of it moves the business forward.
                </p>
                <a
                  href="#pricing"
                  className="font-bold flex items-center gap-1 hover:opacity-80 transition-opacity text-base"
                  style={{ color: BLUE }}
                >
                  6+ hrs wasted every week →
                </a>
              </div>
              <div className="flex justify-center pb-6 pt-2 px-6">
                <IllustrationPhoneChain />
              </div>
            </div>
          </ScrollReveal>

        </div>

        <ScrollReveal delay={300}>
          <div
            className="bg-white p-6 sm:p-8 md:p-10 rounded-2xl border border-shark-100 flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-10"
            style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}
          >
            <p className="text-xl text-shark-700 max-w-3xl font-light leading-relaxed">
              The average service business loses over{" "}
              <strong className="text-[#191c1f] font-bold">$18,000 a year</strong> to untracked equipment and
              emergency restocking. trackio pays for itself in weeks.
            </p>
            <a
              href="#pricing"
              className="shrink-0 inline-flex items-center gap-2 font-bold px-8 sm:px-10 py-3.5 sm:py-4 whitespace-nowrap text-base sm:text-lg hover:bg-yellow-400 transition-colors shadow-sm"
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
