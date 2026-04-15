"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/* ── Swyftx colour palette (NO opacity anywhere) ──
   Dark royal:  #1537E8   (main shapes idle)
   Mid blue:    #1E45F0   (secondary idle)
   Ice blue:    #8BC5F0   (light fills idle)
   Pale ice:    #D4ECFA   (very light fills)
   Orange:      #F06400   (accents, both states)
   Dark orange: #CC5500   (orange shadow)
   Active bg:   #1F3DD9
   Idle bg:     #f0f1f5
   Hover dark:  #3B5BDB   (shapes on blue bg)
   Hover mid:   #6B8FFF   (secondary on blue bg)
   Hover light: #A8D4F5   (light on blue bg)
*/

/* ── Idle illustrations — all use viewBox 0 0 280 280 for uniform sizing ── */
const idleIllustrations = [
  // Getting Started Guide - idle
  (
    <svg viewBox="0 0 280 280" fill="none" className="w-full h-full">
      {/* Back clipboard */}
      <rect x="48" y="48" width="160" height="190" rx="14" fill="#1537E8" transform="rotate(-5 128 143)" />
      {/* Main clipboard */}
      <rect x="62" y="36" width="160" height="190" rx="14" fill="#8BC5F0" />
      {/* Clip */}
      <rect x="104" y="22" width="72" height="26" rx="7" fill="#fff" />
      <rect x="114" y="28" width="52" height="14" rx="5" fill="#1537E8" />
      {/* Checklist rows */}
      <rect x="84" y="72" width="19" height="19" rx="5" fill="#D4ECFA" />
      <path d="M88.5 81.5l4.5 4.5 8-8" stroke="#1537E8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="114" y="76" width="90" height="9" rx="4.5" fill="#fff" />
      <rect x="84" y="104" width="19" height="19" rx="5" fill="#D4ECFA" />
      <path d="M88.5 113.5l4.5 4.5 8-8" stroke="#1537E8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="114" y="108" width="75" height="9" rx="4.5" fill="#fff" />
      <rect x="84" y="136" width="19" height="19" rx="5" fill="#D4ECFA" />
      <path d="M88.5 145.5l4.5 4.5 8-8" stroke="#1537E8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="114" y="140" width="62" height="9" rx="4.5" fill="#fff" />
      <rect x="84" y="168" width="19" height="19" rx="5" fill="#D4ECFA" />
      <rect x="114" y="172" width="82" height="9" rx="4.5" fill="#fff" />
      {/* Pencil */}
      <g transform="translate(195, 100) rotate(25)">
        <rect x="0" y="0" width="14" height="75" rx="3" fill="#F06400" />
        <polygon points="0,75 14,75 7,90" fill="#CC5500" />
        <rect x="0" y="0" width="14" height="14" rx="3" fill="#CC5500" />
        <rect x="3" y="3" width="8" height="5" rx="1.5" fill="#FFB84D" />
      </g>
    </svg>
  ),
  // Video Tutorials - idle (scaled up to match clipboard size)
  (
    <svg viewBox="0 0 280 280" fill="none" className="w-full h-full">
      {/* Monitor body */}
      <rect x="22" y="28" width="230" height="155" rx="16" fill="#1537E8" />
      {/* Screen */}
      <rect x="34" y="40" width="206" height="128" rx="10" fill="#1E45F0" />
      {/* Stand */}
      <rect x="105" y="183" width="64" height="14" rx="5" fill="#1537E8" />
      <rect x="85" y="197" width="104" height="12" rx="6" fill="#1E45F0" />
      {/* Play button */}
      <circle cx="137" cy="100" r="36" fill="#1E45F0" />
      <circle cx="137" cy="100" r="26" fill="#F06400" />
      <polygon points="129,86 129,114 153,100" fill="#fff" />
      {/* Sound bars */}
      <rect x="195" y="72" width="10" height="58" rx="5" fill="#1E45F0" />
      <rect x="212" y="55" width="10" height="75" rx="5" fill="#2B55E0" />
      <rect x="229" y="72" width="10" height="58" rx="5" fill="#1E45F0" />
      {/* Decorative dots */}
      <circle cx="52" cy="55" r="6" fill="#F06400" />
      <circle cx="70" cy="55" r="6" fill="#1E45F0" />
      <circle cx="88" cy="55" r="6" fill="#2B55E0" />
    </svg>
  ),
  // Help Centre - idle (scaled up to match clipboard size)
  (
    <svg viewBox="0 0 280 280" fill="none" className="w-full h-full">
      {/* Open book pages */}
      <path d="M30 210 Q140 182 140 70 Q140 182 250 210 Z" fill="#8BC5F0" />
      <path d="M30 210 Q140 182 140 70" stroke="#1537E8" strokeWidth="3.5" fill="none" />
      <path d="M140 70 Q140 182 250 210" stroke="#1537E8" strokeWidth="3.5" fill="none" />
      {/* Spine */}
      <line x1="140" y1="70" x2="140" y2="216" stroke="#1537E8" strokeWidth="3" />
      {/* Left page lines */}
      <rect x="55" y="118" width="65" height="7" rx="3.5" fill="#fff" />
      <rect x="62" y="136" width="56" height="7" rx="3.5" fill="#fff" />
      <rect x="68" y="154" width="48" height="7" rx="3.5" fill="#fff" />
      {/* Right page lines */}
      <rect x="158" y="118" width="65" height="7" rx="3.5" fill="#fff" />
      <rect x="158" y="136" width="56" height="7" rx="3.5" fill="#fff" />
      <rect x="158" y="154" width="48" height="7" rx="3.5" fill="#fff" />
      {/* Graduation cap */}
      <g transform="translate(112, 5)">
        <polygon points="28,40 -22,58 28,76 78,58" fill="#1E45F0" />
        <polygon points="28,22 -22,42 28,40 78,42" fill="#1537E8" />
        <line x1="68" y1="52" x2="68" y2="78" stroke="#1537E8" strokeWidth="3" />
        <circle cx="68" cy="80" r="5" fill="#1537E8" />
        <rect x="20" y="16" width="16" height="10" rx="2" fill="#F06400" transform="rotate(3 28 22)" />
      </g>
      {/* Magnifier */}
      <g transform="translate(200, 52)">
        <circle cx="18" cy="18" r="24" stroke="#F06400" strokeWidth="4.5" fill="none" />
        <circle cx="18" cy="18" r="17" fill="#D4ECFA" />
        <line x1="35" y1="35" x2="52" y2="52" stroke="#F06400" strokeWidth="6" strokeLinecap="round" />
      </g>
    </svg>
  ),
];

