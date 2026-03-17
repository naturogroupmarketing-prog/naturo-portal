import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import type { IconName } from "@/components/ui/icon";
import { parsePreferences } from "@/lib/dashboard-types";
import { DashboardClient } from "./dashboard-client";
import { StaffDashboardClient } from "./staff-dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Staff dashboard
  if (session.user.role === "STAFF") {
    const [assetCount, consumableCount, pendingRequestCount, unacknowledgedCount, recentAssets, recentConsumables, recentRequests] = await Promise.all([
      db.assetAssignment.count({ where: { userId: session.user.id, isActive: true } }),
      db.consumableAssignment.count({ where: { userId: session.user.id, isActive: true } }),
      db.consumableRequest.count({ where: { userId: session.user.id, status: "PENDING" } }),
      db.assetAssignment.count({ where: { userId: session.user.id, isActive: true, acknowledgedAt: null } }),
      db.assetAssignment.findMany({
        where: { userId: session.user.id, isActive: true },
        include: { asset: true },
        orderBy: { checkoutDate: "desc" },
        take: 5,
      }),
      db.consumableAssignment.findMany({
        where: { userId: session.user.id, isActive: true },
        include: { consumable: true },
        orderBy: { assignedDate: "desc" },
        take: 5,
      }),
      db.consumableRequest.findMany({
        where: { userId: session.user.id },
        include: { consumable: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    const staffStats: { label: string; value: number; icon: IconName; borderColor: string; iconBg: string; iconColor: string; href: string }[] = [
      { label: "Assigned Assets", value: assetCount, icon: "package", borderColor: "border-l-action-400", iconBg: "bg-action-50", iconColor: "text-action-500", href: "/my-assets" },
      { label: "Consumable Items", value: consumableCount, icon: "droplet", borderColor: "border-l-blue-400", iconBg: "bg-blue-50", iconColor: "text-blue-500", href: "/my-consumables" },
      { label: "Pending Requests", value: pendingRequestCount, icon: "clipboard", borderColor: "border-l-amber-400", iconBg: "bg-amber-50", iconColor: "text-amber-500", href: "/my-requests" },
    ];

    return (
      <StaffDashboardClient
        stats={staffStats}
        recentAssets={JSON.parse(JSON.stringify(recentAssets))}
        recentConsumables={JSON.parse(JSON.stringify(recentConsumables))}
        recentRequests={JSON.parse(JSON.stringify(recentRequests))}
        unacknowledgedCount={unacknowledgedCount}
      />
    );
  }

  const organizationId = session.user.organizationId!;

  const regionFilter = session.user.role === "BRANCH_MANAGER"
    ? { regionId: session.user.regionId!, organizationId }
    : { organizationId };

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  const [
    totalAssets,
    checkedOut,
    overdue,
    damaged,
    lost,
    pendingRequests,
    pendingPOs,
    lowStockItems,
    userPrefs,
    ...regionData
  ] = await Promise.all([
    db.asset.count({ where: regionFilter }),
    db.asset.count({ where: { ...regionFilter, status: { in: ["CHECKED_OUT", "ASSIGNED"] } } }),
    db.assetAssignment.count({
      where: {
        isActive: true,
        expectedReturnDate: { lt: new Date() },
        assignmentType: "TEMPORARY",
        asset: regionFilter,
      },
    }),
    db.asset.count({ where: { ...regionFilter, status: "DAMAGED" } }),
    db.asset.count({ where: { ...regionFilter, status: "LOST" } }),
    db.consumableRequest.count({
      where: {
        status: "PENDING",
        consumable: regionFilter,
      },
    }),
    db.purchaseOrder.count({
      where: {
        status: "PENDING",
        ...regionFilter,
      },
    }),
    db.consumable.findMany({
      where: {
        ...regionFilter,
        isActive: true,
      },
      include: { region: true },
    }).then((items) =>
      items.filter((i) => i.quantityOnHand <= i.minimumThreshold).slice(0, 10)
    ),
    db.user.findUnique({
      where: { id: session.user.id },
      select: { dashboardPreferences: true },
    }),
    // Regional breakdown data (Super Admin only)
    ...(isSuperAdmin
      ? [
          db.region.findMany({ where: { organizationId }, include: { state: true }, orderBy: { name: "asc" } }),
          db.asset.groupBy({ by: ["regionId"], where: { status: "DAMAGED", organizationId }, _count: true }),
          db.asset.groupBy({ by: ["regionId"], where: { status: "LOST", organizationId }, _count: true }),
          db.consumableRequest.findMany({
            where: { status: "PENDING", consumable: { organizationId } },
            select: { consumable: { select: { regionId: true } } },
          }),
          db.purchaseOrder.groupBy({ by: ["regionId"], where: { status: "PENDING", organizationId }, _count: true }),
          db.consumable.findMany({
            where: { isActive: true, organizationId },
            include: { region: true },
          }).then((items) => items.filter((i) => i.quantityOnHand <= i.minimumThreshold)),
        ]
      : []),
  ]);

  // Build regional breakdown for Super Admin
  let regionBreakdown: { regionId: string; regionName: string; stateName: string; damaged: number; lost: number; pendingRequests: number; pendingPOs: number; lowStockItems: { id: string; name: string; unitType: string; quantityOnHand: number; minimumThreshold: number }[] }[] | undefined;

  if (isSuperAdmin && regionData.length > 0) {
    const [regions, damagedByRegion, lostByRegion, pendingReqRaw, pendingPOsByRegion, allLowStock] = regionData as [
      { id: string; name: string; state: { name: string } }[],
      { regionId: string; _count: number }[],
      { regionId: string; _count: number }[],
      { consumable: { regionId: string } }[],
      { regionId: string; _count: number }[],
      { id: string; name: string; unitType: string; quantityOnHand: number; minimumThreshold: number; regionId: string }[],
    ];

    // Count pending requests per region
    const pendingReqByRegion = new Map<string, number>();
    for (const r of pendingReqRaw) {
      const rid = r.consumable.regionId;
      pendingReqByRegion.set(rid, (pendingReqByRegion.get(rid) ?? 0) + 1);
    }

    const damagedMap = new Map(damagedByRegion.map((r) => [r.regionId, r._count]));
    const lostMap = new Map(lostByRegion.map((r) => [r.regionId, r._count]));
    const poMap = new Map(pendingPOsByRegion.map((r) => [r.regionId, r._count]));

    regionBreakdown = regions.map((region) => ({
      regionId: region.id,
      regionName: region.name,
      stateName: region.state.name,
      damaged: damagedMap.get(region.id) ?? 0,
      lost: lostMap.get(region.id) ?? 0,
      pendingRequests: pendingReqByRegion.get(region.id) ?? 0,
      pendingPOs: poMap.get(region.id) ?? 0,
      lowStockItems: allLowStock
        .filter((i) => i.regionId === region.id)
        .slice(0, 5)
        .map((i) => ({ id: i.id, name: i.name, unitType: i.unitType, quantityOnHand: i.quantityOnHand, minimumThreshold: i.minimumThreshold })),
    }));
  }

  const preferences = parsePreferences(userPrefs?.dashboardPreferences);

  const stats: { widgetId: string; label: string; value: number; icon: IconName; borderColor: string; iconBg: string; iconColor: string; href: string }[] = [
    { widgetId: "stat-total-assets", label: "Total Assets", value: totalAssets, icon: "package", borderColor: "border-l-action-400", iconBg: "bg-action-50", iconColor: "text-action-500", href: "/assets" },
    { widgetId: "stat-checked-out", label: "Checked Out", value: checkedOut, icon: "arrow-right", borderColor: "border-l-blue-400", iconBg: "bg-blue-50", iconColor: "text-blue-500", href: "/assets" },
    { widgetId: "stat-overdue", label: "Overdue", value: overdue, icon: "clock", borderColor: "border-l-orange-400", iconBg: "bg-orange-50", iconColor: "text-orange-500", href: "/assets" },
    { widgetId: "stat-damaged", label: "Damaged", value: damaged, icon: "alert-triangle", borderColor: "border-l-red-400", iconBg: "bg-red-50", iconColor: "text-red-500", href: "/assets" },
    { widgetId: "stat-lost", label: "Lost", value: lost, icon: "shield", borderColor: "border-l-shark-400", iconBg: "bg-shark-50", iconColor: "text-shark-500", href: "/assets" },
    { widgetId: "stat-pending-requests", label: "Pending Requests", value: pendingRequests, icon: "clipboard", borderColor: "border-l-amber-400", iconBg: "bg-amber-50", iconColor: "text-amber-500", href: "/consumables" },
    { widgetId: "stat-pending-pos", label: "Pending POs", value: pendingPOs, icon: "truck", borderColor: "border-l-purple-400", iconBg: "bg-purple-50", iconColor: "text-purple-500", href: "/purchase-orders" },
  ];

  const quickLinks: { label: string; href: string; icon: IconName; iconBg: string; iconColor: string }[] = [
    { label: "Manage Assets", href: "/assets", icon: "package", iconBg: "bg-action-50", iconColor: "text-action-500" },
    { label: "Consumables", href: "/consumables", icon: "droplet", iconBg: "bg-blue-50", iconColor: "text-blue-500" },
    { label: "Staff Overview", href: "/staff", icon: "users", iconBg: "bg-emerald-50", iconColor: "text-emerald-500" },
    { label: "Reports", href: "/reports", icon: "clipboard", iconBg: "bg-amber-50", iconColor: "text-amber-500" },
  ];

  return (
    <DashboardClient
      stats={stats}
      lowStockItems={JSON.parse(JSON.stringify(lowStockItems))}
      quickLinks={quickLinks}
      preferences={preferences}
      subtitle={isSuperAdmin ? "All locations overview" : "Your region overview"}
      regionBreakdown={regionBreakdown}
    />
  );
}
