"use client";

import { useEffect, useRef, useState } from "react";

/* ── Idle illustrations (muted ghost, barely visible) ── */
const idleIllustrations = [
  // Getting Started Guide - idle (ghost white on blue)
  (
    <svg viewBox="0 0 280 200" fill="none" className="w-full h-full">
      <rect x="70" y="50" width="120" height="140" rx="8" fill="#fff" opacity="0.06" transform="rotate(-5 130 120)" />
      <rect x="80" y="40" width="120" height="140" rx="8" fill="#fff" opacity="0.1" />
      <rect x="115" y="32" width="50" height="16" rx="4" fill="#fff" opacity="0.12" />
      <rect x="98" y="68" width="12" height="12" rx="3" fill="#fff" opacity="0.08" />
      <rect x="118" y="70" width="65" height="6" rx="3" fill="#fff" opacity="0.06" />
      <rect x="98" y="92" width="12" height="12" rx="3" fill="#fff" opacity="0.08" />
      <rect x="118" y="94" width="55" height="6" rx="3" fill="#fff" opacity="0.06" />
      <rect x="98" y="116" width="12" height="12" rx="3" fill="#fff" opacity="0.08" />
      <rect x="118" y="118" width="45" height="6" rx="3" fill="#fff" opacity="0.06" />
      <rect x="98" y="140" width="12" height="12" rx="3" fill="#fff" opacity="0.05" />
      <rect x="118" y="142" width="60" height="6" rx="3" fill="#fff" opacity="0.04" />
      <g transform="translate(170, 95) rotate(25)">
        <rect x="0" y="0" width="8" height="55" rx="2" fill="#fff" opacity="0.08" />
        <polygon points="0,55 8,55 4,65" fill="#fff" opacity="0.06" />
      </g>
    </svg>
  ),
  // Video Tutorials - idle (ghost blue on gray)
  (
    <svg viewBox="0 0 280 200" fill="none" className="w-full h-full">
      <rect x="55" y="30" width="170" height="110" rx="8" fill="#4C6EF5" opacity="0.04" />
      <rect x="62" y="37" width="156" height="90" rx="4" fill="#4C6EF5" opacity="0.03" />
      <rect x="120" y="140" width="40" height="8" rx="2" fill="#4C6EF5" opacity="0.05" />
      <rect x="105" y="148" width="70" height="6" rx="3" fill="#4C6EF5" opacity="0.04" />
      <circle cx="140" cy="80" r="22" fill="#4C6EF5" opacity="0.04" />
      <circle cx="140" cy="80" r="16" fill="#4C6EF5" opacity="0.06" />
      <polygon points="135,71 135,89 151,80" fill="#4C6EF5" opacity="0.08" />
      {[0, 1, 2, 3, 4].map((j) => (
        <rect key={j} x={185 + j * 12} y={60 + (j % 2 === 0 ? 10 : 0)} width="6" height={40 - (j % 2 === 0 ? 10 : 0)} rx="3" fill="#4C6EF5" opacity="0.04" />
      ))}
    </svg>
  ),
  // Help Centre - idle (ghost blue on gray)
  (
    <svg viewBox="0 0 280 200" fill="none" className="w-full h-full">
      <path d="M60 150 Q140 130 140 60 Q140 130 220 150 Z" fill="#4C6EF5" opacity="0.03" />
      <path d="M60 150 Q140 130 140 60" stroke="#4C6EF5" strokeWidth="1.5" opacity="0.06" fill="none" />
      <path d="M140 60 Q140 130 220 150" stroke="#4C6EF5" strokeWidth="1.5" opacity="0.06" fill="none" />
      <line x1="140" y1="60" x2="140" y2="155" stroke="#4C6EF5" strokeWidth="1" opacity="0.04" />
      <rect x="80" y="95" width="45" height="4" rx="2" fill="#4C6EF5" opacity="0.04" />
      <rect x="85" y="107" width="40" height="4" rx="2" fill="#4C6EF5" opacity="0.03" />
      <rect x="155" y="95" width="45" height="4" rx="2" fill="#4C6EF5" opacity="0.04" />
      <rect x="155" y="107" width="40" height="4" rx="2" fill="#4C6EF5" opacity="0.03" />
      <g transform="translate(130, 20)">
        <polygon points="10,25 -15,35 10,45 35,35" fill="#4C6EF5" opacity="0.06" />
        <polygon points="10,18 -15,28 10,25 35,28" fill="#4C6EF5" opacity="0.08" />
      </g>
      <g transform="translate(190, 55)">
        <circle cx="12" cy="12" r="14" stroke="#4C6EF5" strokeWidth="2" opacity="0.06" fill="none" />
        <line x1="22" y1="22" x2="32" y2="32" stroke="#4C6EF5" strokeWidth="2.5" opacity="0.06" strokeLinecap="round" />
      </g>
    </svg>
  ),
];

