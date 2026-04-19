"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBreadcrumbOverrides } from "@/components/ui/breadcrumb-context";

const staticOverrides: Record<string, string> = {
  "inventory": "Choose your location",
  "purchase-orders": "Purchase Orders",
  "my-assets": "My Assets",
  "my-consumables": "My Supplies",
  "condition-checks": "Inspections",
  "starter-kits": "Starter Kits",
  "admin": "Admin",
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
    href: "/" + segments.slice(0, i + 1).join("/"),
  }));

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5 text-sm">
        {/* Home link */}
        <li>
          <Link
            href="/dashboard"
            className="text-shark-400 hover:text-action-500 transition-colors"
          >
            Home
          </Link>
        </li>

        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li key={crumb.href} className="flex items-center gap-1.5">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-shark-300 flex-shrink-0"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
              {isLast ? (
                <span className="text-shark-700 dark:text-shark-300 font-medium">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-shark-400 hover:text-action-500 transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
