import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdminOrManager } from "@/lib/permissions";
import { db } from "@/lib/db";
import { getLocations, getArchivedRegions } from "@/app/actions/locations";
import { InventoryListClient } from "./inventory-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inventory",
  description: "Browse and manage inventory across all locations",
};

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) redirect("/dashboard");

  // Branch Manager → auto-redirect to their region (preserve tab param)
  if (session.user.role === "BRANCH_MANAGER" && session.user.regionId) {
    redirect(`/inventory/${session.user.regionId}${tab ? `?tab=${tab}` : ""}`);
  }

  const organizationId = session.user.organizationId!;

  const [locations, archivedRegions, damagedByRegion, lostByRegion, lowStockByRegion, unresolvedDamageByRegion] = await Promise.all([
    getLocations(),
    getArchivedRegions(),
    db.asset.groupBy({ by: ["regionId"], where: { organizationId, status: "DAMAGED" }, _count: true }),
    db.asset.groupBy({ by: ["regionId"], where: { organizationId, status: "LOST" }, _count: true }),
    db.consumable.groupBy({
      by: ["regionId"],
      where: { organizationId, isActive: true },
      _count: true,
      having: { quantityOnHand: { _max: { lte: 0 } } },
    }).catch(() => []), // fallback if having doesn't work
    db.damageReport.findMany({
      where: { organizationId, isResolved: false },
      select: { asset: { select: { regionId: true } } },
    }),
  ]);

  // Build maps
  const damagedMap = new Map(damagedByRegion.map((r) => [r.regionId, r._count]));
  const lostMap = new Map(lostByRegion.map((r) => [r.regionId, r._count]));

  // Count unresolved damage per region
  const unresolvedMap = new Map<string, number>();
  for (const d of unresolvedDamageByRegion) {
    const rid = d.asset?.regionId;
    if (rid) unresolvedMap.set(rid, (unresolvedMap.get(rid) || 0) + 1);
  }

  // Count low stock per region using raw query (groupBy having is unreliable)
  const lowStockItems = await db.consumable.findMany({
    where: { organizationId, isActive: true },
    select: { regionId: true, quantityOnHand: true, minimumThreshold: true },
  });
  const lowStockMap = new Map<string, number>();
  for (const c of lowStockItems) {
    if (c.quantityOnHand <= c.minimumThreshold) {
      lowStockMap.set(c.regionId, (lowStockMap.get(c.regionId) || 0) + 1);
    }
  }

  // Build region alerts
  const regionAlerts: Record<string, { damaged: number; lost: number; lowStock: number; unresolvedDamage: number }> = {};
  for (const state of locations) {
    for (const region of state.regions) {
      regionAlerts[region.id] = {
        damaged: damagedMap.get(region.id) || 0,
        lost: lostMap.get(region.id) || 0,
        lowStock: lowStockMap.get(region.id) || 0,
        unresolvedDamage: unresolvedMap.get(region.id) || 0,
      };
    }
  }

  return (
    <InventoryListClient
      locations={JSON.parse(JSON.stringify(locations))}
      regionAlerts={regionAlerts}
      isSuperAdmin={session.user.role === "SUPER_ADMIN"}
      archivedRegions={JSON.parse(JSON.stringify(archivedRegions))}
    />
  );
}
