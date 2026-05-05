"use client";

import Link from "next/link";

/* ─── Mini UI mockups rendered in SVG/HTML ─────────────────────────── */

function AssetListMockup() {
  const rows = [
    { name: "Pressure Washer", loc: "Sydney North", status: "Available", color: "#22c55e" },
    { name: "Wet/Dry Vacuum", loc: "Melbourne CBD", status: "Assigned", color: "#3b82f6" },
    { name: "Extension Ladder", loc: "Brisbane West", status: "Damaged", color: "#ef4444" },
    { name: "Steam Cleaner", loc: "Perth Central", status: "Available", color: "#22c55e" },
    { name: "Power Scrubber", loc: "Sydney South", status: "Available", color: "#22c55e" },
  ];
  return (
    <div className="w-full rounded-xl overflow-hidden border border-white/20 bg-white/10 backdrop-blur-sm text-white text-[11px]">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-white/10">
        <span className="font-semibold opacity-80">Assets</span>
        <span className="ml-auto opacity-50">47 total</span>
      </div>
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-2 px-3 py-2 border-b border-white/10 last:border-0 hover:bg-white/10">
          <div className="w-5 h-5 rounded bg-white/20 flex items-center justify-center shrink-0">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate opacity-90">{r.name}</div>
            <div className="opacity-50 truncate">{r.loc}</div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: r.color }} />
            <span className="opacity-70">{r.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function AIChatMockup() {
  return (
    <div className="w-full rounded-xl overflow-hidden border border-white/20 bg-white/10 backdrop-blur-sm text-[11px]">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-white/10">
        <div className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center">
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        </div>
        <span className="text-white font-semibold opacity-80">AI Assistant</span>
      </div>
      <div className="p-3 space-y-3">
        <div className="flex justify-end">
          <div className="bg-white/20 text-white rounded-xl rounded-tr-sm px-3 py-1.5 max-w-[75%] text-[10px]">
            Which supplies are running low?
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-5 h-5 rounded-full bg-white/20 shrink-0 flex items-center justify-center mt-0.5">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="5"/></svg>
          </div>
          <div className="bg-white/15 text-white rounded-xl rounded-tl-sm px-3 py-1.5 text-[10px] leading-relaxed">
            <p className="font-medium mb-1 opacity-90">3 items need attention:</p>
            <p className="opacity-70">• Hand sanitiser — Sydney North (2 left)</p>
            <p className="opacity-70">• Microfibre cloths — Perth (4 left)</p>
            <p className="opacity-70">• Bin liners — Brisbane (critical)</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white/10 rounded-lg px-2 py-1.5 border border-white/20">
          <span className="text-white/40 flex-1 text-[10px]">Ask anything…</span>
          <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
            <svg width="7" height="7" viewBox="0 0 24 24" fill="white"><path d="M22 2L11 13M22 2L15 22 11 13 2 9l20-7z"/></svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function LocationsMockup() {
  const locs = [
    { name: "Sydney North", assets: 12, low: 1 },
    { name: "Melbourne CBD", assets: 9, low: 0 },
    { name: "Brisbane West", assets: 7, low: 2 },
    { name: "Perth Central", assets: 11, low: 0 },
  ];
  return (
    <div className="w-full rounded-xl overflow-hidden border border-white/20 bg-white/10 backdrop-blur-sm text-white text-[11px]">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-white/10">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
        <span className="font-semibold opacity-80">Locations</span>
        <span className="ml-auto opacity-50">4 sites</span>
      </div>
      {locs.map((l, i) => (
        <div key={i} className="flex items-center gap-2 px-3 py-2.5 border-b border-white/10 last:border-0">
          <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-[9px] font-bold">
            {l.name.split(" ").map(w => w[0]).join("")}
          </div>
          <div className="flex-1">
            <div className="font-medium opacity-90">{l.name}</div>
            <div className="opacity-50">{l.assets} assets</div>
          </div>
          {l.low > 0 && (
            <div className="flex items-center gap-1 bg-red-500/30 text-red-200 rounded-full px-2 py-0.5 text-[9px] font-semibold">
              <span>{l.low} low</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function POmockup() {
  return (
    <div className="w-full rounded-xl overflow-hidden border border-white/20 bg-white/10 backdrop-blur-sm text-white text-[11px]">
      <div className="px-3 py-2 border-b border-white/10 bg-white/10 flex items-center gap-2">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 3h22v5H1zM1 8h22v13H1z"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
        <span className="font-semibold opacity-80">Purchase Order #1042</span>
        <span className="ml-auto bg-amber-500/30 text-amber-200 rounded-full px-2 py-0.5 text-[9px] font-semibold">Pending</span>
      </div>
      <div className="p-3 space-y-2">
        {[
          { item: "Microfibre Cloths ×50", price: "$42.00" },
          { item: "Hand Sanitiser ×24", price: "$68.00" },
          { item: "Bin Liners ×200", price: "$29.50" },
        ].map((row, i) => (
          <div key={i} className="flex justify-between opacity-80">
            <span>{row.item}</span>
            <span className="font-medium">{row.price}</span>
          </div>
        ))}
        <div className="border-t border-white/20 pt-2 flex justify-between font-semibold">
          <span>Total</span>
          <span>$139.50</span>
        </div>
        <div className="flex gap-2 pt-1">
          <div className="flex-1 bg-white/20 rounded-lg py-1.5 text-center text-[10px] font-semibold cursor-pointer hover:bg-white/30">Approve</div>
          <div className="flex-1 bg-white/10 rounded-lg py-1.5 text-center text-[10px] opacity-60 cursor-pointer">Reject</div>
        </div>
      </div>
    </div>
  );
}

function QRMockup() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-24 h-24 bg-white rounded-xl p-2">
        <svg viewBox="0 0 21 21" className="w-full h-full">
          <rect x="0" y="0" width="9" height="9" fill="#0a2540"/>
          <rect x="1" y="1" width="7" height="7" fill="white"/>
          <rect x="2" y="2" width="5" height="5" fill="#0a2540"/>
          <rect x="12" y="0" width="9" height="9" fill="#0a2540"/>
          <rect x="13" y="1" width="7" height="7" fill="white"/>
          <rect x="14" y="2" width="5" height="5" fill="#0a2540"/>
          <rect x="0" y="12" width="9" height="9" fill="#0a2540"/>
          <rect x="1" y="13" width="7" height="7" fill="white"/>
          <rect x="2" y="14" width="5" height="5" fill="#0a2540"/>
          <rect x="12" y="12" width="2" height="2" fill="#0a2540"/>
          <rect x="15" y="12" width="2" height="2" fill="#0a2540"/>
          <rect x="18" y="12" width="3" height="2" fill="#0a2540"/>
          <rect x="12" y="15" width="3" height="2" fill="#0a2540"/>
          <rect x="16" y="15" width="2" height="2" fill="#0a2540"/>
          <rect x="19" y="15" width="2" height="2" fill="#0a2540"/>
          <rect x="12" y="18" width="2" height="3" fill="#0a2540"/>
          <rect x="15" y="19" width="3" height="2" fill="#0a2540"/>
          <rect x="19" y="18" width="2" height="3" fill="#0a2540"/>
        </svg>
      </div>
      <div className="text-white/80 text-[11px] text-center">
        <div className="font-semibold">Pressure Washer</div>
        <div className="opacity-60">Asset #PRW-0042 · Sydney North</div>
      </div>
      <div className="flex gap-1.5">
        {["Assign", "History", "Report"].map((btn, i) => (
          <div key={btn} className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${i === 0 ? "bg-white text-[#0a2540]" : "bg-white/20 text-white"}`}>{btn}</div>
        ))}
      </div>
    </div>
  );
}

/* ─── Section ───────────────────────────────────────────────────────── */

export function BentoShowcaseSection() {
  return (
    <section id="features" className="py-32 sm:py-40 px-4 sm:px-8 lg:px-16 bg-white">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-action-50 border border-action-100 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-action-500" />
            <span className="text-xs font-semibold text-action-600 tracking-wide">Everything in one platform</span>
          </div>
          <h2 className="text-5xl sm:text-6xl font-bold text-[#0a2540] tracking-tight leading-tight">
            Built for operational teams
          </h2>
          <p className="mt-6 text-xl text-shark-400 max-w-2xl mx-auto leading-relaxed">
            From assets to supplies to staff — trackio gives your whole team one place to stay on top of everything.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 auto-rows-auto">

          {/* Card 1 — Asset tracking (large, 3 cols) */}
          <div className="lg:col-span-3 rounded-xl overflow-hidden relative min-h-[480px] flex flex-col"
            style={{ background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 40%, #ec4899 80%, #f472b6 100%)" }}>
            <div className="p-10 pb-0 flex flex-col flex-1">
              <div className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">Asset Management</div>
              <h3 className="text-3xl font-bold text-white leading-tight mb-3">
                Know exactly where<br />every asset is.
              </h3>
              <p className="text-sm text-white/70 mb-8 max-w-xs leading-relaxed">
                Real-time visibility across every location, every status, every team member — all from one screen.
              </p>
              <div className="flex-1 flex items-end pb-8">
                <AssetListMockup />
              </div>
            </div>
          </div>

          {/* Card 2 — AI assistant (2 cols) */}
          <div className="lg:col-span-2 rounded-xl overflow-hidden relative min-h-[480px] flex flex-col"
            style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #3730a3 50%, #4f46e5 100%)" }}>
            <div className="p-10 pb-0 flex flex-col flex-1">
              <div className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">AI Assistant</div>
              <h3 className="text-3xl font-bold text-white leading-tight mb-3">
                Ask anything,<br />get answers fast.
              </h3>
              <p className="text-sm text-white/70 mb-8 leading-relaxed">
                Your built-in AI knows your inventory and flags issues before they become problems.
              </p>
              <div className="flex-1 flex items-end pb-8">
                <AIChatMockup />
              </div>
            </div>
          </div>

          {/* Card 3 — Multi-location (2 cols) */}
          <div className="lg:col-span-2 rounded-xl overflow-hidden relative min-h-[420px] flex flex-col"
            style={{ background: "linear-gradient(135deg, rgba(255,50,55,1.0) 0%, rgba(255,140,45,0.90) 60%, rgba(255,200,70,0.80) 100%)" }}>
            <div className="p-10 pb-0 flex flex-col flex-1">
              <div className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">Multi-Location</div>
              <h3 className="text-3xl font-bold text-white leading-tight mb-3">
                All your sites,<br />one dashboard.
              </h3>
              <p className="text-sm text-white/70 mb-8 leading-relaxed">
                Switch between locations instantly. Spot low stock and coverage gaps across your entire network.
              </p>
              <div className="flex-1 flex items-end pb-8">
                <LocationsMockup />
              </div>
            </div>
          </div>

          {/* Card 4 — Purchase orders (2 cols) */}
          <div className="lg:col-span-2 rounded-xl overflow-hidden relative min-h-[420px] flex flex-col"
            style={{ background: "linear-gradient(135deg, #0f4c81 0%, #1113d4 60%, #4f46e5 100%)" }}>
            <div className="p-10 pb-0 flex flex-col flex-1">
              <div className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">Procurement</div>
              <h3 className="text-3xl font-bold text-white leading-tight mb-3">
                Approve orders<br />on the go.
              </h3>
              <p className="text-sm text-white/70 mb-8 leading-relaxed">
                Raise, review and approve purchase orders from anywhere. Auto-trigger reorders when stock hits threshold.
              </p>
              <div className="flex-1 flex items-end pb-8">
                <POmockup />
              </div>
            </div>
          </div>

          {/* Card 5 — QR scanning (1 col) */}
          <div className="lg:col-span-1 rounded-xl overflow-hidden relative min-h-[420px] flex flex-col"
            style={{ background: "linear-gradient(160deg, #0a2540 0%, #1a3a5c 60%, #0f4c81 100%)" }}>
            <div className="p-10 flex flex-col flex-1">
              <div className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">QR Tracking</div>
              <h3 className="text-2xl font-bold text-white leading-tight mb-3">
                Scan &amp; go.
              </h3>
              <p className="text-sm text-white/70 mb-8 leading-relaxed">
                Every asset gets a QR code. Scan to assign, return, or report — no training needed.
              </p>
              <div className="flex-1 flex items-center justify-center">
                <QRMockup />
              </div>
            </div>
          </div>

        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 text-sm font-semibold bg-[#0a2540] text-white px-8 py-3.5 rounded-full hover:bg-[#1a3a5c] transition-all hover:-translate-y-px hover:shadow-xl active:scale-[0.97]"
          >
            Start your free trial
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
          <p className="mt-3 text-xs text-shark-400">No credit card required · Set up in minutes</p>
        </div>

      </div>
    </section>
  );
}
