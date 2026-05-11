import { db } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AnomalySeverity = "critical" | "warning" | "info";
export type AnomalyCategory = "stock" | "asset" | "staff" | "procurement" | "damage";

export interface Anomaly {
  id: string;
  severity: AnomalySeverity;
  category: AnomalyCategory;
  title: string;
  description: string;
  entityId: string;
  entityName: string;
  entityType: "consumable" | "asset" | "user" | "region" | "purchaseOrder";
  detectedAt: Date;
  metric: string;
  recommendation: string;
  auditLink?: string;
  data: Record<string, unknown>;
}

// ─── Severity sort order ─────────────────────────────────────────────────────

const SEVERITY_ORDER: Record<AnomalySeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

// ─── Main export ─────────────────────────────────────────────────────────────

export interface AnomalySettings {
  stockConsumptionMultiplier?: number;
  overdueReturnDays?: number;
  damageReportsThreshold?: number;
  maxAnomalies?: number;
}

export async function detectAnomalies(
  organizationId: string,
  settings?: AnomalySettings
): Promise<Anomaly[]> {
  const [stock, assets, damage, staff] = await Promise.all([
    detectStockAnomalies(organizationId, settings),
    detectAssetAnomalies(organizationId, settings),
    detectDamageAnomalies(organizationId, settings),
    detectStaffAnomalies(organizationId),
  ]);

  const all = [...stock, ...assets, ...damage, ...staff];

  // Deduplicate by id
  const seen = new Set<string>();
  const unique: Anomaly[] = [];
  for (const anomaly of all) {
    if (!seen.has(anomaly.id)) {
      seen.add(anomaly.id);
      unique.push(anomaly);
    }
  }

  // Sort: critical → warning → info
  unique.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  // Cap at configured max (default 50)
  return unique.slice(0, settings?.maxAnomalies ?? 50);
}

// ─── Stock anomalies ─────────────────────────────────────────────────────────

async function detectStockAnomalies(organizationId: string, settings?: AnomalySettings): Promise<Anomaly[]> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const anomalies: Anomaly[] = [];

  // Fetch consumables with a meaningful baseline, plus active POs for each
  const [consumables, recentAssignments] = await Promise.all([
    db.consumable.findMany({
      where: {
        organizationId,
        avgDailyUsage: { gt: 0 },
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        quantityOnHand: true,
        avgDailyUsage: true,
        purchaseOrders: {
          where: { status: { in: ["PENDING", "APPROVED", "ORDERED"] } },
          select: { id: true },
        },
      },
    }),
    db.consumableAssignment.findMany({
      where: {
        consumable: { organizationId },
        assignedDate: { gte: sevenDaysAgo },
      },
      select: { consumableId: true, quantity: true },
    }),
  ]);

  // Group 7-day usage by consumable
  const usageMap = new Map<string, number>();
  for (const a of recentAssignments) {
    usageMap.set(a.consumableId, (usageMap.get(a.consumableId) ?? 0) + a.quantity);
  }

  for (const c of consumables) {
    const baseline = c.avgDailyUsage!; // already filtered > 0

    // ── Unusual consumption ──────────────────────────────────────────────────
    const sevenDayTotal = usageMap.get(c.id) ?? 0;
    const actualDailyRate = sevenDayTotal / 7;
    const ratio = actualDailyRate / baseline;

    if (ratio > 3.5) {
      anomalies.push({
        id: `stock-${c.id}-high-consumption`,
        severity: "critical",
        category: "stock",
        title: `Unusual stock consumption: ${c.name}`,
        description: `Consumption rate is ${ratio.toFixed(1)}x above the 30-day baseline over the last 7 days.`,
        entityId: c.id,
        entityName: c.name,
        entityType: "consumable",
        detectedAt: now,
        metric: `usage ${ratio.toFixed(1)}x above 30-day average`,
        recommendation: "Investigate the cause immediately and check for waste, theft, or bulk usage. Consider raising the reorder level.",
        auditLink: `/consumables/${c.id}`,
        data: {
          sevenDayTotal,
          actualDailyRate,
          baselineDailyRate: baseline,
          ratio,
        },
      });
    } else if (ratio > (settings?.stockConsumptionMultiplier ?? 2.0)) {
      anomalies.push({
        id: `stock-${c.id}-high-consumption`,
        severity: "warning",
        category: "stock",
        title: `Unusual stock consumption: ${c.name}`,
        description: `Consumption rate is ${ratio.toFixed(1)}x above the 30-day baseline over the last 7 days.`,
        entityId: c.id,
        entityName: c.name,
        entityType: "consumable",
        detectedAt: now,
        metric: `usage ${ratio.toFixed(1)}x above 30-day average`,
        recommendation: "Monitor closely and verify whether demand has legitimately increased or whether there is an uncontrolled drawdown.",
        auditLink: `/consumables/${c.id}`,
        data: {
          sevenDayTotal,
          actualDailyRate,
          baselineDailyRate: baseline,
          ratio,
        },
      });
    }

    // ── Zero stock with no active PO ────────────────────────────────────────
    if (c.quantityOnHand === 0 && c.purchaseOrders.length === 0) {
      anomalies.push({
        id: `stock-${c.id}-zero-no-po`,
        severity: "critical",
        category: "stock",
        title: `Out of stock with no purchase order: ${c.name}`,
        description: `Stock has reached zero and there is no active purchase order to replenish supply.`,
        entityId: c.id,
        entityName: c.name,
        entityType: "consumable",
        detectedAt: now,
        metric: "quantityOnHand = 0, active POs = 0",
        recommendation: "Raise a purchase order immediately to avoid an operational gap.",
        auditLink: `/consumables/${c.id}`,
        data: {
          quantityOnHand: c.quantityOnHand,
          activePurchaseOrders: 0,
        },
      });
    }

    // ── Overstock ────────────────────────────────────────────────────────────
    const overstockThreshold = baseline * 90;
    if (c.quantityOnHand > overstockThreshold) {
      anomalies.push({
        id: `stock-${c.id}-overstock`,
        severity: "info",
        category: "stock",
        title: `Possible overstock: ${c.name}`,
        description: `Current stock (${c.quantityOnHand}) exceeds 90 days of supply at the current average daily usage (${baseline.toFixed(2)}/day).`,
        entityId: c.id,
        entityName: c.name,
        entityType: "consumable",
        detectedAt: now,
        metric: `${Math.round(c.quantityOnHand / baseline)} days of stock on hand`,
        recommendation: "Review reorder quantities to reduce carrying costs and free up storage space.",
        auditLink: `/consumables/${c.id}`,
        data: {
          quantityOnHand: c.quantityOnHand,
          baselineDailyRate: baseline,
          daysOfStock: c.quantityOnHand / baseline,
          overstockThreshold,
        },
      });
    }
  }

  return anomalies;
}

