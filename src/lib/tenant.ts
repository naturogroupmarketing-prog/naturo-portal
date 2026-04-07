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

  // Plan-based limits (source of truth) — override database maxUsers/maxAssets
  const PLAN_LIMITS: Record<string, { users: number; assets: number }> = {
    FREE: { users: 3, assets: 50 },
    ADMIN: { users: 15, assets: 500 },
    PRO: { users: 75, assets: 2000 },
    ENTERPRISE: { users: 999999, assets: 999999 },
  };
  const limits = PLAN_LIMITS[org.plan] || PLAN_LIMITS.FREE;

  return {
    org,
    withinUserLimit: org._count.users < limits.users,
    withinAssetLimit: org._count.assets < limits.assets,
    userCount: org._count.users,
    assetCount: org._count.assets,
    maxUsers: limits.users,
    maxAssets: limits.assets,
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
      `User limit reached (${limits.userCount}/${limits.maxUsers}). Please upgrade your plan to add more users.`
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
      `Asset limit reached (${limits.assetCount}/${limits.maxAssets}). Please upgrade your plan to add more assets.`
    );
  }
}
