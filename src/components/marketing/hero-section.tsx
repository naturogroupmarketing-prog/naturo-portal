"use client";

import Link from "next/link";

export function HeroSection() {
  return (
    <>
    <section className="relative overflow-hidden pt-[68px] pb-16" style={{ minHeight: "880px" }}>

      {/* ── AGL-style linear blue gradient base ── */}
      <div
        className="absolute inset-0 z-0"
        style={{ background: "linear-gradient(135deg, #00118A 0%, #0030C0 45%, #1040D8 100%)" }}
      />

      {/* ── Subtle radial highlight for depth ── */}
      <div className="absolute inset-0 z-0" style={{
        background: "radial-gradient(ellipse 65% 70% at 62% 38%, rgba(40,80,240,0.45) 0%, transparent 65%)",
      }} />

      {/* ── Edge darkening ── */}
      <div className="absolute inset-0 z-0" style={{
        background: "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 55%, rgba(0,8,50,0.30) 100%)",
      }} />

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none"
        style={{ zIndex: 3, background: "linear-gradient(to top, rgba(0,24,120,0.6) 0%, transparent 100%)" }} />

      {/* ── Layout ── */}
      <div className="relative flex flex-col lg:flex-row" style={{ zIndex: 10, minHeight: "736px" }}>

        {/* ── LEFT — text ── */}
        <div className="lg:w-[55%] px-8 lg:pl-16 xl:pl-24 lg:pr-6 py-16 lg:py-0 flex flex-col justify-center">

          {/* ── Content ── */}
          <div className="animate-[fadeInUp_0.6s_ease-out]">

            {/* Headline — pain-first */}
            <h1
              className="text-[2.6rem] sm:text-5xl lg:text-[3.4rem] font-semibold leading-[1.25] tracking-tight text-white"
              style={{ fontFamily: "var(--font-exo, sans-serif)" }}
            >
              Tired of chasing<br />
              equipment and{" "}
              <span style={{ color: "#FFD700" }}>
                emergency restocks?
              </span>
            </h1>

            {/* Subheading */}
            <p className="mt-6 text-lg text-white/70 leading-relaxed max-w-md">
              trackio replaces spreadsheets and clunky apps with one simple system — so your team always knows what&apos;s available, where it is, and who has it. Set up in 15 minutes.
            </p>

            {/* Trust micro-copy */}
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
              {["14-day free trial", "No credit card required", "Set up in 15 mins"].map((t) => (
                <span key={t} className="flex items-center gap-1.5 text-sm text-white/50">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  {t}
                </span>
              ))}
            </div>

          </div>
        </div>

        {/* ── RIGHT — phone + dashboard ── */}
        <div className="hidden lg:block lg:w-[45%] relative animate-[fadeInUp_0.8s_ease-out_0.3s_both]">

          {/* ── Dashboard browser frame ── */}
          <div
            className="absolute z-10 overflow-hidden p-px"
            style={{
              left: "30%",
              right: "-480px",
              top: "55px",
              height: "660px",
              bottom: "auto",
              borderRadius: "29px",
              background: "linear-gradient(135deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.10) 45%, rgba(255,255,255,0.28) 100%)",
              boxShadow: "0 2px 4px rgba(0,0,0,0.20), 0 40px 80px rgba(0,0,0,0.40)",
            }}
          >
          <div
            className="relative overflow-hidden h-full"
            style={{
              borderRadius: "28px",
              background: "rgba(255,255,255,0.06)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.20)",
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
              src="/dashboard-hero-v3.jpg"
              alt="Trackio dashboard"
              draggable={false}
              className="relative block w-full"
              style={{ height: "calc(660px - 38px)", objectFit: "cover", objectPosition: "top left" }}
            />
          </div>
          </div>

          {/* ── Phone ── */}
          <div
            className="absolute z-20 animate-[gentleFloat_6s_ease-in-out_infinite]"
            style={{ left: "2%", top: "105px" }}
          >
            {/* Phone shell */}
            <div style={{
              width: "264px",
              height: "560px",
              background: "#111827",
              borderRadius: "48px",
              padding: "10px",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.12), 0 30px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)",
              position: "relative",
            }}>
              {/* Side buttons */}
              <div style={{ position: "absolute", left: "-3px", top: "110px", width: "3px", height: "32px", background: "#1f2937", borderRadius: "2px 0 0 2px" }} />
              <div style={{ position: "absolute", left: "-3px", top: "154px", width: "3px", height: "56px", background: "#1f2937", borderRadius: "2px 0 0 2px" }} />
              <div style={{ position: "absolute", right: "-3px", top: "140px", width: "3px", height: "64px", background: "#1f2937", borderRadius: "0 2px 2px 0" }} />

              {/* Screen area */}
              <div style={{ width: "100%", height: "100%", borderRadius: "40px", overflow: "hidden", position: "relative", background: "#000" }}>
                {/* Dynamic island */}
                <div style={{ position: "absolute", top: "10px", left: "50%", transform: "translateX(-50%)", width: "88px", height: "24px", background: "#000", borderRadius: "12px", zIndex: 10 }} />
                {/* Screenshot */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/mobile-dashboard-screenshot.jpg"
                  alt="Trackio mobile dashboard"
                  draggable={false}
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }}
                />
              </div>
            </div>
          </div>

          {/* ── Floating glass stat cards ── */}
          <div
            className="absolute z-30 animate-[gentleFloat_5s_ease-in-out_1s_infinite] p-px"
            style={{
              left: "6%", top: "85px",
              background: "linear-gradient(135deg, rgba(255,255,255,0.40) 0%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.28) 100%)",
              borderRadius: "17px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.30)",
              minWidth: "150px",
            }}
          >
            <div style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderRadius: "16px", padding: "12px 16px", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.40)" }}>
              <p className="text-[10px] font-semibold text-white/80 uppercase tracking-wider">Assets tracked</p>
              <p className="text-2xl font-bold text-white mt-0.5">2,847</p>
              <p className="text-[10px] text-green-300 font-semibold mt-0.5">↑ 12% this month</p>
            </div>
          </div>

          <div
            className="absolute z-30 animate-[gentleFloat_7s_ease-in-out_2s_infinite] p-px"
            style={{
              left: "16%", top: "445px",
              background: "linear-gradient(135deg, rgba(255,255,255,0.40) 0%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.28) 100%)",
              borderRadius: "17px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.30)",
              minWidth: "150px",
            }}
          >
            <div style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderRadius: "16px", padding: "12px 16px", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.40)" }}>
              <p className="text-[10px] font-semibold text-white/80 uppercase tracking-wider">Locations</p>
              <p className="text-2xl font-bold text-white mt-0.5">34</p>
              <p className="text-[10px] font-semibold mt-0.5" style={{ color: "#bfdbfe" }}>All synced live</p>
            </div>
          </div>

        </div>
      </div>

      {/* ── Mobile fallback ── */}
      <div className="lg:hidden relative px-4 pb-6 -mt-4" style={{ zIndex: 10 }}>

        {/* Glass stat cards */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "Assets", value: "2,847", sub: "↑ 12% this month", subColor: "#4ade80" },
            { label: "Locations", value: "34", sub: "All synced live", subColor: "#93c5fd" },
            { label: "Users", value: "412", sub: "Online now", subColor: "#93c5fd" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-px"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.26) 100%)",
                borderRadius: "17px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
              }}
            >
              <div style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderRadius: "16px", padding: "10px 12px", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22)" }}>
                <p className="text-[9px] font-semibold text-white/50 uppercase tracking-wider">{stat.label}</p>
                <p className="text-lg font-bold text-white mt-0.5">{stat.value}</p>
                <p className="text-[9px] font-semibold mt-0.5" style={{ color: stat.subColor }}>{stat.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Browser frame */}
        <div
          className="relative mx-auto p-px"
          style={{
            borderRadius: "25px",
            background: "linear-gradient(135deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.10) 45%, rgba(255,255,255,0.28) 100%)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.40)",
          }}
        >
        <div
          className="relative overflow-hidden"
          style={{
            borderRadius: "24px",
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.20)",
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
          <img src="/dashboard-hero-v3.jpg" alt="Trackio dashboard" draggable={false} className="w-full block" />
        </div>
        </div>
      </div>
    </section>

    {/* ── Overlapping form card — AGL style ── */}
    <div className="relative -mt-14 z-20 px-6 pb-12">
      <div className="max-w-6xl mx-auto">
        <div
          className="bg-white rounded-2xl px-8 py-6 sm:px-10 sm:py-7"
          style={{ boxShadow: "0 8px 40px rgba(0,16,100,0.14), 0 2px 8px rgba(0,0,0,0.06)" }}
        >
          <p className="text-lg font-bold text-[#191c1f] mb-5">
            Start tracking your assets — get set up in minutes
          </p>
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="flex-1 flex items-center gap-3 border border-gray-300 rounded-lg px-4 py-3 focus-within:border-[#001b94] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <input
                type="email"
                placeholder="e.g. you@yourcompany.com.au"
                className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400 min-w-0"
              />
            </div>
            <Link
              href="/login"
              className="text-sm font-bold text-white px-7 py-3 rounded-full text-center transition-opacity hover:opacity-90 whitespace-nowrap"
              style={{ background: "#001b94" }}
            >
              Get started free
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-bold whitespace-nowrap hover:underline"
              style={{ color: "#001b94" }}
            >
              View pricing plans
            </Link>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