// ─── Asset anomalies ─────────────────────────────────────────────────────────

async function detectAssetAnomalies(organizationId: string, settings?: AnomalySettings): Promise<Anomaly[]> {
  const now = new Date();
  const overdueReturnDays = settings?.overdueReturnDays ?? 14;
  const day14Ago = new Date(now.getTime() - overdueReturnDays * 24 * 60 * 60 * 1000);
  const day30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const day7Ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const anomalies: Anomaly[] = [];

  const [overdueAssignments, damagedAssets, unavailableAssets] = await Promise.all([
    // CHECKED_OUT with checkout date > 14 days ago and no return
    db.assetAssignment.findMany({
      where: {
        isActive: true,
        actualReturnDate: null,
        checkoutDate: { lte: day14Ago },
        asset: {
          organizationId,
          status: "CHECKED_OUT",
        },
      },
      select: {
        id: true,
        checkoutDate: true,
        asset: { select: { id: true, name: true, assetCode: true } },
        user: { select: { id: true, name: true } },
      },
    }),

    // DAMAGED with more than 1 damage report in last 30 days
    db.asset.findMany({
      where: {
        organizationId,
        status: "DAMAGED",
        deletedAt: null,
        damageReports: {
          some: { createdAt: { gte: day30Ago } },
        },
      },
      select: {
        id: true,
        name: true,
        assetCode: true,
        damageReports: {
          where: { createdAt: { gte: day30Ago } },
          select: { id: true, createdAt: true },
        },
      },
    }),

    // UNAVAILABLE for more than 7 days with no MaintenanceLog
    db.asset.findMany({
      where: {
        organizationId,
        status: "UNAVAILABLE",
        deletedAt: null,
        updatedAt: { lte: day7Ago },
      },
      select: {
        id: true,
        name: true,
        assetCode: true,
        updatedAt: true,
        maintenance: {
          select: {
            logs: {
              where: { completedAt: { gte: day7Ago } },
              select: { id: true },
            },
          },
        },
      },
    }),
  ]);

  // ── Overdue checkouts ────────────────────────────────────────────────────
  for (const assignment of overdueAssignments) {
    const daysOut = Math.floor(
      (now.getTime() - assignment.checkoutDate.getTime()) / (24 * 60 * 60 * 1000)
    );
    const severity: AnomalySeverity = daysOut > 30 ? "critical" : "warning";
    const asset = assignment.asset;
    const user = assignment.user;

    anomalies.push({
      id: `asset-${asset.id}-overdue-checkout`,
      severity,
      category: "asset",
      title: `Overdue checkout: ${asset.name}`,
      description: `Asset ${asset.assetCode} has been checked out to ${user.name ?? "unknown"} for ${daysOut} days with no return recorded.`,
      entityId: asset.id,
      entityName: asset.name,
      entityType: "asset",
      detectedAt: now,
      metric: `${daysOut} days checked out without return`,
      recommendation: daysOut > 30
        ? "Escalate immediately — contact the staff member and initiate a formal retrieval process."
        : "Follow up with the assigned staff member to confirm the asset's status and arrange return.",
      auditLink: `/assets/${asset.id}`,
      data: {
        assetCode: asset.assetCode,
        assignedUserId: user.id,
        assignedUserName: user.name,
        checkoutDate: assignment.checkoutDate,
        daysOut,
      },
    });
  }

  // ── Recurring damage ─────────────────────────────────────────────────────
  for (const asset of damagedAssets) {
    const reportCount = asset.damageReports.length;
    if (reportCount <= 1) continue;

    anomalies.push({
      id: `asset-${asset.id}-recurring-damage`,
      severity: "warning",
      category: "asset",
      title: `Recurring damage: ${asset.name}`,
      description: `Asset ${asset.assetCode} has received ${reportCount} damage reports in the last 30 days.`,
      entityId: asset.id,
      entityName: asset.name,
      entityType: "asset",
      detectedAt: now,
      metric: `${reportCount} damage reports in 30 days`,
      recommendation: "Review the asset's condition and usage patterns. Consider retirement or intensive maintenance.",
      auditLink: `/assets/${asset.id}`,
      data: {
        assetCode: asset.assetCode,
        damageReportCount: reportCount,
        reportIds: asset.damageReports.map((r) => r.id),
      },
    });
  }

  // ── Silent unavailability ────────────────────────────────────────────────
  for (const asset of unavailableAssets) {
    const hasRecentMaintenanceLog = asset.maintenance.some((s) => s.logs.length > 0);
    if (hasRecentMaintenanceLog) continue;

    const daysUnavailable = Math.floor(
      (now.getTime() - asset.updatedAt.getTime()) / (24 * 60 * 60 * 1000)
    );

    anomalies.push({
      id: `asset-${asset.id}-silent-unavailable`,
      severity: "warning",
      category: "asset",
      title: `Unaccounted unavailability: ${asset.name}`,
      description: `Asset ${asset.assetCode} has been UNAVAILABLE for ${daysUnavailable} days with no maintenance log recorded.`,
      entityId: asset.id,
      entityName: asset.name,
      entityType: "asset",
      detectedAt: now,
      metric: `${daysUnavailable} days UNAVAILABLE, 0 maintenance logs`,
      recommendation: "Add a maintenance log explaining the reason or return the asset to service.",
      auditLink: `/assets/${asset.id}`,
      data: {
        assetCode: asset.assetCode,
        daysUnavailable,
        lastUpdated: asset.updatedAt,
      },
    });
  }

  return anomalies;
}

