import Stripe from "stripe";
import { db } from "./db";

function createStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

/** Stripe client — null if STRIPE_SECRET_KEY is not configured */
export const stripe = createStripeClient();

function requireStripe(): Stripe {
  if (!stripe) throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY.");
  return stripe;
}

// ─── Plan Configuration ─────────────────────────────────

export const PLANS = {
  FREE: {
    name: "Free",
    maxUsers: 5,
    maxAssets: 50,
    price: 0,
    priceId: null,
  },
  PRO: {
    name: "Pro",
    maxUsers: 25,
    maxAssets: 500,
    price: 49,
    priceId: process.env.STRIPE_PRO_PRICE_ID || null,
  },
  ENTERPRISE: {
    name: "Enterprise",
    maxUsers: 999999,
    maxAssets: 999999,
    price: 149,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || null,
  },
} as const;

export type PlanType = keyof typeof PLANS;

// ─── Customer Management ────────────────────────────────

export async function getOrCreateStripeCustomer(organizationId: string) {
  const org = await db.organization.findUnique({
    where: { id: organizationId },
  });
  if (!org) throw new Error("Organization not found");

  if (org.stripeCustomerId) {
    return org.stripeCustomerId;
  }

  // Create a new Stripe customer
  const customer = await requireStripe().customers.create({
    name: org.name,
    metadata: { organizationId: org.id },
  });

  await db.organization.update({
    where: { id: organizationId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

// ─── Subscription Management ────────────────────────────

export async function createCheckoutSession(
  organizationId: string,
  plan: "PRO" | "ENTERPRISE",
  returnUrl: string
) {
  const customerId = await getOrCreateStripeCustomer(organizationId);
  const priceId = PLANS[plan].priceId;

  if (!priceId) throw new Error(`No Stripe price configured for ${plan} plan`);

  const session = await requireStripe().checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}&success=true`,
    cancel_url: `${returnUrl}?canceled=true`,
    metadata: { organizationId, plan },
  });

  return session;
}

export async function createBillingPortalSession(
  organizationId: string,
  returnUrl: string
) {
  const org = await db.organization.findUnique({
    where: { id: organizationId },
  });
  if (!org?.stripeCustomerId) {
    throw new Error("No billing account found");
  }

  const session = await requireStripe().billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: returnUrl,
  });

  return session;
}

// ─── Webhook Handlers ────────────────────────────────────

export async function handleSubscriptionCreated(
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;
  const org = await db.organization.findFirst({
    where: { stripeCustomerId: customerId },
  });
  if (!org) return;

  const plan = determinePlan(subscription);
  const planConfig = PLANS[plan];

  await db.organization.update({
    where: { id: org.id },
    data: {
      plan,
      subscriptionStatus: "ACTIVE",
      stripeSubscriptionId: subscription.id,
      maxUsers: planConfig.maxUsers,
      maxAssets: planConfig.maxAssets,
    },
  });
}

export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;
  const org = await db.organization.findFirst({
    where: { stripeCustomerId: customerId },
  });
  if (!org) return;

  const status = mapStripeStatus(subscription.status);
  const plan = determinePlan(subscription);
  const planConfig = PLANS[plan];

  await db.organization.update({
    where: { id: org.id },
    data: {
      plan,
      subscriptionStatus: status,
      maxUsers: planConfig.maxUsers,
      maxAssets: planConfig.maxAssets,
    },
  });
}

export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;
  const org = await db.organization.findFirst({
    where: { stripeCustomerId: customerId },
  });
  if (!org) return;

  await db.organization.update({
    where: { id: org.id },
    data: {
      plan: "FREE",
      subscriptionStatus: "CANCELED",
      stripeSubscriptionId: null,
      maxUsers: PLANS.FREE.maxUsers,
      maxAssets: PLANS.FREE.maxAssets,
    },
  });
}

// ─── Helpers ─────────────────────────────────────────────

function determinePlan(subscription: Stripe.Subscription): PlanType {
  const priceId = subscription.items.data[0]?.price.id;
  if (priceId === PLANS.ENTERPRISE.priceId) return "ENTERPRISE";
  if (priceId === PLANS.PRO.priceId) return "PRO";
  return "FREE";
}

function mapStripeStatus(
  status: Stripe.Subscription.Status
): "ACTIVE" | "PAST_DUE" | "CANCELED" | "TRIALING" {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
    case "unpaid":
    case "incomplete_expired":
      return "CANCELED";
    case "trialing":
      return "TRIALING";
    default:
      return "ACTIVE";
  }
}
