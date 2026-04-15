import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * POST /api/predictions — Recalculate predictive inventory data
 * Super Admin only. Analyzes consumption history and updates predictions.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId = session.user.organizationId!;
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  try {
    // Get all active consumables
    const consumables = await db.consumable.findMany({
      where: { organizationId, isActive: true, deletedAt: null },
      select: {
        id: true,
        name: true,
        quantityOnHand: true,
        minimumThreshold: true,
      },
    });

    // Get consumption data — assignments + issued requests
    const [assignments, issuedRequests] = await Promise.all([
      db.consumableAssignment.findMany({
        where: {
          consumable: { organizationId },
          assignedDate: { gte: ninetyDaysAgo },
        },
        select: { consumableId: true, quantity: true, assignedDate: true },
      }),
      db.consumableRequest.findMany({
        where: {
          consumable: { organizationId },
          status: "ISSUED",
          issuedAt: { gte: ninetyDaysAgo },
        },
        select: { consumableId: true, quantity: true, issuedAt: true },
      }),
    ]);

    // Build consumption map
    const consumptionMap = new Map<string, { total90d: number; total30d: number; firstDate: Date }>();

    for (const a of assignments) {
      const existing = consumptionMap.get(a.consumableId) || { total90d: 0, total30d: 0, firstDate: a.assignedDate };
      existing.total90d += a.quantity;
      if (a.assignedDate >= thirtyDaysAgo) existing.total30d += a.quantity;
      if (a.assignedDate < existing.firstDate) existing.firstDate = a.assignedDate;
      consumptionMap.set(a.consumableId, existing);
    }

    for (const r of issuedRequests) {
      const issuedAt = r.issuedAt || new Date();
      const existing = consumptionMap.get(r.consumableId) || { total90d: 0, total30d: 0, firstDate: issuedAt };
      existing.total90d += r.quantity;
      if (issuedAt >= thirtyDaysAgo) existing.total30d += r.quantity;
      if (issuedAt < existing.firstDate) existing.firstDate = issuedAt;
      consumptionMap.set(r.consumableId, existing);
    }

    let updated = 0;

    // Update each consumable with prediction data
    await Promise.all(
      consumables.map(async (c) => {
        const consumption = consumptionMap.get(c.id);
        let avgDailyUsage = 0;

        if (consumption) {
          if (consumption.total30d > 0) {
            const daySpan30 = Math.max(1, Math.ceil((now.getTime() - thirtyDaysAgo.getTime()) / (24 * 60 * 60 * 1000)));
            avgDailyUsage = consumption.total30d / daySpan30;
          } else {
            const daySpan = Math.max(1, Math.ceil((now.getTime() - consumption.firstDate.getTime()) / (24 * 60 * 60 * 1000)));
            avgDailyUsage = consumption.total90d / daySpan;
          }
        }

        let daysRemaining: number | null = null;
        let predictedDepletionDate: Date | null = null;

        if (avgDailyUsage > 0) {
          daysRemaining = Math.round(c.quantityOnHand / avgDailyUsage);
          predictedDepletionDate = new Date(now.getTime() + daysRemaining * 24 * 60 * 60 * 1000);
        }

        let riskLevel = "ok";
        if (c.quantityOnHand === 0) riskLevel = "critical";
        else if (daysRemaining !== null && daysRemaining <= 3) riskLevel = "critical";
        else if (daysRemaining !== null && daysRemaining <= 7) riskLevel = "warning";
        else if (c.quantityOnHand <= c.minimumThreshold) riskLevel = "warning";

        await db.consumable.update({
          where: { id: c.id },
          data: {
            avgDailyUsage: Math.round(avgDailyUsage * 100) / 100,
            predictedDepletionDate,
            riskLevel,
            lastUsageCalcAt: now,
          },
        });
        updated++;
      })
    );

    return NextResponse.json({
      success: true,
      updated,
      message: `Updated predictions for ${updated} consumables`,
    });
  } catch (error) {
    console.error("[predictions]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to calculate predictions" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/predictions — Get current prediction status
 */
export async function GET() {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "BRANCH_MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId = session.user.organizationId!;

  const [critical, warning, lastCalc] = await Promise.all([
    db.consumable.count({
      where: { organizationId, isActive: true, deletedAt: null, riskLevel: "critical" },
    }),
    db.consumable.count({
      where: { organizationId, isActive: true, deletedAt: null, riskLevel: "warning" },
    }),
    db.consumable.findFirst({
      where: { organizationId, lastUsageCalcAt: { not: null } },
      select: { lastUsageCalcAt: true },
      orderBy: { lastUsageCalcAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    critical,
    warning,
    lastCalculated: lastCalc?.lastUsageCalcAt || null,
  });
}
