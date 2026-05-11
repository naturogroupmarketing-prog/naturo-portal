export function SwitcherBar() {
  const replacements = [
    "Excel & Google Sheets",
    "Paper logs & clipboards",
    "ServiceM8",
    "Simpro",
    "Tradify",
    "WhatsApp groups",
    "Outlook folders",
  ];

  return (
    <div className="bg-gray-50 border-y border-gray-200 py-5">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 shrink-0">
            Replacing
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {replacements.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded-full"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#9ca3af" }}>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                {item}
              </span>
            ))}
          </div>
          <div className="hidden sm:block flex-1" />
          <a
            href="#pricing"
            className="shrink-0 text-xs font-bold px-4 py-1.5 rounded-full transition-colors"
            style={{ background: "#002FA0", color: "#fff" }}
          >
            See pricing →
          </a>
        </div>
      </div>
    </div>
  );
}
