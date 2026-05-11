"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { INDUSTRY_TEMPLATES } from "@/lib/industry-templates";
import type { IndustryId } from "@/lib/industry-templates";
import type { Prisma } from "@/generated/prisma/client";

export interface OnboardingData {
  industry: IndustryId;
  locationCount: string;
  teamSize: string;
  mainPriority: string;
}

// ─── Complete onboarding & seed workspace ─────────────────────────────────────

export async function completeOnboarding(data: OnboardingData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");
  if (!session.user.organizationId) throw new Error("No organization");

  const orgId = session.user.organizationId;
  const template = INDUSTRY_TEMPLATES[data.industry];
  if (!template) throw new Error("Unknown industry");

  // 1. Seed asset categories
  const assetCategoryData = template.assetCategories.map((name, i) => ({
    name,
    type: "ASSET",
    organizationId: orgId,
    sortOrder: i,
  }));

  // 2. Seed consumable categories
  const consumableCategoryData = template.consumableCategories.map((name, i) => ({
    name,
    type: "CONSUMABLE",
    organizationId: orgId,
    sortOrder: i,
  }));

  // 3. Seed workflow rules
  const workflowData = template.defaultWorkflows.map((wf) => ({
    organizationId: orgId,
    name: wf.name,
    trigger: wf.trigger,
    conditions: wf.conditions as Prisma.InputJsonValue,
    action: wf.action,
    actionConfig: wf.actionConfig as Prisma.InputJsonValue,
    enabled: true,
  }));

  // Run all seeding in parallel
  await Promise.all([
    // Create categories (skip existing ones)
    db.category.createMany({
      data: [...assetCategoryData, ...consumableCategoryData],
      skipDuplicates: true,
    }),

    // Create workflow rules (skip existing ones with same name+trigger+org)
    db.workflowRule.createMany({
      data: workflowData,
      skipDuplicates: true,
    }),

    // Mark onboarding complete + save answers on org
    db.organization.update({
      where: { id: orgId },
      data: {
        industry: data.industry,
        onboardingCompletedAt: new Date(),
        onboardingSkippedAt: null,
        onboardingData: data as unknown as Prisma.InputJsonValue,
      },
    }),
  ]);

  revalidatePath("/dashboard");
  revalidatePath("/admin/workflows");
}

// ─── Skip onboarding ──────────────────────────────────────────────────────────

export async function skipOnboarding() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");
  if (!session.user.organizationId) throw new Error("No organization");

  await db.organization.update({
    where: { id: session.user.organizationId },
    data: { onboardingSkippedAt: new Date() },
  });

  revalidatePath("/dashboard");
}

// ─── Restart onboarding (clear state so wizard shows again) ───────────────────

export async function restartOnboarding() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");
  if (!session.user.organizationId) throw new Error("No organization");

  await db.organization.update({
    where: { id: session.user.organizationId },
    data: {
      onboardingCompletedAt: null,
      onboardingSkippedAt: null,
    },
  });

  redirect("/setup");
}

// ─── Dismiss setup banner ─────────────────────────────────────────────────────

export async function dismissSetupBanner() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");
  if (!session.user.organizationId) throw new Error("No organization");

  // Mark as skipped so banner hides — same as skip
  await db.organization.update({
    where: { id: session.user.organizationId },
    data: { onboardingSkippedAt: new Date() },
  });

  revalidatePath("/dashboard");
}
