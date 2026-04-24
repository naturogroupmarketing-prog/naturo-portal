"use client";

import Link from "next/link";

/** Realistic iPhone-style frame — dynamic island, side buttons, metallic bezel */
function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative" style={{ width: "210px", height: "455px" }}>
      {/* ── Left side buttons ── */}
      {/* Mute / silent */}
      <div className="absolute z-10" style={{ left: "-4px", top: "88px", width: "4px", height: "28px", borderRadius: "4px 0 0 4px", background: "linear-gradient(to right, #1c3354, #243e65)" }} />
      {/* Volume up */}
      <div className="absolute z-10" style={{ left: "-4px", top: "128px", width: "4px", height: "52px", borderRadius: "4px 0 0 4px", background: "linear-gradient(to right, #1c3354, #243e65)" }} />
      {/* Volume down */}
      <div className="absolute z-10" style={{ left: "-4px", top: "192px", width: "4px", height: "52px", borderRadius: "4px 0 0 4px", background: "linear-gradient(to right, #1c3354, #243e65)" }} />

      {/* ── Right side button — power ── */}
      <div className="absolute z-10" style={{ right: "-4px", top: "148px", width: "4px", height: "68px", borderRadius: "0 4px 4px 0", background: "linear-gradient(to left, #1c3354, #243e65)" }} />

      {/* ── Main phone body ── */}
      <div
        className="relative w-full h-full overflow-hidden"
        style={{
          borderRadius: "44px",
          background: "linear-gradient(160deg, #243e65 0%, #0d2240 40%, #091a35 100%)",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.12), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.3), 0 32px 80px rgba(5,15,35,0.65), 0 8px 24px rgba(5,15,35,0.4)",
          padding: "14px 10px 12px",
        }}
      >
        {/* ── Screen area ── */}
        <div className="relative w-full h-full overflow-hidden" style={{ borderRadius: "34px", background: "#f6f9fc" }}>
          {/* Dynamic island */}
          <div
            className="absolute left-1/2 z-20 flex items-center justify-center gap-1.5"
            style={{
              top: "8px",
              transform: "translateX(-50%)",
              width: "88px",
              height: "26px",
              borderRadius: "20px",
              background: "#000",
            }}
          >
            {/* Front camera dot */}
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#1a1a2e", border: "1.5px solid #2a2a3e" }} />
          </div>

          {/* Screen content */}
          <div className="flex flex-col h-full pt-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Mobile app UI content inside the phone */