// ─── Damage anomalies ─────────────────────────────────────────────────────────

async function detectDamageAnomalies(organizationId: string, settings?: AnomalySettings): Promise<Anomaly[]> {
  const now = new Date();
  const day30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const anomalies: Anomaly[] = [];

  const [reportsByUser, allAssets, recentReports] = await Promise.all([
    // Damage reports grouped by reporter in last 30 days
    db.damageReport.findMany({
      where: {
        organizationId,
        createdAt: { gte: day30Ago },
      },
      select: {
        id: true,
        reportedById: true,
        assetId: true,
        createdAt: true,
        reportedBy: { select: { id: true, name: true } },
        asset: { select: { id: true, name: true, category: true } },
      },
    }),

    // All assets per category (for rate calculation)
    db.asset.findMany({
      where: { organizationId, deletedAt: null },
      select: { id: true, category: true },
    }),

    // Just for reference — same data as reportsByUser above
    Promise.resolve([] as unknown[]),
  ]);

  // ── High damage rate by staff member ────────────────────────────────────
  const byUser = new Map<string, { user: { id: string; name: string | null }; reports: typeof reportsByUser }>();
  for (const r of reportsByUser) {
    if (!byUser.has(r.reportedById)) {
      byUser.set(r.reportedById, { user: r.reportedBy, reports: [] });
    }
    byUser.get(r.reportedById)!.reports.push(r);
  }

  const damageReportsThreshold = settings?.damageReportsThreshold ?? 3;
  for (const [, { user, reports }] of byUser) {
    if (reports.length > damageReportsThreshold) {
      anomalies.push({
        id: `damage-user-${user.id}-high-rate`,
        severity: "warning",
        category: "damage",
        title: `High damage rate: ${user.name ?? "Unknown Staff"}`,
        description: `${user.name ?? "This staff member"} has submitted ${reports.length} damage reports in the last 30 days.`,
        entityId: user.id,
        entityName: user.name ?? "Unknown",
        entityType: "user",
        detectedAt: now,
        metric: `${reports.length} damage reports in 30 days`,
        recommendation: "Review the staff member's handling practices. Consider targeted training or closer supervision.",
        auditLink: `/staff/${user.id}`,
        data: {
          userId: user.id,
          reportCount: reports.length,
          reportIds: reports.map((r) => r.id),
        },
      });
    }
  }

  // ── High damage rate by asset category ──────────────────────────────────
  const assetCountByCategory = new Map<string, number>();
  for (const a of allAssets) {
    assetCountByCategory.set(a.category, (assetCountByCategory.get(a.category) ?? 0) + 1);
  }

  const damageByCategory = new Map<string, { assetIds: Set<string>; reportCount: number }>();
  for (const r of reportsByUser) {
    const cat = r.asset.category;
    if (!damageByCategory.has(cat)) {
      damageByCategory.set(cat, { assetIds: new Set(), reportCount: 0 });
    }
    const entry = damageByCategory.get(cat)!;
    entry.assetIds.add(r.assetId);
    entry.reportCount++;
  }

  for (const [category, { reportCount }] of damageByCategory) {
    const totalInCategory = assetCountByCategory.get(category) ?? 0;
    if (totalInCategory === 0) continue;
    const rate = reportCount / totalInCategory;

    if (rate > 2) {
      anomalies.push({
        id: `damage-category-${category.toLowerCase().replace(/\s+/g, "-")}-high-rate`,
        severity: "warning",
        category: "damage",
        title: `High damage rate in category: ${category}`,
        description: `The "${category}" category has a damage rate of ${rate.toFixed(1)} reports per asset in the last 30 days (${reportCount} reports across ${totalInCategory} assets).`,
        entityId: category,
        entityName: category,
        entityType: "asset",
        detectedAt: now,
        metric: `${rate.toFixed(1)} damage reports per asset in 30 days`,
        recommendation: "Inspect assets in this category. Consider whether storage, handling, or usage conditions need to be reviewed.",
        auditLink: `/assets?category=${encodeURIComponent(category)}`,
        data: {
          category,
          totalAssetsInCategory: totalInCategory,
          damageReportCount: reportCount,
          rate,
        },
      });
    }
  }

  return anomalies;
}

