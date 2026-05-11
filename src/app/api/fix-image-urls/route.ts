import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/permissions";
import { db } from "@/lib/db";

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // e.g. https://pub-xxx.r2.dev

/**
 * GET /api/fix-image-urls
 * Converts all R2 public URLs (https://pub-xxx.r2.dev/...) to proxy URLs (/api/images/...).
 * This fixes 503 rate-limit errors from the r2.dev domain.
 * Super Admin only.
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

  if (!R2_PUBLIC_URL) {
    return NextResponse.json({ error: "R2_PUBLIC_URL not set" }, { status: 500 });
  }

  const results = { assets: 0, consumables: 0, damageReports: 0, conditionChecks: 0, signatures: 0 };

  // Helper: convert R2 URL to proxy URL
  function toProxyUrl(url: string): string {
    return url.replace(R2_PUBLIC_URL!, "/api/images");
  }

  // 1. Assets
  const assets = await db.asset.findMany({
    where: { imageUrl: { startsWith: R2_PUBLIC_URL } },
    select: { id: true, imageUrl: true },
  });
  for (const asset of assets) {
    if (!asset.imageUrl) continue;
    await db.asset.update({ where: { id: asset.id }, data: { imageUrl: toProxyUrl(asset.imageUrl) } });
    results.assets++;
  }

  // 2. Consumables
  const consumables = await db.consumable.findMany({
    where: { imageUrl: { startsWith: R2_PUBLIC_URL } },
    select: { id: true, imageUrl: true },
  });
  for (const c of consumables) {
    if (!c.imageUrl) continue;
    await db.consumable.update({ where: { id: c.id }, data: { imageUrl: toProxyUrl(c.imageUrl) } });
    results.consumables++;
  }

  // 3. Damage Reports
  const damageReports = await db.damageReport.findMany({
    where: { photoUrl: { startsWith: R2_PUBLIC_URL } },
    select: { id: true, photoUrl: true },
  });
  for (const dr of damageReports) {
    if (!dr.photoUrl) continue;
    await db.damageReport.update({ where: { id: dr.id }, data: { photoUrl: toProxyUrl(dr.photoUrl) } });
    results.damageReports++;
  }

  // 4. Condition Checks
  const conditionChecks = await db.conditionCheck.findMany({
    where: { photoUrl: { startsWith: R2_PUBLIC_URL } },
    select: { id: true, photoUrl: true },
  });
  for (const cc of conditionChecks) {
    if (!cc.photoUrl) continue;
    await db.conditionCheck.update({ where: { id: cc.id }, data: { photoUrl: toProxyUrl(cc.photoUrl) } });
    results.conditionChecks++;
  }

  // 5. Starter Kit Signatures
  const kitApps = await db.starterKitApplication.findMany({
    where: { signatureData: { startsWith: R2_PUBLIC_URL } },
    select: { id: true, signatureData: true },
  });
  for (const app of kitApps) {
    if (!app.signatureData) continue;
    await db.starterKitApplication.update({ where: { id: app.id }, data: { signatureData: toProxyUrl(app.signatureData) } });
    results.signatures++;
  }

  const total = results.assets + results.consumables + results.damageReports + results.conditionChecks + results.signatures;

  return NextResponse.json({
    success: true,
    message: `Fixed ${total} image URLs — converted from r2.dev to proxy URLs.`,
    results,
  });
}
