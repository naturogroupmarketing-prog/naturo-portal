"use server";

import { db } from "@/lib/db";
import { withAuth } from "@/lib/action-utils";
import { isAdminOrManager } from "@/lib/permissions";
import { notifyAdminsAndManagers } from "@/lib/notifications";
import { revalidatePath } from "next/cache";

// ─── PREDICTIVE INVENTORY ENGINE ─────────────────────────
// Analyzes historical consumption data to predict:
// - Average daily usage per consumable
// - Days until stock depletion
// - Risk level (critical / warning / ok)

interface PredictionResult {
  consumableId: string;
  name: string;
  regionName: string;
  quantityOnHand: number;
  avgDailyUsage: number;
  daysRemaining: number | null;
  riskLevel: "critical" | "warning" | "ok";
  predictedDepletionDate: Date | null;
}

/**
 * Calculate consumption rate from assignment history.
 * Uses the last 90 days of ConsumableAssignment + ConsumableRequest (ISSUED)
 * to determine how fast each item is being consumed.
 */
export async function recalcConsumablePredictions(): Promise<{ updated: number; predictions: PredictionResult[] }> {
  const session = await withAuth();
  if (!isAdminOrManager(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId!;
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get all active consumables
  const consumables = await db.consumable.findMany({
    where: { organizationId, isActive: true, deletedAt: null },
    select: {
      id: true,
      name: true,
      quantityOnHand: true,
      minimumThreshold: true,
      regionId: true,
      region: { select: { name: true } },
    },
  });

  // Get all issued assignments in the last 90 days (these represent consumption)
  const assignments = await db.consumableAssignment.findMany({
    where: {
      consumable: { organizationId },
      assignedDate: { gte: ninetyDaysAgo },
    },
    select: {
      consumableId: true,
      quantity: true,
      assignedDate: true,
    },
  });

  // Get all issued requests in the last 90 days
  const issuedRequests = await db.consumableRequest.findMany({
    where: {
      consumable: { organizationId },
      status: "ISSUED",
      issuedAt: { gte: ninetyDaysAgo },
    },
    select: {
      consumableId: true,
      quantity: true,
      issuedAt: true,
    },
  });

  // Build consumption map: consumableId → total quantity consumed in window
  const consumptionMap = new Map<string, { total90d: number; total30d: number; firstDate: Date }>();

  for (const a of assignments) {
    const existing = consumptionMap.get(a.consumableId) || { total90d: 0, total30d: 0, firstDate: a.assignedDate };
    existing.total90d += a.quantity;
    if (a.assignedDate >= thirtyDaysAgo) {
      existing.total30d += a.quantity;
    }
    if (a.assignedDate < existing.firstDate) {
      existing.firstDate = a.assignedDate;
    }
    consumptionMap.set(a.consumableId, existing);
  }

  for (const r of issuedRequests) {
    const issuedAt = r.issuedAt || new Date();
    const existing = consumptionMap.get(r.consumableId) || { total90d: 0, total30d: 0, firstDate: issuedAt };
    existing.total90d += r.quantity;
    if (issuedAt >= thirtyDaysAgo) {
      existing.total30d += r.quantity;
    }
    if (issuedAt < existing.firstDate) {
      existing.firstDate = issuedAt;
    }
    consumptionMap.set(r.consumableId, existing);
  }

  const predictions: PredictionResult[] = [];
  const updates: { id: string; avgDailyUsage: number; predictedDepletionDate: Date | null; riskLevel: string }[] = [];

  for (const c of consumables) {
    const consumption = consumptionMap.get(c.id);

    let avgDailyUsage = 0;
    if (consumption) {
      // Prefer 30-day average if available, fallback to 90-day
      if (consumption.total30d > 0) {
        const daySpan30 = Math.max(1, Math.ceil((now.getTime() - thirtyDaysAgo.getTime()) / (24 * 60 * 60 * 1000)));
        avgDailyUsage = consumption.total30d / daySpan30;
      } else {
        const daySpan = Math.max(1, Math.ceil((now.getTime() - consumption.firstDate.getTime()) / (24 * 60 * 60 * 1000)));
        avgDailyUsage = consumption.total90d / daySpan;
      }
    }

    // Calculate days remaining
    let daysRemaining: number | null = null;
    let predictedDepletionDate: Date | null = null;

    if (avgDailyUsage > 0) {
      daysRemaining = Math.round(c.quantityOnHand / avgDailyUsage);
      predictedDepletionDate = new Date(now.getTime() + daysRemaining * 24 * 60 * 60 * 1000);
    }

    // Determine risk level
    let riskLevel: "critical" | "warning" | "ok" = "ok";
    if (c.quantityOnHand === 0) {
      riskLevel = "critical";
    } else if (daysRemaining !== null && daysRemaining <= 3) {
      riskLevel = "critical";
    } else if (daysRemaining !== null && daysRemaining <= 7) {
      riskLevel = "warning";
    } else if (c.quantityOnHand <= c.minimumThreshold) {
      riskLevel = "warning";
    }

    predictions.push({
      consumableId: c.id,
      name: c.name,
      regionName: c.region.name,
      quantityOnHand: c.quantityOnHand,
      avgDailyUsage: Math.round(avgDailyUsage * 100) / 100,
      daysRemaining,
      riskLevel,
      predictedDepletionDate,
    });

    updates.push({
      id: c.id,
      avgDailyUsage: Math.round(avgDailyUsage * 100) / 100,
      predictedDepletionDate,
      riskLevel,
    });
  }

  // Batch update all consumables with predictions
  await Promise.all(
    updates.map((u) =>
      db.consumable.update({
        where: { id: u.id },
        data: {
          avgDailyUsage: u.avgDailyUsage,
          predictedDepletionDate: u.predictedDepletionDate,
          riskLevel: u.riskLevel,
          lastUsageCalcAt: now,
        },
      })
    )
  );

  revalidatePath("/dashboard");
  revalidatePath("/consumables");
  revalidatePath("/alerts");

  return { updated: updates.length, predictions };
}

// ─── AUTO-REPLENISHMENT SUGGESTIONS ──────────────────────
// Generates smart purchase order suggestions based on predictions

export interface ReplenishmentSuggestion {
  consumableId: string;
  consumableName: string;
  regionId: string;
  regionName: string;
  currentStock: number;
  avgDailyUsage: number;
  daysRemaining: number | null;
  riskLevel: string;
  suggestedOrderQty: number;
  unitType: string;
  reason: string;
}

export async function getReplenishmentSuggestions(): Promise<ReplenishmentSuggestion[]> {
  const session = await withAuth();
  if (!isAdminOrManager(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId!;

  // Get consumables that need replenishment
  const atRisk = await db.consumable.findMany({
    where: {
      organizationId,
      isActive: true,
      deletedAt: null,
      OR: [
        { riskLevel: "critical" },
        { riskLevel: "warning" },
        { quantityOnHand: { lte: db.consumable.fields.minimumThreshold } },
      ],
    },
    select: {
      id: true,
      name: true,
      unitType: true,
      quantityOnHand: true,
      minimumThreshold: true,
      reorderLevel: true,
      avgDailyUsage: true,
      predictedDepletionDate: true,
      riskLevel: true,
      regionId: true,
      region: { select: { name: true } },
      // Check if there's already a pending/approved/ordered PO
      purchaseOrders: {
        where: { status: { in: ["PENDING", "APPROVED", "ORDERED"] } },
        select: { id: true },
        take: 1,
      },
    },
    orderBy: [
      { riskLevel: "asc" }, // critical first
      { quantityOnHand: "asc" },
    ],
  });

  const suggestions: ReplenishmentSuggestion[] = [];

  for (const item of atRisk) {
    // Skip if there's already an active PO for this item
    if (item.purchaseOrders.length > 0) continue;

    // Calculate suggested order quantity
    // Target: enough stock for 30 days based on usage, minimum = reorderLevel
    const dailyUsage = item.avgDailyUsage || 0;
    const thirtyDaySupply = Math.ceil(dailyUsage * 30);
    const deficit = Math.max(0, item.reorderLevel - item.quantityOnHand);
    const suggestedQty = Math.max(deficit, thirtyDaySupply, item.reorderLevel);

    if (suggestedQty <= 0) continue;

    const daysRemaining = dailyUsage > 0 ? Math.round(item.quantityOnHand / dailyUsage) : null;

    let reason = "";
    if (item.quantityOnHand === 0) {
      reason = "Out of stock";
    } else if (daysRemaining !== null && daysRemaining <= 3) {
      reason = `Runs out in ~${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`;
    } else if (daysRemaining !== null && daysRemaining <= 7) {
      reason = `Low — ~${daysRemaining} days remaining`;
    } else {
      reason = `Below minimum threshold (${item.minimumThreshold})`;
    }

    suggestions.push({
      consumableId: item.id,
      consumableName: item.name,
      regionId: item.regionId,
      regionName: item.region.name,
      currentStock: item.quantityOnHand,
      avgDailyUsage: dailyUsage,
      daysRemaining,
      riskLevel: item.riskLevel || "warning",
      suggestedOrderQty: suggestedQty,
      unitType: item.unitType,
      reason,
    });
  }

  return suggestions;
}

/**
 * One-click approve a replenishment suggestion → creates a PO
 */
export async function approveReplenishment(consumableId: string, quantity: number) {
  const session = await withAuth();
  if (!isAdminOrManager(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId!;

  const consumable = await db.consumable.findFirst({
    where: { id: consumableId, organizationId },
    select: { id: true, name: true, regionId: true, supplier: true },
  });

  if (!consumable) throw new Error("Consumable not found");

  // Create PO in APPROVED state (auto-approved since admin initiated it)
  const po = await db.purchaseOrder.create({
    data: {
      consumableId: consumable.id,
      regionId: consumable.regionId,
      organizationId,
      quantity,
      supplier: consumable.supplier,
      status: "APPROVED",
      notes: "Auto-generated from smart replenishment suggestion",
      createdById: session.user.id,
      approvedById: session.user.id,
      approvedAt: new Date(),
    },
  });

  revalidatePath("/purchase-orders");
  revalidatePath("/dashboard");

  return { success: true, poId: po.id, itemName: consumable.name };
}

// ─── PREDICTIVE ALERTS ───────────────────────────────────
// Generate smart alerts based on predictions

export async function generatePredictiveAlerts() {
  const session = await withAuth();
  if (!isAdminOrManager(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId!;
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Find consumables predicted to run out within 7 days
  const atRisk = await db.consumable.findMany({
    where: {
      organizationId,
      isActive: true,
      deletedAt: null,
      predictedDepletionDate: { lte: sevenDaysFromNow },
      quantityOnHand: { gt: 0 },
    },
    select: {
      id: true,
      name: true,
      quantityOnHand: true,
      avgDailyUsage: true,
      predictedDepletionDate: true,
      riskLevel: true,
      region: { select: { name: true } },
    },
  });

  // Find overdue asset returns (> 3 days)
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const overdueAssignments = await db.assetAssignment.findMany({
    where: {
      asset: { organizationId },
      actualReturnDate: null,
      isActive: true,
      expectedReturnDate: { lt: now },
      checkoutDate: { lt: threeDaysAgo },
    },
    include: {
      asset: { select: { name: true, assetCode: true } },
      user: { select: { name: true } },
    },
    take: 20,
  });

  let alertsCreated = 0;

  // Create stock depletion alerts
  for (const item of atRisk) {
    const daysLeft = item.avgDailyUsage && item.avgDailyUsage > 0
      ? Math.round(item.quantityOnHand / item.avgDailyUsage)
      : null;

    const priority = item.riskLevel === "critical" ? "critical" : "warning";
    const title = daysLeft !== null && daysLeft <= 3
      ? `${item.name} runs out in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`
      : `${item.name} stock is low — ${item.quantityOnHand} remaining`;

    await notifyAdminsAndManagers({
      organizationId,
      type: "LOW_STOCK_PREDICTION",
      title,
      message: `${item.region.name} — ${item.quantityOnHand} remaining at ${item.avgDailyUsage?.toFixed(1)}/day usage rate.`,
      link: "/purchase-orders",
      priority: priority as "critical" | "warning",
      predictedDate: item.predictedDepletionDate,
    });
    alertsCreated++;
  }

  // Create overdue return alerts
  for (const a of overdueAssignments) {
    const daysOverdue = Math.ceil((now.getTime() - (a.expectedReturnDate?.getTime() || now.getTime())) / (24 * 60 * 60 * 1000));

    await notifyAdminsAndManagers({
      organizationId,
      type: "OVERDUE_RETURN",
      title: `${a.asset.name} (${a.asset.assetCode}) not returned — ${daysOverdue} days overdue`,
      message: `Assigned to ${a.user?.name || "Unknown"}. Expected return was ${daysOverdue} days ago.`,
      link: "/returns",
      priority: daysOverdue > 7 ? "critical" as const : "warning" as const,
    });
    alertsCreated++;
  }

  return { alertsCreated, stockAlerts: atRisk.length, overdueAlerts: overdueAssignments.length };
}
