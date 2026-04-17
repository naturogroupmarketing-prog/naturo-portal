import { db } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HealthFactor {
  name: string;
  impact: number;       // negative = deduction from 100
  description: string;
}

export interface AssetHealthScore {
  assetId: string;
  assetName: string;
  assetCode: string;
  score: number;        // 0–100
  grade: "A" | "B" | "C" | "D" | "F";
  status: "excellent" | "good" | "fair" | "poor" | "critical";
  factors: HealthFactor[];
  recommendation: "maintain" | "monitor" | "service" | "retire";
  lastCalculated: Date;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function scoreToGrade(score: number): AssetHealthScore["grade"] {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 40) return "D";
  return "F";
}

function scoreToStatus(score: number): AssetHealthScore["status"] {
  if (score >= 90) return "excellent";
  if (score >= 75) return "good";
  if (score >= 60) return "fair";
  if (score >= 40) return "poor";
  return "critical";
}

function gradeToRecommendation(grade: AssetHealthScore["grade"]): AssetHealthScore["recommendation"] {
  if (grade === "A" || grade === "B") return "maintain";
  if (grade === "C") return "monitor";
  if (grade === "D") return "service";
  return "retire";
}

function monthsSince(date: Date): number {
  const now = new Date();
  return (
    (now.getFullYear() - date.getFullYear()) * 12 +
    (now.getMonth() - date.getMonth())
  );
}

// ─── Single-asset health calculation ─────────────────────────────────────────

