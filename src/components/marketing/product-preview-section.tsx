import Link from "next/link";
import { ScrollReveal } from "./scroll-reveal";

export function ProductPreviewSection() {
  return (
    <section className="py-14 sm:py-20 lg:py-28 bg-shark-50/40">
      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-semibold text-action-500 uppercase tracking-widest mb-4">
              Built for Operations
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-exo leading-tight">
              <span className="text-shark-900">A clearer way to </span>
              <span className="bg-gradient-to-r from-action-500 to-indigo-500 bg-clip-text text-transparent">manage your branches.</span>
            </h2>
            <p className="mt-4 text-shark-400 text-lg">
              See stock levels, staff assignments, and activity across every
              location &mdash; all in one view.
            </p>
          </div>
        </ScrollReveal>

        {/* Stock page mockup */}
        <div className="relative max-w-4xl mx-auto">
          {/* Glow */}
          <div className="absolute -inset-6 bg-gradient-to-b from-action-100/40 via-action-50/20 to-transparent rounded-[28px] blur-2xl pointer-events-none" />

          <div className="relative bg-white rounded-[28px] border border-shark-200 shadow-xl shadow-shark-200/30 overflow-hidden">
            {/* App frame top bar */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-shark-100 dark:border-shark-800 bg-shark-50/50 dark:bg-shark-800/50">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-300" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-white rounded-md border border-shark-200 px-4 py-1 text-[11px] text-shark-400 min-w-[180px] text-center flex items-center justify-center gap-1.5">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                  app.trackio.com/stock
                </div>
              </div>
              <div className="w-12" />
            </div>

            {/* Stock page content */}
            <div className="p-5 sm:p-6 space-y-5">
              {/* Header row */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-shark-900">Stock</h3>
                  <p className="text-xs text-shark-400 mt-0.5">8 locations · 255 assets · 524 supplies</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-7 px-3 rounded-lg bg-shark-50 text-shark-500 dark:text-shark-400 text-[11px] font-medium flex items-center gap-1.5 border border-shark-100 dark:border-shark-800">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83"/></svg>
                    Manage Locations
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="flex items-center gap-2 bg-shark-50 rounded-lg border border-shark-100 dark:border-shark-800 px-3 py-2 max-w-xs">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <span className="text-xs text-shark-400">Search locations...</span>
              </div>

              {/* State group: New South Wales */}
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  <h4 className="text-base font-bold text-shark-900">New South Wales</h4>
                  <span className="text-[10px] font-medium text-shark-500 dark:text-shark-400 bg-shark-100 dark:bg-shark-800 px-2 py-0.5 rounded-full">4 locations</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" className="ml-auto"><path d="M6 9l6 6 6-6"/></svg>
                </div>

                {/* Region cards */}
                <div className="ml-4 space-y-2">
                  {[
                    { name: "North Branch", assets: 68, supplies: 142, staff: 12, address: "45 George St, Sydney NSW 2000", damage: 0, lowStock: 0 },
                    { name: "Central Office", assets: 94, supplies: 208, staff: 18, address: "120 Pitt St, Sydney NSW 2000", damage: 1, lowStock: 2 },
                    { name: "East Branch", assets: 52, supplies: 96, staff: 8, address: "88 Oxford St, Bondi Junction NSW 2022", damage: 0, lowStock: 0 },
                    { name: "South Branch", assets: 41, supplies: 78, staff: 6, address: "15 Railway Pde, Hurstville NSW 2220", damage: 0, lowStock: 1 },
                  ].map(r => (
                    <div key={r.name} className="flex items-center justify-between px-4 py-3 rounded-[28px] border border-shark-100 dark:border-shark-800 hover:border-shark-200 hover:shadow-sm transition-all bg-white">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-shark-800">{r.name}</p>
                        <p className="text-[11px] text-shark-400 mt-0.5">{r.assets} assets · {r.supplies} supplies · {r.staff} staff</p>
                        <p className="text-[10px] text-shark-400 mt-0.5 hidden sm:flex items-center gap-1">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          {r.address}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {r.damage > 0 && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-500 flex items-center gap-1">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                            {r.damage}
                          </span>
                        )}
                        {r.lowStock > 0 && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 flex items-center gap-1">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                            {r.lowStock}
                          </span>
                        )}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* State group: Victoria (collapsed) */}
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-action-50 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b5bdb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  <h4 className="text-base font-bold text-shark-900">Victoria</h4>
                  <span className="text-[10px] font-medium text-shark-500 dark:text-shark-400 bg-shark-100 dark:bg-shark-800 px-2 py-0.5 rounded-full">2 locations</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" className="ml-auto -rotate-90"><path d="M6 9l6 6 6-6"/></svg>
                </div>
              </div>

              {/* State group: Queensland (collapsed) */}
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  <h4 className="text-base font-bold text-shark-900">Queensland</h4>
                  <span className="text-[10px] font-medium text-shark-500 dark:text-shark-400 bg-shark-100 dark:bg-shark-800 px-2 py-0.5 rounded-full">2 locations</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" className="ml-auto -rotate-90"><path d="M6 9l6 6 6-6"/></svg>
                </div>
              </div>
            </div>

            {/* Bottom fade */}
            <div className="h-12 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none -mt-12 relative z-10" />
          </div>

          {/* ---- Floating explanation cards ---- */}

          {/* Right: Multi-location visibility */}
          <div className="hidden sm:block absolute -right-4 lg:-right-8 top-16 z-20 animate-[floatIn_0.6s_ease-out_0.8s_both]">
            <div className="bg-white rounded-[28px] border border-shark-200 shadow-lg shadow-shark-200/40 px-3.5 py-2.5 flex items-center gap-2.5 animate-[gentleFloat_4s_ease-in-out_infinite] max-w-[200px]">
              <div className="w-7 h-7 rounded-lg bg-action-50 flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b5bdb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-shark-800">Multi-Location</p>
                <p className="text-[8px] text-shark-400">Group by state, drill into any branch</p>
              </div>
            </div>
          </div>

          {/* Left: Alert badges */}
          <div className="hidden sm:block absolute -left-4 lg:-left-8 top-[55%] z-20 animate-[floatIn_0.6s_ease-out_1.1s_both]">
            <div className="bg-white rounded-[28px] border border-shark-200 shadow-lg shadow-shark-200/40 px-3.5 py-2.5 flex items-center gap-2.5 animate-[gentleFloat_5s_ease-in-out_0.5s_infinite] max-w-[200px]">
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-shark-800">Instant Alerts</p>
                <p className="text-[8px] text-shark-400">Low stock & damage badges per location</p>
              </div>
            </div>
          </div>

          {/* Right bottom: Search */}
          <div className="hidden sm:block absolute -right-2 lg:-right-6 bottom-20 z-20 animate-[floatIn_0.6s_ease-out_1.4s_both]">
            <div className="bg-white rounded-[28px] border border-shark-200 shadow-lg shadow-shark-200/40 px-3.5 py-2.5 flex items-center gap-2.5 animate-[gentleFloat_4.5s_ease-in-out_1s_infinite] max-w-[190px]">
              <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-shark-800">Quick Search</p>
                <p className="text-[8px] text-shark-400">Find any location instantly</p>
              </div>
            </div>
          </div>

          {/* CTA below preview */}
          <div className="mt-12 text-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center text-sm font-medium bg-action-500 text-white px-8 py-3.5 rounded-full hover:bg-action-600 transition-all hover:-translate-y-px hover:shadow-lg active:scale-[0.97]"
            >
              See It In Action — Start Free
              <svg className="ml-2 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <p className="mt-3 text-xs text-shark-400">
              Free 14-day trial. Set up in minutes.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
