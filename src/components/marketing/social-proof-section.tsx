"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollReveal } from "./scroll-reveal";

const BLUE = "#001b94";

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
    role: "Operations Manager, CleanForce",
    initials: "SM",
  },
  {
    quote:
      "The simplest system we've ever rolled out. Our field techs actually use it because it takes 5 seconds.",
    name: "James Davies",
    role: "Director, JD Plumbing",
    initials: "JD",
  },
  {
    quote:
      "We used to spend hours every Friday tracking down where tools were left. Now it's right on the dashboard.",
    name: "Mark Peters",
    role: "Site Supervisor, BuildRight",
    initials: "MP",
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
    <section className="py-16 sm:py-24 px-6 bg-shark-50">
      <div className="max-w-6xl mx-auto">

        {/* Stats — white card */}
        <ScrollReveal>
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center mb-12 sm:mb-16 md:mb-20 bg-white p-8 sm:p-10 md:p-12 rounded-2xl border border-shark-100"
            style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
          >
            {stats.map((stat, i) => (
              <div key={stat.label} className="relative">
                {i < stats.length - 1 && (
                  <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-10 bg-shark-200" />
                )}
                <p className="text-5xl md:text-6xl font-bold tracking-tight mb-4" style={{ color: BLUE }}>
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-xs font-bold text-shark-500 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Testimonials */}
        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((t, i) => (
            <ScrollReveal key={t.name} delay={i * 150}>
              <div
                className="bg-white p-8 sm:p-10 rounded-2xl border border-shark-100 relative flex flex-col h-full"
                style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
              >
                {/* Large decorative quote mark */}
                <svg
                  className="w-10 h-10 text-shark-100 absolute top-6 right-6 sm:top-8 sm:right-8"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>

                <p className="text-shark-900 text-xl mb-10 leading-relaxed italic font-light relative z-10 flex-1">
                  &ldquo;{t.quote}&rdquo;
                </p>

                <div className="flex items-center gap-5 mt-auto">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl text-white shrink-0"
                    style={{ background: BLUE }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <div className="font-bold text-[#191c1f] text-lg">{t.name}</div>
                    <div className="text-base text-shark-500">{t.role}</div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

      </div>
    </section>
  );
}
