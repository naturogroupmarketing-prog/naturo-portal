"use server";

import { db } from "@/lib/db";
import { isAdminOrManager, isSuperAdmin, canManageRegion } from "@/lib/permissions";
import { withAuth } from "@/lib/action-utils";
import { generateAssetCode } from "@/lib/utils";
import { generateQRCodeDataURL, buildAssetQRData } from "@/lib/qr";
import { createAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { checkPlanLimits } from "@/lib/tenant";

// ─── Types ────────────────────────────────────────────

export interface ImportResult {
  success: number;
  skipped: number;
  errors: { row: number; field: string; message: string }[];
  createdStaff?: { name: string; email: string; password: string }[];
}

export interface AssetImportRow {
  name: string;
  category: string;
  regionId: string;
  description?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  supplier?: string;
  notes?: string;
  isHighValue?: boolean;
}

export interface ConsumableImportRow {
  name: string;
  category: string;
  unitType: string;
  regionId: string;
  quantityOnHand?: number;
  minimumThreshold?: number;
  reorderLevel?: number;
  supplier?: string;
  notes?: string;
}

export interface StaffImportRow {
  name: string;
  email: string;
  role?: string;
  regionId?: string;
}

// ─── Helpers ──────────────────────────────────────────

async function getValidCategories(type: "ASSET" | "CONSUMABLE", organizationId: string): Promise<string[]> {
  const categories = await db.category.findMany({
    where: { type, organizationId },
    select: { name: true },
    orderBy: { sortOrder: "asc" },
  });
  return categories.map((c) => c.name);
}


function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function parseDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}

function parseNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  return isNaN(n) ? undefined : n;
}

function generateRandomPassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  const bytes = randomBytes(length);
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

// ─── Bulk Import Assets ───────────────────────────────

