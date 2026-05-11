"use server";

/**
 * Inventory Method Settings Actions
 *
 * Manages LIFO/FIFO method selection at the organisation and item level.
 *
 * IMPORTANT: LIFO is for OPERATIONAL stock tracking only.
 * In Australia, IFRS does not permit LIFO for financial/tax reporting.
 */

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { getBatchSummary, getConsumptionHistory } from "@/lib/inventory-engine";

// ─── Organisation-Level Setting ────────────────────────────────────────────

/**
 * Update the organisation-wide default inventory method.
 * Super Admin only.
 */
export async function updateOrgInventoryMethod(method: "FIFO" | "LIFO") {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized — Super Admin only");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  if (method !== "FIFO" && method !== "LIFO") {
    throw new Error("Invalid method. Must be FIFO or LIFO");
  }

  await db.organization.update({
    where: { id: organizationId },
    data: { defaultInventoryMethod: method },
  });

  await createAuditLog({
    action: "INVENTORY_METHOD_UPDATED",
    description: `Organisation default inventory method changed to ${method}`,
    performedById: session.user.id,
    organizationId,
  });

  revalidatePath("/consumables");
  revalidatePath("/settings");
  return { success: true };
}

/**
 * Get the organisation-wide default inventory method.
 */
export async function getOrgInventoryMethod(): Promise<"FIFO" | "LIFO"> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const org = await db.organization.findUnique({
    where: { id: session.user.organizationId! },
    select: { defaultInventoryMethod: true },
  });

  const method = org?.defaultInventoryMethod;
  if (method === "FIFO" || method === "LIFO") return method;
  return "FIFO";
}

// ─── Item-Level Override ────────────────────────────────────────────────────

/**
 * Set an item-level inventory method override (or clear it to inherit org default).
 * Admin / Manager only.
 */
export async function updateConsumableInventoryMethod(
  consumableId: string,
  method: "FIFO" | "LIFO" | null
) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== "SUPER_ADMIN" && session.user.role !== "BRANCH_MANAGER")
  ) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  const consumable = await db.consumable.findUnique({
    where: { id: consumableId },
    select: { organizationId: true, name: true },
  });
  if (!consumable || consumable.organizationId !== organizationId) {
    throw new Error("Supply not found");
  }

  await db.consumable.update({
    where: { id: consumableId },
    data: { inventoryMethod: method },
  });

  await createAuditLog({
    action: "INVENTORY_METHOD_UPDATED",
    description: method
      ? `"${consumable.name}" inventory method set to ${method}`
      : `"${consumable.name}" inventory method reset to organisation default`,
    performedById: session.user.id,
    consumableId,
    organizationId,
  });

  revalidatePath("/consumables");
  return { success: true };
}

// ─── Batch Breakdown Queries ────────────────────────────────────────────────

/**
 * Get full batch breakdown for a consumable (admin only).
 */
export async function getBatchBreakdown(consumableId: string) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== "SUPER_ADMIN" && session.user.role !== "BRANCH_MANAGER")
  ) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  const consumable = await db.consumable.findUnique({
    where: { id: consumableId },
    select: { organizationId: true, inventoryMethod: true, name: true, unitType: true },
  });
  if (!consumable || consumable.organizationId !== organizationId) {
    throw new Error("Supply not found");
  }

  const org = await db.organization.findUnique({
    where: { id: organizationId },
    select: { defaultInventoryMethod: true },
  });

  const summary = await getBatchSummary(consumableId);
  const history = await getConsumptionHistory(consumableId, 30);

  const effectiveMethod =
    (consumable.inventoryMethod as "FIFO" | "LIFO" | null) ??
    (org?.defaultInventoryMethod as "FIFO" | "LIFO" | null) ??
    "FIFO";

  return {
    consumable: {
      id: consumableId,
      name: consumable.name,
      unitType: consumable.unitType,
      itemMethod: consumable.inventoryMethod,
      orgMethod: org?.defaultInventoryMethod ?? "FIFO",
      effectiveMethod,
    },
    summary,
    history,
  };
}

/**
 * Backfill batch records for all consumables in the org that have
 * quantityOnHand > 0 but no existing batch records.
 * Run once after enabling the batch system on an existing installation.
 * Super Admin only.
 */
export async function backfillAllBatches() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized — Super Admin only");
  }

  const organizationId = session.user.organizationId!;

  const consumables = await db.consumable.findMany({
    where: { organizationId, isActive: true, quantityOnHand: { gt: 0 } },
    select: { id: true, quantityOnHand: true },
  });

  let backfilled = 0;

  for (const c of consumables) {
    const existing = await db.consumableBatch.findFirst({
      where: { consumableId: c.id, isActive: true },
      select: { id: true },
    });

    if (!existing) {
      await db.consumableBatch.create({
        data: {
          consumableId: c.id,
          organizationId,
          quantityAdded: c.quantityOnHand,
          quantityRemaining: c.quantityOnHand,
          source: "BACKFILL",
          notes: "Backfilled from existing stock before batch tracking was enabled",
          isActive: true,
          receivedAt: new Date(0), // Epoch — always the oldest
        },
      });
      backfilled++;
    }
  }

  return { success: true, backfilled };
}
