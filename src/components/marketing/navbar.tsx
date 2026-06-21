"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const NAV_LINKS: [string, string][] = [
  ["#features",     "Features"],
  ["#how-it-works", "How It Works"],
  ["#use-cases",    "Use Cases"],
  ["#pricing",      "Pricing"],
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hidden,     setHidden]     = useState(false);
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
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      {/* ── Cream utility bar — desktop only ── */}
      <div className="hidden lg:block" style={{ background: "#F6F3EE" }}>
        <div className="max-w-7xl mx-auto px-10 h-10 flex items-center justify-end gap-5">
          <Link href="/login" className="text-[13px] font-medium text-shark-600 hover:text-shark-900 transition-colors">
            Sign in
          </Link>
          <span className="h-4 w-px bg-shark-300/60" />
          <div className="flex items-center gap-4 text-shark-500">
            <a href="https://www.linkedin.com" aria-label="LinkedIn" target="_blank" rel="noreferrer" className="hover:text-shark-900 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.07 2.07 0 110-4.14 2.07 2.07 0 010 4.14zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>
            </a>
            <a href="https://x.com" aria-label="X" target="_blank" rel="noreferrer" className="hover:text-shark-900 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.68l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23zm-1.16 17.52h1.83L7.08 4.13H5.12z"/></svg>
            </a>
            <a href="https://www.facebook.com" aria-label="Facebook" target="_blank" rel="noreferrer" className="hover:text-shark-900 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.03 4.39 11.03 10.13 11.93v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8v8.44C19.61 23.1 24 18.1 24 12.07z"/></svg>
            </a>
            <a href="https://www.instagram.com" aria-label="Instagram" target="_blank" rel="noreferrer" className="hover:text-shark-900 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.43.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.43.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.43-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.43-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.78.3-1.45.71-2.12 1.38C1.35 2.68.94 3.35.63 4.14.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.79.72 1.46 1.38 2.13.67.66 1.34 1.07 2.12 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.79-.31 1.46-.72 2.13-1.38.66-.67 1.07-1.34 1.38-2.13.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91-.31-.78-.72-1.45-1.38-2.12-.67-.67-1.34-1.08-2.13-1.39-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1018.16 12 6.16 6.16 0 0012 5.84zM12 16a4 4 0 110-8 4 4 0 010 8zm6.4-10.4a1.44 1.44 0 11-1.44-1.44 1.44 1.44 0 011.44 1.44z"/></svg>
            </a>
          </div>
        </div>
      </div>

      {/* ── Main menu bar ── */}
      <div className="lg:bg-white">
        <div className="relative max-w-7xl mx-3 mt-3 lg:mx-auto lg:mt-0 bg-white lg:bg-transparent rounded-full lg:rounded-none shadow-[0_6px_24px_rgba(0,0,0,0.10)] lg:shadow-none px-5 lg:px-10 h-[52px] lg:h-[88px] flex items-center">

          {/* Logo */}
          <Link href="/welcome" className="shrink-0">
            <img src="/Logotrackio.svg" alt="Trackio" className="h-7 lg:h-[42px] w-auto" />
          </Link>

          {/* Centered nav links — desktop */}
          <div className="hidden lg:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {NAV_LINKS.map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="text-[16px] font-medium text-shark-700 hover:text-shark-900 px-4 py-2 rounded-md hover:bg-shark-50 transition-colors whitespace-nowrap"
              >
                {label}
              </a>
            ))}
          </div>

          {/* Right actions — desktop: search + Get started */}
          <div className="hidden lg:flex items-center gap-3 ml-auto shrink-0">
            <button
              aria-label="Search"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-shark-100 hover:bg-shark-200 text-shark-700 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            </button>
            <GetStartedButton />
          </div>

          {/* Mobile hamburger */}
          <div className="flex-1 lg:hidden" />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 -mr-1 text-shark-600"
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

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden mx-3 mt-2 rounded-2xl bg-white shadow-[0_6px_24px_rgba(0,0,0,0.10)] overflow-hidden">
          <div className="px-6 py-4 space-y-1">
            {NAV_LINKS.map(([href, label]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="block py-2.5 text-[15px] font-medium text-shark-700 hover:text-shark-900"
              >
                {label}
              </a>
            ))}
            <div className="pt-4 border-t border-shark-100 mt-3 flex flex-col gap-2">
              <Link href="/login" className="text-center py-2.5 text-sm font-medium text-shark-600 border border-shark-200 rounded-full">
                Sign in
              </Link>
              <GetStartedButton full />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

function GetStartedButton({ full = false }: { full?: boolean }) {
  return (
    <Link
      href="/login"
      className={`group inline-flex items-center justify-center gap-2.5 rounded-full pl-5 pr-1.5 py-1.5 whitespace-nowrap ${full ? "w-full" : ""}`}
      style={{ background: "#1b1e28" }}
    >
      <span className="text-[14px] font-semibold text-white">Get started free</span>
      <span className="flex items-center justify-center w-8 h-8 rounded-full border-[1.5px] border-[#4d83ff] text-[#4d83ff] transition-[transform,background-color,color] duration-200 group-hover:translate-x-0.5 group-hover:bg-[#4d83ff] group-hover:text-white shrink-0">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </span>
    </Link>
  );
}
