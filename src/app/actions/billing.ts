"use server";

import { isSuperAdmin } from "@/lib/permissions";
import { withAuth } from "@/lib/action-utils";
import {
  createCheckoutSession,
  createBillingPortalSession,
  PLANS,
} from "@/lib/stripe";

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
