"use client";

import Link from "next/link";

function FlipOnce({ text, delay = 0 }: { text: string; delay?: number }) {
  const chars = text.split("");
  return (
    <span className="text-action-500 inline-block" style={{ perspective: "800px" }}>
      {chars.map((char, i) => (
        <span
          key={i}
          className="inline-block animate-[charFlipIn_0.8s_cubic-bezier(0.22,1,0.36,1)_both]"
          style={{
            animationDelay: `${delay + i * 50}ms`,
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
      <section className="relative pt-24 pb-16 sm:pt-40 sm:pb-28 overflow-x-clip bg-white">
        {/* Swyftx-style gradient — warm peach/salmon bottom-left, lavender/periwinkle right */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 90% 80% at -5% 105%, rgba(235,180,175,0.6) 0%, rgba(240,195,185,0.35) 35%, transparent 70%), " +
                "radial-gradient(ellipse 75% 90% at 105% 50%, rgba(195,200,238,0.5) 0%, rgba(210,215,245,0.25) 40%, transparent 70%), " +
                "radial-gradient(ellipse 60% 50% at 40% 105%, rgba(230,195,205,0.25) 0%, transparent 55%)",
            }}
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6">
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
              className="w-full sm:w-auto inline-flex items-center justify-center text-sm font-medium text-shark-600 dark:text-shark-400 bg-white border border-shark-200 px-8 py-3.5 rounded-full hover:bg-shark-50 dark:hover:bg-shark-800 hover:border-shark-300 transition-all"
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
/*  Dashboard showcase — real app screenshot                           */
/* ------------------------------------------------------------------ */
function DashboardShowcase() {
  return (
    <div className="relative mx-auto max-w-5xl">
      {/* Glow */}
      <div className="absolute -inset-8 bg-gradient-to-b from-action-100/60 via-action-50/30 to-transparent rounded-3xl blur-3xl pointer-events-none" />

      {/* Browser chrome frame */}
      <div className="relative z-10 animate-[slideUp_0.7s_ease-out_0.4s_both]">
        <div className="relative bg-white rounded-2xl border border-shark-200 shadow-2xl shadow-shark-300/40 overflow-hidden">

          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/70 to-transparent z-10 pointer-events-none rounded-b-2xl" />

          {/* Browser chrome bar */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-shark-100 bg-shark-50/60">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-300" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="bg-white rounded-md border border-shark-200 px-4 py-1 text-[11px] text-shark-400 min-w-[200px] text-center flex items-center justify-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                app.trackio.au/dashboard
              </div>
            </div>
            <div className="w-12" />
          </div>

          {/* Real app screenshot */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/dashboard-hero.jpg"
            alt="Trackio dashboard"
            draggable={false}
            className="w-full block"
          />
        </div>
      </div>

      {/* Floating: Low stock alert */}
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

      {/* Floating: Asset assigned */}
      <div className="hidden sm:block absolute -left-4 bottom-16 z-20 animate-[floatIn_0.6s_ease-out_1.5s_both]">
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