// ─── Staff anomalies ─────────────────────────────────────────────────────────

async function detectStaffAnomalies(organizationId: string): Promise<Anomaly[]> {
  const now = new Date();
  const day30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const day7Ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const anomalies: Anomaly[] = [];

  const [recentConsumableAssignments, allConsumableAssignments, unacknowledgedAssetAssignments] =
    await Promise.all([
      // Last 30 days of consumable assignments per user
      db.consumableAssignment.findMany({
        where: {
          consumable: { organizationId },
          assignedDate: { gte: day30Ago },
        },
        select: {
          userId: true,
          quantity: true,
          user: { select: { id: true, name: true } },
        },
      }),

      // All-time consumable assignments per user (for historical average)
      db.consumableAssignment.findMany({
        where: {
          consumable: { organizationId },
        },
        select: {
          userId: true,
          quantity: true,
          assignedDate: true,
        },
      }),

      // Unacknowledged asset assignments older than 7 days
      db.assetAssignment.findMany({
        where: {
          asset: { organizationId },
          isActive: true,
          acknowledgedAt: null,
          createdAt: { lte: day7Ago },
        },
        select: {
          id: true,
          checkoutDate: true,
          createdAt: true,
          asset: { select: { id: true, name: true, assetCode: true } },
          user: { select: { id: true, name: true } },
        },
      }),
    ]);

  // ── Unusual consumable draw-down per user ────────────────────────────────
  // Build recent 30-day totals
  const recentByUser = new Map<string, { user: { id: string; name: string | null }; total: number }>();
  for (const a of recentConsumableAssignments) {
    if (!recentByUser.has(a.userId)) {
      recentByUser.set(a.userId, { user: a.user, total: 0 });
    }
    recentByUser.get(a.userId)!.total += a.quantity;
  }

  // Build historical daily average (excluding the last 30 days to keep it as baseline)
  const historicalByUser = new Map<string, number>(); // userId → total historical quantity
  const historicalDaysByUser = new Map<string, number>(); // userId → days of history

  for (const a of allConsumableAssignments) {
    if (a.assignedDate >= day30Ago) continue; // exclude recent window
    historicalByUser.set(a.userId, (historicalByUser.get(a.userId) ?? 0) + a.quantity);

    // Track earliest date per user to calculate span
    const current = historicalDaysByUser.get(a.userId);
    if (current === undefined) {
      historicalDaysByUser.set(a.userId, 1);
    }
  }

  // Calculate overall historical days span from the full dataset
  const firstAssignmentByUser = new Map<string, Date>();
  for (const a of allConsumableAssignments) {
    if (a.assignedDate >= day30Ago) continue;
    const existing = firstAssignmentByUser.get(a.userId);
    if (!existing || a.assignedDate < existing) {
      firstAssignmentByUser.set(a.userId, a.assignedDate);
    }
  }

  for (const [userId, { user, total: recentTotal }] of recentByUser) {
    const historicalTotal = historicalByUser.get(userId) ?? 0;
    const firstDate = firstAssignmentByUser.get(userId);
    if (!firstDate || historicalTotal === 0) continue;

    const historicalDays = Math.max(
      1,
      Math.floor((day30Ago.getTime() - firstDate.getTime()) / (24 * 60 * 60 * 1000))
    );
    const historicalDailyAvg = historicalTotal / historicalDays;
    const recentDailyAvg = recentTotal / 30;
    const ratio = recentDailyAvg / historicalDailyAvg;

    if (ratio > 3) {
      anomalies.push({
        id: `staff-${userId}-high-consumable-draw`,
        severity: "warning",
        category: "staff",
        title: `Unusual consumable draw: ${user.name ?? "Unknown Staff"}`,
        description: `${user.name ?? "This staff member"} has consumed ${recentTotal} units in the last 30 days — ${ratio.toFixed(1)}x their historical daily average.`,
        entityId: userId,
        entityName: user.name ?? "Unknown",
        entityType: "user",
        detectedAt: now,
        metric: `consumption ${ratio.toFixed(1)}x above historical average`,
        recommendation: "Verify the legitimacy of the assignments and check for waste or misuse.",
        auditLink: `/staff/${userId}`,
        data: {
          userId,
          recentTotal,
          recentDailyAvg,
          historicalDailyAvg,
          ratio,
          historicalDays,
        },
      });
    }
  }

  // ── Unacknowledged asset assignments > 7 days ────────────────────────────
  for (const assignment of unacknowledgedAssetAssignments) {
    const daysUnacknowledged = Math.floor(
      (now.getTime() - assignment.createdAt.getTime()) / (24 * 60 * 60 * 1000)
    );

    anomalies.push({
      id: `staff-${assignment.user.id}-unacknowledged-${assignment.asset.id}`,
      severity: "warning",
      category: "staff",
      title: `Unacknowledged assignment: ${assignment.asset.name}`,
      description: `${assignment.user.name ?? "A staff member"} has not acknowledged the assignment of asset ${assignment.asset.assetCode} after ${daysUnacknowledged} days.`,
      entityId: assignment.user.id,
      entityName: assignment.user.name ?? "Unknown",
      entityType: "user",
      detectedAt: now,
      metric: `${daysUnacknowledged} days without acknowledgement`,
      recommendation: "Contact the staff member to confirm receipt and obtain acknowledgement.",
      auditLink: `/assets/${assignment.asset.id}`,
      data: {
        userId: assignment.user.id,
        userName: assignment.user.name,
        assetId: assignment.asset.id,
        assetCode: assignment.asset.assetCode,
        assetName: assignment.asset.name,
        assignedAt: assignment.createdAt,
        daysUnacknowledged,
      },
    });
  }

  return anomalies;
}
