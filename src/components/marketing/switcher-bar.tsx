export function SwitcherBar() {
  const items = [
    "ServiceM8",
    "Simpro",
    "Tradify",
    "Excel & Google Sheets",
    "Paper logs",
    "Outlook folders",
  ];

  return (
    <div className="border-b border-gray-100 bg-white py-4">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center gap-6 flex-wrap">
          <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400 shrink-0">
            Switching from
          </span>
          <div className="flex flex-wrap items-center gap-x-1 gap-y-1">
            {items.map((item, i) => (
              <span key={item} className="flex items-center gap-1">
                <span className="text-sm text-gray-500">{item}</span>
                {i < items.length - 1 && (
                  <span className="text-gray-200 mx-1 select-none text-base">·</span>
                )}
              </span>
            ))}
          </div>
          <a
            href="#pricing"
            className="ml-auto shrink-0 text-sm font-semibold whitespace-nowrap"
            style={{ color: "#002FA0" }}
          >
            See why teams switch →
          </a>
        </div>
      </div>
    </div>
  );
}