export async function bulkImportAssets(rows: AssetImportRow[]): Promise<ImportResult> {
  if (rows.length > 1000) return { success: 0, skipped: 0, errors: [{ row: 0, field: "general", message: "Maximum 1000 rows per import" }] };

  const session = await withAuth();
  if (!isAdminOrManager(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId!;
  const result: ImportResult = { success: 0, skipped: 0, errors: [] };

  // Fetch valid asset categories from DB
  const validAssetCategories = await getValidCategories("ASSET", organizationId);

  // Validate all regions exist
  const regionIds = [...new Set(rows.map((r) => r.regionId).filter(Boolean))];
  const regions = await db.region.findMany({
    where: { id: { in: regionIds } },
    select: { id: true },
  });
  const validRegionIds = new Set(regions.map((r) => r.id));

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // +2 for 1-indexed + header row

    // Required field checks
    if (!row.name?.trim()) {
      result.errors.push({ row: rowNum, field: "name", message: "Name is required" });
      continue;
    }
    if (!row.category?.trim()) {
      result.errors.push({ row: rowNum, field: "category", message: "System is required" });
      continue;
    }
    // Validate category is a valid asset system
    const normalizedCategory = row.category.trim();
    const matchedSystem = validAssetCategories.find(
      (s) => s.toLowerCase() === normalizedCategory.toLowerCase()
    );
    if (!matchedSystem) {
      result.errors.push({
        row: rowNum,
        field: "category",
        message: `Invalid system "${normalizedCategory}". Must be: ${validAssetCategories.join(", ")}`,
      });
      continue;
    }
    if (!row.regionId) {
      result.errors.push({ row: rowNum, field: "regionId", message: "Region is required" });
      continue;
    }
    if (!validRegionIds.has(row.regionId)) {
      result.errors.push({ row: rowNum, field: "regionId", message: "Region not found" });
      continue;
    }

    // Permission check
    if (!canManageRegion(session.user.role, session.user.regionId, row.regionId)) {
      result.errors.push({ row: rowNum, field: "regionId", message: "No permission for this region" });
      continue;
    }

    try {
      const assetCode = generateAssetCode();
      const qrCodeData = await generateQRCodeDataURL(buildAssetQRData(assetCode));

      const asset = await db.asset.create({
        data: {
          assetCode,
          name: row.name.trim(),
          category: matchedSystem,
          regionId: row.regionId,
          organizationId: session.user.organizationId!,
          description: row.description?.trim() || null,
          serialNumber: row.serialNumber?.trim() || null,
          qrCodeData,
          purchaseDate: parseDate(row.purchaseDate) || null,
          purchaseCost: parseNumber(row.purchaseCost) ?? null,
          supplier: row.supplier?.trim() || null,
          notes: row.notes?.trim() || null,
          isHighValue: row.isHighValue ?? false,
          status: "AVAILABLE",
        },
      });

      await createAuditLog({
        action: "ASSET_CREATED",
        description: `Asset "${row.name}" (${assetCode}) bulk imported`,
        performedById: session.user.id,
        assetId: asset.id,
        organizationId,
      });

      result.success++;
    } catch (error) {
      result.errors.push({
        row: rowNum,
        field: "general",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  revalidatePath("/assets");
  return result;
}

// ─── Bulk Import Consumables ──────────────────────────

export async function bulkImportConsumables(rows: ConsumableImportRow[]): Promise<ImportResult> {
  if (rows.length > 1000) return { success: 0, skipped: 0, errors: [{ row: 0, field: "general", message: "Maximum 1000 rows per import" }] };

  const session = await withAuth();
  if (!isAdminOrManager(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId!;
  const result: ImportResult = { success: 0, skipped: 0, errors: [] };

  // Fetch valid consumable categories from DB
  const validConsumableCategories = await getValidCategories("CONSUMABLE", organizationId);

  // Validate all regions exist
  const regionIds = [...new Set(rows.map((r) => r.regionId).filter(Boolean))];
  const regions = await db.region.findMany({
    where: { id: { in: regionIds } },
    select: { id: true },
  });
  const validRegionIds = new Set(regions.map((r) => r.id));

  // Get existing consumable name+region combos to detect duplicates
  const existing = await db.consumable.findMany({
    where: { regionId: { in: regionIds } },
    select: { name: true, regionId: true },
  });
  const existingKeys = new Set(existing.map((c) => `${c.name.toLowerCase()}|${c.regionId}`));

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    if (!row.name?.trim()) {
      result.errors.push({ row: rowNum, field: "name", message: "Name is required" });
      continue;
    }
    if (!row.category?.trim()) {
      result.errors.push({ row: rowNum, field: "category", message: "Category is required" });
      continue;
    }
    // Validate category is a valid consumable category
    const normalizedConsCategory = row.category.trim();
    const matchedConsCategory = validConsumableCategories.find(
      (c) => c.toLowerCase() === normalizedConsCategory.toLowerCase()
    );
    if (!matchedConsCategory) {
      result.errors.push({
        row: rowNum,
        field: "category",
        message: `Invalid category "${normalizedConsCategory}". Must be one of: ${validConsumableCategories.join(", ")}`,
      });
      continue;
    }
    if (!row.unitType?.trim()) {
      result.errors.push({ row: rowNum, field: "unitType", message: "Unit type is required" });
      continue;
    }
    if (!row.regionId) {
      result.errors.push({ row: rowNum, field: "regionId", message: "Region is required" });
      continue;
    }
    if (!validRegionIds.has(row.regionId)) {
      result.errors.push({ row: rowNum, field: "regionId", message: "Region not found" });
      continue;
    }
    if (!canManageRegion(session.user.role, session.user.regionId, row.regionId)) {
      result.errors.push({ row: rowNum, field: "regionId", message: "No permission for this region" });
      continue;
    }

    // Check for duplicate
    const key = `${row.name.trim().toLowerCase()}|${row.regionId}`;
    if (existingKeys.has(key)) {
      result.skipped++;
      continue;
    }

    try {
      const consumable = await db.consumable.create({
        data: {
          name: row.name.trim(),
          category: matchedConsCategory,
          unitType: row.unitType.trim(),
          regionId: row.regionId,
          organizationId: session.user.organizationId!,
          quantityOnHand: parseNumber(row.quantityOnHand) ?? 0,
          minimumThreshold: parseNumber(row.minimumThreshold) ?? 5,
          reorderLevel: parseNumber(row.reorderLevel) ?? 10,
          supplier: row.supplier?.trim() || null,
          notes: row.notes?.trim() || null,
        },
      });

      // Track to avoid in-batch duplicates
      existingKeys.add(key);

      await createAuditLog({
        action: "CONSUMABLE_CREATED",
        description: `Consumable "${row.name}" bulk imported with qty ${row.quantityOnHand ?? 0}`,
        performedById: session.user.id,
        consumableId: consumable.id,
        organizationId,
      });

      result.success++;
    } catch (error) {
      result.errors.push({
        row: rowNum,
        field: "general",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  revalidatePath("/consumables");
  return result;
}

// ─── Bulk Import Staff ────────────────────────────────

export async function bulkImportStaff(rows: StaffImportRow[]): Promise<ImportResult> {
  const session = await withAuth();
  if (!isSuperAdmin(session.user.role)) {
    throw new Error("Unauthorized — Super Admin only");
  }

  const organizationId = session.user.organizationId!;
  const result: ImportResult = { success: 0, skipped: 0, errors: [], createdStaff: [] };

  // Validate regions
  const regionIds = [...new Set(rows.map((r) => r.regionId).filter(Boolean))] as string[];
  const regions = await db.region.findMany({
    where: { id: { in: regionIds } },
    select: { id: true },
  });
  const validRegionIds = new Set(regions.map((r) => r.id));

  // Get existing emails
  const emails = rows.map((r) => r.email?.toLowerCase()).filter(Boolean) as string[];
  const existingUsers = await db.user.findMany({
    where: { email: { in: emails } },
    select: { email: true },
  });
  const existingEmails = new Set(existingUsers.map((u) => u.email.toLowerCase()));

  const validRoles = new Set(["SUPER_ADMIN", "BRANCH_MANAGER", "STAFF"]);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    if (!row.email?.trim()) {
      result.errors.push({ row: rowNum, field: "email", message: "Email is required" });
      continue;
    }
    if (!validateEmail(row.email.trim())) {
      result.errors.push({ row: rowNum, field: "email", message: "Invalid email format" });
      continue;
    }
    if (!row.name?.trim()) {
      result.errors.push({ row: rowNum, field: "name", message: "Name is required" });
      continue;
    }

    const email = row.email.trim().toLowerCase();

    // Skip existing
    if (existingEmails.has(email)) {
      result.skipped++;
      continue;
    }

    // Validate role
    const role = row.role?.toUpperCase().replace(/\s+/g, "_") || "STAFF";
    if (!validRoles.has(role)) {
      result.errors.push({ row: rowNum, field: "role", message: `Invalid role "${row.role}". Use STAFF, BRANCH_MANAGER, or SUPER_ADMIN` });
      continue;
    }

    // Validate region if provided
    if (row.regionId && !validRegionIds.has(row.regionId)) {
      result.errors.push({ row: rowNum, field: "regionId", message: "Region not found" });
      continue;
    }

    try {
      const plainPassword = generateRandomPassword(8);
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      const user = await db.user.create({
        data: {
          email,
          name: row.name.trim(),
          role: role as "SUPER_ADMIN" | "BRANCH_MANAGER" | "STAFF",
          regionId: row.regionId || null,
          isActive: true,
          password: hashedPassword,
          organizationId,
        },
      });

      existingEmails.add(email);

      result.createdStaff!.push({
        name: row.name.trim(),
        email,
        password: plainPassword,
      });

      await createAuditLog({
        action: "USER_CREATED",
        description: `User "${row.name}" (${email}) bulk imported with role ${role}`,
        performedById: session.user.id,
        targetUserId: user.id,
        organizationId,
      });

      result.success++;
    } catch (error) {
      result.errors.push({
        row: rowNum,
        field: "general",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  revalidatePath("/admin/users");
  revalidatePath("/staff");
  return result;
}
