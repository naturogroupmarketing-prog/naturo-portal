import { CourseCategory, CourseStatus } from "@/generated/prisma/client";

/**
 * Training domain helpers — pure functions and label maps.
 * Safe to import from both client and server components (no "use server",
 * no DB or Node-only APIs).
 */

// ─── Category labels ────────────────────────────────────

export const COURSE_CATEGORY_LABELS: Record<CourseCategory, string> = {
  NEW_STAFF_INDUCTION: "New Staff Induction",
  SITE_INDUCTION: "Site-Specific Induction",
  SAFETY_TRAINING: "Safety Training",
  EQUIPMENT_TRAINING: "Equipment Training",
  CHEMICAL_HANDLING: "Chemical Handling",
  COMPANY_POLICY: "Company Policies",
  SOP_TRAINING: "SOP Training",
  REFRESHER: "Refresher Course",
  COMPLIANCE: "Compliance Training",
  OTHER: "Other",
};

export const COURSE_CATEGORY_OPTIONS: Array<{ value: CourseCategory; label: string }> =
  (Object.keys(COURSE_CATEGORY_LABELS) as CourseCategory[]).map((value) => ({
    value,
    label: COURSE_CATEGORY_LABELS[value],
  }));

// ─── Status labels + badge ──────────────────────────────

export const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

export type CourseStatusTone = "draft" | "published" | "archived";

/**
 * Map a course status to a display label + tone for a Badge.
 */
export function courseStatusBadge(status: CourseStatus): {
  label: string;
  tone: CourseStatusTone;
} {
  switch (status) {
    case "PUBLISHED":
      return { label: COURSE_STATUS_LABELS.PUBLISHED, tone: "published" };
    case "ARCHIVED":
      return { label: COURSE_STATUS_LABELS.ARCHIVED, tone: "archived" };
    case "DRAFT":
    default:
      return { label: COURSE_STATUS_LABELS.DRAFT, tone: "draft" };
  }
}

// ─── Certificate numbers ────────────────────────────────

/**
 * Generate a unique-ish certificate number, e.g. "TRN-2026-A1B2C3D4".
 * Uniqueness is ultimately enforced by the DB unique constraint on
 * Certificate.certificateNumber; this just produces a readable candidate.
 */
export function generateCertificateNumber(): string {
  const year = new Date().getFullYear();
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  // Prefer crypto for better randomness when available
  const cryptoObj = typeof crypto !== "undefined" ? crypto : undefined;
  if (cryptoObj?.getRandomValues) {
    const bytes = new Uint8Array(8);
    cryptoObj.getRandomValues(bytes);
    for (let i = 0; i < 8; i++) {
      suffix += alphabet[bytes[i] % alphabet.length];
    }
  } else {
    for (let i = 0; i < 8; i++) {
      suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
  }
  return `TRN-${year}-${suffix}`;
}