export async function calculateAssetHealth(assetId: string): Promise<AssetHealthScore> {
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  const asset = await db.asset.findUniqueOrThrow({
    where: { id: assetId },
    select: {
      id: true,
      name: true,
      assetCode: true,
      status: true,
      purchaseDate: true,
      damageReports: {
        select: { id: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
      maintenance: {
        where: { isActive: true },
        select: {
          id: true,
          nextDueDate: true,
          logs: {
            select: { id: true, completedAt: true },
            orderBy: { completedAt: "desc" },
            take: 1,
          },
        },
      },
      conditionChecks: {
        select: { id: true, condition: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  let score = 100;
  const factors: HealthFactor[] = [];

  // ── Factor 1: LOST override ───────────────────────────────────────────────
  if (asset.status === "LOST") {
    return {
      assetId: asset.id,
      assetName: asset.name,
      assetCode: asset.assetCode,
      score: 0,
      grade: "F",
      status: "critical",
      factors: [
        {
          name: "Asset lost",
          impact: -100,
          description: "Asset is marked as LOST. Score is overridden to 0.",
        },
      ],
      recommendation: "retire",
      lastCalculated: now,
    };
  }

  // ── Factor 2: Age deduction (max -25) ────────────────────────────────────
  if (asset.purchaseDate) {
    const months = monthsSince(asset.purchaseDate);
    let agePenalty = 0;
    let ageDescription = "";

    if (months > 96) {
      agePenalty = -25;
      ageDescription = `Asset is ${Math.floor(months / 12)} years old (> 8 years).`;
    } else if (months > 72) {
      agePenalty = -20;
      ageDescription = `Asset is ${Math.floor(months / 12)} years old (> 6 years).`;
    } else if (months > 48) {
      agePenalty = -10;
      ageDescription = `Asset is ${Math.floor(months / 12)} years old (> 4 years).`;
    } else if (months > 24) {
      agePenalty = -5;
      ageDescription = `Asset is ${Math.floor(months / 12)} years old (> 2 years).`;
    }

    if (agePenalty < 0) {
      score += agePenalty;
      factors.push({
        name: "Age",
        impact: agePenalty,
        description: ageDescription,
      });
    }
  }

  // ── Factor 3: Damage history deduction (max -30) ─────────────────────────
  const damageCount = asset.damageReports.length;
  if (damageCount > 0) {
    let damagePenalty = 0;
    if (damageCount >= 3) damagePenalty = -30;
    else if (damageCount === 2) damagePenalty = -20;
    else damagePenalty = -10;

    // Bonus: if last damage report was more than 12 months ago, halve the deduction
    const lastDamage = asset.damageReports[0];
    const isOldDamage = lastDamage && lastDamage.createdAt < twelveMonthsAgo;
    if (isOldDamage) {
      damagePenalty = Math.floor(damagePenalty / 2);
    }

    score += damagePenalty;
    factors.push({
      name: "Damage history",
      impact: damagePenalty,
      description: `${damageCount} damage report(s) on record${isOldDamage ? " (most recent > 12 months ago — deduction halved)" : ""}.`,
    });
  }

  // ── Factor 4: Maintenance compliance deduction (max -20) ─────────────────
  const overdueSchedules = asset.maintenance.filter(
    (s) => s.nextDueDate < now
  );
  if (overdueSchedules.length > 0) {
    const maintenancePenalty = overdueSchedules.length >= 2 ? -20 : -10;
    score += maintenancePenalty;
    factors.push({
      name: "Maintenance compliance",
      impact: maintenancePenalty,
      description: `${overdueSchedules.length} overdue maintenance schedule(s).`,
    });
  }

  // ── Factor 5: Status deduction (max -15) ─────────────────────────────────
  if (asset.status === "DAMAGED") {
    score += -15;
    factors.push({
      name: "Asset status",
      impact: -15,
      description: "Asset is currently marked as DAMAGED.",
    });
  } else if (asset.status === "UNAVAILABLE") {
    score += -10;
    factors.push({
      name: "Asset status",
      impact: -10,
      description: "Asset is currently marked as UNAVAILABLE.",
    });
  }

  // ── Factor 6: Condition check deduction (max -10) ─────────────────────────
  // ConditionCheck has a `condition` string field: "GOOD", "FAIR", "POOR", "DAMAGED"
  const latestCheck = asset.conditionChecks[0];
  if (latestCheck) {
    const cond = latestCheck.condition;
    if (cond === "POOR" || cond === "DAMAGED") {
      score += -10;
      factors.push({
        name: "Condition check",
        impact: -10,
        description: `Latest condition check rated "${cond}".`,
      });
    } else if (cond === "FAIR") {
      score += -5;
      factors.push({
        name: "Condition check",
        impact: -5,
        description: `Latest condition check rated "${cond}".`,
      });
    }
  }

  // Clamp to 0–100
  score = Math.max(0, Math.min(100, score));

  const grade = scoreToGrade(score);

  return {
    assetId: asset.id,
    assetName: asset.name,
    assetCode: asset.assetCode,
    score,
    grade,
    status: scoreToStatus(score),
    factors,
    recommendation: gradeToRecommendation(grade),
    lastCalculated: now,
  };
}

// ─── Org-wide batch calculation ───────────────────────────────────────────────

export async function calculateOrgAssetHealth(
  organizationId: string
): Promise<AssetHealthScore[]> {
  const assets = await db.asset.findMany({
    where: {
      organizationId,
      status: { notIn: ["LOST", "RETIRED" as never] },
      deletedAt: null,
    },
    select: { id: true },
  });

  const assetIds = assets.map((a) => a.id);
  const results: AssetHealthScore[] = [];

  // Process in batches of 10
  for (let i = 0; i < assetIds.length; i += 10) {
    const batch = assetIds.slice(i, i + 10);
    const batchResults = await Promise.all(
      batch.map((id) =>
        calculateAssetHealth(id).catch((err) => {
          console.error(`[asset-health] Failed to calculate health for asset ${id}:`, err);
          return null;
        })
      )
    );

    for (const result of batchResults) {
      if (result !== null) {
        results.push(result);
      }
    }
  }

  // Sort ascending by score (worst first)
  results.sort((a, b) => a.score - b.score);

  return results;
}

// ─── Org-level summary stats ──────────────────────────────────────────────────

export async function getAssetHealthSummary(organizationId: string): Promise<{
  averageScore: number;
  distribution: { grade: string; count: number }[];
  criticalAssets: AssetHealthScore[];
  topPerformers: AssetHealthScore[];
}> {
  const allScores = await calculateOrgAssetHealth(organizationId);

  if (allScores.length === 0) {
    return {
      averageScore: 0,
      distribution: [],
      criticalAssets: [],
      topPerformers: [],
    };
  }

  const averageScore =
    Math.round(
      (allScores.reduce((sum, s) => sum + s.score, 0) / allScores.length) * 10
    ) / 10;

  // Grade distribution
  const gradeCounts = new Map<string, number>();
  for (const s of allScores) {
    gradeCounts.set(s.grade, (gradeCounts.get(s.grade) ?? 0) + 1);
  }
  const distribution = (["A", "B", "C", "D", "F"] as const).map((grade) => ({
    grade,
    count: gradeCounts.get(grade) ?? 0,
  }));

  // Critical assets: grade F or score <= 39 (already sorted worst-first)
  const criticalAssets = allScores.filter((s) => s.grade === "F").slice(0, 10);

  // Top performers: sort descending
  const topPerformers = [...allScores]
    .sort((a, b) => b.score - a.score)
    .filter((s) => s.grade === "A")
    .slice(0, 10);

  return {
    averageScore,
    distribution,
    criticalAssets,
    topPerformers,
  };
}
