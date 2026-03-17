import { auth } from "./auth";
import { db } from "./db";

/**
 * Get the current user's organization ID.
 * Throws if no session or no organization.
 * Use this in every server action / page to scope queries.
 */
export async function requireOrganization() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const orgId = session.user.organizationId;
  if (!orgId) throw new Error("No organization found. Please contact support.");

  return { session, orgId };
}

/**
 * Get organization with subscription info for billing checks.
 */
export async function getOrganization(orgId: string) {
  return db.organization.findUnique({
    where: { id: orgId },
  });
}

/**
 * Check if the organization is within its plan limits.
 */
export async function checkPlanLimits(orgId: string) {
  const org = await db.organization.findUnique({
    where: { id: orgId },
    include: {
      _count: {
        select: { users: true, assets: true },
      },
    },
  });

  if (!org) throw new Error("Organization not found");

  // Check if trial has expired
  if (
    org.subscriptionStatus === "TRIALING" &&
    org.trialEndsAt &&
    new Date() > org.trialEndsAt
  ) {
    throw new Error("Your free trial has expired. Please upgrade your plan.");
  }

  // Check if subscription is active
  if (
    org.subscriptionStatus === "CANCELED" ||
    org.subscriptionStatus === "PAST_DUE"
  ) {
    throw new Error(
      "Your subscription is inactive. Please update your billing information."
    );
  }

  return {
    org,
    withinUserLimit: org._count.users < org.maxUsers,
    withinAssetLimit: org._count.assets < org.maxAssets,
    userCount: org._count.users,
    assetCount: org._count.assets,
  };
}

/**
 * Enforce that the organization can add more users.
 * Throws if the limit is reached.
 */
export async function enforceUserLimit(orgId: string) {
  const limits = await checkPlanLimits(orgId);
  if (!limits.withinUserLimit) {
    throw new Error(
      `User limit reached (${limits.userCount}/${limits.org.maxUsers}). Please upgrade your plan to add more users.`
    );
  }
}

/**
 * Enforce that the organization can add more assets.
 * Throws if the limit is reached.
 */
export async function enforceAssetLimit(orgId: string) {
  const limits = await checkPlanLimits(orgId);
  if (!limits.withinAssetLimit) {
    throw new Error(
      `Asset limit reached (${limits.assetCount}/${limits.org.maxAssets}). Please upgrade your plan to add more assets.`
    );
  }
}
