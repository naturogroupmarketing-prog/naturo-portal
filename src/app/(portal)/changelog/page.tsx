import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Icon, type IconName } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";

interface Release {
  version: string;
  date: string;
  tag: "new" | "improved" | "fixed";
  title: string;
  changes: string[];
  icon: IconName;
}

const RELEASES: Release[] = [
  {
    version: "2.5.0",
    date: "5 April 2026",
    tag: "new",
    title: "Premium Features & Security Hardening",
    icon: "shield",
    changes: [
      "Two-factor authentication (MFA) with authenticator apps",
      "Sentry error tracking for production monitoring",
      "Playwright E2E test suite (21 automated tests)",
      "Framer Motion page animations with staggered card entrances",
      "Enhanced offline PWA mode with smart caching",
      "Onboarding tour for first-time users",
      "Vercel Analytics & Web Vitals monitoring",
      "Command palette (Cmd+K) for instant navigation",
    ],
  },
  {
    version: "2.4.0",
    date: "4 April 2026",
    tag: "improved",
    title: "Privacy Act 1988 Compliance",
    icon: "lock",
    changes: [
      "Full Privacy Policy page covering all 13 Australian Privacy Principles",
      "Cookie consent banner with Accept All / Essential Only",
      "User data export (Download My Data as JSON)",
      "Self-service profile editing (name, email, phone)",
      "Account deletion request with admin notification",
      "Security event logging and brute-force detection",
      "Account lockout after 5 failed login attempts",
      "Session invalidation on password change",
    ],
  },
  {
    version: "2.3.0",
    date: "3 April 2026",
    tag: "new",
    title: "Monthly Condition Checks & AI Region Filtering",
    icon: "search",
    changes: [
      "Monthly photo inspections — staff photograph assigned equipment",
      "Manager review page with photo grid and condition badges",
      "Inspection configuration — super admin chooses which categories need photos",
      "AI assistant: filter by region, compare locations, create consumables",
      "list_regions and compare_regions AI tools",
    ],
  },
  {
    version: "2.2.0",
    date: "2 April 2026",
    tag: "improved",
    title: "Performance & UX Improvements",
    icon: "settings",
    changes: [
      "Batch server actions — kit receipt and returns process in single transaction",
      "Auto-generated purchase orders when stock falls below threshold",
      "Column visibility saved to localStorage",
      "Animated stat counters on dashboard",
      "Database indexes for faster queries",
      "Lazy-loaded QR scanner (100KB smaller bundle)",
    ],
  },
  {
    version: "2.1.0",
    date: "1 April 2026",
    tag: "fixed",
    title: "Bug Fixes & Polish",
    icon: "check-circle",
    changes: [
      "Fixed modal stealing focus from inputs on every keystroke",
      "Fixed consumable photo disappearing when changing category",
      "Fixed double-click on stock add/deduct submitting twice",
      "Fixed Neon compatibility — removed interactive transactions",
      "Added toast notifications replacing alert() calls",
    ],
  },
];

export default async function ChangelogPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-shark-900">What&apos;s New</h1>
        <p className="text-sm text-shark-400 mt-1">Latest updates and improvements to Trackio</p>
      </div>

      <div className="space-y-4">
        {RELEASES.map((release, idx) => (
          <Card key={release.version}>
            <div className="px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-action-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon name={release.icon} size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-semibold text-shark-900">{release.title}</h3>
                    <Badge status={release.tag === "new" ? "AVAILABLE" : release.tag === "improved" ? "ASSIGNED" : "PENDING_RETURN"} />
                  </div>
                  <p className="text-xs text-shark-400 mt-0.5">v{release.version} &middot; {release.date}</p>
                  <ul className="mt-3 space-y-1.5">
                    {release.changes.map((change, i) => (
                      <li key={i} className="text-sm text-shark-600 flex items-start gap-2">
                        <Icon name="check" size={14} className="text-action-500 shrink-0 mt-0.5" />
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
