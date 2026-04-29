/**
 * LIFO / FIFO Inventory Engine for Trackio
 *
 * IMPORTANT — IFRS COMPLIANCE NOTICE:
 * LIFO is used for OPERATIONAL stock tracking only (which units to consume first).
 * In Australia, IFRS does not permit LIFO for financial/tax reporting.
 * This engine MUST NOT be used to generate financial accounting outputs.
 */

import { db } from "@/lib/db";

// Prisma transaction client type (compatible with both db and tx)
type PrismaTx = Omit<
  typeof db,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export type InventoryMethod = "FIFO" | "LIFO";

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

// ─── Method Resolution ──────────────────────────────────────────────────────

/**
 * Get the effective inventory method for a consumable.
 * Hierarchy: item-level override → org default → "FIFO"
 */
export async function getEffectiveMethod(
  consumableId: string,
  organizationId: string,
  tx?: PrismaTx
): Promise<InventoryMethod> {
  const client = tx ?? db;

  const consumable = await (client as typeof db).consumable.findUnique({
    where: { id: consumableId },
    select: { inventoryMethod: true },
  });

  if (consumable?.inventoryMethod === "FIFO" || consumable?.inventoryMethod === "LIFO") {
    return consumable.inventoryMethod as InventoryMethod;
  }

  const org = await (client as typeof db).organization.findUnique({
    where: { id: organizationId },
    select: { defaultInventoryMethod: true },
  });

  const orgMethod = org?.defaultInventoryMethod;
  if (orgMethod === "FIFO" || orgMethod === "LIFO") {
    return orgMethod as InventoryMethod;
  }

  return "FIFO";
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
 * LIFO / FIFO consumption algorithm.
 *
 * Deducts `quantity` from batches for `consumableId` using the effective method:
 *   LIFO → newest batch first (sort receivedAt DESC)
 *   FIFO → oldest batch first (sort receivedAt ASC)
 *
 * Returns a breakdown of which batches were consumed and how much.
 *
 * MUST be called inside a Prisma $transaction.
 * The caller is responsible for also decrementing quantityOnHand on the Consumable record.
 *
 * Test case (from spec):
 *   Batch A: 10 units (created first)
 *   Batch B: 20 units (created second)
 *   Remove 15 using LIFO →
 *     Consumed from B: 15  → B remaining: 5
 *     Consumed from A: 0   → A remaining: 10
 *   Total remaining: 15 ✓
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
  const method = await getEffectiveMethod(consumableId, organizationId, tx);

  // Check for backfill need (legacy items with no batches)
  const consumable = await (tx as typeof db).consumable.findUnique({
    where: { id: consumableId },
    select: { quantityOnHand: true },
  });
  if (consumable) {
    await ensureBackfillBatch(consumableId, organizationId, consumable.quantityOnHand, tx);
  }

  // Fetch active batches sorted by method
  const batches = await (tx as typeof db).consumableBatch.findMany({
    where: { consumableId, isActive: true, quantityRemaining: { gt: 0 } },
    orderBy: { receivedAt: method === "LIFO" ? "desc" : "asc" },
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
  // (in LIFO mode, old batches sit at the bottom and are never consumed)
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
