"use client";

import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden" style={{ minHeight: "860px" }}>

      {/* ── Deep purple background ── */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "linear-gradient(135deg, #0f0830 0%, #1a0f5e 30%, #2d1580 60%, #1a0f5e 100%)",
        }}
      />

      {/* ── Blob 1 — large pink/magenta top-right ── */}
      <div
        className="absolute z-0 rounded-full"
        style={{
          width: "680px",
          height: "680px",
          top: "-180px",
          right: "-120px",
          background: "radial-gradient(circle, rgba(220,60,160,0.85) 0%, rgba(160,40,200,0.65) 45%, transparent 72%)",
          filter: "blur(2px)",
        }}
      />

      {/* ── Blob 2 — pink/coral mid-right ── */}
      <div
        className="absolute z-0 rounded-full"
        style={{
          width: "420px",
          height: "420px",
          bottom: "60px",
          right: "20%",
          background: "radial-gradient(circle, rgba(255,100,140,0.70) 0%, rgba(200,60,120,0.45) 50%, transparent 72%)",
          filter: "blur(4px)",
        }}
      />

      {/* ── Blob 3 — blue/indigo left ── */}
      <div
        className="absolute z-0 rounded-full"
        style={{
          width: "380px",
          height: "380px",
          top: "35%",
          left: "-80px",
          background: "radial-gradient(circle, rgba(80,100,255,0.55) 0%, rgba(60,60,200,0.30) 55%, transparent 70%)",
          filter: "blur(6px)",
        }}
      />

      {/* ── Orb 1 — glassy pink sphere top-right ── */}
      <div
        className="absolute z-1 rounded-full"
        style={{
          width: "200px",
          height: "200px",
          top: "5%",
          right: "2%",
          background: "radial-gradient(circle at 35% 35%, rgba(255,160,220,0.90) 0%, rgba(220,60,160,0.80) 40%, rgba(140,20,120,0.60) 70%, transparent 100%)",
          boxShadow: "inset -8px -8px 20px rgba(0,0,0,0.25), inset 4px 4px 12px rgba(255,255,255,0.35), 0 8px 40px rgba(220,60,160,0.45)",
          backdropFilter: "blur(2px)",
        }}
      />

      {/* ── Orb 2 — glassy blue sphere bottom-right ── */}
      <div
        className="absolute z-1 rounded-full"
        style={{
          width: "140px",
          height: "140px",
          bottom: "12%",
          right: "5%",
          background: "radial-gradient(circle at 35% 35%, rgba(140,180,255,0.90) 0%, rgba(80,120,255,0.80) 40%, rgba(40,60,200,0.60) 70%, transparent 100%)",
          boxShadow: "inset -6px -6px 16px rgba(0,0,0,0.25), inset 3px 3px 8px rgba(255,255,255,0.35), 0 6px 32px rgba(80,120,255,0.45)",
          backdropFilter: "blur(2px)",
        }}
      />

      {/* ── Orb 3 — glassy purple sphere mid-left ── */}
      <div
        className="absolute z-1 rounded-full"
        style={{
          width: "110px",
          height: "110px",
          top: "52%",
          left: "3%",
          background: "radial-gradient(circle at 35% 35%, rgba(200,160,255,0.90) 0%, rgba(150,80,255,0.80) 40%, rgba(100,40,200,0.60) 70%, transparent 100%)",
          boxShadow: "inset -5px -5px 14px rgba(0,0,0,0.25), inset 3px 3px 8px rgba(255,255,255,0.35), 0 6px 28px rgba(150,80,255,0.45)",
          backdropFilter: "blur(2px)",
        }}
      />

      {/* ── Floating dots ── */}
      {[
        { size: 10, top: "22%", left: "42%", color: "rgba(220,120,255,0.8)" },
        { size: 7,  top: "55%", left: "18%", color: "rgba(255,100,180,0.8)" },
        { size: 12, top: "70%", left: "52%", color: "rgba(120,100,255,0.7)" },
        { size: 6,  top: "15%", right: "38%", color: "rgba(255,140,200,0.9)" },
        { size: 8,  top: "80%", right: "28%", color: "rgba(180,80,255,0.7)" },
      ].map((dot, i) => (
        <div
          key={i}
          className="absolute z-0 rounded-full"
          style={{ width: dot.size, height: dot.size, top: dot.top, left: (dot as any).left, right: (dot as any).right, background: dot.color }}
        />
      ))}

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(15,8,48,1) 0%, transparent 100%)" }} />

      {/* ── Layout ── */}
      <div className="relative z-20 flex flex-col lg:flex-row" style={{ minHeight: "920px" }}>

        {/* ── LEFT — text ── */}
        <div className="lg:w-[46%] px-8 lg:pl-16 xl:pl-24 lg:pr-6 pt-44 lg:pt-56 pb-16 lg:pb-0 flex flex-col">

          {/* ── Glass content panel ── */}
          <div
            className="rounded-[32px] p-7 sm:p-8 animate-[fadeInUp_0.6s_ease-out]"
            style={{
              background: "rgba(255,255,255,0.07)",
              backdropFilter: "blur(28px)",
              WebkitBackdropFilter: "blur(28px)",
              border: "1px solid rgba(255,255,255,0.18)",
              boxShadow: "0 8px 48px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.22)",
            }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full w-fit mb-6"
              style={{
                background: "rgba(255,255,255,0.12)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.22)",
              }}>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-semibold text-white/90 tracking-wide uppercase">Asset & Supply Tracking Platform</span>
            </div>

            {/* Headline */}
            <h1
              className="text-[2.6rem] sm:text-5xl lg:text-[3.4rem] font-bold leading-[1.06] tracking-tight text-white"
              style={{ fontFamily: "var(--font-exo, sans-serif)", textShadow: "0 2px 40px rgba(0,0,0,0.3)" }}
            >
              Know exactly what<br />
              you have,{" "}
              <span style={{ background: "linear-gradient(90deg, #f472b6, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                where it is,
              </span>
              <br />
              and who has it.
            </h1>

            {/* Divider line — matches reference */}
            <div className="mt-5 mb-5 h-px w-full" style={{ background: "rgba(255,255,255,0.15)" }} />

            {/* Subheading */}
            <p className="text-base text-white/65 leading-relaxed max-w-md">
              Finally feel in control of every location, every asset, and every supply — with one system your whole team will actually use.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-start gap-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center text-sm font-bold text-white px-7 py-3.5 rounded-full transition-all hover:-translate-y-px active:scale-[0.97]"
                style={{
                  background: "linear-gradient(135deg, #5b5ef4 0%, #7c3aed 100%)",
                  boxShadow: "0 4px 24px rgba(100,80,240,0.55), 0 1px 0 rgba(255,255,255,0.15) inset",
                }}
              >
                Get started
                <svg className="ml-2 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center text-sm font-semibold text-white px-7 py-3.5 rounded-full transition-all hover:bg-white/15"
                style={{
                  background: "rgba(255,255,255,0.10)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.22)",
                }}
              >
                See how it works
              </a>
            </div>

            <p className="mt-5 text-xs text-white/35">
              Trusted by 500+ operational teams across Australia · No credit card required
            </p>
          </div>
        </div>

        {/* ── RIGHT — phone + dashboard ── */}
        <div className="hidden lg:block lg:w-[54%] relative animate-[fadeInUp_0.8s_ease-out_0.3s_both]">

          {/* ── Dashboard browser frame ── */}
          <div
            className="absolute z-10 overflow-hidden"
            style={{
              left: "30%",
              right: "-480px",
              top: "170px",
              height: "620px",
              borderRadius: "28px",
              background: "rgba(255,255,255,0.08)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.18)",
              boxShadow: "0 2px 4px rgba(0,0,0,0.20), 0 40px 80px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.20)",
            }}
          >
            {/* Browser chrome */}
            <div
              className="relative flex items-center gap-2 px-4 py-2.5 shrink-0"
              style={{ background: "rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.10)", zIndex: 1 }}
            >
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
              </div>
              <div className="flex-1 flex justify-center">
                <div
                  className="flex items-center gap-1.5 rounded-md px-4 py-1 text-[11px]"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.50)", minWidth: "180px", justifyContent: "center" }}
                >
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
              style={{ height: "calc(620px - 38px)", objectFit: "cover", objectPosition: "top left" }}
            />
          </div>

          {/* ── Phone ── */}
          <div
            className="absolute z-20 animate-[gentleFloat_6s_ease-in-out_infinite]"
            style={{ left: "2%", top: "205px" }}
          >
            <div
              aria-label="Trackio mobile app"
              style={{
                width: "280px",
                height: "560px",
                backgroundImage: "url('/mobile_trackio_transperancy.svg')",
                backgroundSize: "1550px auto",
                backgroundPosition: "-347px -140px",
                backgroundRepeat: "no-repeat",
              }}
            />
          </div>

          {/* ── Floating glass stat cards ── */}
          <div
            className="absolute z-30 animate-[gentleFloat_5s_ease-in-out_1s_infinite]"
            style={{
              left: "8%",
              top: "165px",
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.22)",
              borderRadius: "16px",
              padding: "12px 16px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.30)",
              minWidth: "150px",
            }}
          >
            <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">Assets tracked</p>
            <p className="text-2xl font-bold text-white mt-0.5">2,847</p>
            <p className="text-[10px] text-green-400 font-semibold mt-0.5">↑ 12% this month</p>
          </div>

          <div
            className="absolute z-30 animate-[gentleFloat_7s_ease-in-out_2s_infinite]"
            style={{
              left: "18%",
              bottom: "240px",
              background: "rgba(255,255,255,0.10)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: "16px",
              padding: "12px 16px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.25)",
              minWidth: "140px",
            }}
          >
            <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">Locations</p>
            <p className="text-2xl font-bold text-white mt-0.5">34</p>
            <p className="text-[10px] text-purple-300 font-semibold mt-0.5">All synced live</p>
          </div>

        </div>
      </div>

      {/* ── Mobile fallback ── */}
      <div className="lg:hidden relative z-20 px-4 pb-6 -mt-4">

        {/* Glass stat cards */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "Assets", value: "2,847", sub: "↑ 12% this month", subColor: "#4ade80" },
            { label: "Locations", value: "34", sub: "All synced live", subColor: "#d8b4fe" },
            { label: "Users", value: "412", sub: "Online now", subColor: "#93c5fd" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "rgba(255,255,255,0.10)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: "16px",
                padding: "10px 12px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.22)",
              }}
            >
              <p className="text-[9px] font-semibold text-white/50 uppercase tracking-wider">{stat.label}</p>
              <p className="text-lg font-bold text-white mt-0.5">{stat.value}</p>
              <p className="text-[9px] font-semibold mt-0.5" style={{ color: stat.subColor }}>{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Browser frame */}
        <div
          className="relative overflow-hidden mx-auto"
          style={{
            borderRadius: "24px",
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.18)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.20)",
          }}
        >
          <div
            className="flex items-center gap-1.5 px-3 py-2.5"
            style={{ background: "rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.10)" }}
          >
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-red-400/80" />
              <div className="w-2 h-2 rounded-full bg-amber-400/80" />
              <div className="w-2 h-2 rounded-full bg-green-400/80" />
            </div>
            <div className="flex-1 flex justify-center">
              <div
                className="flex items-center gap-1 rounded px-3 py-0.5 text-[10px]"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.45)" }}
              >
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                app.trackio.au
              </div>
            </div>
            <div className="w-8" />
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/dashboard-hero.jpg" alt="Trackio dashboard" draggable={false} className="w-full block" />
        </div>
      </div>
    </section>
  );
}
