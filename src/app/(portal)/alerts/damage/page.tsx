import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdminOrManager } from "@/lib/permissions";
import { db } from "@/lib/db";
import { UnresolvedDamageClient } from "./damage-client";

export default async function UnresolvedDamagePage({ searchParams }: { searchParams: Promise<{ region?: string }> }) {
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) redirect("/dashboard");

  const organizationId = session.user.organizationId!;
  const regionWhere = session.user.role === "BRANCH_MANAGER" && session.user.regionId
    ? { regionId: session.user.regionId }
    : {};

  const reports = await db.damageReport.findMany({
    where: { organizationId, isResolved: false },
    include: {
      asset: {
        select: { name: true, assetCode: true, category: true, status: true, regionId: true, region: { select: { id: true, name: true, state: { select: { name: true } } } } },
      },
      reportedBy: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  // Filter by region for branch managers
  const filtered = session.user.role === "BRANCH_MANAGER" && session.user.regionId
    ? reports.filter((r) => r.asset.regionId === session.user.regionId)
    : reports;

  const { region: focusRegion } = await searchParams;
  return <UnresolvedDamageClient reports={JSON.parse(JSON.stringify(filtered))} focusRegionId={focusRegion} />;
}