/* ── Hover illustrations (bold, vivid, high-contrast — Swyftx-style pop) ── */
const hoverIllustrations = [
  // Getting Started Guide - hover (bold whites + bright orange on blue)
  (
    <svg viewBox="0 0 280 200" fill="none" className="w-full h-full">
      {/* Shadow clipboard */}
      <rect x="65" y="55" width="125" height="145" rx="10" fill="#000" opacity="0.08" transform="rotate(-6 128 128)" />
      {/* Back clipboard */}
      <rect x="68" y="48" width="125" height="145" rx="10" fill="#7B9CFF" opacity="0.5" transform="rotate(-5 130 120)" />
      {/* Main clipboard */}
      <rect x="78" y="38" width="125" height="145" rx="10" fill="#AFC2FF" />
      <rect x="78" y="38" width="125" height="145" rx="10" fill="#fff" opacity="0.7" />
      {/* Clip */}
      <rect x="113" y="28" width="55" height="20" rx="6" fill="#fff" />
      <rect x="120" y="33" width="41" height="11" rx="4" fill="#4C6EF5" opacity="0.6" />
      {/* Checklist rows */}
      <rect x="96" y="68" width="15" height="15" rx="4" fill="#4C6EF5" opacity="0.2" />
      <path d="M100 75.5l3.5 3.5 6-6" stroke="#4C6EF5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="120" y="71" width="70" height="7" rx="3.5" fill="#4C6EF5" opacity="0.15" />

      <rect x="96" y="94" width="15" height="15" rx="4" fill="#4C6EF5" opacity="0.2" />
      <path d="M100 101.5l3.5 3.5 6-6" stroke="#4C6EF5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="120" y="97" width="58" height="7" rx="3.5" fill="#4C6EF5" opacity="0.15" />

      <rect x="96" y="120" width="15" height="15" rx="4" fill="#4C6EF5" opacity="0.2" />
      <path d="M100 127.5l3.5 3.5 6-6" stroke="#4C6EF5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="120" y="123" width="50" height="7" rx="3.5" fill="#4C6EF5" opacity="0.15" />

      <rect x="96" y="146" width="15" height="15" rx="4" fill="#4C6EF5" opacity="0.1" />
      <rect x="120" y="149" width="65" height="7" rx="3.5" fill="#4C6EF5" opacity="0.07" />

      {/* Pencil */}
      <g transform="translate(175, 85) rotate(25)">
        <rect x="-1" y="-2" width="12" height="62" rx="3" fill="#E8590C" opacity="0.15" /> {/* shadow */}
        <rect x="0" y="0" width="10" height="58" rx="3" fill="#F76707" />
        <polygon points="0,58 10,58 5,70" fill="#F76707" opacity="0.9" />
        <rect x="0" y="0" width="10" height="10" rx="3" fill="#E8590C" />
        <rect x="2" y="2" width="6" height="3" rx="1" fill="#fff" opacity="0.3" />
      </g>
      {/* Sparkles */}
      <circle cx="218" cy="50" r="5" fill="#fff" opacity="0.7" />
      <path d="M215 50h6M218 47v6" stroke="#fff" strokeWidth="2" opacity="0.9" />
      <circle cx="60" cy="85" r="4" fill="#fff" opacity="0.4" />
      <circle cx="220" cy="140" r="3" fill="#fff" opacity="0.25" />
    </svg>
  ),
  // Video Tutorials - hover (bold blue monitor + orange play)
  (
    <svg viewBox="0 0 280 200" fill="none" className="w-full h-full">
      {/* Monitor shadow */}
      <rect x="50" y="35" width="180" height="118" rx="12" fill="#1830C0" opacity="0.08" />
      {/* Monitor body */}
      <rect x="45" y="28" width="180" height="118" rx="12" fill="#4C6EF5" opacity="0.25" />
      {/* Screen */}
      <rect x="53" y="36" width="164" height="96" rx="6" fill="#4C6EF5" opacity="0.12" />
      {/* Screen glare */}
      <rect x="53" y="36" width="164" height="48" rx="6" fill="#fff" opacity="0.04" />
      {/* Stand */}
      <rect x="115" y="146" width="50" height="10" rx="3" fill="#4C6EF5" opacity="0.35" />
      <rect x="100" y="156" width="80" height="8" rx="4" fill="#4C6EF5" opacity="0.25" />
      {/* Play button */}
      <circle cx="135" cy="82" r="28" fill="#4C6EF5" opacity="0.2" />
      <circle cx="135" cy="82" r="20" fill="#F76707" opacity="0.9" />
      <polygon points="129,72 129,92 148,82" fill="#fff" />
      {/* Sound bars */}
      {[0, 1, 2, 3, 4].map((j) => (
        <rect key={j} x={182 + j * 14} y={50 + (j === 1 || j === 3 ? 0 : 12)} width="8" height={55 - (j === 1 || j === 3 ? 0 : 12)} rx="4" fill="#4C6EF5" opacity={0.2 + j * 0.08} />
      ))}
      {/* Decorative dots */}
      <circle cx="67" cy="48" r="4" fill="#F76707" opacity="0.7" />
      <circle cx="79" cy="48" r="4" fill="#4C6EF5" opacity="0.4" />
      <circle cx="91" cy="48" r="4" fill="#4C6EF5" opacity="0.25" />
    </svg>
  ),
  // Help Centre - hover (bold book + cap + magnifier)
  (
    <svg viewBox="0 0 280 200" fill="none" className="w-full h-full">
      {/* Book shadow */}
      <path d="M55 158 Q140 138 140 60 Q140 138 225 158 Z" fill="#1830C0" opacity="0.06" />
      {/* Open book pages */}
      <path d="M55 152 Q140 130 140 55 Q140 130 225 152 Z" fill="#4C6EF5" opacity="0.15" />
      <path d="M55 152 Q140 130 140 55" stroke="#4C6EF5" strokeWidth="2" opacity="0.4" fill="none" />
      <path d="M140 55 Q140 130 225 152" stroke="#4C6EF5" strokeWidth="2" opacity="0.4" fill="none" />
      {/* Spine */}
      <line x1="140" y1="55" x2="140" y2="158" stroke="#4C6EF5" strokeWidth="1.5" opacity="0.3" />
      {/* Left page lines */}
      <rect x="75" y="92" width="50" height="5" rx="2.5" fill="#4C6EF5" opacity="0.25" />
      <rect x="80" y="105" width="44" height="5" rx="2.5" fill="#4C6EF5" opacity="0.2" />
      <rect x="84" y="118" width="38" height="5" rx="2.5" fill="#4C6EF5" opacity="0.15" />
      {/* Right page lines */}
      <rect x="155" y="92" width="50" height="5" rx="2.5" fill="#4C6EF5" opacity="0.25" />
      <rect x="155" y="105" width="44" height="5" rx="2.5" fill="#4C6EF5" opacity="0.2" />
      <rect x="155" y="118" width="38" height="5" rx="2.5" fill="#4C6EF5" opacity="0.15" />
      {/* Graduation cap */}
      <g transform="translate(125, 10)">
        {/* Cap base */}
        <polygon points="15,30 -20,42 15,54 50,42" fill="#4C6EF5" opacity="0.55" />
        {/* Cap top */}
        <polygon points="15,18 -20,32 15,30 50,32" fill="#4C6EF5" opacity="0.75" />
        {/* Tassel */}
        <line x1="42" y1="38" x2="42" y2="55" stroke="#4C6EF5" strokeWidth="2" opacity="0.5" />
        <circle cx="42" cy="57" r="3.5" fill="#4C6EF5" opacity="0.5" />
        {/* Orange bar on cap */}
        <rect x="10" y="14" width="10" height="7" rx="1" fill="#F76707" opacity="0.85" transform="rotate(3 15 18)" />
      </g>
      {/* Magnifier */}
      <g transform="translate(188, 45)">
        <circle cx="15" cy="15" r="18" stroke="#F76707" strokeWidth="3" opacity="0.75" fill="none" />
        <circle cx="15" cy="15" r="13" fill="#F76707" opacity="0.12" />
        {/* Glass shine */}
        <path d="M9 9 Q12 6 18 9" stroke="#fff" strokeWidth="1.5" opacity="0.3" fill="none" />
        <line x1="28" y1="28" x2="40" y2="40" stroke="#F76707" strokeWidth="4" opacity="0.75" strokeLinecap="round" />
      </g>
      {/* Sparkle */}
      <circle cx="70" cy="55" r="3" fill="#4C6EF5" opacity="0.3" />
      <circle cx="230" cy="130" r="2.5" fill="#4C6EF5" opacity="0.2" />
    </svg>
  ),
];

