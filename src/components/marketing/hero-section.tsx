"use client";

import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden" style={{ minHeight: "860px" }}>
      {/* ── Gradient background ── */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 65% at 105% -5%, rgba(255,55,60,1.0) 0%, rgba(255,90,55,0.90) 40%, transparent 70%), radial-gradient(ellipse 80% 80% at 100% 0%, rgba(255,110,50,0.75) 0%, transparent 65%), linear-gradient(135deg, #7c3aed 0%, #a855f7 15%, #ec4899 35%, #f472b6 50%, #fce7f3 65%, #ffffff 80%, #ffffff 100%)",
        }}
      />
      {/* Bottom white fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />

      {/* ── Full-width layout ── */}
      <div className="relative z-20 flex flex-col lg:flex-row" style={{ minHeight: "920px" }}>

        {/* ── LEFT — text ── */}
        <div className="lg:w-[46%] px-8 lg:pl-16 xl:pl-24 lg:pr-6 pt-44 lg:pt-56 pb-16 lg:pb-0 flex flex-col">
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

          {/* ── Dashboard browser frame — large, bleeds off the right ── */}
          <div
            className="absolute z-10 overflow-hidden rounded-2xl"
            style={{
              left: "30%",
              right: "-480px",
              top: "170px",
              height: "620px",
              boxShadow: "0 2px 4px rgba(10,37,64,0.04), 0 50px 100px -20px rgba(10,37,64,0.14), 0 30px 60px -30px rgba(0,0,0,0.10)",
            }}
          >
            {/* White base */}
            <div className="absolute inset-0 rounded-2xl" style={{ background: "#fff" }} />

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
              style={{ height: "calc(620px - 38px)", objectFit: "cover", objectPosition: "top left" }}
            />
          </div>

          {/* ── Phone — foreground, overlapping left of dashboard ── */}
          <div
            className="absolute z-20 animate-[gentleFloat_6s_ease-in-out_infinite]"
            style={{ left: "2%", top: "205px" }}
          >
            {/* Crop to phone area — SVG viewBox 1024.5×576, phone at ~x:239-406, y:98-446 */}
            {/* At bg-width 1900px: scale=1.854×; phone left≈461, top≈219; bg-pos offsets there */}
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
