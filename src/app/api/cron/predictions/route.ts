import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifyAdminsAndManagers } from "@/lib/notifications";

/**
 * Daily cron — recalculates predictive inventory data for all organizations.
 * Should run once daily (e.g., 6:00 AM AEST).
 *
 * Analyzes 90-day consumption history → calculates avg daily usage,
 * predicted depletion dates, and risk levels for all consumables.
 * Generates alerts for items predicted to deplete within 7 days.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  let totalUpdated = 0;
  let totalAlerts = 0;

  try {
    // Process all organizations
    const orgs = await db.organization.findMany({ select: { id: true } });

    for (const org of orgs) {
      const organizationId = org.id;

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

      // Get consumption data
      const [assignments, issuedRequests] = await Promise.all([
        db.consumableAssignment.findMany({
          where: { consumable: { organizationId }, assignedDate: { gte: ninetyDaysAgo } },
          select: { consumableId: true, quantity: true, assignedDate: true },
        }),
        db.consumableRequest.findMany({
          where: { consumable: { organizationId }, status: "ISSUED", issuedAt: { gte: ninetyDaysAgo } },
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

      // Update predictions — batch in groups of 20 to avoid connection pool exhaustion
      const BATCH_SIZE = 20;
      for (let i = 0; i < consumables.length; i += BATCH_SIZE) {
        const batch = consumables.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(async (c) => {
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

            let predictedDepletionDate: Date | null = null;
            let daysRemaining: number | null = null;
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
            totalUpdated++;

            // Generate alerts for critical items predicted to deplete within 7 days
            if (riskLevel === "critical" && predictedDepletionDate && predictedDepletionDate <= sevenDaysFromNow) {
              const title = daysRemaining !== null && daysRemaining <= 3
                ? `${c.name} runs out in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`
                : `${c.name} stock is critically low`;

              await notifyAdminsAndManagers({
                organizationId,
                type: "LOW_STOCK_PREDICTION",
                title,
                message: `${c.region.name} — ${c.quantityOnHand} remaining at ${avgDailyUsage.toFixed(1)}/day usage.`,
                link: "/purchase-orders",
                priority: "critical",
                predictedDate: predictedDepletionDate,
              });
              totalAlerts++;
            }
          })
        );
      }
    }

    return NextResponse.json({
      success: true,
      totalUpdated,
      totalAlerts,
      organizations: orgs.length,
    });
  } catch (error) {
    console.error("[cron:predictions]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Prediction calculation failed" },
      { status: 500 }
    );
  }
}
