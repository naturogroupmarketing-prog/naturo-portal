import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdminOrManager } from "@/lib/permissions";
import { db } from "@/lib/db";
import { LowStockClient } from "./low-stock-client";
import { autoSyncLowStockPOs } from "@/lib/auto-sync-pos";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Low Stock Alerts",
  description: "Supplies at or below their minimum threshold",
};

export const dynamic = "force-dynamic";

export default async function LowStockPage({ searchParams }: { searchParams: Promise<{ region?: string }> }) {
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) redirect("/dashboard");

  const organizationId = session.user.organizationId!;
  const isSuperAdmin = session.user.role === "SUPER_ADMIN";
  const isBM = session.user.role === "BRANCH_MANAGER" && !!session.user.regionId;
  const regionWhere = isBM ? { regionId: session.user.regionId! } : {};

  // Auto-sync: create missing POs for any low-stock items on page load
  await autoSyncLowStockPOs(organizationId);

  const [lowStockItems, regions] = await Promise.all([
    db.consumable.findMany({
      where: { organizationId, isActive: true, ...regionWhere },
      include: { region: { include: { state: true } } },
      orderBy: [{ region: { name: "asc" } }, { name: "asc" }],
      take: 500,
    }),
    // Fetch all regions so the dropdown shows every location, not just ones with alerts
    db.region.findMany({
      where: isBM
        ? { id: session.user.regionId!, organizationId }
        : { organizationId },
      select: { id: true, name: true, state: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  const filtered = lowStockItems.filter((c) => c.quantityOnHand <= c.minimumThreshold);

  const { region: focusRegion } = await searchParams;

  return (
    <LowStockClient
      items={JSON.parse(JSON.stringify(filtered))}
      regions={JSON.parse(JSON.stringify(regions))}
      focusRegionId={focusRegion ?? (isBM ? session.user.regionId! : undefined)}
      isSuperAdmin={isSuperAdmin}
    />
  );
}
