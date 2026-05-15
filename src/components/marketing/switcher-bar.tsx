const BLUE = "#001b94";

const items = [
  {
    name: "ServiceM8",
    sub: "Import your history",
    icon: (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="2" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    name: "Simpro",
    sub: "Free data migration",
    icon: (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93l-1.41 1.41M5.34 18.66l-1.41 1.41M20 12h-2M6 12H4M18.66 18.66l-1.41-1.41M6.34 5.34L4.93 4.93M12 20v-2M12 4V2" />
      </svg>
    ),
  },
  {
    name: "Tradify",
    sub: "Switch in minutes",
    icon: (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    name: "Excel & Sheets",
    sub: "One-click import",
    icon: (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M3 15h18M9 3v18" />
      </svg>
    ),
  },
  {
    name: "Paper logs",
    sub: "Go fully digital",
    icon: (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="16" y2="17" />
      </svg>
    ),
  },
  {
    name: "Outlook & Email",
    sub: "No more email chains",
    icon: (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
];

export function SwitcherBar() {
  return (
    <div className="bg-white py-8 relative z-20 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Floating white panel — AGL card style */}
        <div
          className="bg-white rounded-2xl overflow-hidden border border-gray-100"
          style={{ boxShadow: "0 8px 40px rgba(0,27,148,0.10)" }}
        >
          <div className="px-6 sm:px-10 md:px-14 pt-8 pb-8 sm:pt-10 sm:pb-10">

            {/* Label row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8 sm:mb-10">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Switching from
              </p>
              <a
                href="#pricing"
                className="text-sm font-bold hover:underline"
                style={{ color: BLUE }}
              >
                See why teams switch →
              </a>
            </div>

            {/* 3×2 grid — no icon circles, AGL style */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 sm:gap-x-12 gap-y-8 sm:gap-y-10">
              {items.map((item) => (
                <div key={item.name} className="flex items-start gap-5">
                  <div className="shrink-0 mt-0.5" style={{ color: BLUE }}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-bold text-[#191c1f] text-lg leading-tight">{item.name}</p>
                    <p className="text-gray-500 text-sm mt-1.5">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Solid yellow bar */}
          <div className="h-3" style={{ background: "#FFE344" }} />

        </div>
      </div>
    </div>
  );
}
