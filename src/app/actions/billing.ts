"use server";

import { db } from "@/lib/db";
import { isSuperAdmin } from "@/lib/permissions";
import { withAuth } from "@/lib/action-utils";
import { revalidatePath } from "next/cache";
import {
  createCheckoutSession,
  createBillingPortalSession,
  PLANS,
} from "@/lib/stripe";
import type { SubscriptionPlan } from "@/generated/prisma/client";

export async function getPlans() {
  const session = await withAuth();

  return Object.entries(PLANS).map(([key, plan]) => ({
    id: key,
    name: plan.name,
    maxUsers: plan.maxUsers,
    maxAssets: plan.maxAssets,
    price: plan.price,
  }));
}

export async function subscribeToPlan(
  plan: "PRO" | "ENTERPRISE",
  returnUrl: string
) {
  const session = await withAuth();
  if (!isSuperAdmin(session.user.role)) {
    throw new Error("Unauthorized — only Super Admin can manage billing");
  }

  const orgId = session.user.organizationId!;

  const checkoutSession = await createCheckoutSession(orgId, plan, returnUrl);
  return { url: checkoutSession.url };
}

export async function openBillingPortal(returnUrl: string) {
  const session = await withAuth();
  if (!isSuperAdmin(session.user.role)) {
    throw new Error("Unauthorized — only Super Admin can manage billing");
  }

  const orgId = session.user.organizationId!;

  const portalSession = await createBillingPortalSession(orgId, returnUrl);
  return { url: portalSession.url };
}

/**
 * Change the organization's plan directly (before Stripe is fully wired).
 */
export async function changePlan(newPlan: string) {
  const session = await withAuth();
  if (!isSuperAdmin(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const validPlans = ["FREE", "ADMIN", "PRO", "ENTERPRISE"];
  if (!validPlans.includes(newPlan)) throw new Error("Invalid plan");

  const orgId = session.user.organizationId!;

  await db.organization.update({
    where: { id: orgId },
    data: {
      plan: newPlan as SubscriptionPlan,
      subscriptionStatus: newPlan === "FREE" ? "TRIALING" : "ACTIVE",
    },
  });

  revalidatePath("/admin/billing");
  revalidatePath("/dashboard");
  return { success: true };
}