const resources = [
  {
    title: "Getting Started Guide",
    description: "Step-by-step walkthrough to set up your locations, assets, and team",
    href: "/login",
    featured: true,
  },
  {
    title: "Video Tutorials",
    description: "Watch short videos to master every feature in Trackio",
    href: "/login",
    featured: false,
  },
  {
    title: "Help Centre",
    description: "Guides, FAQs, and instructions for navigating Trackio",
    href: "mailto:support@trackio.com.au",
    featured: false,
  },
];

export function ResourcesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-6" ref={sectionRef}>
        <div className="grid sm:grid-cols-3 gap-4">
          {resources.map((resource, i) => (
            <a
              key={resource.title}
              href={resource.href}
              className={`group relative overflow-hidden flex flex-col ${
                resource.featured
                  ? "bg-action-600 text-white"
                  : "bg-[#f0f1f5] text-shark-900"
              }`}
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(60px)",
                transition: `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${i * 150}ms, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${i * 150}ms`,
              }}
            >
              {/* Header */}
              <div
                className="p-7 pb-3"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? "translateY(0)" : "translateY(20px)",
                  transition: `opacity 0.5s ease ${200 + i * 150}ms, transform 0.5s ease ${200 + i * 150}ms`,
                }}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className={`text-2xl font-semibold font-exo tracking-tight ${
                    resource.featured ? "text-white" : "text-shark-900"
                  }`}>
                    {resource.title}
                  </h3>
                  <svg
                    width="22" height="22" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className={`shrink-0 transition-transform duration-300 group-hover:translate-x-1.5 ${
                      resource.featured ? "text-white/60" : "text-shark-400"
                    }`}
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
                <p className={`text-sm leading-relaxed ${
                  resource.featured ? "text-white/70" : "text-shark-400"
                }`}>
                  {resource.description}
                </p>
              </div>

              {/* Illustration — idle/hover swap like Swyftx */}
              <div
                className="flex-1 px-6 pb-2 min-h-[240px] flex items-end justify-center relative"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? "translateY(0)" : "translateY(40px) scale(0.95)",
                  transition: `opacity 0.8s cubic-bezier(0.22,1,0.36,1) ${350 + i * 150}ms, transform 0.8s cubic-bezier(0.22,1,0.36,1) ${350 + i * 150}ms`,
                }}
              >
                {/* Idle state — visible by default, hidden on hover */}
                <div className="absolute inset-0 px-6 pb-2 flex items-end justify-center transition-opacity duration-500 ease-out group-hover:opacity-0">
                  {idleIllustrations[i]}
                </div>
                {/* Hover state — hidden by default, visible on hover with scale-up */}
                <div className="absolute inset-0 px-6 pb-2 flex items-end justify-center opacity-0 scale-95 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:scale-100">
                  {hoverIllustrations[i]}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
