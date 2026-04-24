"use client";

import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden" style={{ minHeight: "800px" }}>
      {/* ── Gradient background ── */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(135deg, #7c3aed 0%, #a855f7 15%, #ec4899 35%, #f97316 55%, #fb923c 70%, #fbbf24 85%, #f0abfc 100%)",
        }}
      />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />

      {/* ── Full-width flex row — left text | right mockups extend to edge ── */}
      <div className="relative z-20 flex flex-col lg:flex-row min-h-[800px]">

        {/* ── LEFT column — text, constrained ── */}
        <div className="lg:w-[46%] px-8 lg:pl-16 xl:pl-24 lg:pr-6 pt-32 lg:pt-40 pb-16 lg:pb-0 flex flex-col justify-start">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-8 w-fit animate-[fadeInDown_0.5s_ease-out]">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            <span className="text-xs font-medium text-white tracking-wide">Asset & Supply Tracking Platform</span>
          </div>

          {/* Headline */}
          <h1
            className="text-[2.6rem] sm:text-5xl lg:text-[3.3rem] font-bold leading-[1.08] tracking-tight text-[#0a2540] animate-[fadeInUp_0.6s_ease-out]"
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

          <p className="mt-6 text-lg text-[#1a3a5c]/80 leading-relaxed max-w-md animate-[fadeInUp_0.6s_ease-out_0.1s_both]">
            Finally feel in control of every location, every asset, and every supply — with one system your whole team will actually use.
          </p>

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

          <p className="mt-5 text-xs text-[#1a3a5c]/50 animate-[fadeInUp_0.6s_ease-out_0.3s_both]">
            Trusted by 500+ operational teams across Australia · No credit card required
          </p>
        </div>

        {/* ── RIGHT column — phone + dashboard, extends to viewport edge ── */}
        <div className="hidden lg:block lg:w-[54%] relative animate-[fadeInUp_0.8s_ease-out_0.3s_both]" style={{ minHeight: "800px" }}>

          {/* ── Phone mockup ── left portion of right column */}
          <div
            className="absolute z-20 animate-[gentleFloat_6s_ease-in-out_infinite]"
            style={{ left: "6%", top: "80px", width: "210px", height: "455px" }}
          >
            <div
              className="w-full h-full rounded-[36px] overflow-hidden shadow-[0_32px_80px_rgba(10,37,64,0.55),0_4px_16px_rgba(10,37,64,0.3)]"
              style={{ border: "5px solid #1e3a5f", background: "#0a2540" }}
            >
              {/* Dynamic island */}
              <div className="flex justify-center py-2" style={{ background: "#0a2540" }}>
                <div className="w-20 h-4 rounded-full" style={{ background: "#000" }} />
              </div>

              {/* App screen */}
              <div className="flex flex-col h-full" style={{ background: "#f6f9fc" }}>
                {/* Dark nav bar */}
                <div className="flex items-center justify-between px-3 py-2.5" style={{ background: "#0a2540" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded" style={{ background: "#635bff" }} />
                    <div className="w-16 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.5)" }} />
                  </div>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(255,255,255,0.7)" }} />
                  </div>
                </div>

                {/* Stat row */}
                <div className="grid grid-cols-2 gap-2 px-3 pt-3">
                  {[
                    { label: "Assets", value: "247", color: "#635bff" },
                    { label: "Low Stock", value: "12", color: "#f59e0b" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl p-2.5" style={{ background: "#fff", border: "1px solid #e3e8ef" }}>
                      <div className="text-[8px] mb-1" style={{ color: "#697386" }}>{s.label}</div>
                      <div className="text-[16px] font-bold" style={{ color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Chart */}
                <div className="px-3 pt-2.5">
                  <div className="rounded-xl p-2.5" style={{ background: "#fff", border: "1px solid #e3e8ef" }}>
                    <div className="text-[7px] mb-2" style={{ color: "#697386" }}>Weekly Activity</div>
                    <div className="flex items-end gap-1" style={{ height: "44px" }}>
                      {[38, 62, 45, 85, 55, 92, 68].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-sm"
                          style={{
                            height: `${h}%`,
                            background: i === 5 ? "#635bff" : i === 3 ? "#7b73ff" : "#e3e8ef",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Alert list */}
                <div className="px-3 pt-3 space-y-2">
                  <div className="text-[7px] font-semibold px-0.5" style={{ color: "#697386" }}>RECENT ALERTS</div>
                  {[
                    { dot: "#f59e0b", title: "Gloves — Low Stock", sub: "South Branch · 3 left" },
                    { dot: "#22c55e", title: "Kit Assigned", sub: "Vacuum V200 → Sarah" },
                    { dot: "#635bff", title: "PO Approved", sub: "$1,240 · North Region" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 px-2.5 py-2 rounded-xl" style={{ background: "#fff", border: "1px solid #e3e8ef" }}>
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item.dot }} />
                      <div className="min-w-0">
                        <div className="text-[8px] font-semibold truncate" style={{ color: "#1a1f36" }}>{item.title}</div>
                        <div className="text-[7px] truncate" style={{ color: "#697386" }}>{item.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Dashboard browser mockup ── right portion, extends to edge */}
          <div
            className="absolute z-10 overflow-hidden rounded-2xl shadow-[0_32px_80px_rgba(10,37,64,0.4),0_4px_16px_rgba(10,37,64,0.2)]"
            style={{
              left: "30%",
              right: "-24px",
              top: "60px",
              height: "480px",
              border: "1px solid rgba(255,255,255,0.5)",
            }}
          >
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-2.5 shrink-0" style={{ background: "#f6f9fc", borderBottom: "1px solid #e3e8ef" }}>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-1.5 rounded-md px-4 py-1 text-[11px]" style={{ background: "#fff", border: "1px solid #e3e8ef", color: "#697386", minWidth: "180px", justifyContent: "center" }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  app.trackio.au/dashboard
                </div>
              </div>
              <div style={{ width: "48px" }} />
            </div>

            {/* Dashboard screenshot — full height, no fade */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/dashboard-hero.jpg"
              alt="Trackio dashboard"
              draggable={false}
              style={{ width: "100%", height: "calc(480px - 38px)", objectFit: "cover", objectPosition: "top left", display: "block" }}
            />
          </div>

          {/* Floating badge — top right of dashboard */}
          <div className="absolute z-30 animate-[floatIn_0.6s_ease-out_1.2s_both]" style={{ top: "70px", right: "16px" }}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl animate-[gentleFloat_4s_ease-in-out_infinite]" style={{ background: "#fff", border: "1px solid #e3e8ef", boxShadow: "0 8px 30px rgba(60,66,87,0.18)" }}>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#fffbeb" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold" style={{ color: "#1a1f36" }}>Low Stock Alert</p>
                <p className="text-[8px]" style={{ color: "#697386" }}>Gloves — South Branch · 3 left</p>
              </div>
            </div>
          </div>

          {/* Floating badge — bottom of dashboard */}
          <div className="absolute z-30 animate-[floatIn_0.6s_ease-out_1.5s_both]" style={{ bottom: "180px", right: "20px" }}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl animate-[gentleFloat_5s_ease-in-out_0.5s_infinite]" style={{ background: "#fff", border: "1px solid #e3e8ef", boxShadow: "0 8px 30px rgba(60,66,87,0.18)" }}>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#f0fdf4" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold" style={{ color: "#1a1f36" }}>Asset Assigned</p>
                <p className="text-[8px]" style={{ color: "#697386" }}>Vacuum V200 → Sarah M.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile fallback ── */}
      <div className="lg:hidden relative z-20 px-4 pb-0 -mt-4">
        <div className="relative bg-white rounded-2xl overflow-hidden border border-white/60 mx-auto max-w-sm" style={{ boxShadow: "0 20px 60px rgba(10,37,64,0.3)" }}>
          <div className="flex items-center gap-1.5 px-3 py-2" style={{ background: "#f6f9fc", borderBottom: "1px solid #e3e8ef" }}>
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <div className="w-2 h-2 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 text-center text-[10px]" style={{ color: "#697386" }}>app.trackio.au</div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/dashboard-hero.jpg" alt="Trackio dashboard" draggable={false} className="w-full block" />
        </div>
      </div>
    </section>
  );
}
