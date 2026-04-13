"use client";

import Link from "next/link";

function FlipOnce({ text, delay = 0 }: { text: string; delay?: number }) {
  const chars = text.split("");
  return (
    <span className="text-action-500 inline-block" style={{ perspective: "800px" }}>
      {chars.map((char, i) => (
        <span
          key={i}
          className="inline-block animate-[charFlipIn_0.5s_cubic-bezier(0.22,1,0.36,1)_both]"
          style={{
            animationDelay: `${delay + i * 55}ms`,
            transformOrigin: "center bottom",
          }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
}

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-x-clip">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-action-50/40 via-white to-white pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-action-50 border border-action-100 mb-8 animate-[fadeInDown_0.5s_ease-out]">
            <span className="w-1.5 h-1.5 rounded-full bg-action-500" />
            <span className="text-xs font-medium text-action-700 tracking-wide">
              Asset & Supply Tracking Platform
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-semibold text-shark-900 tracking-tight leading-[1.1] font-exo animate-[fadeInUp_0.6s_ease-out]">
            Know exactly what you have,{" "}
            <FlipOnce text="where it is," delay={800} />{" "}
            and who has it.
          </h1>

          {/* Subheading */}
          <p className="mt-6 text-lg sm:text-xl text-shark-400 leading-relaxed max-w-2xl mx-auto animate-[fadeInUp_0.6s_ease-out_0.1s_both]">
            Finally feel in control of every location, every asset, and every
            supply — with one system your whole team will actually use.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 animate-[fadeInUp_0.6s_ease-out_0.2s_both]">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center text-sm font-medium bg-action-500 text-white px-8 py-3.5 rounded-full hover:bg-action-600 transition-all hover:-translate-y-px hover:shadow-lg active:scale-[0.97]"
            >
              Start Your Free Trial
              <svg className="ml-2 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto inline-flex items-center justify-center text-sm font-medium text-shark-600 bg-white border border-shark-200 px-8 py-3.5 rounded-full hover:bg-shark-50 hover:border-shark-300 transition-all"
            >
              See How It Works
            </a>
          </div>
        </div>

        {/* Dashboard Showcase */}
        <div className="mt-16 sm:mt-20 animate-[fadeInUp_0.8s_ease-out_0.3s_both]">
          <DashboardShowcase />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard showcase with floating notifications                     */
/* ------------------------------------------------------------------ */
function DashboardShowcase() {
  return (
    <div className="relative mx-auto max-w-5xl">
      {/* Glow effect */}
      <div className="absolute -inset-8 bg-gradient-to-b from-action-100/60 via-action-50/30 to-transparent rounded-3xl blur-3xl pointer-events-none" />

      {/* ---- Main Dashboard ---- */}
      <div className="relative z-10 animate-[slideUp_0.7s_ease-out_0.4s_both]">
        <div className="relative bg-white rounded-2xl border border-shark-200 shadow-2xl shadow-shark-300/40 overflow-hidden">
          {/* Bottom fade to suggest more content */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white via-white/80 to-transparent z-10 pointer-events-none rounded-b-2xl" />
          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-shark-100 bg-shark-50/50">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-300" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="bg-white rounded-md border border-shark-200 px-4 py-1 text-[11px] text-shark-400 min-w-[200px] text-center flex items-center justify-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                app.trackio.com/dashboard
              </div>
            </div>
            <div className="w-12" />
          </div>

          {/* App layout */}
          <div className="flex">
            {/* Sidebar */}
            <div className="hidden sm:flex flex-col w-[185px] shrink-0 bg-white border-r border-shark-100 py-3 px-3">
              {/* Logo - uses actual trackio logo */}
              <div className="flex items-center gap-1.5 px-2 mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/trackio_t_full_logo.svg"
                  alt="Trackio"
                  style={{ height: "18px", width: "auto" }}
                  draggable={false}
                />
              </div>

              {/* Nav items */}
              <div className="space-y-0.5">
                <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-action-50 text-action-600">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/></svg>
                  <span className="text-[11px] font-medium">Dashboard</span>
                </div>
              </div>

              <p className="px-2.5 mt-3 mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-shark-400">Management</p>
              <div className="space-y-0.5">
                {[
                  { icon: "M16.5 9.4l-9-5.19M21 16V8l-9-5-9 5v8l9 5 9-5z", label: "Inventory" },
                  { icon: "M1 3h15v13H1zM16 8h7v13h-7z", label: "Purchase Orders", badge: 36 },
                  { icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2", label: "Staff" },
                  { icon: "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8", label: "Starter Kits" },
                  { icon: "M19 12H5M12 19l-7-7 7-7", label: "Returns" },
                  { icon: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83", label: "Maintenance" },
                  { icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2", label: "Reports" },
                  { icon: "M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35", label: "Inspections" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2.5 px-2.5 py-1.5 text-shark-500 hover:bg-shark-50 rounded-lg">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon}/></svg>
                    <span className="text-[11px] flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="min-w-[18px] h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[8px] font-bold px-1">
                        {item.badge}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <p className="px-2.5 mt-3 mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-shark-400">Admin</p>
              <div className="space-y-0.5">
                {[
                  { icon: "M19 11H5M19 11a2 2 0 012 2v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 012-2", label: "Permissions" },
                  { icon: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12", label: "Import Data" },
                  { icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", label: "Activity Log" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2.5 px-2.5 py-1.5 text-shark-500 rounded-lg">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon}/></svg>
                    <span className="text-[11px]">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Main content area */}
            <div className="flex-1 bg-shark-50/40">
              {/* Top bar */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-white/80 border-b border-shark-100">
                <div className="flex items-center gap-2 bg-shark-50 rounded-lg border border-shark-100 px-3 py-1.5 w-48">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                  <span className="text-[10px] text-shark-400">Search</span>
                  <span className="ml-auto text-[9px] text-shark-300 bg-white px-1.5 py-0.5 rounded border border-shark-100">⌘K</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
                    <span className="absolute -top-1 -right-1.5 min-w-[14px] h-3.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[7px] font-bold px-1">9+</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-action-500 flex items-center justify-center text-white text-[10px] font-bold">A</div>
                    <div className="hidden md:block">
                      <p className="text-[10px] font-medium text-shark-800 leading-tight">Admin User</p>
                      <p className="text-[8px] text-shark-400">SUPER ADMIN</p>
                    </div>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                  </div>
                </div>
              </div>

              {/* Dashboard content */}
              <div className="p-4 space-y-3">
                {/* Title row */}
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-shark-900">Dashboard</h2>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 010 4h-.09"/></svg>
                </div>

                <p className="text-[9px] font-semibold text-shark-400 uppercase tracking-wider">Overview</p>

                {/* Overview stat cards */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Damage", value: "0", icon: "⚠", bg: "bg-orange-50", iconColor: "text-orange-500", arrow: "↓" },
                    { label: "Requests", value: "1", icon: "📋", bg: "bg-action-50", iconColor: "text-action-500", arrow: "↑" },
                    { label: "Returns", value: "0", icon: "←", bg: "bg-blue-50", iconColor: "text-blue-500", arrow: "↓" },
                  ].map(s => (
                    <div key={s.label} className="bg-white rounded-xl border border-shark-100 p-2.5 flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center ${s.iconColor} text-xs`}>
                        {s.icon}
                      </div>
                      <div>
                        <p className="text-[9px] text-shark-400">{s.label}</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-bold text-shark-900">{s.value}</span>
                          <span className="text-[8px] text-shark-300">{s.arrow}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Operations + Finance row */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Operations */}
                  <div className="bg-white rounded-xl border border-shark-100 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-[10px] font-semibold text-shark-800">Operations</p>
                        <p className="text-[8px] text-shark-400">Business health</p>
                      </div>
                      <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center text-white text-sm font-bold">
                        68
                      </div>
                    </div>
                    <div className="space-y-1">
                      {[
                        { label: "Awaiting Approval", value: "36", color: "text-shark-800" },
                        { label: "Awaiting Receival", value: "3", color: "text-shark-800" },
                        { label: "Low Stock Items", value: "10", color: "text-red-500" },
                        { label: "Pending Requests", value: "1", color: "text-shark-800" },
                        { label: "Active Staff", value: "14", color: "text-shark-800" },
                      ].map(m => (
                        <div key={m.label} className="flex items-center justify-between">
                          <span className="text-[8px] text-shark-500">{m.label}</span>
                          <span className={`text-[9px] font-semibold ${m.color}`}>{m.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Finance */}
                  <div className="bg-white rounded-xl border border-shark-100 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-[10px] font-semibold text-shark-800">Finance</p>
                        <p className="text-[8px] text-shark-400">Asset & Supply Value</p>
                      </div>
                    </div>
                    <div className="flex gap-3 mb-2">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-action-500" />
                        <span className="text-[8px] text-shark-500">Assets</span>
                        <span className="text-[9px] font-bold text-shark-800">$9,449</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        <span className="text-[8px] text-shark-500">Supplies</span>
                        <span className="text-[9px] font-bold text-shark-800">$6,593</span>
                      </div>
                    </div>
                    {/* Mini chart */}
                    <div className="relative h-14 mt-1">
                      <svg viewBox="0 0 200 50" className="w-full h-full" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#3b5bdb" stopOpacity="0.15"/>
                            <stop offset="100%" stopColor="#3b5bdb" stopOpacity="0"/>
                          </linearGradient>
                        </defs>
                        <path d="M0 35 Q25 30 50 28 T100 22 T150 18 T200 12 V50 H0Z" fill="url(#chartFill)"/>
                        <path d="M0 35 Q25 30 50 28 T100 22 T150 18 T200 12" fill="none" stroke="#3b5bdb" strokeWidth="1.5"/>
                        <path d="M0 38 Q25 36 50 34 T100 30 T150 32 T200 28" fill="none" stroke="#E8532E" strokeWidth="1" strokeDasharray="3 2" opacity="0.6"/>
                      </svg>
                      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1">
                        {["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"].map(m => (
                          <span key={m} className="text-[6px] text-shark-300">{m}</span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-shark-50 flex items-center justify-between">
                      <span className="text-[8px] text-shark-400">Total Portfolio</span>
                      <span className="text-[10px] font-bold text-shark-900">$16,041</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Floating notification cards ---- */}

      {/* Top-right: Low stock alert */}
      <div className="hidden sm:block absolute -right-4 top-12 z-20 animate-[floatIn_0.6s_ease-out_1.2s_both]">
        <div className="bg-white rounded-xl border border-shark-200 shadow-lg shadow-shark-200/40 px-3.5 py-2.5 flex items-center gap-2.5 animate-[gentleFloat_4s_ease-in-out_infinite]">
          <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-shark-800">Low Stock Alert</p>
            <p className="text-[8px] text-shark-400">Gloves — South Branch</p>
          </div>
          <span className="text-[7px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full font-medium">3 left</span>
        </div>
      </div>

      {/* Bottom-left: Assignment notification */}
      <div className="hidden sm:block absolute -left-4 bottom-12 z-20 animate-[floatIn_0.6s_ease-out_1.5s_both]">
        <div className="bg-white rounded-xl border border-shark-200 shadow-lg shadow-shark-200/40 px-3.5 py-2.5 flex items-center gap-2.5 animate-[gentleFloat_5s_ease-in-out_0.5s_infinite]">
          <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-shark-800">Asset Assigned</p>
            <p className="text-[8px] text-shark-400">Vacuum V200 → Sarah M.</p>
          </div>
          <span className="text-[7px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full font-medium">Just now</span>
        </div>
      </div>
    </div>
  );
}
