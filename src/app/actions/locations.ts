"use server";

import { db } from "@/lib/db";
import { isSuperAdmin, hasPermission } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit";
import { generateAssetCode } from "@/lib/utils";
import { generateQRCodeDataURL, buildAssetQRData } from "@/lib/qr";
import { revalidatePath } from "next/cache";
import { withAuth } from "@/lib/action-utils";

export async function createState(formData: FormData) {
  const session = await withAuth();
  if (!isSuperAdmin(session.user.role)) throw new Error("Unauthorized");

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("State name is required");
  const organizationId = session.user.organizationId!;

  await db.state.create({ data: { name, organizationId } });
  revalidatePath("/admin/locations");
  revalidatePath("/inventory");
  return { success: true };
}

export async function createRegion(formData: FormData) {
  const session = await withAuth();
  if (!(await hasPermission(session.user.id, session.user.role, "regionAdd"))) throw new Error("Unauthorized");

  const name = (formData.get("name") as string)?.trim();
  const stateId = formData.get("stateId") as string;
  if (!name) throw new Error("Region name is required");
  if (!stateId) throw new Error("State is required");
  const organizationId = session.user.organizationId!;

  const address = (formData.get("address") as string)?.trim() || null;
  const lat = formData.get("latitude") as string;
  const lng = formData.get("longitude") as string;
  const latitude = lat ? parseFloat(lat) : null;
  const longitude = lng ? parseFloat(lng) : null;

  await db.region.create({ data: { name, stateId, organizationId, address, latitude, longitude } });
  revalidatePath("/admin/locations");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateState(formData: FormData) {
  const session = await withAuth();
  if (!isSuperAdmin(session.user.role)) throw new Error("Unauthorized");

  const organizationId = session.user.organizationId!;

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  if (!name?.trim()) throw new Error("Name is required");

  const state = await db.state.findUnique({ where: { id } });
  if (!state) throw new Error("State not found");
  if (state.organizationId !== organizationId) throw new Error("State not found");

  await db.state.update({ where: { id }, data: { name: name.trim() } });
  revalidatePath("/admin/locations");
  revalidatePath("/inventory");
  return { success: true };
}

export async function updateRegion(formData: FormData) {
  const session = await withAuth();
  if (!isSuperAdmin(session.user.role)) throw new Error("Unauthorized");

  const organizationId = session.user.organizationId!;

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  if (!name?.trim()) throw new Error("Name is required");

  const region = await db.region.findUnique({ where: { id } });
  if (!region) throw new Error("Region not found");
  if (region.organizationId !== organizationId) throw new Error("Region not found");

  const address = (formData.get("address") as string)?.trim() || null;
  const lat = formData.get("latitude") as string;
  const lng = formData.get("longitude") as string;
  const latitude = lat ? parseFloat(lat) : null;
  const longitude = lng ? parseFloat(lng) : null;

  await db.region.update({ where: { id }, data: { name: name.trim(), address, latitude, longitude } });
  revalidatePath("/admin/locations");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteState(formData: FormData) {
  const session = await withAuth();
  if (!isSuperAdmin(session.user.role)) throw new Error("Unauthorized");

  const organizationId = session.user.organizationId!;

  const id = formData.get("id") as string;

  const state = await db.state.findUnique({ where: { id } });
  if (!state) throw new Error("State not found");
  if (state.organizationId !== organizationId) throw new Error("State not found");

  const regionCount = await db.region.count({ where: { stateId: id } });
  if (regionCount > 0) throw new Error("Cannot delete state with regions. Delete all regions first.");

  await db.state.delete({ where: { id } });
  revalidatePath("/admin/locations");
  return { success: true };
}

export async function deleteRegion(formData: FormData) {
  const session = await withAuth();
  if (!(await hasPermission(session.user.id, session.user.role, "regionDelete"))) throw new Error("Unauthorized");

  const organizationId = session.user.organizationId!;

  const id = formData.get("id") as string;

  const region = await db.region.findUnique({ where: { id } });
  if (!region) throw new Error("Region not found");
  if (region.organizationId !== organizationId) throw new Error("Region not found");

  const [assetCount, consumableCount, userCount] = await Promise.all([
    db.asset.count({ where: { regionId: id } }),
    db.consumable.count({ where: { regionId: id } }),
    db.user.count({ where: { regionId: id } }),
  ]);

  if (assetCount > 0 || consumableCount > 0 || userCount > 0) {
    throw new Error("Cannot delete region with assets, consumables, or users assigned to it.");
  }

  await db.region.delete({ where: { id } });
  revalidatePath("/admin/locations");
  revalidatePath("/inventory");
  return { success: true };
}

/**
 * Archive a region — soft-delete that preserves all assets, consumables, and staff.
 * Can be restored later.
 */
export async function archiveRegion(regionId: string) {
  const session = await withAuth();
  if (!isSuperAdmin(session.user.role)) throw new Error("Unauthorized");

  const organizationId = session.user.organizationId!;

  const region = await db.region.findUnique({ where: { id: regionId } });
  if (!region) throw new Error("Region not found");
  if (region.organizationId !== organizationId) throw new Error("Region not found");
  if (region.archivedAt) throw new Error("Region is already archived");

  await db.region.update({
    where: { id: regionId },
    data: { archivedAt: new Date() },
  });

  await createAuditLog({
    action: "REGION_ARCHIVED",
    description: `Region "${region.name}" archived`,
    performedById: session.user.id,
    organizationId,
  });

  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Restore an archived region — brings it back to active status.
 */
export async function restoreRegion(regionId: string) {
  const session = await withAuth();
  if (!isSuperAdmin(session.user.role)) throw new Error("Unauthorized");

  const organizationId = session.user.organizationId!;

  const region = await db.region.findUnique({ where: { id: regionId } });
  if (!region) throw new Error("Region not found");
  if (region.organizationId !== organizationId) throw new Error("Region not found");
  if (!region.archivedAt) throw new Error("Region is not archived");

  await db.region.update({
    where: { id: regionId },
    data: { archivedAt: null },
  });

  await createAuditLog({
    action: "REGION_RESTORED",
    description: `Region "${region.name}" restored from archive`,
    performedById: session.user.id,
    organizationId,
  });

  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getLocations() {
  const session = await withAuth();
  const organizationId = session.user.organizationId!;

  return db.state.findMany({
    where: { organizationId },
    include: {
      regions: {
        where: { archivedAt: null },
        include: {
          _count: {
            select: { assets: true, consumables: true, users: true },
          },
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getArchivedRegions() {
  const session = await withAuth();
  if (!isSuperAdmin(session.user.role)) return [];

  const organizationId = session.user.organizationId!;

  return db.region.findMany({
    where: { organizationId, archivedAt: { not: null } },
    include: {
      state: { select: { name: true } },
      _count: { select: { assets: true, consumables: true, users: true } },
    },
    orderBy: { archivedAt: "desc" },
  });
}

export async function getRegions() {
  const session = await withAuth();
  const organizationId = session.user.organizationId!;

  return db.region.findMany({
    where: { organizationId },
    include: { state: true },
    orderBy: { name: "asc" },
  });
}

/**
 * Get distinct asset/consumable templates from all regions (for cloning)
 */
export async function getItemTemplates() {
  const session = await withAuth();
  if (!isSuperAdmin(session.user.role)) throw new Error("Unauthorized");

  const organizationId = session.user.organizationId!;

  const allAssets = await db.asset.findMany({
    where: { organizationId },
    select: { name: true, category: true, description: true, isHighValue: true, supplier: true, purchaseCost: true, imageUrl: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  // Deduplicate by name (case-insensitive) — keep first occurrence
  const seenAssets = new Set<string>();
  const assets = allAssets.filter((a) => {
    const key = a.name.toLowerCase().trim();
    if (seenAssets.has(key)) return false;
    seenAssets.add(key);
    return true;
  });

  const allConsumables = await db.consumable.findMany({
    where: { organizationId, isActive: true },
    select: { name: true, category: true, unitType: true, minimumThreshold: true, reorderLevel: true, supplier: true, unitCost: true, imageUrl: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  const seenConsumables = new Set<string>();
  const consumables = allConsumables.filter((c) => {
    const key = c.name.toLowerCase().trim();
    if (seenConsumables.has(key)) return false;
    seenConsumables.add(key);
    return true;
  });

  return { assets, consumables };
}

/**
 * Clone selected assets and consumables to a target region
 */
export async function applyItemsToRegion(data: {
  regionId: string;
  assets: { name: string; category: string; description?: string | null; isHighValue?: boolean; supplier?: string | null; purchaseCost?: number | null; imageUrl?: string | null }[];
  consumables: { name: string; category: string; unitType: string; minimumThreshold?: number; reorderLevel?: number; supplier?: string | null; unitCost?: number | null; imageUrl?: string | null; initialStock?: number }[];
}) {
  const session = await withAuth();
  if (!isSuperAdmin(session.user.role)) throw new Error("Unauthorized");

  const organizationId = session.user.organizationId!;

  const region = await db.region.findUnique({ where: { id: data.regionId } });
  if (!region || region.organizationId !== organizationId) throw new Error("Region not found");

  let assetsCreated = 0;
  let consumablesCreated = 0;

  for (const item of data.assets) {
    const assetCode = generateAssetCode();
    const qrCodeData = await generateQRCodeDataURL(buildAssetQRData(assetCode));
    await db.asset.create({
      data: {
        assetCode, name: item.name, category: item.category,
        description: item.description || null, isHighValue: item.isHighValue || false,
        supplier: item.supplier || null, purchaseCost: item.purchaseCost || null,
        imageUrl: item.imageUrl || null,
        qrCodeData, regionId: data.regionId, organizationId,
      },
    });
    assetsCreated++;
  }

  for (const item of data.consumables) {
    await db.consumable.create({
      data: {
        name: item.name, category: item.category, unitType: item.unitType || "units",
        quantityOnHand: item.initialStock || 0, minimumThreshold: item.minimumThreshold ?? 5,
        reorderLevel: item.reorderLevel ?? 10, supplier: item.supplier || null,
        unitCost: item.unitCost || null, imageUrl: item.imageUrl || null,
        regionId: data.regionId, organizationId,
      },
    });
    consumablesCreated++;
  }

  await createAuditLog({
    action: "ASSET_CREATED",
    description: `Bulk applied ${assetsCreated} assets and ${consumablesCreated} consumables to ${region.name}`,
    performedById: session.user.id, organizationId,
  });

  revalidatePath(`/admin/locations/${data.regionId}`);
  revalidatePath("/admin/locations");
  revalidatePath("/assets");
  revalidatePath("/consumables");
  return { success: true, assetsCreated, consumablesCreated };
}
