import Link from "next/link";
import { ScrollReveal } from "./scroll-reveal";

const cases = [
  {
    title: "Cleaning & Facilities.",
    description:
      "Track vacuums, mops, chemicals, and cleaning supplies across multiple sites. Know exactly what's at each location before the day starts.",
    href: "/login",
    cta: "See how cleaning teams use trackio ›",
    shape: (
      <svg viewBox="0 0 220 180" fill="none" className="w-full h-full" preserveAspectRatio="xMaxYMax meet">
        <defs>
          <linearGradient id="g1a" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <polygon points="220,0 220,180 40,180" fill="url(#g1a)" opacity="0.15" />
        <polygon points="220,30 220,180 90,180" fill="url(#g1a)" opacity="0.25" />
        <polygon points="220,70 220,180 140,180" fill="url(#g1a)" opacity="0.5" />
      </svg>
    ),
  },
  {
    title: "Multi-Branch Operations.",
    description:
      "Businesses with multiple offices or branches that need centralised asset oversight. One view, every site, real-time.",
    href: "/login",
    cta: "See how multi-site teams use trackio ›",
    shape: (
      <svg viewBox="0 0 220 180" fill="none" className="w-full h-full" preserveAspectRatio="xMaxYMax meet">
        <defs>
          <linearGradient id="g2a" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>
        <polygon points="220,0 220,180 40,180" fill="url(#g2a)" opacity="0.15" />
        <polygon points="220,30 220,180 90,180" fill="url(#g2a)" opacity="0.25" />
        <polygon points="220,70 220,180 140,180" fill="url(#g2a)" opacity="0.5" />
      </svg>
    ),
  },
  {
    title: "Field Service Teams.",
    description:
      "Equip mobile teams with tracked gear. Know who has what before they leave the depot — and what comes back at the end of the day.",
    href: "/login",
    cta: "See how field teams use trackio ›",
    shape: (
      <svg viewBox="0 0 220 180" fill="none" className="w-full h-full" preserveAspectRatio="xMaxYMax meet">
        <defs>
          <linearGradient id="g3a" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        <polygon points="220,0 220,180 40,180" fill="url(#g3a)" opacity="0.15" />
        <polygon points="220,30 220,180 90,180" fill="url(#g3a)" opacity="0.25" />
        <polygon points="220,70 220,180 140,180" fill="url(#g3a)" opacity="0.5" />
      </svg>
    ),
  },
  {
    title: "Healthcare & Aged Care.",
    description:
      "Track consumables, PPE, and shared equipment across wards, facilities, or care homes — with full audit trails and low-stock alerts.",
    href: "/login",
    cta: "See how care facilities use trackio ›",
    shape: (
      <svg viewBox="0 0 220 180" fill="none" className="w-full h-full" preserveAspectRatio="xMaxYMax meet">
        <defs>
          <linearGradient id="g4a" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <polygon points="220,0 220,180 40,180" fill="url(#g4a)" opacity="0.15" />
        <polygon points="220,30 220,180 90,180" fill="url(#g4a)" opacity="0.25" />
        <polygon points="220,70 220,180 140,180" fill="url(#g4a)" opacity="0.5" />
      </svg>
    ),
  },
  {
    title: "Hospitality.",
    description:
      "Manage linen, amenities, kitchen supplies, and equipment across hotel or venue locations. Never run short when guests are checking in.",
    href: "/login",
    cta: "See how hospitality teams use trackio ›",
    shape: (
      <svg viewBox="0 0 220 180" fill="none" className="w-full h-full" preserveAspectRatio="xMaxYMax meet">
        <defs>
          <linearGradient id="g5a" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>
        <polygon points="220,0 220,180 40,180" fill="url(#g5a)" opacity="0.15" />
        <polygon points="220,30 220,180 90,180" fill="url(#g5a)" opacity="0.25" />
        <polygon points="220,70 220,180 140,180" fill="url(#g5a)" opacity="0.5" />
      </svg>
    ),
  },
  {
    title: "Construction & Trades.",
    description:
      "Track tools, safety gear, and job-site supplies. Reduce loss and improve accountability across every crew and every site.",
    href: "/login",
    cta: "See how trade businesses use trackio ›",
    shape: (
      <svg viewBox="0 0 220 180" fill="none" className="w-full h-full" preserveAspectRatio="xMaxYMax meet">
        <defs>
          <linearGradient id="g6a" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1113d4" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        <polygon points="220,0 220,180 40,180" fill="url(#g6a)" opacity="0.15" />
        <polygon points="220,30 220,180 90,180" fill="url(#g6a)" opacity="0.25" />
        <polygon points="220,70 220,180 140,180" fill="url(#g6a)" opacity="0.5" />
      </svg>
    ),
  },
];

export function UseCasesSection() {
  return (
    <section id="use-cases" className="py-14 sm:py-20 lg:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-6">

        {/* Header */}
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-semibold text-action-500 uppercase tracking-widest mb-4">
              Who It&apos;s For
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
              <span className="text-shark-900">Built for teams that </span>
              <span className="bg-gradient-to-r from-action-500 to-indigo-500 bg-clip-text text-transparent">manage things.</span>
            </h2>
            <p className="mt-4 text-shark-400 text-lg">
              Any business that issues equipment or tracks supplies across locations and staff.
            </p>
          </div>
        </ScrollReveal>

        {/* Stripe-style cards */}
        <div className="grid sm:grid-cols-2 gap-4">
          {cases.map((c, i) => (
            <ScrollReveal key={c.title} delay={i * 80}>
              <div className="relative overflow-hidden rounded-2xl border border-shark-100 bg-white hover:border-shark-200 hover:shadow-md transition-all duration-300 h-full min-h-[180px] flex">
                {/* Text side */}
                <div className="flex-1 p-7 flex flex-col justify-between z-10 relative">
                  <div>
                    <p className="text-[15px] font-bold text-shark-900 leading-snug mb-2">
                      {c.title}{" "}
                      <span className="font-normal text-shark-500">{c.description}</span>
                    </p>
                  </div>
                  <Link
                    href={c.href}
                    className="mt-4 inline-flex items-center text-sm font-semibold text-action-500 hover:text-action-600 transition-colors"
                  >
                    {c.cta}
                  </Link>
                </div>

                {/* Geometric shape — bleeds to right edge */}
                <div className="absolute right-0 top-0 bottom-0 w-[220px] pointer-events-none">
                  {c.shape}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

      </div>
    </section>
  );
}
