import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdminOrManager } from "@/lib/permissions";
import { db } from "@/lib/db";
import { ReturnsClient } from "./returns-client";

export const dynamic = "force-dynamic";

export default async function ReturnsPage() {
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) redirect("/dashboard");

  const organizationId = session.user.organizationId!;

  const regionFilter = session.user.role === "BRANCH_MANAGER"
    ? { regionId: session.user.regionId!, organizationId }
    : { organizationId };

  const pendingReturns = await db.pendingReturn.findMany({
    where: { ...regionFilter, isVerified: false },
    orderBy: { createdAt: "desc" },
  });

  // Fetch asset/consumable details for each return
  const assetIds = pendingReturns.filter((r) => r.assetId).map((r) => r.assetId!);
  const consumableIds = pendingReturns.filter((r) => r.consumableId).map((r) => r.consumableId!);

  const [assets, consumables] = await Promise.all([
    assetIds.length > 0
      ? db.asset.findMany({
          where: { id: { in: assetIds } },
          select: { id: true, name: true, assetCode: true, category: true, imageUrl: true },
        })
      : [],
    consumableIds.length > 0
      ? db.consumable.findMany({
          where: { id: { in: consumableIds } },
          select: { id: true, name: true, unitType: true, imageUrl: true },
        })
      : [],
  ]);

  const assetMap = Object.fromEntries(assets.map((a) => [a.id, a]));
  const consumableMap = Object.fromEntries(consumables.map((c) => [c.id, c]));

  const enrichedReturns = pendingReturns.map((r) => ({
    ...r,
    assetDetails: r.assetId ? assetMap[r.assetId] || null : null,
    consumableDetails: r.consumableId ? consumableMap[r.consumableId] || null : null,
  }));

  return (
    <ReturnsClient returns={JSON.parse(JSON.stringify(enrichedReturns))} />
  );
}
