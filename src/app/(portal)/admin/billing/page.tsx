import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/permissions";
import { db } from "@/lib/db";
import { BillingClient } from "./billing-client";

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user || !isSuperAdmin(session.user.role)) redirect("/dashboard");

  const org = await db.organization.findUnique({
    where: { id: session.user.organizationId! },
    select: {
      name: true,
      subscriptionStatus: true,
      maxUsers: true,
      maxAssets: true,
      trialEndsAt: true,
      _count: { select: { users: true, assets: true } },
    },
  });

  if (!org) redirect("/dashboard");

  return (
    <BillingClient
      org={JSON.parse(JSON.stringify(org))}
    />
  );
}
