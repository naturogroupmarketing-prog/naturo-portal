import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import type { IconName } from "@/components/ui/icon";
import { parsePreferences } from "@/lib/dashboard-types";
import { DashboardClient } from "./dashboard-client";
import { StaffDashboardClient } from "./staff-dashboard-client";

export const revalidate = 30; // Refresh data every 30 seconds instead of every request

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Staff dashboard
  if (session.user.role === "STAFF") {
    const currentMonthYear = new Date().toISOString().slice(0, 7);
    const [assetCount, consumableCount, pendingRequestCount, unacknowledgedCount, recentAssets, recentConsumables, recentRequests, pendingAssetItems, pendingConsumableItems, kitApplications, allActiveAssets, allActiveConsumables] = await Promise.all([
      db.assetAssignment.count({ where: { userId: session.user.id, isActive: true, acknowledgedAt: { not: null } } }),
      db.consumableAssignment.count({ where: { userId: session.user.id, isActive: true, acknowledgedAt: { not: null } } }),
      db.consumableRequest.count({ where: { userId: session.user.id, status: "PENDING" } }),
      db.assetAssignment.count({ where: { userId: session.user.id, isActive: true, acknowledgedAt: null, starterKitApplicationId: { not: null } } }),
      db.assetAssignment.findMany({
        where: { userId: session.user.id, isActive: true, acknowledgedAt: { not: null } },
        include: { asset: true },
        orderBy: { checkoutDate: "desc" },
        take: 5,
      }),
      db.consumableAssignment.findMany({
        where: { userId: session.user.id, isActive: true, acknowledgedAt: { not: null } },
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
      // Pending kit items — assets not yet acknowledged
      db.assetAssignment.findMany({
        where: { userId: session.user.id, isActive: true, acknowledgedAt: null, starterKitApplicationId: { not: null } },
        include: { asset: { select: { name: true, assetCode: true, category: true, imageUrl: true } } },
        orderBy: { checkoutDate: "desc" },
      }),
      // Pending kit items — consumables not yet acknowledged
      db.consumableAssignment.findMany({
        where: { userId: session.user.id, isActive: true, acknowledgedAt: null, starterKitApplicationId: { not: null } },
        include: { consumable: { select: { name: true, unitType: true, imageUrl: true } } },
        orderBy: { assignedDate: "desc" },
      }),
      // Kit applications for "Return Kit" feature
      db.starterKitApplication.findMany({
        where: { userId: session.user.id },
        include: { starterKit: { select: { name: true } } },
        orderBy: { appliedAt: "desc" },
      }),
      // ALL active asset assignments (for My Equipment section + condition checks)
      db.assetAssignment.findMany({
        where: { userId: session.user.id, isActive: true },
        include: { asset: { select: { name: true, assetCode: true, category: true, imageUrl: true } } },
        orderBy: { checkoutDate: "desc" },
      }),
      // ALL active consumable assignments (for My Equipment section + condition checks)
      db.consumableAssignment.findMany({
        where: { userId: session.user.id, isActive: true },
        include: { consumable: { select: { name: true, unitType: true, category: true, imageUrl: true } } },
        orderBy: { assignedDate: "desc" },
      }),
    ]);

    // Condition checks: get config + submitted checks
    const [conditionChecksThisMonth, inspectionCategories] = await Promise.all([
      db.conditionCheck.findMany({
        where: { userId: session.user.id, monthYear: currentMonthYear },
        select: { id: true, itemType: true, assetId: true, consumableId: true, condition: true, photoLabel: true },
      }),
      db.category.findMany({
        where: { organizationId: session.user.organizationId!, requiresInspection: true },
        select: { name: true, type: true, inspectionPhotos: true },
      }),
    ]);

    // Build kit application groups (for "Return Kit" button)
    const activeKitApplications = kitApplications
      .map((app) => ({
        id: app.id,
        kitName: app.starterKit.name,
        appliedAt: app.appliedAt.toISOString(),
        assets: allActiveAssets
          .filter((a) => a.starterKitApplicationId === app.id)
          .map((a) => ({ id: a.id, name: a.asset.name, assetCode: a.asset.assetCode, category: a.asset.category })),
        consumables: allActiveConsumables
          .filter((c) => c.starterKitApplicationId === app.id)
          .map((c) => ({ id: c.id, name: c.consumable.name, unitType: c.consumable.unitType, quantity: c.quantity })),
      }))
      .filter((app) => app.assets.length > 0 || app.consumables.length > 0);

    // Non-kit individual assignments (items assigned directly, not through a kit)
    const individualAssets = allActiveAssets
      .filter((a) => !a.starterKitApplicationId)
      .map((a) => ({ id: a.id, name: a.asset.name, assetCode: a.asset.assetCode, category: a.asset.category }));
    const individualConsumables = allActiveConsumables
      .filter((c) => !c.starterKitApplicationId)
      .map((c) => ({ id: c.id, name: c.consumable.name, unitType: c.consumable.unitType, quantity: c.quantity }));

    // Build condition check items — only show items from enabled categories
    const inspectionCatNames = new Set(inspectionCategories.map((c) => c.name));
    const photosPerCategory = new Map(inspectionCategories.map((c) => [c.name, c.inspectionPhotos]));

    // Build checked set keyed by "type-itemId-label"
    const checkedSet = new Set(conditionChecksThisMonth.map((c) => {
      const base = c.itemType === "ASSET" ? `asset-${c.assetId}` : `consumable-${c.consumableId}`;
      return c.photoLabel ? `${base}-${c.photoLabel}` : base;
    }));
    const conditionCheckMap = new Map(conditionChecksThisMonth.map((c) => {
      const base = c.itemType === "ASSET" ? `asset-${c.assetId}` : `consumable-${c.consumableId}`;
      const key = c.photoLabel ? `${base}-${c.photoLabel}` : base;
      return [key, c.condition];
    }));

    const conditionCheckItems: Array<{ id: string; type: "ASSET" | "CONSUMABLE"; name: string; code: string | null; category: string | null; imageUrl: string | null; photoLabel: string | null; checked: boolean; condition: string | null }> = [];

    // Assets — only show items from enabled inspection categories
    for (const a of allActiveAssets) {
      if (a.acknowledgedAt === null) continue;
      if (!inspectionCatNames.has(a.asset.category)) continue;
      const labels = photosPerCategory.get(a.asset.category) || [];
      if (labels.length > 0) {
        for (const label of labels) {
          const key = `asset-${a.assetId}-${label}`;
          conditionCheckItems.push({
            id: a.assetId, type: "ASSET", name: a.asset.name, code: a.asset.assetCode,
            category: a.asset.category, imageUrl: a.asset.imageUrl || null, photoLabel: label,
            checked: checkedSet.has(key), condition: conditionCheckMap.get(key) || null,
          });
        }
      } else {
        const key = `asset-${a.assetId}`;
        conditionCheckItems.push({
          id: a.assetId, type: "ASSET", name: a.asset.name, code: a.asset.assetCode,
          category: a.asset.category, imageUrl: a.asset.imageUrl || null, photoLabel: null,
          checked: checkedSet.has(key), condition: conditionCheckMap.get(key) || null,
        });
      }
    }

    // Consumables — only show items from enabled inspection categories
    for (const c of allActiveConsumables) {
      if (c.acknowledgedAt === null) continue;
      const cat = (c.consumable as { name: string; unitType: string; category: string; imageUrl: string | null }).category;
      const img = (c.consumable as { name: string; unitType: string; category: string; imageUrl: string | null }).imageUrl;
      if (!inspectionCatNames.has(cat)) continue;
      const labels = photosPerCategory.get(cat) || [];
      if (labels.length > 0) {
        for (const label of labels) {
          const key = `consumable-${c.consumableId}-${label}`;
          conditionCheckItems.push({
            id: c.consumableId, type: "CONSUMABLE", name: c.consumable.name, code: null,
            category: cat, imageUrl: img || null, photoLabel: label,
            checked: checkedSet.has(key), condition: conditionCheckMap.get(key) || null,
          });
        }
      } else {
        const key = `consumable-${c.consumableId}`;
        conditionCheckItems.push({
          id: c.consumableId, type: "CONSUMABLE", name: c.consumable.name, code: null,
          category: cat, imageUrl: img || null, photoLabel: null,
          checked: checkedSet.has(key), condition: conditionCheckMap.get(key) || null,
        });
      }
    }

    // Consumable usage history — last 6 months
    const staffUsageRaw = await db.consumableAssignment.findMany({
      where: {
        userId: session.user.id,
        isActive: false,
        returnCondition: "USED",
        returnedDate: { gte: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1) },
      },
      select: {
        quantity: true,
        returnedDate: true,
        consumable: { select: { name: true, unitType: true } },
      },
      orderBy: { returnedDate: "desc" },
    });

    const usageByMonth = new Map<string, { month: string; label: string; totalUsed: number; items: { name: string; quantity: number; unitType: string }[] }>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      const label = d.toLocaleDateString("en-AU", { month: "short", year: "numeric" });
      usageByMonth.set(key, { month: key, label, totalUsed: 0, items: [] });
    }
    for (const u of staffUsageRaw) {
      if (!u.returnedDate) continue;
      const key = u.returnedDate.toISOString().slice(0, 7);
      const bucket = usageByMonth.get(key);
      if (!bucket) continue;
      bucket.totalUsed += u.quantity;
      const existing = bucket.items.find((i) => i.name === u.consumable.name);
      if (existing) existing.quantity += u.quantity;
      else bucket.items.push({ name: u.consumable.name, quantity: u.quantity, unitType: u.consumable.unitType });
    }
    const consumableUsageHistory = Array.from(usageByMonth.values());

    const staffStats: { label: string; value: number; icon: IconName; borderColor: string; iconBg: string; iconColor: string; href: string }[] = [
      { label: "Assigned Assets", value: assetCount, icon: "package", borderColor: "border-t-action-500", iconBg: "bg-action-500", iconColor: "text-white", href: "/my-assets" },
      { label: "Consumable Items", value: consumableCount, icon: "droplet", borderColor: "border-t-action-500", iconBg: "bg-action-500", iconColor: "text-white", href: "/my-consumables" },
      { label: "Requests", value: pendingRequestCount, icon: "clipboard", borderColor: "border-t-action-500", iconBg: "bg-action-500", iconColor: "text-white", href: "/my-requests" },
    ];

    return (
      <StaffDashboardClient
        stats={staffStats}
        recentAssets={JSON.parse(JSON.stringify(recentAssets))}
        recentConsumables={JSON.parse(JSON.stringify(recentConsumables))}
        recentRequests={JSON.parse(JSON.stringify(recentRequests))}
        unacknowledgedCount={unacknowledgedCount}
        pendingAssetItems={JSON.parse(JSON.stringify(pendingAssetItems))}
        pendingConsumableItems={JSON.parse(JSON.stringify(pendingConsumableItems))}
        activeKitApplications={activeKitApplications}
        individualAssets={individualAssets}
        individualConsumables={individualConsumables}
        conditionCheckItems={conditionCheckItems}
        conditionCheckMonth={currentMonthYear}
        consumableUsageHistory={consumableUsageHistory}
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
    pendingReturns,
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
    db.pendingReturn.count({
      where: {
        isVerified: false,
        ...regionFilter,
      },
    }),
    db.user.findUnique({
      where: { id: session.user.id },
      select: { dashboardPreferences: true },
    }),
    // Regional breakdown data (Super Admin only)
    ...(isSuperAdmin
      ? [
          db.region.findMany({ where: { organizationId }, include: { state: true, _count: { select: { assets: true, consumables: true, users: true } } }, orderBy: { name: "asc" } }),
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
      { id: string; name: string; latitude: number | null; longitude: number | null; state: { name: string }; _count: { assets: number; consumables: number; users: number } }[],
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

  // Map locations for Super Admin
  type RegionWithCoords = { id: string; name: string; latitude: number | null; longitude: number | null; state: { name: string }; _count: { assets: number; consumables: number; users: number } };
  const mapLocations: { id: string; name: string; stateName: string; latitude: number; longitude: number; assetCount: number; consumableCount: number; staffCount: number }[] = [];
  if (isSuperAdmin && regionData.length > 0) {
    const regionsWithCoords = regionData[0] as unknown as RegionWithCoords[];
    for (const r of regionsWithCoords) {
      if (r.latitude != null && r.longitude != null) {
        mapLocations.push({ id: r.id, name: r.name, stateName: r.state.name, latitude: r.latitude, longitude: r.longitude, assetCount: r._count.assets, consumableCount: r._count.consumables, staffCount: r._count.users });
      }
    }
  }

  // Chart data: asset status breakdown — single groupBy instead of 6 count queries
  const assetStatusGroups = await db.asset.groupBy({
    by: ["status"],
    where: regionFilter,
    _count: true,
  });
  const statusCountMap = Object.fromEntries(assetStatusGroups.map((g) => [g.status, g._count]));

  const assetStatusChart = [
    { name: "Available", value: statusCountMap["AVAILABLE"] || 0, color: "#10b981" },
    { name: "Assigned", value: statusCountMap["ASSIGNED"] || 0, color: "#3b82f6" },
    { name: "Checked Out", value: statusCountMap["CHECKED_OUT"] || 0, color: "#f59e0b" },
    { name: "Damaged", value: statusCountMap["DAMAGED"] || 0, color: "#ef4444" },
    { name: "Lost", value: statusCountMap["LOST"] || 0, color: "#6b7280" },
    { name: "Unavailable", value: statusCountMap["UNAVAILABLE"] || 0, color: "#8b5cf6" },
  ].filter((s) => s.value > 0);

  // Chart data: assets by category
  const assetsByCategory = await db.asset.groupBy({
    by: ["category"],
    where: regionFilter,
    _count: true,
    orderBy: { _count: { category: "desc" } },
    take: 8,
  });

  const categoryChart = assetsByCategory.map((c) => ({
    name: c.category,
    value: c._count,
  }));

  // Chart data: consumable stock status
  const allConsumables = await db.consumable.findMany({
    where: { ...regionFilter, isActive: true },
    select: { quantityOnHand: true, minimumThreshold: true, reorderLevel: true },
  });

  const consumableStatusChart = (() => {
    let outOfStock = 0, critical = 0, low = 0, adequate = 0;
    for (const c of allConsumables) {
      if (c.quantityOnHand === 0) outOfStock++;
      else if (c.quantityOnHand <= c.minimumThreshold) critical++;
      else if (c.quantityOnHand <= c.reorderLevel) low++;
      else adequate++;
    }
    return [
      { name: "Adequate", value: adequate, color: "#10b981" },
      { name: "Low Stock", value: low, color: "#f59e0b" },
      { name: "Critical", value: critical, color: "#ef4444" },
      { name: "Out of Stock", value: outOfStock, color: "#6b7280" },
    ].filter((s) => s.value > 0);
  })();

  // Chart data: consumables by category
  const consumablesByCategory = await db.consumable.groupBy({
    by: ["category"],
    where: { ...regionFilter, isActive: true },
    _count: true,
    orderBy: { _count: { category: "desc" } },
    take: 8,
  });

  const consumableCategoryChart = consumablesByCategory.map((c) => ({
    name: c.category,
    value: c._count,
  }));

  // Portfolio valuation
  const assetsWithCost = await db.asset.findMany({
    where: { ...regionFilter, purchaseCost: { not: null } },
    select: { purchaseCost: true, purchaseDate: true, depreciationRate: true },
  });

  const totalPurchaseValue = assetsWithCost.reduce((sum, a) => sum + (a.purchaseCost || 0), 0);
  const totalCurrentValue = assetsWithCost.reduce((sum, a) => {
    const cost = a.purchaseCost || 0;
    const rate = a.depreciationRate || 10; // default 10% per year
    const purchaseDate = a.purchaseDate ? new Date(a.purchaseDate) : new Date();
    const yearsOwned = (Date.now() - purchaseDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    const currentValue = Math.max(0, cost * Math.pow(1 - rate / 100, yearsOwned));
    return sum + currentValue;
  }, 0);

  // Consumable stock valuation (with createdAt for historical chart)
  const consumablesWithCost = await db.consumable.findMany({
    where: { ...regionFilter, isActive: true, unitCost: { not: null } },
    select: { unitCost: true, quantityOnHand: true, createdAt: true },
  });
  const totalConsumableValue = consumablesWithCost.reduce((sum, c) => sum + (c.unitCost || 0) * c.quantityOnHand, 0);

  // Portfolio chart data — 6-month trend (assets vs consumables value)
  const now = new Date();
  const portfolioChartData: { month: string; assets: number; consumables: number; depreciation: number }[] = [];

  // Activity bar chart data — consumables used + staff per month
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const [allStaff, consumableUsageAll] = await Promise.all([
    db.user.findMany({
      where: { organizationId: session.user.organizationId!, isActive: true, role: "STAFF" },
      select: { createdAt: true },
    }),
    db.consumableAssignment.findMany({
      where: {
        user: { organizationId: session.user.organizationId! },
        isActive: false,
        returnCondition: "USED",
        returnedDate: { gte: sixMonthsAgo },
      },
      select: { quantity: true, returnedDate: true },
    }),
  ]);

  const activityChartData: { month: string; consumablesUsed: number; staff: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthLabel = d.toLocaleDateString("en-AU", { month: "short" });
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);

    // Portfolio: asset value and depreciation at this month-end
    let assetVal = 0;
    let purchaseTotal = 0;
    for (const a of assetsWithCost) {
      const cost = a.purchaseCost || 0;
      const rate = a.depreciationRate || 10;
      const purchaseDate = a.purchaseDate ? new Date(a.purchaseDate) : new Date();
      if (purchaseDate > monthEnd) continue;
      purchaseTotal += cost;
      const yearsOwned = (monthEnd.getTime() - purchaseDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      assetVal += Math.max(0, cost * Math.pow(1 - rate / 100, yearsOwned));
    }

    // Consumable value at this month-end — only include items that existed by then
    const consumableVal = consumablesWithCost.reduce((sum, c) => {
      if (new Date(c.createdAt) > monthEnd) return sum;
      return sum + (c.unitCost || 0) * c.quantityOnHand;
    }, 0);

    portfolioChartData.push({
      month: monthLabel,
      assets: Math.round(assetVal),
      consumables: Math.round(consumableVal),
      depreciation: Math.round(purchaseTotal - assetVal),
    });

    // Activity: consumables used this month + staff count
    const monthConsumablesUsed = consumableUsageAll
      .filter((a) => a.returnedDate && a.returnedDate >= monthStart && a.returnedDate <= monthEnd)
      .reduce((sum, a) => sum + a.quantity, 0);
    const staffCount = allStaff.filter((u) => new Date(u.createdAt) <= monthEnd).length;

    activityChartData.push({
      month: monthLabel,
      consumablesUsed: monthConsumablesUsed,
      staff: staffCount,
    });
  }

  // Upcoming maintenance count
  const upcomingMaintenance = await db.maintenanceSchedule.count({
    where: {
      isActive: true,
      nextDueDate: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      asset: regionFilter,
    },
  });

  const preferences = parsePreferences(userPrefs?.dashboardPreferences);

  const stats: { widgetId: string; label: string; value: number; icon: IconName; borderColor: string; iconBg: string; iconColor: string; href: string }[] = [
    { widgetId: "stat-total-assets", label: "Total Assets", value: totalAssets, icon: "package", borderColor: "border-t-action-500", iconBg: "bg-action-500", iconColor: "text-white", href: "/assets" },
    { widgetId: "stat-checked-out", label: "Checked Out", value: checkedOut, icon: "arrow-right", borderColor: "border-t-action-500", iconBg: "bg-action-500", iconColor: "text-white", href: "/assets" },
    { widgetId: "stat-overdue", label: "Overdue", value: overdue, icon: "clock", borderColor: "border-t-[#E8532E]", iconBg: "bg-[#E8532E]", iconColor: "text-white", href: "/assets" },
    { widgetId: "stat-damaged", label: "Damaged", value: damaged, icon: "alert-triangle", borderColor: "border-t-[#E8532E]", iconBg: "bg-[#E8532E]", iconColor: "text-white", href: "/assets" },
    { widgetId: "stat-lost", label: "Lost", value: lost, icon: "shield", borderColor: "border-t-shark-700", iconBg: "bg-shark-700", iconColor: "text-white", href: "/assets" },
    { widgetId: "stat-pending-requests", label: "Requests", value: pendingRequests, icon: "clipboard", borderColor: "border-t-action-500", iconBg: "bg-action-500", iconColor: "text-white", href: "/consumables" },
    { widgetId: "stat-pending-pos", label: "POs", value: pendingPOs, icon: "truck", borderColor: "border-t-action-500", iconBg: "bg-action-500", iconColor: "text-white", href: "/purchase-orders" },
    { widgetId: "stat-pending-returns", label: "Returns", value: pendingReturns as number, icon: "arrow-left", borderColor: "border-t-action-500", iconBg: "bg-action-500", iconColor: "text-white", href: "/returns" },
  ];

  const quickLinks: { label: string; href: string; icon: IconName; iconBg: string; iconColor: string }[] = [
    { label: "Manage Assets", href: "/assets", icon: "package", iconBg: "bg-action-500", iconColor: "text-white" },
    { label: "Consumables", href: "/consumables", icon: "droplet", iconBg: "bg-action-500", iconColor: "text-white" },
    { label: "Staff Overview", href: "/staff", icon: "users", iconBg: "bg-action-500", iconColor: "text-white" },
    { label: "Reports", href: "/reports", icon: "clipboard", iconBg: "bg-action-500", iconColor: "text-white" },
  ];

  return (
    <DashboardClient
      stats={stats}
      lowStockItems={JSON.parse(JSON.stringify(lowStockItems))}
      quickLinks={quickLinks}
      preferences={preferences}
      subtitle={isSuperAdmin ? "All locations overview" : "Your region overview"}
      regionBreakdown={regionBreakdown}
      assetStatusChart={assetStatusChart}
      categoryChart={categoryChart}
      consumableStatusChart={consumableStatusChart}
      consumableCategoryChart={consumableCategoryChart}
      portfolioValue={isSuperAdmin ? { purchase: totalPurchaseValue, current: Math.round(totalCurrentValue * 100) / 100, depreciation: Math.round((totalPurchaseValue - totalCurrentValue) * 100) / 100, consumableValue: Math.round(totalConsumableValue * 100) / 100 } : undefined}
      portfolioChartData={isSuperAdmin ? portfolioChartData : undefined}
      activityChartData={isSuperAdmin ? activityChartData : undefined}
      upcomingMaintenance={upcomingMaintenance}
      isSuperAdmin={isSuperAdmin}
      mapLocations={mapLocations}
    />
  );
}
