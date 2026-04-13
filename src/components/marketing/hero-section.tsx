"use client";

import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-action-50/40 via-white to-white pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-action-50 border border-action-100 mb-8">
            <span className="w-1.5 h-1.5 rounded-xl bg-action-500" />
            <span className="text-xs font-medium text-action-700 tracking-wide">
              Asset & Supply Tracking Platform
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-shark-900 tracking-tight leading-[1.1] font-exo">
            Know exactly what you have,{" "}
            <span className="text-action-500">where it is,</span>{" "}
            and who has it.
          </h1>

          {/* Subheading */}
          <p className="mt-6 text-lg sm:text-xl text-shark-400 leading-relaxed max-w-2xl mx-auto">
            One clear system to track equipment, manage supplies, and keep
            every location accountable. No spreadsheets. No guesswork.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center text-sm font-medium bg-action-400 text-white px-8 py-3.5 rounded-xl hover:bg-action-500 shadow-sm hover:shadow transition-all hover:-translate-y-px active:scale-[0.97]"
            >
              Get Started Free
              <svg className="ml-2 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto inline-flex items-center justify-center text-sm font-medium text-shark-700 bg-shark-50 border border-shark-200 px-8 py-3.5 rounded-xl hover:bg-shark-100 transition-all"
            >
              See How It Works
            </a>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-16 sm:mt-20">
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <div className="relative mx-auto max-w-5xl">
      {/* Glow effect behind */}
      <div className="absolute -inset-4 bg-gradient-to-b from-action-100/50 to-transparent rounded-3xl blur-2xl pointer-events-none" />

      {/* Browser frame */}
      <div className="relative bg-white rounded-2xl border border-shark-200 shadow-2xl shadow-shark-200/50 overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-shark-100 bg-shark-50/50">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-xl bg-shark-200" />
            <div className="w-2.5 h-2.5 rounded-xl bg-shark-200" />
            <div className="w-2.5 h-2.5 rounded-xl bg-shark-200" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="bg-white rounded-md border border-shark-200 px-4 py-1 text-xs text-shark-400 min-w-[200px] text-center">
              app.trackio.com
            </div>
          </div>
          <div className="w-12" />
        </div>

        {/* App content */}
        <div className="p-4 sm:p-6 bg-shark-50/30">
          <div className="flex gap-4 sm:gap-6">
            {/* Sidebar hint */}
            <div className="hidden sm:flex flex-col gap-2 w-44 shrink-0">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-action-500 text-white shadow-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/></svg>
                <span className="text-xs font-medium">Dashboard</span>
              </div>
              {[
                { icon: "M16.5 9.4l-9-5.19M21 16V8l-9-5-9 5v8l9 5 9-5z", label: "Assets" },
                { icon: "M12 2.69l5.66 5.66a8 8 0 11-11.31 0z", label: "Supplies" },
                { icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2", label: "Staff" },
                { icon: "M9 11l3 3L22 4", label: "Returns" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 px-3 py-2 text-shark-400">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={item.icon}/></svg>
                  <span className="text-xs">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Main content */}
            <div className="flex-1 space-y-4">
              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Total Assets", value: "284", change: "+12", color: "text-action-600" },
                  { label: "Available", value: "196", change: "", color: "text-green-600" },
                  { label: "Assigned", value: "76", change: "", color: "text-blue-600" },
                  { label: "Low Stock", value: "8", change: "", color: "text-amber-600" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-xl border border-shark-100 p-3 sm:p-4">
                    <p className="text-[10px] sm:text-xs text-shark-400 uppercase tracking-wider">{stat.label}</p>
                    <div className="flex items-end gap-1.5 mt-1">
                      <span className={`text-lg sm:text-2xl font-bold ${stat.color}`}>{stat.value}</span>
                      {stat.change && <span className="text-[10px] text-green-500 font-medium mb-0.5">{stat.change}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Table preview */}
              <div className="bg-white rounded-xl border border-shark-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-shark-100 flex items-center justify-between">
                  <p className="text-xs font-semibold text-shark-700">Recent Activity</p>
                  <div className="flex gap-2">
                    <div className="h-6 px-2.5 rounded-md bg-shark-50 border border-shark-100 text-[10px] text-shark-400 flex items-center">All Locations</div>
                  </div>
                </div>
                <div className="divide-y divide-shark-50">
                  {[
                    { action: "Vacuum V200 issued to", who: "Sarah M.", location: "North Branch", status: "Assigned", statusColor: "bg-blue-50 text-blue-600" },
                    { action: "Mop heads restocked at", who: "", location: "Central Office", status: "Restocked", statusColor: "bg-green-50 text-green-600" },
                    { action: "Phone returned by", who: "James K.", location: "East Branch", status: "Available", statusColor: "bg-green-50 text-green-600" },
                    { action: "Low stock alert for", who: "Gloves", location: "South Branch", status: "Low Stock", statusColor: "bg-amber-50 text-amber-600" },
                  ].map((row, i) => (
                    <div key={i} className="px-4 py-2.5 flex items-center gap-3 text-xs">
                      <div className="flex-1 text-shark-600">
                        <span>{row.action} </span>
                        {row.who && <span className="font-medium text-shark-800">{row.who} </span>}
                        <span className="text-shark-400">- {row.location}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-xl text-[10px] font-medium ${row.statusColor}`}>
                        {row.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
