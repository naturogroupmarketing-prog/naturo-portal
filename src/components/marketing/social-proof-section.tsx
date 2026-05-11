"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollReveal } from "./scroll-reveal";

const stats = [
  { value: 500, suffix: "+", label: "Teams tracking smarter" },
  { value: 45, suffix: "k+", label: "Assets under management" },
  { value: 99.9, suffix: "%", label: "Uptime reliability" },
  { value: 4.9, suffix: "/5", label: "Average user rating" },
];

const testimonials = [
  {
    quote:
      "We cut equipment losses by over 40% in the first three months. trackio paid for itself in weeks.",
    name: "Sarah Mitchell",
    role: "Operations Manager",
    company: "CleanForce Services",
    initials: "SM",
    color: "#002FA0",
  },
  {
    quote:
      "Before trackio, restocking was a guessing game. Now we get alerts before anything runs out. Our branch managers love it.",
    name: "James Nguyen",
    role: "Regional Director",
    company: "Pacific Aged Care Group",
    initials: "JN",
    color: "#0570EB",
  },
  {
    quote:
      "Managing 12 locations used to mean endless spreadsheets and phone calls. Now I see everything from one dashboard.",
    name: "Rachel Torres",
    role: "Facilities Lead",
    company: "Horizon Hospitality",
    initials: "RT",
    color: "#FFD700",
    textColor: "#003AB0",
  },
];

function AnimatedCounter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const duration = 1800;
          const steps = 40;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(target % 1 !== 0 ? parseFloat(current.toFixed(1)) : Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, hasAnimated]);

  return <span ref={ref}>{count}{suffix}</span>;
}

export function SocialProofSection() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-6">

        {/* Stats bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10 mb-20">
          {stats.map((stat, i) => (
            <div key={stat.label} className="text-center relative">
              {i < stats.length - 1 && (
                <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-10 bg-gray-200" />
              )}
              <p
                className="text-5xl sm:text-6xl font-bold tracking-tight"
                style={{ color: "#002FA0", fontFamily: "var(--font-exo, sans-serif)" }}
              >
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-sm text-gray-500 mt-2 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid sm:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <ScrollReveal key={t.name} delay={i * 150}>
              <div className="bg-white rounded-3xl p-7 border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 h-full flex flex-col">
                {/* Quote mark */}
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="mb-4 shrink-0" style={{ color: "#002FA0", opacity: 0.18 }}>
                  <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" fill="currentColor" />
                  <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" fill="currentColor" />
                </svg>

                <p className="text-sm text-gray-600 leading-relaxed flex-1 mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>

                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: t.color, color: t.textColor ?? "#fff" }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-[11px] text-gray-400">{t.role}, {t.company}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-8 sm:gap-12">
          {[
            {
              icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>,
              label: "256-bit SSL encrypted",
            },
            {
              icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
              label: "SOC 2 compliant",
            },
            {
              icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
              label: "99.9% uptime SLA",
            },
            {
              icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>,
              label: "Trusted by 500+ teams",
            },
          ].map((badge) => (
            <div key={badge.label} className="flex items-center gap-2 text-gray-400">
              {badge.icon}
              <span className="text-xs font-medium">{badge.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
