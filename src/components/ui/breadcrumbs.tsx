"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBreadcrumbOverrides } from "@/components/ui/breadcrumb-context";

const staticOverrides: Record<string, string> = {
  "inventory":        "Inventory",
  "consumables":      "Supplies",
  "purchase-orders":  "Purchase Orders",
  "my-assets":        "My Assets",
  "my-consumables":   "My Supplies",
  "condition-checks": "Inspections",
  "starter-kits":     "Starter Kits",
  "admin":            "Admin",
  "dashboard":        "Dashboard",
  "alerts":           "Alerts",
  "reports":          "Reports",
  "maintenance":      "Maintenance",
  "returns":          "Returns",
  "staff":            "Staff",
  "settings":         "Settings",
  "activity":         "Activity Log",
  "scan":             "Scan QR",
};

function toLabel(segment: string, dynamicOverrides: Record<string, string>): string {
  if (dynamicOverrides[segment]) return dynamicOverrides[segment];
  if (staticOverrides[segment]) return staticOverrides[segment];
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const dynamicOverrides = useBreadcrumbOverrides();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = segments.map((seg, i) => ({
    label: toLabel(seg, dynamicOverrides),
    href:  "/" + segments.slice(0, i + 1).join("/"),
  }));

  const pageTitle    = crumbs[crumbs.length - 1].label;
  const parentCrumbs = crumbs.slice(0, -1);

  return (
    <div className="mb-6 lg:mb-8">
      {/* Small parent breadcrumb trail */}
      {parentCrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-1.5">
          <ol className="flex items-center gap-1.5 text-xs text-shark-400">
            <li>
              <Link href="/dashboard" className="hover:text-[#0071e3] transition-colors">
                Home
              </Link>
            </li>
            {parentCrumbs.map((crumb) => (
              <li key={crumb.href} className="flex items-center gap-1.5">
                <svg
                  width="10" height="10" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"
                  className="text-shark-300 flex-shrink-0"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
                <Link href={crumb.href} className="hover:text-[#0071e3] transition-colors">
                  {crumb.label}
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Samsung One UI — large bold page title */}
      <h1 className="text-[28px] sm:text-[32px] font-bold text-shark-900 dark:text-white leading-tight tracking-tight">
        {pageTitle}
      </h1>
    </div>
  );
}
