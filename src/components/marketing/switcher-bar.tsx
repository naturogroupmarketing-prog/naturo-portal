export function SwitcherBar() {
  const items = [
    "ServiceM8",
    "Simpro",
    "Tradify",
    "Excel & Sheets",
    "Paper logs",
  ];

  return (
    <div className="py-12 bg-white border-b border-gray-200 relative z-20">
      <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-center gap-x-16 gap-y-8 text-sm font-semibold text-gray-500">
        <span className="uppercase tracking-widest text-xs text-gray-400 font-bold shrink-0">
          Switching From:
        </span>
        {items.map((item) => (
          <span
            key={item}
            className="text-base transition-colors cursor-pointer hover:text-[#001b94]"
          >
            {item}
          </span>
        ))}
        <a
          href="#pricing"
          className="ml-auto flex items-center gap-2 font-bold text-base shrink-0 hover:underline"
          style={{ color: "#001b94" }}
        >
          See why teams switch →
        </a>
      </div>
    </div>
  );
}
