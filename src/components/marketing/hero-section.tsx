"use client";

import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden" style={{ minHeight: "820px" }}>
      {/* ── Stripe-style gradient background ── */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(135deg, #7c3aed 0%, #a855f7 15%, #ec4899 35%, #f97316 55%, #fb923c 70%, #fbbf24 85%, #f0abfc 100%)",
        }}
      />
      {/* Soft white fade at the very bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />

      {/* ── Content ── */}
      <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-10 pt-28 lg:pt-36 pb-0">
        <div className="flex flex-col lg:flex-row lg:items-start lg:gap-12">

          {/* ── LEFT — headline + CTAs ── */}
          <div className="lg:w-[44%] pb-12 lg:pb-32">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-8 animate-[fadeInDown_0.5s_ease-out]">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              <span className="text-xs font-medium text-white tracking-wide">
                Asset & Supply Tracking Platform
              </span>
            </div>

            {/* Headline */}
            <h1
              className="text-[2.5rem] sm:text-5xl lg:text-[3.2rem] font-bold leading-[1.08] tracking-tight text-[#0a2540] animate-[fadeInUp_0.6s_ease-out]"
              style={{ fontFamily: "var(--font-exo, sans-serif)" }}
            >
              Know exactly what<br />
              you have,{" "}
              <span className="text-white" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.15)" }}>
                where it is,
              </span>
              <br />
              and who has it.
            </h1>

            {/* Subheading */}
            <p className="mt-6 text-lg text-[#1a3a5c]/80 leading-relaxed max-w-lg animate-[fadeInUp_0.6s_ease-out_0.1s_both]">
              Finally feel in control of every location, every asset, and every
              supply — with one system your whole team will actually use.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row items-start gap-3 animate-[fadeInUp_0.6s_ease-out_0.2s_both]">
              <Link
                href="/login"
                className="inline-flex items-center justify-center text-sm font-semibold bg-[#0a2540] text-white px-7 py-3.5 rounded-full hover:bg-[#1a3a5c] transition-all hover:-translate-y-px hover:shadow-xl active:scale-[0.97]"
              >
                Start free trial
                <svg className="ml-2 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center text-sm font-medium text-[#0a2540] bg-white/80 backdrop-blur-sm border border-white/60 px-7 py-3.5 rounded-full hover:bg-white transition-all"
              >
                See how it works
              </a>
            </div>

            {/* Trust line */}
            <p className="mt-6 text-xs text-[#1a3a5c]/60 animate-[fadeInUp_0.6s_ease-out_0.3s_both]">
              Trusted by 500+ operational teams across Australia · No credit card required
            </p>
          </div>

          {/* ── RIGHT — Phone LEFT + Dashboard RIGHT, Stripe-style ── */}
          <div
            className="hidden lg:block lg:w-[56%] relative animate-[fadeInUp_0.8s_ease-out_0.3s_both]"
            style={{ height: "520px" }}
          >
            {/* ── Dashboard browser frame — right side, full height ── */}
            <div
              className="absolute top-0 bottom-0 overflow-hidden rounded-2xl border border-white/50 shadow-[0_30px_80px_rgba(10,37,64,0.4),0_2px_8px_rgba(10,37,64,0.15)]"
              style={{ left: "172px", right: "-32px" }}
            >
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-[#f6f9fc] border-b border-[#e3e8ef] shrink-0">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-white rounded-md border border-[#e3e8ef] px-4 py-1 text-[11px] text-[#697386] min-w-[180px] text-center flex items-center justify-center gap-1.5">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                    app.trackio.au/dashboard
                  </div>
                </div>
                <div className="w-12" />
              </div>
              {/* Dashboard screenshot — fills remaining height, aligned to top */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/dashboard-hero.jpg"
                alt="Trackio dashboard"
                draggable={false}
                className="w-full h-full object-cover object-top block"
                style={{ maxHeight: "calc(520px - 38px)" }}
              />
            </div>

            {/* ── Phone mockup — left side, in front of dashboard ── */}
            <div
              className="absolute top-[10px] z-20 animate-[gentleFloat_5s_ease-in-out_infinite]"
              style={{ left: 0, width: "158px", height: "500px" }}
            >
              {/* Phone shell */}
              <div
                className="w-full h-full rounded-[32px] border-[5px] border-[#1a3a5c] shadow-[0_24px_70px_rgba(10,37,64,0.55),0_2px_12px_rgba(10,37,64,0.25)] overflow-hidden"
                style={{ background: "#0a2540" }}
              >
                {/* Dynamic island / notch */}
                <div className="flex justify-center pt-2 pb-1 bg-[#0a2540]">
                  <div className="w-16 h-3.5 rounded-full bg-[#000]" />
                </div>
                {/* Screen */}
                <div className="flex flex-col h-full bg-[#f6f9fc]">
                  {/* Mobile header bar */}
                  <div className="bg-[#0a2540] px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded bg-[#635bff]/80" />
                      <div className="w-14 h-1.5 bg-white/60 rounded-full" />
                    </div>
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white/70" />
                    </div>
                  </div>
                  {/* Stat cards */}
                  <div className="px-2.5 pt-2.5 grid grid-cols-2 gap-1.5">
                    {[
                      { label: "Assets", val: "247", color: "#635bff" },
                      { label: "Low Stock", val: "12", color: "#f59e0b" },
                    ].map((s) => (
                      <div key={s.label} className="bg-white rounded-xl p-2 border border-[#e3e8ef]">
                        <div className="text-[8px] text-[#697386] mb-0.5">{s.label}</div>
                        <div className="text-[14px] font-bold" style={{ color: s.color }}>{s.val}</div>
                      </div>
                    ))}
                  </div>
                  {/* Chart */}
                  <div className="px-2.5 pt-2">
                    <div className="bg-white rounded-xl p-2 border border-[#e3e8ef]">
                      <div className="text-[7px] text-[#697386] mb-1.5">Weekly Activity</div>
                      <div className="flex items-end gap-0.5 h-10">
                        {[40, 65, 35, 80, 55, 90, 70].map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-sm transition-all"
                            style={{
                              height: `${h}%`,
                              background: i === 5 ? "#635bff" : i === 3 ? "#7b73ff" : "#e3e8ef",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* List items */}
                  <div className="px-2.5 pt-2 space-y-1.5">
                    <div className="text-[7px] text-[#697386] font-medium px-0.5">Recent Alerts</div>
                    {[
                      { dot: "#f59e0b", text: "Gloves — Low Stock", sub: "South Branch" },
                      { dot: "#22c55e", text: "Kit Assigned", sub: "Vacuum V200 → Sarah" },
                      { dot: "#635bff", text: "PO Approved", sub: "$1,240 · North" },
                    ].map((item, i) => (
                      <div key={i} className="bg-white rounded-lg px-2 py-1.5 flex items-center gap-1.5 border border-[#e3e8ef]">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: item.dot }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[8px] font-semibold text-[#1a1f36] truncate">{item.text}</div>
                          <div className="text-[7px] text-[#697386] truncate">{item.sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating alert badge — above dashboard, top right area */}
            <div className="absolute top-8 right-4 z-30 animate-[floatIn_0.6s_ease-out_1.2s_both]">
              <div className="bg-white rounded-xl border border-[#e3e8ef] shadow-[0_8px_30px_rgba(60,66,87,0.18)] px-3 py-2 flex items-center gap-2 animate-[gentleFloat_4s_ease-in-out_infinite]">
                <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-[#1a1f36]">Low Stock Alert</p>
                  <p className="text-[8px] text-[#697386]">Gloves — South Branch · 3 left</p>
                </div>
              </div>
            </div>

            {/* Floating assigned badge — mid-right */}
            <div className="absolute bottom-20 right-6 z-30 animate-[floatIn_0.6s_ease-out_1.5s_both]">
              <div className="bg-white rounded-xl border border-[#e3e8ef] shadow-[0_8px_30px_rgba(60,66,87,0.18)] px-3 py-2 flex items-center gap-2 animate-[gentleFloat_5s_ease-in-out_0.5s_infinite]">
                <div className="w-6 h-6 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-[#1a1f36]">Asset Assigned</p>
                  <p className="text-[8px] text-[#697386]">Vacuum V200 → Sarah M.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile-only: browser frame below text ── */}
      <div className="lg:hidden relative z-20 mt-10 px-4 pb-0">
        <div className="relative bg-white rounded-2xl shadow-[0_20px_60px_rgba(10,37,64,0.3)] overflow-hidden border border-white/60 mx-auto max-w-sm">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-[#f6f9fc] border-b border-[#e3e8ef]">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <div className="w-2 h-2 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 text-center text-[10px] text-[#697386]">app.trackio.au</div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/dashboard-hero.jpg" alt="Trackio dashboard" draggable={false} className="w-full block" />
        </div>
      </div>
    </section>
  );
}
