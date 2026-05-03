import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import type { IconName } from "@/components/ui/icon";
import { parsePreferences } from "@/lib/dashboard-types";
import { DashboardClient } from "./dashboard-client";
import { StaffDashboardClient } from "./staff-dashboard-client";
import { BranchManagerDashboard } from "./branch-manager-dashboard";
import { AiBriefingWidget } from "./ai-briefing-widget";
import { AuditorDashboard } from "./auditor-dashboard";
import { getReplenishmentSuggestions } from "@/app/actions/predictions";
import { detectAnomalies } from "@/lib/anomaly-detection";
import { getAssetHealthSummary } from "@/lib/asset-health";
import { SetupBanner } from "@/components/ui/setup-banner";
import { INDUSTRY_TEMPLATES } from "@/lib/industry-templates";
import type { IndustryId } from "@/lib/industry-templates";
import { AdminQuickNav } from "./admin-quick-nav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Overview of assets, supplies, and team activity",
};

export const revalidate = 30; // Refresh data every 30 seconds instead of every request

// Fetch staff equipment data for a user (used by Staff dashboard and Branch Manager "My Equipment" view)
async function fetchStaffData(userId: string, organizationId: string) {
  const currentMonthYear = new Date().toISOString().slice(0, 7);
  const [recentRequests, pendingAssetItems, pendingConsumableItems, kitApplications, allActiveAssets, allActiveConsumables] = await Promise.all([
      db.consumableRequest.findMany({
        where: { userId: userId },
        include: { consumable: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      // Pending kit items — assets not yet acknowledged
      db.assetAssignment.findMany({
        where: { userId: userId, isActive: true, acknowledgedAt: null, starterKitApplicationId: { not: null } },
        include: { asset: { select: { name: true, assetCode: true, category: true, imageUrl: true } } },
        orderBy: { checkoutDate: "desc" },
      }),
      // Pending kit items — consumables not yet acknowledged
      db.consumableAssignment.findMany({
        where: { userId: userId, isActive: true, acknowledgedAt: null, starterKitApplicationId: { not: null } },
        include: { consumable: { select: { name: true, unitType: true, category: true, imageUrl: true } } },
        orderBy: { assignedDate: "desc" },
      }),
      // Kit applications for "Return Kit" feature
      db.starterKitApplication.findMany({
        where: { userId: userId },
        include: { starterKit: { select: { name: true } } },
        orderBy: { appliedAt: "desc" },
      }),
      // ALL active asset assignments (for My Equipment section + condition checks)
      db.assetAssignment.findMany({
        where: { userId: userId, isActive: true },
        include: { asset: { select: { name: true, assetCode: true, category: true, imageUrl: true } } },
        orderBy: { checkoutDate: "desc" },
      }),
      // ALL active consumable assignments (for My Equipment section + condition checks)
      db.consumableAssignment.findMany({
        where: { userId: userId, isActive: true },
        include: { consumable: { select: { name: true, unitType: true, category: true, imageUrl: true } } },
        orderBy: { assignedDate: "desc" },
      }),
    ]);

    // Derive counts and subsets from findMany results (no extra DB calls needed)
    const recentAssets = allActiveAssets.filter((a) => a.acknowledgedAt !== null).slice(0, 5);
    const recentConsumables = allActiveConsumables.filter((c) => c.acknowledgedAt !== null).slice(0, 5);
    const assetCount = allActiveAssets.filter((a) => a.acknowledgedAt !== null).length;
    const consumableCount = allActiveConsumables.filter((c) => c.acknowledgedAt !== null).length;
    const pendingRequestCount = recentRequests.filter((r) => r.status === "PENDING").length;
    const pendingConfirmCount = allActiveConsumables.filter((c) => c.acknowledgedAt === null).length;
    const unacknowledgedCount = allActiveAssets.filter((a) => a.acknowledgedAt === null && a.starterKitApplicationId).length;

    // Condition checks: get config + submitted checks + schedules + user's personal schedule
    const [conditionCheckSchedule, inspectionCategories, inspectionSchedules] = await Promise.all([
      db.conditionCheckSchedule.findUnique({
        where: { userId: userId },
      }),
      db.category.findMany({
        where: { organizationId, requiresInspection: true },
        select: { name: true, type: true, inspectionPhotos: true },
      }),
      db.inspectionSchedule.findMany({
        where: { organizationId, isActive: true },
        select: { id: true, title: true, dueDate: true, notes: true },
        orderBy: { dueDate: "asc" },
      }),
    ]);

    // Determine which checks to fetch based on personal schedule or default monthly
    const conditionChecksThisMonth = conditionCheckSchedule
      ? await db.conditionCheck.findMany({
          where: { userId: userId, periodStart: conditionCheckSchedule.periodStart },
          select: { id: true, itemType: true, assetId: true, consumableId: true, condition: true, photoLabel: true },
        })
      : await db.conditionCheck.findMany({
          where: { userId: userId, monthYear: currentMonthYear },
          select: { id: true, itemType: true, assetId: true, consumableId: true, condition: true, photoLabel: true },
        });

    // Build kit application groups (for "Return Kit" button)
    const activeKitApplications = kitApplications
      .map((app) => ({
        id: app.id,
        kitName: app.starterKit.name,
        appliedAt: app.appliedAt.toISOString(),
        assets: allActiveAssets
          .filter((a) => a.starterKitApplicationId === app.id)
          .map((a) => ({ id: a.id, name: a.asset.name, assetCode: a.asset.assetCode, category: a.asset.category, imageUrl: a.asset.imageUrl })),
        consumables: allActiveConsumables
          .filter((c) => c.starterKitApplicationId === app.id)
          .map((c) => ({ id: c.id, name: c.consumable.name, unitType: c.consumable.unitType, quantity: c.quantity, imageUrl: c.consumable.imageUrl })),
      }))
      .filter((app) => app.assets.length > 0 || app.consumables.length > 0);

    // Non-kit individual assignments (items assigned directly, not through a kit)
    const individualAssets = allActiveAssets
      .filter((a) => !a.starterKitApplicationId)
      .map((a) => ({ id: a.id, name: a.asset.name, assetCode: a.asset.assetCode, category: a.asset.category, imageUrl: a.asset.imageUrl }));
    const individualConsumables = allActiveConsumables
      .filter((c) => !c.starterKitApplicationId)
      .map((c) => ({ id: c.id, name: c.consumable.name, unitType: c.consumable.unitType, quantity: c.quantity, imageUrl: c.consumable.imageUrl }));

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
        userId: userId,
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
      { label: "Supplies", value: consumableCount, icon: "droplet", borderColor: "border-t-action-500", iconBg: "bg-action-500", iconColor: "text-white", href: "/my-consumables" },
      { label: "Request & Confirm", value: pendingRequestCount + pendingConfirmCount, icon: "clipboard", borderColor: "border-t-action-500", iconBg: "bg-action-500", iconColor: "text-white", href: "/request-consumables" },
    ];

    return {
      staffStats,
      recentAssets: JSON.parse(JSON.stringify(recentAssets)),
      recentConsumables: JSON.parse(JSON.stringify(recentConsumables)),
      recentRequests: JSON.parse(JSON.stringify(recentRequests)),
      unacknowledgedCount,
      pendingAssetItems: JSON.parse(JSON.stringify(pendingAssetItems)),
      pendingConsumableItems: JSON.parse(JSON.stringify(pendingConsumableItems)),
      activeKitApplications,
      individualAssets,
      individualConsumables,
      conditionCheckItems,
      conditionCheckMonth: currentMonthYear,
      conditionCheckFrequency: conditionCheckSchedule?.frequency || null,
      conditionCheckDueDate: conditionCheckSchedule?.nextDueDate?.toISOString() || null,
      inspectionSchedules: JSON.parse(JSON.stringify(inspectionSchedules)),
      consumableUsageHistory,
      // Counts for AI briefing
      assetCount,
      consumableCount,
      pendingRequestCount,
      pendingConfirmCount,
    };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Auditor dashboard — read-only executive view
  if (session.user.role === "AUDITOR") {
    const organizationId = session.user.organizationId!;

    const [
      totalAssets,
      totalConsumables,
      totalStaff,
      lowStockConsumables,
      damageReports,
      pendingPOs,
      overdueReturns,
      recentAuditLogs,
      orgRecord,
    ] = await Promise.all([
      db.asset.count({ where: { organizationId, deletedAt: null } }),
      db.consumable.count({ where: { organizationId, isActive: true, deletedAt: null } }),
      db.user.count({ where: { organizationId, isActive: true, role: "STAFF" } }),
      db.consumable.findMany({
        where: { organizationId, isActive: true },
        select: { quantityOnHand: true, minimumThreshold: true },
      }),
      db.damageReport.count({ where: { organizationId, isResolved: false } }),
      db.purchaseOrder.count({ where: { organizationId, status: "PENDING" } }),
      db.pendingReturn.count({ where: { organizationId, isVerified: false } }),
      db.auditLog.findMany({
        where: { organizationId },
        select: {
          action: true,
          createdAt: true,
          performedBy: { select: { name: true } },
          metadata: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      db.organization.findUnique({
        where: { id: organizationId },
        select: { name: true },
      }),
    ]);

    const lowStockCount = lowStockConsumables.filter(
      (c) => c.quantityOnHand <= c.minimumThreshold
    ).length;

    // Health score calculation (mirrors the main dashboard logic)
    let healthScore = 100;
    healthScore -= Math.min(30, lowStockCount * 5);
    healthScore -= Math.min(20, overdueReturns * 4);
    healthScore -= Math.min(15, damageReports * 5);
    healthScore = Math.max(0, healthScore);

    const auditorStats = {
      totalAssets,
      totalConsumables,
      totalStaff,
      healthScore,
      lowStockCount,
      damageReports,
      pendingPOs,
      overdueReturns,
    };

    const auditorActivity = recentAuditLogs.map((log) => ({
      action: log.action as string,
      performedBy: log.performedBy?.name ?? "Unknown",
      createdAt: log.createdAt,
      metadata: log.metadata ? JSON.parse(log.metadata) : undefined,
    }));

    return (
      <AuditorDashboard
        orgName={orgRecord?.name ?? "Your Organisation"}
        stats={auditorStats}
        recentActivity={auditorActivity}
      />
    );
  }

  // Staff dashboard — fetch and render
  if (session.user.role === "STAFF") {
    const [staffData, staffOrgRecord] = await Promise.all([
      fetchStaffData(session.user.id, session.user.organizationId!),
      db.organization.findUnique({
        where: { id: session.user.organizationId! },
        select: { name: true },
      }),
    ]);

    const staffConditionChecksDue = staffData.conditionCheckItems.filter((i) => !i.checked).length;
    // pendingConfirmations = unacknowledged consumable kit items + unacknowledged asset kit items
    const staffPendingConfirmations = staffData.pendingConfirmCount + staffData.unacknowledgedCount;

    return (
      <>
        <AiBriefingWidget
          orgName={staffOrgRecord?.name ?? "Your Organisation"}
          lowStockCount={0}
          criticalStockCount={0}
          overdueReturns={0}
          pendingApprovals={staffData.pendingRequestCount}
          unresolvedDamage={0}
          healthScore={100}
          depletionForecasts={[]}
          recentAnomalyCount={0}
          staffUnacknowledgedCount={0}
          date={new Date().toISOString()}
          userRole="staff"
          userName={session.user.name ?? undefined}
          assignedAssetsCount={staffData.assetCount}
          assignedConsumablesCount={staffData.consumableCount}
          pendingConfirmations={staffPendingConfirmations}
          conditionChecksDue={staffConditionChecksDue}
        />
        <StaffDashboardClient
          stats={staffData.staffStats}
          recentAssets={staffData.recentAssets}
          recentConsumables={staffData.recentConsumables}
          recentRequests={staffData.recentRequests}
          unacknowledgedCount={staffData.unacknowledgedCount}
          pendingAssetItems={staffData.pendingAssetItems}
          pendingConsumableItems={staffData.pendingConsumableItems}
          activeKitApplications={staffData.activeKitApplications}
          individualAssets={staffData.individualAssets}
          individualConsumables={staffData.individualConsumables}
          conditionCheckItems={staffData.conditionCheckItems}
          conditionCheckMonth={staffData.conditionCheckMonth}
          conditionCheckFrequency={staffData.conditionCheckFrequency}
          conditionCheckDueDate={staffData.conditionCheckDueDate}
          inspectionSchedules={staffData.inspectionSchedules}
          consumableUsageHistory={staffData.consumableUsageHistory}
        />
      </>
    );
  }

  // Super Admin & Branch Manager — simple quick-nav dashboard
  if (session.user.role === "SUPER_ADMIN" || session.user.role === "BRANCH_MANAGER") {
    return <AdminQuickNav userName={session.user.name} />;
  }

  const organizationId = session.user.organizationId!;

  const regionFilter = { organizationId };

  // SUPER_ADMIN and BRANCH_MANAGER return early above — this code path is for
  // support roles only, so isSuperAdmin is always false here.
  const isSuperAdmin = false;

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
    predictedShortagesRaw,
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
    // Predicted shortages — consumables predicted to deplete within 14 days
    db.consumable.findMany({
      where: {
        ...regionFilter,
        isActive: true,
        deletedAt: null,
        riskLevel: { in: ["critical", "warning"] },
        avgDailyUsage: { gt: 0 },
      },
      select: {
        id: true,
        name: true,
        unitType: true,
        quantityOnHand: true,
        avgDailyUsage: true,
        predictedDepletionDate: true,
        riskLevel: true,
        region: { select: { id: true, name: true } },
      },
      orderBy: [{ riskLevel: "asc" }, { quantityOnHand: "asc" }],
      take: 10,
    }),
    // Regional breakdown data (Super Admin only)
    ...(isSuperAdmin
      ? [
          db.region.findMany({ where: { organizationId }, include: { state: true, _count: { select: { assets: true, consumables: true, users: true } } }, orderBy: { name: "asc" } }),
          db.damageReport.findMany({
            where: { organizationId, isResolved: false, type: "DAMAGE" },
            select: { asset: { select: { regionId: true } } },
          }),
          db.damageReport.findMany({
            where: { organizationId, isResolved: false, type: "LOSS" },
            select: { asset: { select: { regionId: true } } },
          }),
          db.consumableRequest.findMany({
            where: { status: "PENDING", consumable: { organizationId } },
            select: { consumable: { select: { regionId: true } } },
          }),
          db.purchaseOrder.groupBy({ by: ["regionId"], where: { status: "PENDING", organizationId }, _count: true }),
          db.consumable.findMany({
            where: { isActive: true, organizationId },
            include: { region: true },
          }).then((items) => items.filter((i) => i.quantityOnHand <= i.minimumThreshold)),
          db.pendingReturn.groupBy({ by: ["regionId"], where: { organizationId, isVerified: false }, _count: true }),
        ]
      : []),
  ]);

  // Build regional breakdown for Super Admin
  let regionBreakdown: { regionId: string; regionName: string; stateName: string; damaged: number; lost: number; pendingRequests: number; pendingPOs: number; overdueReturns: number; lowStockCount: number; healthScore: number; lowStockItems: { id: string; name: string; unitType: string; quantityOnHand: number; minimumThreshold: number }[] }[] | undefined;

  if (isSuperAdmin && regionData.length > 0) {
    const [regions, damageReportsRaw, lossReportsRaw, pendingReqRaw, pendingPOsByRegion, allLowStock, overdueReturnsByRegion] = regionData as [
      { id: string; name: string; latitude: number | null; longitude: number | null; state: { name: string }; _count: { assets: number; consumables: number; users: number } }[],
      { asset: { regionId: string } }[],
      { asset: { regionId: string } }[],
      { consumable: { regionId: string } }[],
      { regionId: string; _count: number }[],
      { id: string; name: string; unitType: string; quantityOnHand: number; minimumThreshold: number; regionId: string }[],
      { regionId: string | null; _count: number }[],
    ];

    // Count pending requests per region
    const pendingReqByRegion = new Map<string, number>();
    for (const r of pendingReqRaw) {
      const rid = r.consumable.regionId;
      pendingReqByRegion.set(rid, (pendingReqByRegion.get(rid) ?? 0) + 1);
    }

    // Count unresolved damage/loss reports per region
    const damagedMap = new Map<string, number>();
    for (const r of damageReportsRaw) {
      const rid = r.asset?.regionId;
      if (rid) damagedMap.set(rid, (damagedMap.get(rid) ?? 0) + 1);
    }
    const lostMap = new Map<string, number>();
    for (const r of lossReportsRaw) {
      const rid = r.asset?.regionId;
      if (rid) lostMap.set(rid, (lostMap.get(rid) ?? 0) + 1);
    }
    const poMap = new Map(pendingPOsByRegion.map((r) => [r.regionId, r._count]));
    const overdueReturnsMap = new Map(overdueReturnsByRegion.filter((r) => r.regionId).map((r) => [r.regionId!, r._count]));

    regionBreakdown = regions.map((region) => {
      const regionDamaged = damagedMap.get(region.id) ?? 0;
      const regionLowStock = allLowStock.filter((i) => i.regionId === region.id).length;
      const regionOverdueReturns = overdueReturnsMap.get(region.id) ?? 0;
      const regionPendingReq = pendingReqByRegion.get(region.id) ?? 0;

      // Per-region health score
      let regionHealth = 100;
      regionHealth -= Math.min(30, regionLowStock * 5);
      regionHealth -= Math.min(20, regionOverdueReturns * 4);
      regionHealth -= Math.min(15, regionDamaged * 5);
      regionHealth -= Math.min(10, regionPendingReq * 2);
      regionHealth = Math.max(0, regionHealth);

      return {
        regionId: region.id,
        regionName: region.name,
        stateName: region.state.name,
        damaged: regionDamaged,
        lost: lostMap.get(region.id) ?? 0,
        pendingRequests: regionPendingReq,
        pendingPOs: poMap.get(region.id) ?? 0,
        overdueReturns: regionOverdueReturns,
        lowStockCount: regionLowStock,
        healthScore: regionHealth,
        lowStockItems: allLowStock
          .filter((i) => i.regionId === region.id)
          .slice(0, 5)
          .map((i) => ({ id: i.id, name: i.name, unitType: i.unitType, quantityOnHand: i.quantityOnHand, minimumThreshold: i.minimumThreshold })),
      };
    });
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
    take: 10000,
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
    take: 10000,
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
    take: 10000,
  });
  const totalConsumableValue = consumablesWithCost.reduce((sum, c) => sum + (c.unitCost || 0) * c.quantityOnHand, 0);

  // Portfolio chart data — 6-month trend (assets vs consumables value)
  const now = new Date();
  const portfolioChartData: { month: string; assets: number; consumables: number; depreciation: number }[] = [];

  // Activity bar chart data — consumables used + staff per month
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const [allStaff, consumableUsageAll] = await Promise.all([
    db.user.findMany({
      where: { organizationId, isActive: true, role: "STAFF" },
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

  // Smart action panel — fetch pending requests, overdue returns, and pending POs with details
  const [pendingRequestsDetail, overdueReturnsDetail, pendingPOsDetail] = await Promise.all([
    db.consumableRequest.findMany({
      where: { status: "PENDING", consumable: regionFilter },
      select: {
        id: true,
        createdAt: true,
        quantity: true,
        consumable: { select: { name: true, unitType: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" }, // oldest first (most urgent)
      take: 8,
    }),
    db.assetAssignment.findMany({
      where: {
        isActive: true,
        expectedReturnDate: { lt: new Date() },
        assignmentType: "TEMPORARY",
        asset: regionFilter,
      },
      select: {
        id: true,
        expectedReturnDate: true,
        asset: { select: { name: true, assetCode: true } },
        user: { select: { name: true } },
      },
      orderBy: { expectedReturnDate: "asc" }, // most overdue first
      take: 8,
    }),
    db.purchaseOrder.findMany({
      where: { status: "PENDING", ...regionFilter },
      select: {
        id: true,
        createdAt: true,
        quantity: true,
        consumable: { select: { name: true, unitType: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" }, // oldest first
      take: 5,
    }),
  ]);

  // AI Feature queries — run in parallel
  const [depletionForecastRaw, staffUnackRaw, consumptionSpikeRaw] = await Promise.all([
    // 1. Depletion forecast: items predicted to run out in next 14 days
    db.consumable.findMany({
      where: {
        ...regionFilter,
        isActive: true,
        deletedAt: null,
        avgDailyUsage: { gt: 0 },
        predictedDepletionDate: {
          not: null,
          lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          gte: new Date(),
        },
      },
      select: {
        id: true,
        name: true,
        unitType: true,
        quantityOnHand: true,
        avgDailyUsage: true,
        predictedDepletionDate: true,
        riskLevel: true,
        region: { select: { name: true } },
      },
      orderBy: { predictedDepletionDate: "asc" },
      take: 20,
    }),

    // 2. Staff with unacknowledged kit items (assigned but not confirmed receipt)
    db.assetAssignment.findMany({
      where: {
        isActive: true,
        acknowledgedAt: null,
        starterKitApplicationId: { not: null },
        asset: regionFilter,
      },
      select: {
        id: true,
        checkoutDate: true,
        user: { select: { name: true, id: true } },
      },
      orderBy: { checkoutDate: "asc" },
      take: 30,
    }),

    // 3. Consumption spike detection: consumables where 30-day rate is much higher than baseline
    // We detect spikes by comparing riskLevel with quantityOnHand — if critical but qty > minimum, usage spiked
    db.consumable.findMany({
      where: {
        ...regionFilter,
        isActive: true,
        deletedAt: null,
        avgDailyUsage: { gt: 0 },
        riskLevel: "critical",
        quantityOnHand: { gt: 0 }, // not just out-of-stock, genuinely fast depletion
      },
      select: {
        id: true,
        name: true,
        quantityOnHand: true,
        minimumThreshold: true,
        avgDailyUsage: true,
        region: { select: { name: true } },
      },
      orderBy: { avgDailyUsage: "desc" },
      take: 5,
    }),
  ]);

  // Recent Activity feed — merge requests + checkouts + POs (last 5 each, sort in JS)
  const [recentRequests, recentCheckouts, recentPOs] = await Promise.all([
    db.consumableRequest.findMany({
      where: { consumable: regionFilter },
      select: {
        id: true, createdAt: true, status: true, quantity: true,
        consumable: { select: { name: true, unitType: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.assetAssignment.findMany({
      where: { asset: regionFilter, isActive: true },
      select: {
        id: true, checkoutDate: true, assignmentType: true,
        asset: { select: { name: true, assetCode: true } },
        user: { select: { name: true } },
      },
      orderBy: { checkoutDate: "desc" },
      take: 5,
    }),
    db.purchaseOrder.findMany({
      where: { ...regionFilter },
      select: {
        id: true, createdAt: true, status: true, quantity: true,
        consumable: { select: { name: true, unitType: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  // Upcoming maintenance count
  const upcomingMaintenance = await db.maintenanceSchedule.count({
    where: {
      isActive: true,
      nextDueDate: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      asset: regionFilter,
    },
  });

  // Operations overview data
  const regionWhere = isSuperAdmin ? {} : { regionId: session.user.regionId! };
  const assetRegionWhere = isSuperAdmin ? { organizationId } : { organizationId, asset: { regionId: session.user.regionId! } };
  const [overdueReturns, incompleteInspections, totalStaffCount, unresolvedDamageReports, unresolvedLossReports, ordersAwaitingApproval, ordersAwaitingReceival] = await Promise.all([
    db.pendingReturn.count({ where: { organizationId, isVerified: false, ...regionWhere } }),
    db.inspectionSchedule.count({ where: { organizationId, isActive: true, dueDate: { lt: new Date() } } }),
    db.user.count({ where: { organizationId, isActive: true, role: "STAFF", ...(isSuperAdmin ? {} : { regionId: session.user.regionId! }) } }),
    db.damageReport.count({ where: { ...assetRegionWhere, isResolved: false, type: "DAMAGE" } }),
    db.damageReport.count({ where: { ...assetRegionWhere, isResolved: false, type: "LOSS" } }),
    db.purchaseOrder.count({ where: { organizationId, status: "PENDING", ...regionWhere } }),
    db.purchaseOrder.count({ where: { organizationId, status: "ORDERED", ...regionWhere } }),
  ]);

  // Health score: 100 = perfect, deduct for issues
  let healthScore = 100;
  healthScore -= Math.min(30, (lowStockItems as unknown[]).length * 5); // -5 per low stock item, max -30
  healthScore -= Math.min(20, overdueReturns * 4); // -4 per overdue return, max -20
  healthScore -= Math.min(15, (unresolvedDamageReports + unresolvedLossReports) * 5); // -5 per unresolved report, max -15
  healthScore -= Math.min(15, incompleteInspections * 5); // -5 per overdue inspection, max -15
  healthScore -= Math.min(10, overdue * 2); // -2 per overdue checkout, max -10
  healthScore -= Math.min(10, (pendingRequests as number) * 2); // -2 per pending request, max -10
  healthScore = Math.max(0, healthScore);

  // Build regional breakdown for Branch Manager (their single region)
  if (!isSuperAdmin && session.user.regionId) {
    const bmRegion = await db.region.findUnique({
      where: { id: session.user.regionId },
      select: { id: true, name: true, state: { select: { name: true } } },
    });
    if (bmRegion) {
      regionBreakdown = [{
        regionId: bmRegion.id,
        regionName: bmRegion.name,
        stateName: bmRegion.state.name,
        damaged: unresolvedDamageReports,
        lost: unresolvedLossReports,
        pendingRequests: pendingRequests as number,
        pendingPOs: pendingPOs,
        overdueReturns: overdueReturns,
        lowStockCount: (lowStockItems as unknown[]).length,
        healthScore,
        lowStockItems: (lowStockItems as { id: string; name: string; unitType: string; quantityOnHand: number; minimumThreshold: number }[])
          .slice(0, 5)
          .map((i) => ({ id: i.id, name: i.name, unitType: i.unitType, quantityOnHand: i.quantityOnHand, minimumThreshold: i.minimumThreshold })),
      }];
    }
  }

  const operationsOverview = {
    healthScore,
    ordersAwaitingApproval,
    ordersAwaitingReceival,
    overdueReturns,
    incompleteInspections,
    unresolvedDamage: unresolvedDamageReports,
    lostItems: unresolvedLossReports,
    totalStaff: totalStaffCount,
    pendingRequests: pendingRequests as number,
    lowStockCount: (lowStockItems as unknown[]).length,
  };

  // Active procurement: count + cost for PENDING + APPROVED + ORDERED POs (SuperAdmin only)
  let totalProcurementCost = 0;
  let activePOCount = 0;
  if (isSuperAdmin) {
    const activePOs = await db.purchaseOrder.findMany({
      where: { organizationId, status: { in: ["PENDING", "APPROVED", "ORDERED"] } },
      select: { quantity: true, consumable: { select: { unitCost: true } } },
    });
    activePOCount = activePOs.length;
    totalProcurementCost = activePOs.reduce((sum, po) => sum + (po.consumable.unitCost ? po.quantity * po.consumable.unitCost : 0), 0);
  }

  // Smart reorder suggestions — generated from predictions (server action)
  let replenishmentSuggestions: import("@/app/actions/predictions").ReplenishmentSuggestion[] = [];
  try {
    replenishmentSuggestions = await getReplenishmentSuggestions();
  } catch {
    // Non-fatal — dashboard works without suggestions
  }

  // Anomaly count — wrapped in try/catch so detection failures don't break the page
  let anomalyCount = 0;
  try {
    const anomalies = await detectAnomalies(organizationId);
    anomalyCount = anomalies.length;
  } catch {
    // Non-fatal — dashboard works without anomaly data
  }

  // Asset health summary — SUPER_ADMIN only, non-fatal
  let assetHealthSummary: Awaited<ReturnType<typeof getAssetHealthSummary>> | null = null;
  if (isSuperAdmin) {
    try {
      assetHealthSummary = await getAssetHealthSummary(organizationId);
    } catch {
      // Non-fatal — dashboard works without asset health data
    }
  }

  let preferences = parsePreferences(userPrefs?.dashboardPreferences);

  // Branch Manager default: show Overview, Operations, Finance, Region, Low Stock
  if (!isSuperAdmin && !userPrefs?.dashboardPreferences) {
    preferences = {
      ...preferences,
      sectionOrder: ["stats", "portfolio", "regional", "low-stock"],
      hiddenWidgets: ["asset-charts", "consumable-charts", "location-map", "maintenance-due", "quick-links"],
    };
  }

  const cardTrend = (val: number, actionLabel: string) => val === 0 ? { direction: "neutral" as const, label: "Clear" } : { direction: "up" as const, label: actionLabel };

  const lowStockCount = (lowStockItems as unknown[]).length;

  const stats: { widgetId: string; label: string; value: number; icon: IconName; borderColor: string; iconBg: string; iconColor: string; href: string; trend?: { direction: "up" | "down" | "neutral"; label: string } }[] = isSuperAdmin ? [
    { widgetId: "stat-low-stock", label: "Low Stock", value: lowStockCount, icon: "alert-triangle", borderColor: "border-t-[#E8532E]", iconBg: "bg-[#E8532E]", iconColor: "text-white", href: "/alerts/low-stock", trend: cardTrend(lowStockCount, "Action") },
    { widgetId: "stat-pending-requests", label: "Requests", value: pendingRequests, icon: "clipboard", borderColor: "border-t-action-500", iconBg: "bg-action-500", iconColor: "text-white", href: "/consumables?tab=requests", trend: cardTrend(pendingRequests, "Assign") },
    { widgetId: "stat-pending-returns", label: "Returns", value: pendingReturns as number, icon: "arrow-left", borderColor: "border-t-action-500", iconBg: "bg-action-500", iconColor: "text-white", href: "/returns", trend: cardTrend(pendingReturns as number, "Confirm returns") },
    { widgetId: "stat-total-assets", label: "Total Assets", value: totalAssets, icon: "package", borderColor: "border-t-action-500", iconBg: "bg-action-500", iconColor: "text-white", href: "/assets" },
    { widgetId: "stat-checked-out", label: "Checked Out", value: checkedOut, icon: "arrow-right", borderColor: "border-t-action-500", iconBg: "bg-action-500", iconColor: "text-white", href: "/assets" },
    { widgetId: "stat-overdue", label: "Overdue", value: overdue, icon: "clock", borderColor: "border-t-[#E8532E]", iconBg: "bg-[#E8532E]", iconColor: "text-white", href: "/assets", trend: cardTrend(overdue, "Action") },
    { widgetId: "stat-damaged", label: "Damage", value: unresolvedDamageReports + unresolvedLossReports, icon: "alert-triangle", borderColor: "border-t-[#E8532E]", iconBg: "bg-[#E8532E]", iconColor: "text-white", href: "/alerts/damage", trend: cardTrend(unresolvedDamageReports + unresolvedLossReports, "Action") },
    { widgetId: "stat-pending-pos", label: "POs", value: pendingPOs, icon: "truck", borderColor: "border-t-action-500", iconBg: "bg-action-500", iconColor: "text-white", href: "/purchase-orders", trend: cardTrend(pendingPOs, "Action") },
  ] : [
    // Branch Manager — focused on actionable items
    { widgetId: "stat-low-stock", label: "Low Stock", value: lowStockCount, icon: "alert-triangle", borderColor: "border-t-[#E8532E]", iconBg: "bg-[#E8532E]", iconColor: "text-white", href: "/alerts/low-stock", trend: cardTrend(lowStockCount, "Action") },
    { widgetId: "stat-pending-requests", label: "Requests", value: pendingRequests, icon: "clipboard", borderColor: "border-t-action-500", iconBg: "bg-action-500", iconColor: "text-white", href: "/consumables?tab=requests", trend: cardTrend(pendingRequests, "Assign") },
    { widgetId: "stat-pending-returns", label: "Returns", value: pendingReturns as number, icon: "arrow-left", borderColor: "border-t-action-500", iconBg: "bg-action-500", iconColor: "text-white", href: "/returns", trend: cardTrend(pendingReturns as number, "Confirm returns") },
    { widgetId: "stat-damaged", label: "Damage", value: unresolvedDamageReports + unresolvedLossReports, icon: "alert-triangle", borderColor: "border-t-[#E8532E]", iconBg: "bg-[#E8532E]", iconColor: "text-white", href: "/alerts/damage", trend: cardTrend(unresolvedDamageReports + unresolvedLossReports, "Action") },
  ];

  const quickLinks: { label: string; href: string; icon: IconName; iconBg: string; iconColor: string }[] = [
    { label: "Manage Assets", href: "/assets", icon: "package", iconBg: "bg-action-500", iconColor: "text-white" },
    { label: "Supplies", href: "/consumables", icon: "droplet", iconBg: "bg-action-500", iconColor: "text-white" },
    { label: "Staff Overview", href: "/staff", icon: "users", iconBg: "bg-action-500", iconColor: "text-white" },
    { label: "Reports", href: "/reports", icon: "clipboard", iconBg: "bg-action-500", iconColor: "text-white" },
  ];

  // Transform predicted shortages for client
  const predictedShortages = (predictedShortagesRaw as { id: string; name: string; unitType: string; quantityOnHand: number; avgDailyUsage: number | null; predictedDepletionDate: Date | null; riskLevel: string | null; region: { id: string; name: string } }[])
    .map((item) => {
      const daysRemaining = item.avgDailyUsage && item.avgDailyUsage > 0
        ? Math.round(item.quantityOnHand / item.avgDailyUsage)
        : null;
      return {
        id: item.id,
        name: item.name,
        unitType: item.unitType,
        quantityOnHand: item.quantityOnHand,
        avgDailyUsage: item.avgDailyUsage || 0,
        daysRemaining,
        riskLevel: (item.riskLevel || "ok") as "critical" | "warning" | "ok",
        regionName: item.region.name,
        predictedDepletionDate: item.predictedDepletionDate?.toISOString() || null,
      };
    });

  // Build prioritised action items for SmartActionsPanel
  const nowMs = Date.now();
  const actionItems: import("./smart-actions-panel").SmartActionItem[] = [];

  // 1. Pending consumable requests (oldest = most critical)
  for (const req of pendingRequestsDetail as { id: string; createdAt: Date; quantity: number; consumable: { name: string; unitType: string }; user: { name: string | null } }[]) {
    const ageMs = nowMs - new Date(req.createdAt).getTime();
    const ageDays = Math.floor(ageMs / (24 * 60 * 60 * 1000));
    const ageHours = Math.floor(ageMs / (60 * 60 * 1000));
    const staffName = req.user?.name || "A staff member";
    const priority = ageDays >= 2 ? "critical" : ageDays >= 1 ? "urgent" : "normal";
    actionItems.push({
      id: `req-${req.id}`,
      priority,
      type: "request",
      title: `${staffName} needs ${req.consumable.name}`,
      description: `Requested ${req.quantity} ${req.consumable.unitType} — waiting for fulfilment`,
      href: "/consumables?tab=requests",
      timeLabel: ageDays >= 1 ? `${ageDays} day${ageDays !== 1 ? "s" : ""} ago` : `${ageHours}h ago`,
    });
  }

  // 2. Overdue asset returns
  for (const ret of overdueReturnsDetail as { id: string; expectedReturnDate: Date | null; asset: { name: string; assetCode: string }; user: { name: string | null } }[]) {
    if (!ret.expectedReturnDate) continue;
    const overdueDays = Math.ceil((nowMs - new Date(ret.expectedReturnDate).getTime()) / (24 * 60 * 60 * 1000));
    const staffName = ret.user?.name || "A staff member";
    const priority = overdueDays >= 7 ? "critical" : overdueDays >= 3 ? "urgent" : "normal";
    actionItems.push({
      id: `ret-${ret.id}`,
      priority,
      type: "overdue",
      title: `${staffName} hasn't returned ${ret.asset.name}`,
      description: `${ret.asset.assetCode} · Expected back ${overdueDays} day${overdueDays !== 1 ? "s" : ""} ago`,
      href: "/returns",
      timeLabel: `${overdueDays}d overdue`,
    });
  }

  // 3. Low stock / out-of-stock items — link to low-stock alert page (not create modal)
  for (const item of (lowStockItems as { id: string; name: string; unitType: string; quantityOnHand: number; minimumThreshold: number; region: { id: string; name: string } }[]).slice(0, 5)) {
    const isOut = item.quantityOnHand === 0;
    actionItems.push({
      id: `stock-${item.id}`,
      priority: isOut ? "critical" : "urgent",
      type: "stock",
      title: isOut ? `Out of stock: ${item.name}` : `Low stock: ${item.name}`,
      description: `${item.region.name} · ${item.quantityOnHand} left (min: ${item.minimumThreshold} ${item.unitType})`,
      href: `/alerts/low-stock?region=${item.region.id}&highlight=${item.id}`,
      timeLabel: isOut ? "Out of stock" : `${item.quantityOnHand} remaining`,
    });
  }

  // 4. Pending POs — one action item per PO linking directly to that row with highlight
  for (const po of (pendingPOsDetail as { id: string; createdAt: Date; quantity: number; consumable: { name: string; unitType: string }; createdBy: { name: string | null } | null }[])) {
    const ageMs = nowMs - new Date(po.createdAt).getTime();
    const ageDays = Math.floor(ageMs / (24 * 60 * 60 * 1000));
    const ageHours = Math.floor(ageMs / (60 * 60 * 1000));
    const createdBy = po.createdBy?.name || "Admin";
    const priority: "urgent" | "critical" = ageDays >= 3 ? "critical" : "urgent";
    actionItems.push({
      id: `po-${po.id}`,
      priority,
      type: "po",
      title: "Purchase order created — awaiting approval",
      description: `${po.quantity} ${po.consumable.unitType} of ${po.consumable.name} · Created by ${createdBy}`,
      // status=PENDING ensures the Pending tab is active from initial render (not just useEffect)
      href: `/purchase-orders?status=PENDING&highlight=${po.id}`,
      timeLabel: ageDays > 0 ? `${ageDays}d ago` : ageHours > 0 ? `${ageHours}h ago` : "Just now",
    });
  }

  // 5. Unresolved damage reports
  const totalDamage = (unresolvedDamageReports + unresolvedLossReports) as number;
  if (totalDamage > 0) {
    actionItems.push({
      id: "damage-reports",
      priority: totalDamage >= 3 ? "urgent" : "normal",
      type: "damage",
      title: `${totalDamage} unresolved damage/loss report${totalDamage !== 1 ? "s" : ""}`,
      description: "Assets marked as damaged or lost need attention",
      href: "/alerts/damage",
      timeLabel: `${totalDamage} open`,
    });
  }

  // 6. Staff unacknowledged kit items — group by user
  const unackByUser = new Map<string, { name: string; count: number; oldestDate: Date }>();
  for (const a of (staffUnackRaw as { id: string; checkoutDate: Date; user: { name: string | null; id: string } }[])) {
    const uid = a.user.id;
    const existing = unackByUser.get(uid);
    const date = new Date(a.checkoutDate);
    if (!existing) {
      unackByUser.set(uid, { name: a.user.name || "A staff member", count: 1, oldestDate: date });
    } else {
      existing.count++;
      if (date < existing.oldestDate) existing.oldestDate = date;
    }
  }
  for (const [, u] of Array.from(unackByUser.entries()).slice(0, 3)) {
    const ageDays = Math.floor((nowMs - u.oldestDate.getTime()) / (24 * 60 * 60 * 1000));
    actionItems.push({
      id: `unack-${u.name}`,
      priority: ageDays >= 3 ? "urgent" : "normal",
      type: "request" as const,
      title: `${u.name} hasn't confirmed ${u.count} item${u.count !== 1 ? "s" : ""}`,
      description: "Kit assigned but not yet acknowledged by staff member",
      href: "/staff",
      timeLabel: ageDays >= 1 ? `${ageDays}d since assigned` : "Today",
    });
  }

  // 7. Consumption spikes — critical items with qty still above minimum (usage has accelerated)
  for (const item of (consumptionSpikeRaw as { id: string; name: string; quantityOnHand: number; minimumThreshold: number; avgDailyUsage: number; region: { name: string } }[])) {
    if (item.quantityOnHand > item.minimumThreshold) {
      const daysLeft = Math.round(item.quantityOnHand / item.avgDailyUsage);
      actionItems.push({
        id: `spike-${item.id}`,
        priority: "urgent" as const,
        type: "stock" as const,
        title: `Usage spike: ${item.name}`,
        description: `${item.region.name} · Depleting faster than normal (~${daysLeft}d left)`,
        href: "/purchase-orders?action=create",
        timeLabel: "Unusual usage ↑",
      });
    }
  }

  // Sort: critical → urgent → normal
  const PRIORITY_ORDER = { critical: 0, urgent: 1, normal: 2 };
  actionItems.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  // Build recent activity feed — merge, sort by date, take top 10
  type RecentActivityItem = import("./recent-activity-widget").RecentActivityItem;
  const activityFeed: RecentActivityItem[] = [];

  for (const r of (recentRequests as { id: string; createdAt: Date; status: string; quantity: number; consumable: { name: string; unitType: string }; user: { name: string | null } }[])) {
    activityFeed.push({
      id: `req-${r.id}`,
      type: "request",
      staffName: r.user?.name || "Someone",
      itemName: r.consumable.name,
      detail: `${r.quantity} ${r.consumable.unitType} · Status: ${r.status.toLowerCase()}`,
      timeAgo: r.createdAt.toISOString(),
      href: "/consumables?tab=requests",
      status: r.status,
    });
  }
  for (const a of (recentCheckouts as { id: string; checkoutDate: Date; assignmentType: string; asset: { name: string; assetCode: string }; user: { name: string | null } }[])) {
    activityFeed.push({
      id: `co-${a.id}`,
      type: "checkout",
      staffName: a.user?.name || "Someone",
      itemName: a.asset.name,
      detail: `${a.asset.assetCode} · ${a.assignmentType.toLowerCase()} assignment`,
      timeAgo: a.checkoutDate.toISOString(),
      href: "/assets",
    });
  }
  for (const p of (recentPOs as { id: string; createdAt: Date; status: string; quantity: number; consumable: { name: string; unitType: string }; createdBy: { name: string | null } | null }[])) {
    activityFeed.push({
      id: `po-${p.id}`,
      type: "po",
      staffName: p.createdBy?.name || "Admin",
      itemName: p.consumable.name,
      detail: `${p.quantity} ${p.consumable.unitType} · ${p.status.toLowerCase()}`,
      timeAgo: p.createdAt.toISOString(),
      href: "/purchase-orders",
      status: p.status,
    });
  }

  // Sort by most recent first, take top 10
  activityFeed.sort((a, b) => new Date(b.timeAgo).getTime() - new Date(a.timeAgo).getTime());
  const recentActivity: RecentActivityItem[] = activityFeed.slice(0, 10).map((item) => ({
    ...item,
    timeAgo: (() => {
      const diff = Date.now() - new Date(item.timeAgo).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return "just now";
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      return `${Math.floor(hrs / 24)}d ago`;
    })(),
  }));

  // Build depletion forecast data
  const spikeIds = new Set((consumptionSpikeRaw as { id: string }[]).map((i) => i.id));
  const depletionForecast = (depletionForecastRaw as { id: string; name: string; unitType: string; quantityOnHand: number; avgDailyUsage: number; predictedDepletionDate: Date; riskLevel: string | null; region: { name: string } }[])
    .map((item) => ({
      id: item.id,
      name: item.name,
      unitType: item.unitType,
      quantityOnHand: item.quantityOnHand,
      predictedDepletionDate: item.predictedDepletionDate.toISOString(),
      daysRemaining: Math.max(0, Math.ceil((item.predictedDepletionDate.getTime() - nowMs) / (24 * 60 * 60 * 1000))),
      riskLevel: (item.riskLevel || "warning") as "critical" | "warning" | "ok",
      regionName: item.region.name,
      spiking: spikeIds.has(item.id),
    }));

  // Map ReplenishmentSuggestion → ReorderRecommendation shape for SmartReorderPanel
  const reorderRecommendations: import("./smart-reorder-panel").ReorderRecommendation[] = replenishmentSuggestions.map((s) => ({
    consumableId: s.consumableId,
    name: s.consumableName,
    category: s.regionName,
    currentStock: s.currentStock,
    unit: s.unitType,
    suggestedQty: s.suggestedOrderQty,
    estimatedCost: s.estimatedCost ?? undefined,
    supplierName: undefined,
    riskLevel: (s.riskLevel === "critical" || s.riskLevel === "warning" || s.riskLevel === "ok") ? s.riskLevel : "warning",
    daysRemaining: s.daysRemaining ?? undefined,
    avgDailyUsage: s.avgDailyUsage,
    reasoning: s.reason,
  }));

  const managerProps = {
    stats,
    lowStockItems: JSON.parse(JSON.stringify(lowStockItems)),
    quickLinks,
    preferences,
    subtitle: isSuperAdmin ? "All locations overview" : "Your region overview",
    userName: session.user.name ?? undefined,
    regionBreakdown,
    assetStatusChart,
    categoryChart,
    consumableStatusChart,
    consumableCategoryChart,
    portfolioValue: { purchase: totalPurchaseValue, current: Math.round(totalCurrentValue * 100) / 100, depreciation: Math.round((totalPurchaseValue - totalCurrentValue) * 100) / 100, consumableValue: Math.round(totalConsumableValue * 100) / 100 },
    portfolioChartData,
    activityChartData: isSuperAdmin ? activityChartData : undefined,
    operationsOverview,
    upcomingMaintenance,
    isSuperAdmin,
    mapLocations,
    predictedShortages,
    actionItems,
    depletionForecast,
    recentActivity,
    procurementCost: isSuperAdmin ? Math.round(totalProcurementCost * 100) / 100 : undefined,
    activePOCount: isSuperAdmin ? activePOCount : undefined,
    reorderRecommendations,
    recentAnomalyCount: anomalyCount,
  };

  // Compute criticalStockCount for AI briefing (items with riskLevel "critical")
  const criticalStockCount = (predictedShortagesRaw as { riskLevel: string | null }[]).filter((i) => i.riskLevel === "critical").length;
  const staffUnacknowledgedCount = new Set((staffUnackRaw as { user: { id: string } }[]).map((a) => a.user.id)).size;

  // Fetch org name for AI briefing
  const orgRecord = await db.organization.findUnique({
    where: { id: organizationId },
    select: { name: true, industry: true, onboardingSkippedAt: true, onboardingCompletedAt: true },
  });

  // Super Admin — standard dashboard
  const showSetupBanner =
    isSuperAdmin &&
    !!orgRecord?.onboardingSkippedAt &&
    !orgRecord?.onboardingCompletedAt;

  const industryLabel = orgRecord?.industry
    ? INDUSTRY_TEMPLATES[orgRecord.industry as IndustryId]?.name
    : undefined;

  if (isSuperAdmin) {
    return (
      <>
        {showSetupBanner && <SetupBanner industry={industryLabel} />}
        <DashboardClient
          {...managerProps}
          assetHealthSummary={assetHealthSummary}
          briefingWidget={
            <AiBriefingWidget
              orgName={orgRecord?.name ?? "Your Organisation"}
              lowStockCount={(lowStockItems as unknown[]).length}
              criticalStockCount={criticalStockCount}
              overdueReturns={overdueReturns}
              pendingApprovals={ordersAwaitingApproval}
              unresolvedDamage={unresolvedDamageReports + unresolvedLossReports}
              healthScore={healthScore}
              depletionForecasts={depletionForecast.map((d) => ({ name: d.name, daysRemaining: d.daysRemaining, riskLevel: d.riskLevel }))}
              recentAnomalyCount={anomalyCount}
              staffUnacknowledgedCount={staffUnacknowledgedCount}
              date={new Date().toISOString()}
            />
          }
        />
      </>
    );
  }

  // Branch Manager — toggle between Manager and Staff views
  const staffData = await fetchStaffData(session.user.id, organizationId);
  const staffProps = {
    stats: staffData.staffStats,
    recentAssets: staffData.recentAssets,
    recentConsumables: staffData.recentConsumables,
    recentRequests: staffData.recentRequests,
    unacknowledgedCount: staffData.unacknowledgedCount,
    pendingAssetItems: staffData.pendingAssetItems,
    pendingConsumableItems: staffData.pendingConsumableItems,
    activeKitApplications: staffData.activeKitApplications,
    individualAssets: staffData.individualAssets,
    individualConsumables: staffData.individualConsumables,
    conditionCheckItems: staffData.conditionCheckItems,
    conditionCheckMonth: staffData.conditionCheckMonth,
    conditionCheckFrequency: staffData.conditionCheckFrequency,
    conditionCheckDueDate: staffData.conditionCheckDueDate,
    inspectionSchedules: staffData.inspectionSchedules,
    consumableUsageHistory: staffData.consumableUsageHistory,
  };

  return (
    <BranchManagerDashboard
      managerProps={managerProps}
      staffProps={staffProps}
      briefingWidget={
        <AiBriefingWidget
          orgName={orgRecord?.name ?? "Your Organisation"}
          lowStockCount={(lowStockItems as unknown[]).length}
          criticalStockCount={criticalStockCount}
          overdueReturns={overdueReturns}
          pendingApprovals={ordersAwaitingApproval}
          unresolvedDamage={unresolvedDamageReports + unresolvedLossReports}
          healthScore={healthScore}
          depletionForecasts={depletionForecast.map((d) => ({ name: d.name, daysRemaining: d.daysRemaining, riskLevel: d.riskLevel }))}
          recentAnomalyCount={anomalyCount}
          staffUnacknowledgedCount={staffUnacknowledgedCount}
          date={new Date().toISOString()}
        />
      }
    />
  );
}