/* ── Hover illustrations — inverted light colours on blue bg ── */
const hoverIllustrations = [
  // Getting Started Guide - hover
  (
    <svg viewBox="0 0 280 280" fill="none" className="w-full h-full">
      {/* Back clipboard */}
      <rect x="48" y="48" width="160" height="190" rx="14" fill="#3B5BDB" transform="rotate(-5 128 143)" />
      {/* Main clipboard */}
      <rect x="62" y="36" width="160" height="190" rx="14" fill="#A8D4F5" />
      {/* Clip */}
      <rect x="104" y="22" width="72" height="26" rx="7" fill="#fff" />
      <rect x="114" y="28" width="52" height="14" rx="5" fill="#6B8FFF" />
      {/* Checklist rows */}
      <rect x="84" y="72" width="19" height="19" rx="5" fill="#D4ECFA" />
      <path d="M88.5 81.5l4.5 4.5 8-8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="114" y="76" width="90" height="9" rx="4.5" fill="#fff" />
      <rect x="84" y="104" width="19" height="19" rx="5" fill="#D4ECFA" />
      <path d="M88.5 113.5l4.5 4.5 8-8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="114" y="108" width="75" height="9" rx="4.5" fill="#fff" />
      <rect x="84" y="136" width="19" height="19" rx="5" fill="#D4ECFA" />
      <path d="M88.5 145.5l4.5 4.5 8-8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="114" y="140" width="62" height="9" rx="4.5" fill="#fff" />
      <rect x="84" y="168" width="19" height="19" rx="5" fill="#D4ECFA" />
      <rect x="114" y="172" width="82" height="9" rx="4.5" fill="#fff" />
      {/* Pencil */}
      <g transform="translate(195, 100) rotate(25)">
        <rect x="0" y="0" width="14" height="75" rx="3" fill="#F06400" />
        <polygon points="0,75 14,75 7,90" fill="#CC5500" />
        <rect x="0" y="0" width="14" height="14" rx="3" fill="#CC5500" />
        <rect x="3" y="3" width="8" height="5" rx="1.5" fill="#FFB84D" />
      </g>
    </svg>
  ),
  // Video Tutorials - hover
  (
    <svg viewBox="0 0 280 280" fill="none" className="w-full h-full">
      {/* Monitor body */}
      <rect x="22" y="28" width="230" height="155" rx="16" fill="#6B8FFF" />
      {/* Screen */}
      <rect x="34" y="40" width="206" height="128" rx="10" fill="#A8D4F5" />
      {/* Stand */}
      <rect x="105" y="183" width="64" height="14" rx="5" fill="#6B8FFF" />
      <rect x="85" y="197" width="104" height="12" rx="6" fill="#8AACFF" />
      {/* Play button */}
      <circle cx="137" cy="100" r="36" fill="#D4ECFA" />
      <circle cx="137" cy="100" r="26" fill="#F06400" />
      <polygon points="129,86 129,114 153,100" fill="#fff" />
      {/* Sound bars */}
      <rect x="195" y="72" width="10" height="58" rx="5" fill="#8AACFF" />
      <rect x="212" y="55" width="10" height="75" rx="5" fill="#A8D4F5" />
      <rect x="229" y="72" width="10" height="58" rx="5" fill="#8AACFF" />
      {/* Decorative dots */}
      <circle cx="52" cy="55" r="6" fill="#F06400" />
      <circle cx="70" cy="55" r="6" fill="#8AACFF" />
      <circle cx="88" cy="55" r="6" fill="#A8D4F5" />
    </svg>
  ),
  // Help Centre - hover
  (
    <svg viewBox="0 0 280 280" fill="none" className="w-full h-full">
      {/* Open book pages */}
      <path d="M30 210 Q140 182 140 70 Q140 182 250 210 Z" fill="#6B8FFF" />
      <path d="M30 210 Q140 182 140 70" stroke="#A8D4F5" strokeWidth="3.5" fill="none" />
      <path d="M140 70 Q140 182 250 210" stroke="#A8D4F5" strokeWidth="3.5" fill="none" />
      {/* Spine */}
      <line x1="140" y1="70" x2="140" y2="216" stroke="#A8D4F5" strokeWidth="3" />
      {/* Left page lines */}
      <rect x="55" y="118" width="65" height="7" rx="3.5" fill="#fff" />
      <rect x="62" y="136" width="56" height="7" rx="3.5" fill="#fff" />
      <rect x="68" y="154" width="48" height="7" rx="3.5" fill="#fff" />
      {/* Right page lines */}
      <rect x="158" y="118" width="65" height="7" rx="3.5" fill="#fff" />
      <rect x="158" y="136" width="56" height="7" rx="3.5" fill="#fff" />
      <rect x="158" y="154" width="48" height="7" rx="3.5" fill="#fff" />
      {/* Graduation cap */}
      <g transform="translate(112, 5)">
        <polygon points="28,40 -22,58 28,76 78,58" fill="#6B8FFF" />
        <polygon points="28,22 -22,42 28,40 78,42" fill="#8AACFF" />
        <line x1="68" y1="52" x2="68" y2="78" stroke="#8AACFF" strokeWidth="3" />
        <circle cx="68" cy="80" r="5" fill="#8AACFF" />
        <rect x="20" y="16" width="16" height="10" rx="2" fill="#F06400" transform="rotate(3 28 22)" />
      </g>
      {/* Magnifier */}
      <g transform="translate(200, 52)">
        <circle cx="18" cy="18" r="24" stroke="#F06400" strokeWidth="4.5" fill="none" />
        <circle cx="18" cy="18" r="17" fill="#D4ECFA" />
        <line x1="35" y1="35" x2="52" y2="52" stroke="#F06400" strokeWidth="6" strokeLinecap="round" />
      </g>
    </svg>
  ),
];

