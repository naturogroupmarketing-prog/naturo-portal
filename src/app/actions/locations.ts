"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { isSuperAdmin, hasPermission } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

export async function createState(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isSuperAdmin(session.user.role)) throw new Error("Unauthorized");

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("State name is required");
  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  await db.state.create({ data: { name, organizationId } });
  revalidatePath("/admin/locations");
  return { success: true };
}

export async function createRegion(formData: FormData) {
  const session = await auth();
  if (!session?.user || !(await hasPermission(session.user.id, session.user.role, "regionAdd"))) throw new Error("Unauthorized");

  const name = (formData.get("name") as string)?.trim();
  const stateId = formData.get("stateId") as string;
  if (!name) throw new Error("Region name is required");
  if (!stateId) throw new Error("State is required");
  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  const address = (formData.get("address") as string)?.trim() || null;
  const lat = formData.get("latitude") as string;
  const lng = formData.get("longitude") as string;
  const latitude = lat ? parseFloat(lat) : null;
  const longitude = lng ? parseFloat(lng) : null;

  await db.region.create({ data: { name, stateId, organizationId, address, latitude, longitude } });
  revalidatePath("/admin/locations");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateState(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isSuperAdmin(session.user.role)) throw new Error("Unauthorized");

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  if (!name?.trim()) throw new Error("Name is required");

  const state = await db.state.findUnique({ where: { id } });
  if (!state) throw new Error("State not found");
  if (state.organizationId !== organizationId) throw new Error("State not found");

  await db.state.update({ where: { id }, data: { name: name.trim() } });
  revalidatePath("/admin/locations");
  return { success: true };
}

export async function updateRegion(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isSuperAdmin(session.user.role)) throw new Error("Unauthorized");

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

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
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteState(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isSuperAdmin(session.user.role)) throw new Error("Unauthorized");

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

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
  const session = await auth();
  if (!session?.user || !(await hasPermission(session.user.id, session.user.role, "regionDelete"))) throw new Error("Unauthorized");

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

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
  return { success: true };
}

export async function getLocations() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const organizationId = session.user.organizationId!;

  return db.state.findMany({
    where: { organizationId },
    include: {
      regions: {
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

export async function getRegions() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const organizationId = session.user.organizationId!;

  return db.region.findMany({
    where: { organizationId },
    include: { state: true },
    orderBy: { name: "asc" },
  });
}
