"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const steps = [
  {
    title: "Add your locations",
    description:
      "Set up branches in seconds. Assign managers, define inventory needs, and organise by state or region.",
    icon: (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        <circle cx="19" cy="5" r="3" strokeWidth="1.25" />
        <path d="M19 3.5v3M17.5 5h3" strokeWidth="1.25" />
      </svg>
    ),
    visual: (
      <div className="space-y-3 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-action-50 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b5bdb" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <div>
            <p className="text-sm font-bold text-shark-900">Your Locations</p>
            <p className="text-[11px] text-shark-400">3 states · 8 branches</p>
          </div>
        </div>
        {[
          { state: "New South Wales", count: 4, color: "bg-blue-500" },
          { state: "Victoria", count: 2, color: "bg-action-500" },
          { state: "Queensland", count: 2, color: "bg-amber-500" },
        ].map((s) => (
          <div key={s.state} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-shark-100">
            <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
            <span className="text-sm font-medium text-shark-800 flex-1">{s.state}</span>
            <span className="text-xs text-shark-400">{s.count} locations</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Track every asset",
    description:
      "Assign equipment to staff with a clear owner, status, and location. Nothing goes unaccounted for.",
    icon: (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="18" rx="2" />
        <path d="M2 8h20" />
        <path d="M9 8v13" />
        <circle cx="5.5" cy="5.5" r="1" fill="currentColor" stroke="none" />
        <circle cx="5.5" cy="12" r="1" fill="currentColor" stroke="none" />
        <circle cx="5.5" cy="16" r="1" fill="currentColor" stroke="none" />
        <path d="M12 12h7M12 16h5" />
      </svg>
    ),
    visual: (
      <div className="space-y-2.5 p-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-shark-900">Assets</p>
          <span className="text-[10px] font-medium text-shark-400 bg-shark-50 px-2 py-0.5 rounded-full">255 total</span>
        </div>
        {[
          { name: "Vacuum V200", assignee: "Sarah M.", status: "Assigned", statusColor: "bg-blue-500" },
          { name: "Floor Polisher X1", assignee: "James T.", status: "Assigned", statusColor: "bg-blue-500" },
          { name: "Steam Cleaner Pro", assignee: "—", status: "Available", statusColor: "bg-green-500" },
          { name: "Carpet Extractor", assignee: "—", status: "Damaged", statusColor: "bg-red-500" },
          { name: "Window Kit #3", assignee: "Mia L.", status: "Checked Out", statusColor: "bg-amber-500" },
        ].map((a) => (
          <div key={a.name} className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-shark-100">
            <div className="w-8 h-8 rounded-lg bg-shark-50 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-shark-800 truncate">{a.name}</p>
              <p className="text-[10px] text-shark-400">{a.assignee}</p>
            </div>
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${a.statusColor}`} />
              <span className="text-[10px] font-medium text-shark-500">{a.status}</span>
            </span>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Get alerts instantly",
    description:
      "Low stock warnings, damage reports, and return notifications arrive the moment they happen.",
    icon: (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
        <circle cx="18" cy="4" r="3" fill="currentColor" stroke="none" />
      </svg>
    ),
    visual: (
      <div className="space-y-2.5 p-6">
        <p className="text-sm font-bold text-shark-900 mb-3">Notifications</p>
        {[
          { type: "Low Stock", msg: "Gloves below threshold at South Branch", time: "2 min ago", color: "bg-amber-500", bgColor: "bg-amber-50" },
          { type: "Damage Report", msg: "Vacuum V200 reported damaged by Sarah M.", time: "15 min ago", color: "bg-red-500", bgColor: "bg-red-50" },
          { type: "Return Due", msg: "Floor Polisher X1 due back from James T.", time: "1 hour ago", color: "bg-blue-500", bgColor: "bg-blue-50" },
          { type: "New Request", msg: "Mia L. requested 50x bin liners", time: "2 hours ago", color: "bg-action-500", bgColor: "bg-action-50" },
        ].map((n) => (
          <div key={n.msg} className="flex items-start gap-3 p-3 rounded-xl bg-white border border-shark-100">
            <div className={`w-8 h-8 rounded-lg ${n.bgColor} flex items-center justify-center shrink-0`}>
              <div className={`w-2 h-2 rounded-full ${n.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-shark-800">{n.type}</p>
              <p className="text-[10px] text-shark-400 leading-snug">{n.msg}</p>
            </div>
            <span className="text-[9px] text-shark-300 whitespace-nowrap shrink-0">{n.time}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Stay in control",
    description:
      "One dashboard for every branch. See operations health, financials, and team activity at a glance.",
    icon: (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <path d="M6.5 6.5h0M17.5 6.5h0M6.5 17.5h0" strokeWidth="2" strokeLinecap="round" />
        <polyline points="15.5 16 17 18 20 15.5" strokeWidth="1.25" />
      </svg>
    ),
    visual: (
      <div className="p-6 space-y-3">
        <p className="text-sm font-bold text-shark-900 mb-3">Operations Overview</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Assets", value: "255", trend: "+12%" },
            { label: "Supplies", value: "524", trend: "+8%" },
            { label: "Staff", value: "42", trend: "+3" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-shark-100 p-2.5 text-center">
              <p className="text-lg font-bold text-shark-900">{s.value}</p>
              <p className="text-[9px] text-shark-400">{s.label}</p>
              <p className="text-[9px] text-green-500 font-medium">{s.trend}</p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-shark-100 p-3 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center text-white text-lg font-bold">94</div>
          <div>
            <p className="text-[12px] font-semibold text-shark-800">Operations Health</p>
            <p className="text-[10px] text-shark-400">All branches performing well</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-shark-100 p-3">
          <p className="text-[11px] font-semibold text-shark-700 mb-2">Asset Utilisation by Branch</p>
          <div className="space-y-1.5">
            {[
              { branch: "North", pct: 88 },
              { branch: "Central", pct: 76 },
              { branch: "East", pct: 92 },
              { branch: "South", pct: 65 },
            ].map((b) => (
              <div key={b.branch} className="flex items-center gap-2">
                <span className="text-[9px] text-shark-500 w-10">{b.branch}</span>
                <div className="flex-1 h-2 bg-shark-50 rounded-full overflow-hidden">
                  <div className="h-full bg-action-500 rounded-full" style={{ width: `${b.pct}%` }} />
                </div>
                <span className="text-[9px] text-shark-500 w-7 text-right">{b.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
];

const STEP_DURATION = 5000;

export function ShowcaseSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  // Trigger CSS progress animation on mount & step change
  useEffect(() => {
    const kickoff = setTimeout(() => setAnimating(true), 50);
    return () => clearTimeout(kickoff);
  }, [activeIndex]);

  // Auto-advance after STEP_DURATION
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimating(false);
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % steps.length);
      }, 80);
    }, STEP_DURATION);
    return () => clearTimeout(timer);
  }, [activeIndex]);

  const handleClick = (i: number) => {
    setAnimating(false);
    setTimeout(() => {
      setActiveIndex(i);
    }, 50);
  };

  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-shark-50/40 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs font-semibold text-action-500 uppercase tracking-widest mb-4">
            How It Works
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-shark-900 tracking-tight font-exo leading-tight">
            Up and running in minutes.
          </h2>
          <p className="mt-4 text-shark-400 text-lg">
            No complex setup. No training manuals. Just a clear system that
            works.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* LEFT — Visual mockup */}
          <div className="relative order-2 lg:order-1">
            <div className="absolute -inset-6 bg-gradient-to-br from-action-100/40 via-action-50/20 to-transparent rounded-3xl blur-2xl pointer-events-none" />

            <div className="relative">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className={`transition-opacity duration-500 ease-out ${
                    i === activeIndex
                      ? "opacity-100 relative"
                      : "opacity-0 absolute inset-0 pointer-events-none"
                  }`}
                >
                  <div className="bg-white rounded-2xl border border-shark-200 shadow-xl shadow-shark-200/30 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2 border-b border-shark-100 bg-shark-50/50">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-300" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
                      </div>
                      <div className="flex-1 flex justify-center">
                        <div className="bg-white rounded-md border border-shark-200 px-3 py-0.5 text-[10px] text-shark-400 flex items-center gap-1.5">
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                          app.trackio.com
                        </div>
                      </div>
                    </div>
                    <div className="bg-shark-50/30 min-h-[340px]">
                      {step.visual}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Steps (Swyftx-style) */}
          <div className="space-y-0 order-1 lg:order-2">
            {steps.map((step, i) => {
              const isActive = i === activeIndex;
              return (
                <button
                  key={i}
                  onClick={() => handleClick(i)}
                  className={`relative w-full text-left transition-colors duration-500 ease-out overflow-hidden ${
                    isActive
                      ? "bg-action-500"
                      : "bg-transparent hover:bg-shark-100/50"
                  }`}
                >
                  {/* Orange progress line at bottom of active step */}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px]">
                      <div
                        className="h-full bg-orange-400"
                        style={{
                          width: animating ? "100%" : "0%",
                          transition: animating
                            ? `width ${STEP_DURATION}ms linear`
                            : "none",
                        }}
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-5 px-6 py-5">
                    {/* Icon — standalone, Swyftx-style */}
                    <div className={`shrink-0 transition-colors duration-500 ${
                      isActive ? "text-white" : "text-action-400"
                    }`}>
                      {step.icon}
                    </div>

                    <h3 className={`text-lg font-semibold transition-colors duration-500 ${
                      isActive ? "text-white" : "text-shark-900"
                    }`}>
                      {step.title}
                    </h3>
                  </div>

                  {/* Separator line between steps */}
                  {!isActive && (
                    <div className="absolute bottom-0 left-6 right-6 h-px bg-shark-200/60" />
                  )}
                </button>
              );
            })}

            <div className="pt-6">
              <Link
                href="/login"
                className="inline-flex items-center justify-center text-sm font-medium bg-action-500 text-white px-8 py-3.5 rounded-full hover:bg-action-600 transition-all hover:-translate-y-px hover:shadow-lg active:scale-[0.97]"
              >
                Start Your Free Trial
                <svg className="ml-2 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
