import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdminOrManager } from "@/lib/permissions";
import { db } from "@/lib/db";
import { LostItemsClient } from "./lost-client";

export default async function LostItemsPage({ searchParams }: { searchParams: Promise<{ region?: string }> }) {
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) redirect("/dashboard");

  const organizationId = session.user.organizationId!;
  const regionWhere = session.user.role === "BRANCH_MANAGER" && session.user.regionId
    ? { regionId: session.user.regionId }
    : {};

  const lostAssets = await db.asset.findMany({
    where: { organizationId, status: "LOST", ...regionWhere },
    include: {
      region: { include: { state: true } },
      assignments: {
        where: { isActive: false },
        orderBy: { actualReturnDate: "desc" },
        take: 1,
        include: { user: { select: { name: true, email: true } } },
      },
    },
    orderBy: [{ region: { name: "asc" } }, { name: "asc" }],
    take: 500,
  });

  // Get associated damage reports for context
  const lostReports = await db.damageReport.findMany({
    where: {
      organizationId,
      type: "LOSS",
      assetId: { in: lostAssets.map((a) => a.id) },
    },
    include: { reportedBy: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  const reportMap = new Map(lostReports.map((r) => [r.assetId, r]));

  const items = lostAssets.map((a) => ({
    id: a.id,
    name: a.name,
    assetCode: a.assetCode,
    category: a.category,
    imageUrl: a.imageUrl,
    isHighValue: a.isHighValue,
    purchaseCost: a.purchaseCost,
    region: { id: a.region.id, name: a.region.name, stateName: a.region.state.name },
    lastAssignedTo: a.assignments[0]?.user?.name || a.assignments[0]?.user?.email || null,
    report: reportMap.get(a.id) ? {
      description: reportMap.get(a.id)!.description,
      reportedBy: reportMap.get(a.id)!.reportedBy.name || reportMap.get(a.id)!.reportedBy.email,
      date: reportMap.get(a.id)!.createdAt.toISOString(),
      isResolved: reportMap.get(a.id)!.isResolved,
    } : null,
  }));

  const { region: focusRegion } = await searchParams;
  return <LostItemsClient items={JSON.parse(JSON.stringify(items))} focusRegionId={focusRegion} />;
}
