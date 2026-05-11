import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdminOrManager } from "@/lib/permissions";
import { db } from "@/lib/db";
import QuickReturnClient from "./quick-return-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quick Returns",
  description: "Mobile-optimised return verification",
};

export const dynamic = "force-dynamic";

export default async function QuickReturnPage() {
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) redirect("/dashboard");

  const organizationId = session.user.organizationId!;

  const regionFilter =
    session.user.role === "BRANCH_MANAGER"
      ? { regionId: session.user.regionId!, organizationId }
      : { organizationId };

  const pendingReturns = await db.pendingReturn.findMany({
    where: { ...regionFilter, isVerified: false },
    orderBy: { createdAt: "asc" },
  });

  const assetIds = pendingReturns.filter((r) => r.assetId).map((r) => r.assetId!);
  const consumableIds = pendingReturns
    .filter((r) => r.consumableId)
    .map((r) => r.consumableId!);

  const [assets, consumables] = await Promise.all([
    assetIds.length > 0
      ? db.asset.findMany({
          where: { id: { in: assetIds } },
          select: { id: true, name: true },
        })
      : [],
    consumableIds.length > 0
      ? db.consumable.findMany({
          where: { id: { in: consumableIds } },
          select: { id: true, name: true },
        })
      : [],
  ]);

  const assetMap = Object.fromEntries(assets.map((a) => [a.id, a.name]));
  const consumableMap = Object.fromEntries(consumables.map((c) => [c.id, c.name]));

  const now = Date.now();

  const mapped = pendingReturns.map((r) => {
    const createdAt = r.createdAt.getTime();
    const daysOverdue = Math.floor((now - createdAt) / (24 * 60 * 60 * 1000));
    return {
      id: r.id,
      assetName: r.assetId ? (assetMap[r.assetId] ?? undefined) : undefined,
      consumableName: r.consumableId
        ? (consumableMap[r.consumableId] ?? undefined)
        : undefined,
      assignedTo: r.returnedByName,
      daysOverdue,
      type: (r.itemType === "ASSET" ? "asset" : "consumable") as "asset" | "consumable",
    };
  });

  return <QuickReturnClient pendingReturns={mapped} />;
}