function MobileAppScreen() {
  return (
    <>
      {/* Dark nav bar */}
      <div className="flex items-center justify-between px-3 py-2.5 shrink-0" style={{ background: "#0a2540" }}>
        <div className="flex items-center gap-1.5">
          <div style={{ width: "18px", height: "18px", borderRadius: "5px", background: "#635bff" }} />
          <div style={{ width: "52px", height: "7px", borderRadius: "4px", background: "rgba(255,255,255,0.45)" }} />
        </div>
        <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "rgba(255,255,255,0.65)" }} />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-2 px-3 pt-2.5 shrink-0">
        {[
          { label: "Assets", value: "247", color: "#635bff" },
          { label: "Low Stock", value: "12", color: "#f59e0b" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#fff", border: "1px solid #e3e8ef", borderRadius: "12px", padding: "8px 10px" }}>
            <div style={{ fontSize: "7px", color: "#697386", marginBottom: "3px" }}>{s.label}</div>
            <div style={{ fontSize: "17px", fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="px-3 pt-2 shrink-0">
        <div style={{ background: "#fff", border: "1px solid #e3e8ef", borderRadius: "12px", padding: "8px 10px" }}>
          <div style={{ fontSize: "7px", color: "#697386", marginBottom: "6px" }}>Weekly Activity</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "40px" }}>
            {[38, 62, 45, 85, 55, 92, 68].map((h, i) => (
              <div key={i} style={{ flex: 1, borderRadius: "3px", height: `${h}%`, background: i === 5 ? "#635bff" : i === 3 ? "#7b73ff" : "#e3e8ef" }} />
            ))}
          </div>
        </div>
      </div>

      {/* Alert list */}
      <div className="px-3 pt-2.5 space-y-1.5 flex-1">
        <div style={{ fontSize: "7px", fontWeight: 600, color: "#697386", letterSpacing: "0.05em", paddingLeft: "2px" }}>RECENT ALERTS</div>
        {[
          { dot: "#f59e0b", title: "Gloves — Low Stock", sub: "South Branch · 3 left" },
          { dot: "#22c55e", title: "Kit Assigned", sub: "Vacuum V200 → Sarah" },
          { dot: "#635bff", title: "PO Approved", sub: "$1,240 · North Region" },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "7px 9px", background: "#fff", border: "1px solid #e3e8ef", borderRadius: "10px" }}>
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0, background: item.dot }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "8px", fontWeight: 600, color: "#1a1f36", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
              <div style={{ fontSize: "7px", color: "#697386", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom home indicator */}
      <div className="flex justify-center pb-2 pt-1 shrink-0">
        <div style={{ width: "100px", height: "4px", borderRadius: "3px", background: "rgba(0,0,0,0.15)" }} />
      </div>
    </>
  );
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden" style={{ minHeight: "860px" }}>
      {/* ── Gradient background ── */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(135deg, #7c3aed 0%, #a855f7 15%, #ec4899 35%, #f97316 55%, #fb923c 70%, #fbbf24 85%, #f0abfc 100%)",
        }}
      />
      {/* Bottom white fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />

      {/* ── Full-width layout ── */}
      <div className="relative z-20 flex flex-col lg:flex-row" style={{ minHeight: "860px" }}>

        {/* ── LEFT — text ── */}
        <div className="lg:w-[46%] px-8 lg:pl-16 xl:pl-24 lg:pr-6 pt-36 lg:pt-44 pb-16 lg:pb-0 flex flex-col">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-8 w-fit animate-[fadeInDown_0.5s_ease-out]">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            <span className="text-xs font-medium text-white tracking-wide">Asset & Supply Tracking Platform</span>
          </div>

          <h1
            className="text-[2.5rem] sm:text-5xl lg:text-[3.3rem] font-bold leading-[1.08] tracking-tight text-[#0a2540] animate-[fadeInUp_0.6s_ease-out]"
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
            <Link href="/login" className="inline-flex items-center justify-center text-sm font-semibold bg-[#0a2540] text-white px-7 py-3.5 rounded-full hover:bg-[#1a3a5c] transition-all hover:-translate-y-px hover:shadow-xl active:scale-[0.97]">
              Start free trial
              <svg className="ml-2 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
            <a href="#features" className="inline-flex items-center justify-center text-sm font-medium text-[#0a2540] bg-white/80 backdrop-blur-sm border border-white/60 px-7 py-3.5 rounded-full hover:bg-white transition-all">
              See how it works
            </a>
          </div>

          <p className="mt-5 text-xs text-[#1a3a5c]/50 animate-[fadeInUp_0.6s_ease-out_0.3s_both]">
            Trusted by 500+ operational teams across Australia · No credit card required
          </p>
        </div>

        {/* ── RIGHT — phone + dashboard ── */}
        <div className="hidden lg:block lg:w-[54%] relative animate-[fadeInUp_0.8s_ease-out_0.3s_both]">

          {/* ── Phone — proper iPhone frame, left of right column ── */}
          <div
            className="absolute z-20 animate-[gentleFloat_6s_ease-in-out_infinite]"
            style={{ left: "4%", top: "140px" }}
          >
            <PhoneFrame>
              <MobileAppScreen />
            </PhoneFrame>
          </div>

          {/* ── Dashboard browser frame — right side, transparent edges ── */}
          <div
            className="absolute z-10 overflow-hidden rounded-2xl"
            style={{
              left: "28%",
              right: "-8px",
              top: "100px",
              height: "500px",
              /* Transparent on right and bottom edges — blends into gradient */
              WebkitMaskImage: "linear-gradient(to bottom, white 55%, transparent 100%), linear-gradient(to right, white 75%, transparent 100%)",
              WebkitMaskComposite: "source-in",
              maskImage: "linear-gradient(to bottom, white 55%, transparent 100%), linear-gradient(to right, white 75%, transparent 100%)",
              maskComposite: "intersect",
            }}
          >
            {/* White base so content is visible before fade */}
            <div className="absolute inset-0 rounded-2xl" style={{ background: "#fff", boxShadow: "0 24px 64px rgba(10,37,64,0.35), 0 2px 8px rgba(10,37,64,0.15)" }} />

            {/* Browser chrome */}
            <div className="relative flex items-center gap-2 px-4 py-2.5 shrink-0" style={{ background: "#f6f9fc", borderBottom: "1px solid #e3e8ef", zIndex: 1 }}>
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

            {/* Dashboard screenshot */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/dashboard-hero.jpg"
              alt="Trackio dashboard"
              draggable={false}
              className="relative block w-full"
              style={{ height: "calc(500px - 38px)", objectFit: "cover", objectPosition: "top left" }}
            />
          </div>

          {/* Floating badge — Low Stock */}
          <div className="absolute z-30 animate-[floatIn_0.6s_ease-out_1.2s_both]" style={{ top: "108px", right: "24px" }}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl animate-[gentleFloat_4s_ease-in-out_infinite]" style={{ background: "#fff", border: "1px solid #e3e8ef", boxShadow: "0 8px 28px rgba(60,66,87,0.18)" }}>
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

          {/* Floating badge — Asset Assigned */}
          <div className="absolute z-30 animate-[floatIn_0.6s_ease-out_1.5s_both]" style={{ bottom: "200px", right: "32px" }}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl animate-[gentleFloat_5s_ease-in-out_0.5s_infinite]" style={{ background: "#fff", border: "1px solid #e3e8ef", boxShadow: "0 8px 28px rgba(60,66,87,0.18)" }}>
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
