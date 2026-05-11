"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const TOP_TABS = [
  { id: "individuals", label: "Individuals" },
  { id: "teams",       label: "Teams" },
  { id: "enterprise",  label: "Enterprise" },
];

const SUB_NAV: [string, string][] = [
  ["#features",     "Features"],
  ["#how-it-works", "How It Works"],
  ["#use-cases",    "Use Cases"],
  ["#pricing",      "Pricing"],
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hidden,     setHidden]     = useState(false);
  const [activeTop,  setActiveTop]  = useState("teams");
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y > lastScrollY.current && y > 80) {
        setHidden(true);
        setMobileOpen(false);
      } else {
        setHidden(false);
      }
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 bg-white transition-transform duration-300 ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
      style={{ borderBottom: "3px solid #1432CC" }}
    >
      {/* ── ROW 1: white — Logo · audience tabs · utility actions ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-10 h-[90px] flex items-center gap-8">

          {/* Logo */}
          <Link href="/welcome" className="shrink-0 w-[200px]">
            <img src="/Logotrackio.svg" alt="Trackio" style={{ height: "90px", width: "auto" }} />
          </Link>

          {/* Audience tabs */}
          <div className="hidden md:flex items-center gap-0.5">
            {TOP_TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveTop(id)}
                className={`text-[14px] leading-none px-4 py-1.5 rounded-full transition-colors whitespace-nowrap ${
                  activeTop === id
                    ? "bg-gray-100 text-gray-900 font-semibold"
                    : "font-normal text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Utility links + Sign in CTA */}
          <div className="hidden md:flex items-center gap-0">
            <a
              href="#"
              className="text-[14px] font-normal text-gray-700 hover:text-gray-900 px-4 py-2 transition-colors whitespace-nowrap"
            >
              About
            </a>
            <a
              href="#"
              className="text-[14px] font-normal text-gray-700 hover:text-gray-900 px-4 py-2 transition-colors whitespace-nowrap"
            >
              Help &amp; Support
            </a>
            <Link
              href="/login"
              className="ml-3 flex items-center gap-1.5 text-[14px] font-semibold text-white px-5 py-2 rounded-full transition-all hover:opacity-90 whitespace-nowrap"
              style={{ background: "#002FA0" }}
            >
              Sign in
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 -mr-2 text-gray-600"
            aria-label="Toggle menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
              {mobileOpen ? (
                <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
              ) : (
                <><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* ── ROW 2: gray — product sub-nav · search ── */}
      <div className="hidden md:block" style={{ background: "#f4f5f7" }}>
        <div className="px-4 sm:px-6 lg:px-10 h-[64px] flex items-center">
          {/* Invisible spacer — same width as logo + gap so sub-nav aligns with audience tabs */}
          <div className="hidden lg:block shrink-0" style={{ width: "calc(200px + 2rem)" }} />
          {SUB_NAV.map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="text-[16px] font-semibold text-gray-700 hover:text-gray-900 px-6 py-4 hover:bg-gray-200/60 transition-colors whitespace-nowrap rounded"
            >
              {label}
            </a>
          ))}

          <div className="flex-1" />

          {/* Search — blue, AGL-style */}
          <button
            className="flex items-center gap-1.5 text-[16px] font-semibold transition-colors px-4 py-4 rounded hover:bg-gray-200/60"
            style={{ color: "#1432CC" }}
            aria-label="Search"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            Search
          </button>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-6 py-4 space-y-1">

            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">I&apos;m looking for</p>
            <div className="flex gap-2 flex-wrap mb-3">
              {TOP_TABS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTop(id)}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                    activeTop === id
                      ? "bg-gray-100 border-gray-300 text-gray-900 font-semibold"
                      : "border-gray-200 text-gray-500 font-normal"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-0.5">
              {SUB_NAV.map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="block py-2.5 text-[14px] font-semibold text-gray-700 hover:text-gray-900"
                >
                  {label}
                </a>
              ))}
            </div>

            <div className="pt-3 border-t border-gray-200 mt-3 space-y-2">
              <Link href="/login" className="block py-2.5 text-sm font-medium text-gray-700">Help &amp; Support</Link>
              <Link
                href="/login"
                className="flex items-center justify-center gap-1.5 text-sm font-semibold text-white px-5 py-2.5 rounded-full"
                style={{ background: "#002FA0" }}
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
