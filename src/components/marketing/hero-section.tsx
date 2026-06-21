"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";

const TRUST = ["No credit card required", "Set up in 15 mins"];

type Visual = "devices" | "office";

interface Slide {
  id: string;
  headline: React.ReactNode;
  sub: string;
  visual: Visual;
  image?: string;
  alt?: string;
}

const SLIDES: Slide[] = [
  {
    id: "assets",
    headline: (
      <>
        Tired of chasing<br />
        equipment and{" "}
        <span style={{ color: "#FFD700" }}>emergency restocks?</span>
      </>
    ),
    sub:
      "trackio replaces spreadsheets and clunky apps with one simple system — so your team always knows what's available, where it is, and who has it.",
    visual: "devices",
  },
  {
    id: "team",
    headline: (
      <>
        Keep on top of your<br />
        team <span style={{ color: "#FFD700" }}>from anywhere</span>
      </>
    ),
    sub:
      "See every asset, supply and job across all your sites from one dashboard — at your desk or on your phone, in real time.",
    visual: "office",
    image: "/Office_guy_trackio.png",
    alt: "Manager checking his team's activity on trackio from a laptop",
  },
  {
    id: "trade",
    headline: (
      <>
        Scan it in, scan it out —<br />
        <span style={{ color: "#FFD700" }}>on any job site</span>
      </>
    ),
    sub:
      "Your team tracks every tool and asset from their phone — check gear out to a job and scan it back in. No paperwork.",
    visual: "office",
    image: "/trade_trakio.png",
    alt: "Tradesperson on a job site checking equipment with trackio on a phone",
  },
];

