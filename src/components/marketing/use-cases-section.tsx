import { ScrollReveal } from "./scroll-reveal";

export function UseCasesSection() {
  const cases = [
    {
      title: "Cleaning & Facilities",
      description: "Track vacuums, mops, chemicals, and cleaning supplies across multiple sites.",
      icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>),
    },
    {
      title: "Multi-Branch Operations",
      description: "Businesses with multiple offices or branches that need centralised asset oversight.",
      icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>),
    },
    {
      title: "Field Service Teams",
      description: "Equip mobile teams with tracked gear. Know who has what before they leave the depot.",
      icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>),
    },
    {
      title: "Healthcare & Aged Care",
      description: "Track consumables, PPE, and shared equipment across wards, facilities, or care homes.",
      icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12h6M12 9v6"/></svg>),
    },
    {
      title: "Hospitality",
      description: "Manage linen, amenities, kitchen supplies, and equipment across hotel or venue locations.",
      icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15a7 7 0 100-14 7 7 0 000 14z"/><path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12"/></svg>),
    },
    {
      title: "Construction & Trades",
      description: "Track tools, safety gear, and job-site supplies. Reduce loss and improve accountability.",
      icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>),
    },
  ];

  return (
    <section id="use-cases" className="py-14 sm:py-20 lg:py-28 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#002FA0" }}>
              Who It&apos;s For
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight" style={{ color: "#111827" }}>
              Built for teams that{" "}
              <span style={{ color: "#FFD700" }}>manage things.</span>
            </h2>
            <p className="mt-4 text-gray-500 text-lg">
              Any business that issues equipment or tracks supplies across locations and staff.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cases.map((useCase, i) => (
            <ScrollReveal key={useCase.title} delay={i * 100}>
              <div className="flex items-start gap-4 p-5 rounded-[28px] border border-gray-100 bg-white hover:border-blue-100 hover:shadow-sm hover:-translate-y-1 transition-all duration-300 h-full">
                <div
                  className="w-10 h-10 rounded-[28px] flex items-center justify-center shrink-0"
                  style={{ background: "rgba(0,47,160,0.08)", color: "#002FA0" }}
                >
                  {useCase.icon}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{useCase.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{useCase.description}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
