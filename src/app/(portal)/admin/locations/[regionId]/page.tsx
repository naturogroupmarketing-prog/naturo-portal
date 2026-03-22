import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { isSuperAdmin } from "@/lib/permissions";
import { db } from "@/lib/db";
import { RegionDetailClient } from "./region-detail-client";

export default async function RegionDetailPage({ params }: { params: Promise<{ regionId: string }> }) {
  const session = await auth();
  if (!session?.user || !isSuperAdmin(session.user.role)) redirect("/dashboard");

  const { regionId } = await params;

  const region = await db.region.findUnique({
    where: { id: regionId },
    include: { state: true },
  });
  if (!region) notFound();

  const [assets, consumables, staff, lowStockCount] = await Promise.all([
    db.asset.findMany({
      where: { regionId },
      include: {
        assignments: {
          where: { isActive: true },
          include: { user: { select: { name: true, email: true } } },
        },
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    db.consumable.findMany({
      where: { regionId, isActive: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    db.user.findMany({
      where: { regionId },
      orderBy: { name: "asc" },
    }),
    db.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM "Consumable"
      WHERE "regionId" = ${regionId} AND "isActive" = true AND "quantityOnHand" <= "minimumThreshold"
    `.then((r) => Number(r[0].count)),
  ]);

  return (
    <RegionDetailClient
      region={JSON.parse(JSON.stringify({ ...region, state: region.state }))}
      assets={JSON.parse(JSON.stringify(assets))}
      consumables={JSON.parse(JSON.stringify(consumables))}
      staff={JSON.parse(JSON.stringify(staff))}
      lowStockCount={lowStockCount}
    />
  );
}