export function HeroSection() {
  const COUNT = SLIDES.length;
  const [active, setActive] = useState(0);
  const [animate, setAnimate] = useState(true);
  const [paused, setPaused] = useState(false);

  // Always advance forward so the track only ever slides to the left.
  const advance = useCallback(() => setActive((a) => (a >= COUNT ? a : a + 1)), [COUNT]);
  const go = useCallback((i: number) => setActive((a) => (i === a % COUNT ? a : a + 1)), [COUNT]);

  // Auto-advance — paused on hover and when the user prefers reduced motion.
  useEffect(() => {
    if (paused) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(advance, 6500);
    return () => clearInterval(id);
  }, [paused, advance]);

  // Landed on the appended clone of slide 1 → let the leftward slide finish,
  // then jump back to the real slide 1 with no transition, so the loop keeps
  // moving left forever instead of snapping back to the right.
  useEffect(() => {
    if (active !== COUNT) return;
    const t = setTimeout(() => {
      setAnimate(false);
      setActive(0);
    }, 1020);
    return () => clearTimeout(t);
  }, [active, COUNT]);

  // Re-enable the transition once the instant snap has painted.
  useEffect(() => {
    if (animate) return;
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
    return () => cancelAnimationFrame(r);
  }, [animate]);

  const realIndex = active % COUNT;
  const RENDER = [...SLIDES, { ...SLIDES[0], id: `${SLIDES[0].id}-loop` }];

  return (
    <>
      <section
        className="lg:pt-[128px] px-0 lg:px-6"
        aria-roledescription="carousel"
        aria-label="trackio highlights"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Rounded, inset hero card (no longer a full-bleed band) */}
        <div className="relative overflow-hidden rounded-none lg:rounded-[40px] mt-0 lg:mt-3">
        {/* ── Solid blue backdrop ── */}
        <div className="absolute inset-0 z-0" style={{ background: "#003DB8" }} />

        {/* ── Sliding track (loops left only) ── */}
        <div
          className="relative flex"
          style={{
            transform: `translateX(-${active * 100}%)`,
            transition: animate ? "transform 1000ms cubic-bezier(0.4,0,0.2,1)" : "none",
            zIndex: 10,
          }}
        >
          {RENDER.map((slide, i) => (
            <div
              key={slide.id}
              className="w-full shrink-0 overflow-hidden"
              role="group"
              aria-roledescription="slide"
              aria-label={`${(i % COUNT) + 1} of ${COUNT}`}
              aria-hidden={i !== active}
            >
              {slide.visual === "devices" ? (
                <DevicesSlide headline={slide.headline} sub={slide.sub} />
              ) : (
                <OfficeSlide headline={slide.headline} sub={slide.sub} image={slide.image ?? "/Office_guy_trackio.png"} alt={slide.alt ?? ""} />
              )}
            </div>
          ))}
        </div>

        {/* ── Controls ── */}
        <div className="absolute z-30 bottom-5 inset-x-0 px-6 flex items-center justify-center gap-4 lg:bottom-12 lg:left-16 xl:left-24 lg:inset-x-auto lg:justify-start lg:px-0">
          <div className="flex items-center gap-2" role="tablist" aria-label="Choose slide">
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                onClick={() => go(i)}
                role="tab"
                aria-selected={i === realIndex}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${i === realIndex ? "w-7 bg-white" : "w-2 bg-white/40 hover:bg-white/70"}`}
              />
            ))}
          </div>
          <button
            onClick={advance}
            aria-label="Next slide"
            className="w-9 h-9 flex items-center justify-center rounded-full border border-white/30 text-white hover:bg-white/15 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
        </div>
      </section>

      {/* ── Overlapping form card ── */}
      <div className="relative mt-6 z-20 px-4 sm:px-6 pb-12">
        <div className="max-w-6xl mx-auto">
          <div
            className="bg-white rounded-2xl px-6 py-6 sm:px-10 sm:py-7"
            style={{ boxShadow: "0 8px 40px rgba(0,16,100,0.14), 0 2px 8px rgba(0,0,0,0.06)" }}
          >
            <p className="text-base sm:text-lg font-bold text-[#191c1f] mb-5">
              Start tracking your assets — get set up in minutes
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="flex-1 flex items-center gap-3 border border-shark-300 rounded-lg px-4 py-3 focus-within:border-[#001b94] transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  type="email"
                  placeholder="you@yourcompany.com.au"
                  className="flex-1 text-sm bg-transparent outline-none text-shark-700 placeholder-shark-400 min-w-0"
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
                className="text-sm font-bold whitespace-nowrap hover:underline text-center sm:text-left"
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

/* ─────────────────────────────────────────────
   Shared headline + sub + trust block
   ───────────────────────────────────────────── */
function HeroCopy({ headline, sub }: { headline: React.ReactNode; sub: string }) {
  return (
    <div className="animate-[fadeInUp_0.6s_ease-out] max-w-xl">
      <h1
        className="text-[2rem] sm:text-5xl lg:text-[3.4rem] font-semibold leading-[1.15] lg:leading-[1.25] tracking-tight text-white"
        style={{ fontFamily: "var(--font-exo, sans-serif)" }}
      >
        {headline}
      </h1>
      <p className="mt-4 sm:mt-6 text-base sm:text-xl font-normal text-white/90 leading-relaxed max-w-lg">{sub}</p>
      <div className="mt-6 sm:mt-8">
        <HeroPillButton href="/login">14-day free trial</HeroPillButton>
      </div>
      <div className="mt-5 sm:mt-6 flex flex-wrap gap-x-6 gap-y-2">
        {TRUST.map((t) => (
          <span key={t} className="flex items-center gap-1.5 text-sm text-white/60">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* nice.com-style white pill with an outlined circular arrow */
function HeroPillButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-3 rounded-full bg-white pl-6 pr-2 py-2 shadow-[0_4px_14px_rgba(0,0,0,0.18)]"
    >
      <span className="text-[15px] font-semibold text-[#16181d]">{children}</span>
      <span className="flex items-center justify-center w-9 h-9 rounded-full border-[1.5px] border-action-400 text-action-400 transition-[transform,background-color,color] duration-200 group-hover:translate-x-0.5 group-hover:bg-action-400 group-hover:text-white">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </span>
    </Link>
  );
}

/* ─────────────────────────────────────────────
   Slide 1 — two-column device-mockup hero
   ───────────────────────────────────────────── */
function DevicesSlide({ headline, sub }: { headline: React.ReactNode; sub: string }) {
  return (
    <div className="relative flex flex-col justify-end lg:flex-row lg:justify-start min-h-[640px] lg:min-h-[740px]">
      {/* Full-bleed background photo — replaces the flat blue for this slide */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/storage.png"
        alt="Organised storage shelves of equipment and supplies"
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{ objectPosition: "center" }}
      />
      {/* Charcoal scrim — same as the other hero slides; keeps the white headline + glass cards legible */}
      <div
        className="absolute inset-0 z-0"
        style={{ background: "linear-gradient(90deg, rgba(24,26,30,0.72) 0%, rgba(24,26,30,0.46) 26%, rgba(24,26,30,0.16) 50%, rgba(24,26,30,0) 70%)" }}
      />

      <div className="relative z-10 lg:w-[55%] px-6 sm:px-8 lg:pl-16 xl:pl-24 lg:pr-6 pb-16 lg:py-0 flex flex-col justify-end lg:justify-center">
        <HeroCopy headline={headline} sub={sub} />
      </div>
      <DeviceVisual />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Slide 2 — full-bleed office photo hero
   ───────────────────────────────────────────── */
function OfficeSlide({ headline, sub, image, alt }: { headline: React.ReactNode; sub: string; image: string; alt: string }) {
  return (
    <div className="relative w-full overflow-hidden min-h-[640px] lg:min-h-[740px] flex items-end lg:items-center">
      {/* Full-bleed photo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt={alt}
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition: "center right" }}
      />

      {/* Subtle charcoal scrim on the left — just enough for legible white text */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(90deg, rgba(24,26,30,0.72) 0%, rgba(24,26,30,0.46) 26%, rgba(24,26,30,0.16) 50%, rgba(24,26,30,0) 70%)" }}
      />

      {/* Copy */}
      <div className="relative w-full px-6 sm:px-8 lg:pl-16 xl:pl-24 lg:pr-6 pb-16 lg:py-0">
        <HeroCopy headline={headline} sub={sub} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Slide 1 visual — device mockups (desktop)
   ───────────────────────────────────────────── */
function DeviceVisual() {
  return (
    <div className="hidden lg:block lg:w-[45%] relative z-10 animate-[fadeInUp_0.8s_ease-out_0.3s_both]">
      {/* Dashboard browser frame */}
      <div
        className="absolute z-10 overflow-hidden p-px"
        style={{
          left: "30%",
          right: "-480px",
          top: "55px",
          height: "660px",
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

      {/* Phone */}
      <div className="absolute z-20 animate-[gentleFloat_6s_ease-in-out_infinite]" style={{ left: "2%", top: "105px" }}>
        <div style={{ width: "264px", height: "560px", background: "#111827", borderRadius: "48px", padding: "10px", boxShadow: "0 0 0 1px rgba(255,255,255,0.12), 0 30px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)", position: "relative" }}>
          <div style={{ position: "absolute", left: "-3px", top: "110px", width: "3px", height: "32px", background: "#1f2937", borderRadius: "2px 0 0 2px" }} />
          <div style={{ position: "absolute", left: "-3px", top: "154px", width: "3px", height: "56px", background: "#1f2937", borderRadius: "2px 0 0 2px" }} />
          <div style={{ position: "absolute", right: "-3px", top: "140px", width: "3px", height: "64px", background: "#1f2937", borderRadius: "0 2px 2px 0" }} />
          <div style={{ width: "100%", height: "100%", borderRadius: "40px", overflow: "hidden", position: "relative", background: "#000" }}>
            <div style={{ position: "absolute", top: "10px", left: "50%", transform: "translateX(-50%)", width: "88px", height: "24px", background: "#000", borderRadius: "12px", zIndex: 10 }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mobile-dashboard-screenshot.jpg" alt="Trackio mobile dashboard" draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }} />
          </div>
        </div>
      </div>

      {/* Floating glass stat cards */}
      <div className="absolute z-30 animate-[gentleFloat_5s_ease-in-out_1s_infinite] p-px" style={{ left: "6%", top: "85px", background: "linear-gradient(135deg, rgba(255,255,255,0.40) 0%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.28) 100%)", borderRadius: "17px", boxShadow: "0 8px 32px rgba(0,0,0,0.30)", minWidth: "150px" }}>
        <div style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderRadius: "16px", padding: "12px 16px", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.40)" }}>
          <p className="text-[10px] font-semibold text-white/80 uppercase tracking-wider">Assets tracked</p>
          <p className="text-2xl font-bold text-white mt-0.5">2,847</p>
          <p className="text-[10px] text-green-300 font-semibold mt-0.5">↑ 12% this month</p>
        </div>
      </div>

      <div className="absolute z-30 animate-[gentleFloat_7s_ease-in-out_2s_infinite] p-px" style={{ left: "16%", top: "445px", background: "linear-gradient(135deg, rgba(255,255,255,0.40) 0%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.28) 100%)", borderRadius: "17px", boxShadow: "0 8px 32px rgba(0,0,0,0.30)", minWidth: "150px" }}>
        <div style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderRadius: "16px", padding: "12px 16px", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.40)" }}>
          <p className="text-[10px] font-semibold text-white/80 uppercase tracking-wider">Locations</p>
          <p className="text-2xl font-bold text-white mt-0.5">34</p>
          <p className="text-[10px] font-semibold mt-0.5" style={{ color: "#bfdbfe" }}>All synced live</p>
        </div>
      </div>
    </div>
  );
}
