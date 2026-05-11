import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SetupWizard } from "./setup-wizard";

export default async function SetupPage() {
  const session = await auth();

  // Must be authenticated super admin
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  if (!session.user.organizationId) {
    redirect("/dashboard");
  }

  // Check org state
  const org = await db.organization.findUnique({
    where: { id: session.user.organizationId },
    select: {
      name: true,
      industry: true,
      onboardingCompletedAt: true,
      onboardingSkippedAt: true,
    },
  });

  if (!org) redirect("/dashboard");

  // Already completed — go to dashboard
  if (org.onboardingCompletedAt) redirect("/dashboard");

  return (
    <SetupWizard
      orgName={org.name}
      alreadySkipped={!!org.onboardingSkippedAt}
      existingIndustry={org.industry ?? undefined}
    />
  );
}
