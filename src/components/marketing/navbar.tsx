"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-xl shadow-[0_1px_0_0_rgba(0,0,0,0.04)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 sm:h-24 flex items-center justify-between">
        {/* Logo */}
        <Link href="/welcome" className="flex items-center gap-2.5">
          <img
            src="/Logotrackio.svg"
            alt="trackio"
            className="w-auto h-10 sm:h-[60px]"
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-shark-500 dark:text-shark-400 hover:text-shark-900 transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="text-sm text-shark-500 dark:text-shark-400 hover:text-shark-900 transition-colors">
            How It Works
          </a>
          <a href="#use-cases" className="text-sm text-shark-500 dark:text-shark-400 hover:text-shark-900 transition-colors">
            Use Cases
          </a>
          <a href="#pricing" className="text-sm text-shark-500 dark:text-shark-400 hover:text-shark-900 transition-colors">
            Pricing
          </a>
          <div className="w-px h-5 bg-shark-200 dark:bg-shark-700" />
          <Link
            href="/login"
            className="text-sm font-medium text-shark-700 hover:text-shark-900 transition-colors"
          >
            Sign In
          </Link>
          <span className="cta-border-wrap inline-block hover:-translate-y-px active:scale-[0.97] transition-all">
            <Link
              href="/login"
              className="block text-sm font-medium text-white bg-action-500 px-5 py-2 rounded-full hover:bg-action-600 transition-colors"
            >
              Start Free Trial
            </Link>
          </span>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 -mr-2 text-shark-600 dark:text-shark-400"
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
        <div className="md:hidden bg-white border-t border-shark-100 dark:border-shark-800 shadow-lg animate-fade-in">
          <div className="px-6 py-4 space-y-1">
            <a href="#features" onClick={() => setMobileOpen(false)} className="block py-2.5 text-sm text-shark-600 dark:text-shark-400 hover:text-shark-900">Features</a>
            <a href="#how-it-works" onClick={() => setMobileOpen(false)} className="block py-2.5 text-sm text-shark-600 dark:text-shark-400 hover:text-shark-900">How It Works</a>
            <a href="#use-cases" onClick={() => setMobileOpen(false)} className="block py-2.5 text-sm text-shark-600 dark:text-shark-400 hover:text-shark-900">Use Cases</a>
            <a href="#pricing" onClick={() => setMobileOpen(false)} className="block py-2.5 text-sm text-shark-600 dark:text-shark-400 hover:text-shark-900">Pricing</a>
            <div className="pt-3 border-t border-shark-100 dark:border-shark-800 mt-3 space-y-2">
              <Link href="/login" className="block py-2.5 text-sm font-medium text-shark-700">Sign In</Link>
              <div className="cta-border-wrap block">
                <Link href="/login" className="block text-center text-sm font-medium bg-action-500 text-white px-5 py-2.5 rounded-full">Start Free Trial</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
