"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const NAV_LINKS: [string, string][] = [
  ["#features",     "Features"],
  ["#how-it-works", "How It Works"],
  ["#use-cases",    "Use Cases"],
  ["#pricing",      "Pricing"],
];

const BLUE = "#001b94";

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
      className={`fixed top-0 left-0 right-0 z-50 bg-white transition-transform duration-300 ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
      style={{ borderBottom: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-[68px] flex items-center gap-8">

        {/* Logo */}
        <Link href="/welcome" className="shrink-0">
          <img src="/Logotrackio.svg" alt="Trackio" style={{ height: "36px", width: "auto" }} />
        </Link>

        {/* Nav links — desktop */}
        <div className="hidden lg:flex items-center gap-1 flex-1">
          {NAV_LINKS.map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="text-[14px] font-medium text-shark-600 hover:text-shark-900 px-3.5 py-2 rounded-md hover:bg-shark-50 transition-colors whitespace-nowrap"
            >
              {label}
            </a>
          ))}
        </div>

        {/* Right actions — desktop */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <Link
            href="/login"
            className="text-[14px] font-medium text-shark-600 hover:text-shark-900 px-4 py-2 transition-colors whitespace-nowrap"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="text-[14px] font-semibold text-white px-5 py-2.5 rounded-full transition-all hover:opacity-90 whitespace-nowrap"
            style={{ background: BLUE }}
          >
            Get started free
          </Link>
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

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-shark-100 shadow-lg">
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
              <Link
                href="/login"
                className="text-center text-sm font-semibold text-white py-2.5 rounded-full"
                style={{ background: BLUE }}
              >
                Get started free
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