const resources = [
  {
    title: "Getting Started Guide",
    description: "Step-by-step walkthrough to set up your locations, assets, and team",
    href: "/login",
  },
  {
    title: "Video Tutorials",
    description: "Watch short videos to master every feature in trackio",
    href: "/login",
  },
  {
    title: "Help Centre",
    description: "Guides, FAQs, and instructions for navigating trackio",
    href: "mailto:support@trackio.com.au",
  },
];

export function ResourcesSection() {
  const router = useRouter();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);

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
    <section className="py-14 sm:py-20 lg:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-6" ref={sectionRef}>
        {/* Section heading */}
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold font-exo tracking-tight text-shark-900">
            Everything you need to get started
          </h2>
          <p className="mt-4 text-lg text-shark-500 max-w-2xl mx-auto">
            From setup guides to video walkthroughs, we&apos;ve got the resources to help you hit the ground running.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {resources.map((resource, i) => {
            const isActive = i === activeIndex;
            return (
              <button
                key={resource.title}
                type="button"
                onClick={() => {
                  if (resource.href.startsWith("mailto:")) {
                    window.location.href = resource.href;
                  } else {
                    router.push(resource.href);
                  }
                }}
                className="group relative overflow-hidden flex flex-col text-left cursor-pointer"
                style={{
                  background: isActive ? "#1F3DD9" : "#f0f1f5",
                  minHeight: "340px",
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? "translateY(0)" : "translateY(60px)",
                  transition: `background 0.5s ease-out, opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${i * 150}ms, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${i * 150}ms`,
                }}
                onMouseEnter={() => {
                  setActiveIndex(i);
                }}
                onMouseLeave={() => {
                  setActiveIndex(0);
                }}
              >
                {/* Header */}
                <div
                  className="p-5 pb-3 sm:p-7 sm:pb-3"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? "translateY(0)" : "translateY(20px)",
                    transition: `opacity 0.5s ease ${200 + i * 150}ms, transform 0.5s ease ${200 + i * 150}ms`,
                  }}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <h3
                      className="text-2xl font-semibold font-exo tracking-tight transition-colors duration-500"
                      style={{ color: isActive ? "#ffffff" : "#1a1c21" }}
                    >
                      {resource.title}
                    </h3>
                    <svg
                      width="22" height="22" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className="shrink-0 transition-all duration-500"
                      style={{
                        color: isActive ? "rgba(255,255,255,0.6)" : "#94a3b8",
                        transform: isActive ? "translateX(4px)" : "translateX(0)",
                      }}
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                  <p
                    className="text-sm leading-relaxed transition-colors duration-500"
                    style={{ color: isActive ? "rgba(255,255,255,0.7)" : "#94a3b8" }}
                  >
                    {resource.description}
                  </p>
                </div>

                {/* Illustration — idle/active swap like Swyftx */}
                <div
                  className="flex-1 relative"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? "translateY(0)" : "translateY(40px) scale(0.95)",
                    transition: `opacity 0.8s cubic-bezier(0.22,1,0.36,1) ${350 + i * 150}ms, transform 0.8s cubic-bezier(0.22,1,0.36,1) ${350 + i * 150}ms`,
                  }}
                >
                  {/* Idle state — always visible, fades out when active */}
                  <div
                    className="absolute inset-0 flex items-end justify-center px-6 pb-4 transition-opacity duration-500 ease-out"
                    style={{ opacity: isActive ? 0 : 1 }}
                  >
                    {idleIllustrations[i]}
                  </div>
                  {/* Active state — visible when active with scale-up */}
                  <div
                    className="absolute inset-0 flex items-end justify-center px-6 pb-4 transition-all duration-500 ease-out"
                    style={{
                      opacity: isActive ? 1 : 0,
                      transform: isActive ? "scale(1)" : "scale(0.95)",
                    }}
                  >
                    {hoverIllustrations[i]}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
