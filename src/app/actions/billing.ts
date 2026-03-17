"use server";

import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/permissions";
import {
  createCheckoutSession,
  createBillingPortalSession,
  PLANS,
} from "@/lib/stripe";

export async function getPlans() {
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
  const session = await auth();
  if (!session?.user || !isSuperAdmin(session.user.role)) {
    throw new Error("Unauthorized — only Super Admin can manage billing");
  }

  const orgId = session.user.organizationId;
  if (!orgId) throw new Error("No organization found");

  const checkoutSession = await createCheckoutSession(orgId, plan, returnUrl);
  return { url: checkoutSession.url };
}

export async function openBillingPortal(returnUrl: string) {
  const session = await auth();
  if (!session?.user || !isSuperAdmin(session.user.role)) {
    throw new Error("Unauthorized — only Super Admin can manage billing");
  }

  const orgId = session.user.organizationId;
  if (!orgId) throw new Error("No organization found");

  const portalSession = await createBillingPortalSession(orgId, returnUrl);
  return { url: portalSession.url };
}
