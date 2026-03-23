import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdminOrManager } from "@/lib/permissions";
import { getConditionChecksForReview } from "@/app/actions/condition-checks";
import { db } from "@/lib/db";
import { ConditionChecksClient } from "./condition-checks-client";

export const dynamic = "force-dynamic";

export default async function ConditionChecksPage() {
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) redirect("/dashboard");

  const organizationId = session.user.organizationId;
  if (!organizationId) redirect("/dashboard");

  const result = await getConditionChecksForReview();

  // Get regions for filter
  const regions = session.user.role === "SUPER_ADMIN"
    ? await db.region.findMany({
        where: { state: { organizationId } },
        include: { state: true },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <ConditionChecksClient
      checks={JSON.parse(JSON.stringify(result.checks))}
      staffStatus={result.staffStatus}
      monthYear={result.monthYear}
      regions={JSON.parse(JSON.stringify(regions))}
      isSuperAdmin={session.user.role === "SUPER_ADMIN"}
    />
  );
}
