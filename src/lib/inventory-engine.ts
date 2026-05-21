/**
 * Inventory Engine for Trackio
 *
 * Uses FIFO (First In, First Out) — oldest batch consumed first.
 */

import { db } from "@/lib/db";

// Prisma transaction client type (compatible with both db and tx)
type PrismaTx = Omit<
  typeof db,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export interface BatchBreakdown {
  batchId: string;
  quantity: number;
  receivedAt: Date;
}

export interface BatchSummary {
  id: string;
  quantityAdded: number;
  quantityRemaining: number;
  unitCost: number | null;
  source: string;
  receivedAt: Date;
  createdAt: Date;
}

// ─── Backfill ───────────────────────────────────────────────────────────────

/**
 * For legacy consumables that have quantityOnHand > 0 but no batch records,
 * auto-create a single BACKFILL batch to represent the existing stock.
 * Uses epoch time (Jan 1 1970) as receivedAt so it is always the "oldest" batch.
 */
async function ensureBackfillBatch(
  consumableId: string,
  organizationId: string,
  quantityOnHand: number,
  tx: PrismaTx
): Promise<void> {
  if (quantityOnHand <= 0) return;

  const existingActive = await (tx as typeof db).consumableBatch.findFirst({
    where: { consumableId, isActive: true, quantityRemaining: { gt: 0 } },
    select: { id: true },
  });

  if (!existingActive) {
    await (tx as typeof db).consumableBatch.create({
      data: {
        consumableId,
        organizationId,
        quantityAdded: quantityOnHand,
        quantityRemaining: quantityOnHand,
        source: "BACKFILL",
        notes: "Auto-created: stock that existed before batch tracking was enabled",
        isActive: true,
        receivedAt: new Date(0), // Epoch — always oldest
      },
    });
  }
}

// ─── Core Consumption Algorithm ─────────────────────────────────────────────

/**
 * FIFO consumption algorithm (oldest batch consumed first).
 *
 * Deducts `quantity` from batches for `consumableId`.
 *
 * Returns a breakdown of which batches were consumed and how much.
 *
 * MUST be called inside a Prisma $transaction.
 * The caller is responsible for also decrementing quantityOnHand on the Consumable record.
 */
export async function consumeFromBatches(
  consumableId: string,
  organizationId: string,
  quantity: number,
  actionType: string,
  performedById: string,
  tx: PrismaTx,
  referenceId?: string
): Promise<BatchBreakdown[]> {
  // Check for backfill need (legacy items with no batches)
  const consumable = await (tx as typeof db).consumable.findUnique({
    where: { id: consumableId },
    select: { quantityOnHand: true },
  });
  if (consumable) {
    await ensureBackfillBatch(consumableId, organizationId, consumable.quantityOnHand, tx);
  }

  // Fetch active batches sorted FIFO (oldest first)
  const batches = await (tx as typeof db).consumableBatch.findMany({
    where: { consumableId, isActive: true, quantityRemaining: { gt: 0 } },
    orderBy: { receivedAt: "asc" },
  });

  const totalAvailable = batches.reduce((sum, b) => sum + b.quantityRemaining, 0);
  if (totalAvailable < quantity) {
    throw new Error(
      `Insufficient batch stock: ${totalAvailable} available, ${quantity} requested`
    );
  }

  let remaining = quantity;
  const breakdown: BatchBreakdown[] = [];

  for (const batch of batches) {
    if (remaining <= 0) break;

    const consume = Math.min(batch.quantityRemaining, remaining);
    const newQtyRemaining = batch.quantityRemaining - consume;

    await (tx as typeof db).consumableBatch.update({
      where: { id: batch.id },
      data: {
        quantityRemaining: newQtyRemaining,
        isActive: newQtyRemaining > 0,
      },
    });

    await (tx as typeof db).batchConsumption.create({
      data: {
        batchId: batch.id,
        consumableId,
        quantity: consume,
        actionType,
        referenceId: referenceId ?? null,
        performedById,
      },
    });

    breakdown.push({
      batchId: batch.id,
      quantity: consume,
      receivedAt: batch.receivedAt,
    });

    remaining -= consume;
  }

  return breakdown;
}

// ─── Batch Creation (Stock In) ──────────────────────────────────────────────

/**
 * Create a new batch when stock is received (stock add, return, adjustment).
 *
 * MUST be called inside a Prisma $transaction.
 * The caller is responsible for also incrementing quantityOnHand on the Consumable record.
 *
 * Returns the new batch ID.
 */
export async function addBatch(
  consumableId: string,
  organizationId: string,
  quantity: number,
  source: string,
  performedById: string | null,
  tx: PrismaTx,
  unitCost?: number,
  notes?: string
): Promise<string> {
  const batch = await (tx as typeof db).consumableBatch.create({
    data: {
      consumableId,
      organizationId,
      quantityAdded: quantity,
      quantityRemaining: quantity,
      unitCost: unitCost ?? null,
      source,
      notes: notes ?? null,
      createdById: performedById,
      isActive: true,
      receivedAt: new Date(),
    },
  });
  return batch.id;
}

// ─── Admin Queries ──────────────────────────────────────────────────────────

/**
 * Get batch summary for a consumable (for admin batch breakdown panel).
 * Returns batches sorted oldest-first, plus aggregate stats.
 */
export async function getBatchSummary(consumableId: string): Promise<{
  batches: BatchSummary[];
  total: number;
  oldest: BatchSummary | null;
  newest: BatchSummary | null;
  batchCount: number;
  hasStagnantStock: boolean;
}> {
  const batches = await db.consumableBatch.findMany({
    where: { consumableId, isActive: true, quantityRemaining: { gt: 0 } },
    orderBy: { receivedAt: "asc" },
    select: {
      id: true,
      quantityAdded: true,
      quantityRemaining: true,
      unitCost: true,
      source: true,
      receivedAt: true,
      createdAt: true,
    },
  });

  const total = batches.reduce((sum, b) => sum + b.quantityRemaining, 0);
  const oldest = batches[0] ?? null;
  const newest = batches[batches.length - 1] ?? null;

  // Stagnant: oldest batch > 30 days old AND there are multiple batches
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const hasStagnantStock =
    batches.length > 1 &&
    oldest !== null &&
    oldest.receivedAt < thirtyDaysAgo &&
    oldest.source !== "BACKFILL"; // Ignore the epoch backfill sentinel

  return { batches, total, oldest, newest, batchCount: batches.length, hasStagnantStock };
}

/**
 * Get recent consumption history for a consumable (for admin audit panel).
 */
export async function getConsumptionHistory(
  consumableId: string,
  limit = 20
): Promise<
  Array<{
    id: string;
    quantity: number;
    actionType: string;
    referenceId: string | null;
    performedById: string;
    createdAt: Date;
    batch: { receivedAt: Date; source: string };
  }>
> {
  return db.batchConsumption.findMany({
    where: { consumableId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      quantity: true,
      actionType: true,
      referenceId: true,
      performedById: true,
      createdAt: true,
      batch: { select: { receivedAt: true, source: true } },
    },
  });
}
