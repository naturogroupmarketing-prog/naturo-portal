import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/permissions";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

function toCSV(headers: string[], rows: string[][]): string {
  const escape = (val: string) => {
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };
  const lines = [headers.map(escape).join(",")];
  for (const row of rows) {
    lines.push(row.map((v) => escape(v ?? "")).join(","));
  }
  return lines.join("\n");
}

/**
 * GET /api/backup
 * Downloads a full backup of assets, consumables, and staff as CSV files
 * in a format compatible with the import system for re-upload.
 *
 * Returns a JSON object with 3 CSV strings + metadata.
 * The client converts these to downloadable files.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user || !isSuperAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`backup:${session.user.id}`, RATE_LIMITS.export);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many backup requests" }, { status: 429 });
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) {
    return NextResponse.json({ error: "No organization" }, { status: 400 });
  }

  // Fetch all data in parallel
  const [assets, consumables, staff, regions] = await Promise.all([
    db.asset.findMany({
      where: { organizationId },
      include: {
        region: { select: { name: true, state: { select: { name: true } } } },
        assignments: {
          where: { isActive: true },
          select: { user: { select: { name: true, email: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.consumable.findMany({
      where: { organizationId, isActive: true },
      include: {
        region: { select: { name: true, state: { select: { name: true } } } },
      },
      orderBy: { name: "asc" },
    }),
    db.user.findMany({
      where: { organizationId, isActive: true },
      include: {
        region: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    }),
    db.region.findMany({
      where: { organizationId, archivedAt: null },
      include: { state: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  // Build region name→ID map for the import system
  const regionMap = new Map(regions.map((r) => [r.id, `${r.state.name} / ${r.name}`]));

  // ─── Assets CSV (import-compatible) ─────────────────
  const assetsCSV = toCSV(
    ["Name", "Category", "Serial Number", "Region", "Status", "Assigned To", "Description", "Purchase Date", "Purchase Cost", "Supplier", "High Value", "Notes", "Asset Code"],
    assets.map((a) => [
      a.name,
      a.category,
      a.serialNumber || "",
      regionMap.get(a.regionId) || "",
      a.status,
      a.assignments[0]?.user?.name || a.assignments[0]?.user?.email || "",
      a.description || "",
      a.purchaseDate ? a.purchaseDate.toISOString().split("T")[0] : "",
      a.purchaseCost ? String(a.purchaseCost) : "",
      a.supplier || "",
      a.isHighValue ? "Yes" : "No",
      a.notes || "",
      a.assetCode,
    ]),
  );

  // ─── Consumables CSV (import-compatible) ────────────
  const consumablesCSV = toCSV(
    ["Name", "Category", "Unit Type", "Qty on Hand", "Min Threshold", "Reorder Level", "Region", "Supplier", "Notes"],
    consumables.map((c) => [
      c.name,
      c.category,
      c.unitType,
      String(c.quantityOnHand),
      String(c.minimumThreshold),
      String(c.reorderLevel),
      regionMap.get(c.regionId) || "",
      c.supplier || "",
      c.notes || "",
    ]),
  );

  // ─── Staff CSV (import-compatible) ──────────────────
  const staffCSV = toCSV(
    ["Name", "Email", "Phone", "Role", "Region", "Status"],
    staff.map((u) => [
      u.name || "",
      u.email,
      u.phone || "",
      u.role,
      u.region?.name || "Head Office",
      u.isActive ? "Active" : "Inactive",
    ]),
  );

  // ─── Regions CSV (for reference) ────────────────────
  const regionsCSV = toCSV(
    ["Region Name", "State", "Region ID"],
    regions.map((r) => [
      r.name,
      r.state.name,
      r.id,
    ]),
  );

  // Log the backup
  await createAuditLog({
    action: "BACKUP_DOWNLOADED",
    description: `Full backup downloaded: ${assets.length} assets, ${consumables.length} consumables, ${staff.length} staff`,
    performedById: session.user.id,
    organizationId,
  });

  const date = new Date().toISOString().split("T")[0];

  return NextResponse.json({
    date,
    files: {
      assets: { filename: `trackio-backup-assets-${date}.csv`, content: assetsCSV, count: assets.length },
      consumables: { filename: `trackio-backup-consumables-${date}.csv`, content: consumablesCSV, count: consumables.length },
      staff: { filename: `trackio-backup-staff-${date}.csv`, content: staffCSV, count: staff.length },
      regions: { filename: `trackio-backup-regions-${date}.csv`, content: regionsCSV, count: regions.length },
    },
  });
}
