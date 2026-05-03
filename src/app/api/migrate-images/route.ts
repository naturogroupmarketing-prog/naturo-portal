import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/permissions";
import { db } from "@/lib/db";
import { isR2Configured, uploadToR2 } from "@/lib/r2";

/**
 * GET /api/migrate-images
 * One-time migration: moves all base64 images from DB to Cloudflare R2.
 * Super Admin only. Visit this URL in browser to run.
 */
export async function GET() {
  // Only available in non-production environments or when explicitly enabled
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_MIGRATION_ROUTES !== "true") {
    return NextResponse.json({ error: "This route is disabled in production" }, { status: 403 });
  }

  const session = await auth();
  if (!session?.user || !isSuperAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized — Super Admin only" }, { status: 401 });
  }

  if (!isR2Configured()) {
    return NextResponse.json({ error: "R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_URL in environment variables." }, { status: 500 });
  }

  const results = { assets: 0, consumables: 0, damageReports: 0, conditionChecks: 0, signatures: 0, errors: 0 };

  // Helper: migrate a base64 value to R2
  async function migrateBase64(base64DataUrl: string, folder: string): Promise<string | null> {
    try {
      // Extract MIME type and base64 data
      const match = base64DataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!match) return null;
      const contentType = match[1];
      const buffer = Buffer.from(match[2], "base64");
      return await uploadToR2(buffer, contentType, folder);
    } catch {
      results.errors++;
      return null;
    }
  }

  // 1. Assets
  const assets = await db.asset.findMany({
    where: { imageUrl: { startsWith: "data:image" } },
    select: { id: true, imageUrl: true },
    take: 500,
  });
  for (const asset of assets) {
    if (!asset.imageUrl) continue;
    const url = await migrateBase64(asset.imageUrl, "assets");
    if (url) {
      await db.asset.update({ where: { id: asset.id }, data: { imageUrl: url } });
      results.assets++;
    }
  }

  // 2. Consumables
  const consumables = await db.consumable.findMany({
    where: { imageUrl: { startsWith: "data:image" } },
    select: { id: true, imageUrl: true },
    take: 500,
  });
  for (const c of consumables) {
    if (!c.imageUrl) continue;
    const url = await migrateBase64(c.imageUrl, "consumables");
    if (url) {
      await db.consumable.update({ where: { id: c.id }, data: { imageUrl: url } });
      results.consumables++;
    }
  }

  // 3. Damage Reports
  const damageReports = await db.damageReport.findMany({
    where: { photoUrl: { startsWith: "data:image" } },
    select: { id: true, photoUrl: true },
    take: 500,
  });
  for (const dr of damageReports) {
    if (!dr.photoUrl) continue;
    const url = await migrateBase64(dr.photoUrl, "damage-reports");
    if (url) {
      await db.damageReport.update({ where: { id: dr.id }, data: { photoUrl: url } });
      results.damageReports++;
    }
  }

  // 4. Condition Checks
  const conditionChecks = await db.conditionCheck.findMany({
    where: { photoUrl: { startsWith: "data:image" } },
    select: { id: true, photoUrl: true },
    take: 1000,
  });
  for (const cc of conditionChecks) {
    if (!cc.photoUrl) continue;
    const url = await migrateBase64(cc.photoUrl, "condition-checks");
    if (url) {
      await db.conditionCheck.update({ where: { id: cc.id }, data: { photoUrl: url } });
      results.conditionChecks++;
    }
  }

  // 5. Starter Kit Signatures
  const kitApps = await db.starterKitApplication.findMany({
    where: { signatureData: { startsWith: "data:image" } },
    select: { id: true, signatureData: true },
    take: 500,
  });
  for (const app of kitApps) {
    if (!app.signatureData) continue;
    const url = await migrateBase64(app.signatureData, "signatures");
    if (url) {
      await db.starterKitApplication.update({ where: { id: app.id }, data: { signatureData: url } });
      results.signatures++;
    }
  }

  const total = results.assets + results.consumables + results.damageReports + results.conditionChecks + results.signatures;

  return NextResponse.json({
    success: true,
    message: `Migration complete. ${total} images moved to R2.`,
    results,
    note: total === 0 ? "No base64 images found — either already migrated or no images uploaded yet." : undefined,
  });
}
