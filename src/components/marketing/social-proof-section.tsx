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
    color: "bg-action-500",
  },
  {
    quote:
      "Before trackio, restocking was a guessing game. Now we get alerts before anything runs out. Our branch managers love it.",
    name: "James Nguyen",
    role: "Regional Director",
    company: "Pacific Aged Care Group",
    initials: "JN",
    color: "bg-emerald-500",
  },
  {
    quote:
      "Managing 12 locations used to mean endless spreadsheets and phone calls. Now I see everything from one dashboard.",
    name: "Rachel Torres",
    role: "Facilities Lead",
    company: "Horizon Hospitality",
    initials: "RT",
    color: "bg-amber-500",
  },
];

function AnimatedCounter({
  target,
  suffix,
}: {
  target: number;
  suffix: string;
}) {
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
              setCount(
                target % 1 !== 0
                  ? parseFloat(current.toFixed(1))
                  : Math.floor(current)
              );
            }
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, hasAnimated]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

export function SocialProofSection() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-white border-t border-shark-100">
      <div className="max-w-6xl mx-auto px-6">
        {/* Stats bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl sm:text-4xl font-bold text-shark-900 font-exo">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-sm text-shark-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid sm:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <ScrollReveal key={t.name} delay={i * 150}>
            <div
              className="bg-shark-50/50 rounded-2xl p-6 border border-shark-100/80 hover:border-shark-200 hover:shadow-sm transition-all relative h-full"
            >
              {/* Quote mark */}
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                className="text-action-100 mb-3"
              >
                <path
                  d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"
                  fill="currentColor"
                />
                <path
                  d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"
                  fill="currentColor"
                />
              </svg>

              <p className="text-sm text-shark-600 leading-relaxed mb-5">
                &ldquo;{t.quote}&rdquo;
              </p>

              <div className="flex items-center gap-3 pt-4 border-t border-shark-100">
                <div
                  className={`w-9 h-9 rounded-full ${t.color} flex items-center justify-center text-white text-xs font-bold`}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-shark-800">
                    {t.name}
                  </p>
                  <p className="text-[11px] text-shark-400">
                    {t.role}, {t.company}
                  </p>
                </div>
              </div>
            </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10">
          {[
            {
              icon: (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect
                    x="3"
                    y="11"
                    width="18"
                    height="11"
                    rx="2"
                    ry="2"
                  />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              ),
              label: "256-bit SSL encrypted",
            },
            {
              icon: (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              ),
              label: "SOC 2 compliant",
            },
            {
              icon: (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              ),
              label: "99.9% uptime SLA",
            },
            {
              icon: (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87" />
                  <path d="M16 3.13a4 4 0 010 7.75" />
                </svg>
              ),
              label: "Trusted by 500+ teams",
            },
          ].map((badge) => (
            <div
              key={badge.label}
              className="flex items-center gap-2 text-shark-400"
            >
              {badge.icon}
              <span className="text-xs font-medium">{badge.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
