import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminOrManager } from "@/lib/permissions";
import { db } from "@/lib/db";

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type } = await params;
  const regionFilter = session.user.role === "BRANCH_MANAGER"
    ? { regionId: session.user.regionId! }
    : {};

  let csv = "";

  switch (type) {
    case "assets": {
      const assets = await db.asset.findMany({
        where: regionFilter,
        include: {
          region: { include: { state: true } },
          assignments: { where: { isActive: true }, include: { user: true } },
        },
      });
      csv = toCSV(
        ["Asset Code", "Name", "Category", "Serial Number", "Status", "State", "Region", "Assigned To", "High Value", "Purchase Date", "Cost"],
        assets.map((a) => [
          a.assetCode, a.name, a.category, a.serialNumber || "", a.status,
          a.region.state.name, a.region.name,
          a.assignments[0]?.user?.name || a.assignments[0]?.user?.email || "",
          a.isHighValue ? "Yes" : "No",
          a.purchaseDate?.toISOString().split("T")[0] || "",
          a.purchaseCost?.toString() || "",
        ])
      );
      break;
    }

    case "consumables": {
      const consumables = await db.consumable.findMany({
        where: { ...regionFilter, isActive: true },
        include: { region: { include: { state: true } } },
      });
      csv = toCSV(
        ["Name", "Category", "Unit", "Qty on Hand", "Min Threshold", "Reorder Level", "State", "Region", "Supplier"],
        consumables.map((c) => [
          c.name, c.category, c.unitType, c.quantityOnHand.toString(),
          c.minimumThreshold.toString(), c.reorderLevel.toString(),
          c.region.state.name, c.region.name, c.supplier || "",
        ])
      );
      break;
    }

    case "assignments": {
      const assignments = await db.assetAssignment.findMany({
        where: { isActive: true, asset: regionFilter },
        include: { asset: true, user: true },
      });
      csv = toCSV(
        ["Staff Name", "Staff Email", "Asset Name", "Asset Code", "Type", "Checkout Date", "Expected Return"],
        assignments.map((a) => [
          a.user.name || "", a.user.email, a.asset.name, a.asset.assetCode,
          a.assignmentType, a.checkoutDate.toISOString().split("T")[0],
          a.expectedReturnDate?.toISOString().split("T")[0] || "Permanent",
        ])
      );
      break;
    }

    case "stock-movement": {
      const logs = await db.auditLog.findMany({
        where: {
          action: { in: ["CONSUMABLE_STOCK_ADDED", "CONSUMABLE_STOCK_REDUCED", "CONSUMABLE_REQUEST_ISSUED"] },
          ...(session.user.role === "BRANCH_MANAGER" ? { consumable: { regionId: session.user.regionId! } } : {}),
        },
        include: { performedBy: true, consumable: true },
        orderBy: { createdAt: "desc" },
        take: 1000,
      });
      csv = toCSV(
        ["Date", "Action", "Item", "Description", "Performed By"],
        logs.map((l) => [
          l.createdAt.toISOString(), l.action, l.consumable?.name || "",
          l.description, l.performedBy.name || l.performedBy.email,
        ])
      );
      break;
    }

    case "requests": {
      const requests = await db.consumableRequest.findMany({
        where: { consumable: regionFilter },
        include: { consumable: true, user: true },
        orderBy: { createdAt: "desc" },
        take: 1000,
      });
      csv = toCSV(
        ["Date", "Item", "Qty", "Unit", "Requested By", "Status", "Notes"],
        requests.map((r) => [
          r.createdAt.toISOString(), r.consumable.name, r.quantity.toString(),
          r.consumable.unitType, r.user.name || r.user.email,
          r.status, r.notes || "",
        ])
      );
      break;
    }

    case "staff-consumable-usage": {
      // Super Admin only
      if (session.user.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      // Get all issued consumable requests
      const issuedRequests = await db.consumableRequest.findMany({
        where: { status: { in: ["ISSUED", "CLOSED"] } },
        include: {
          user: { select: { name: true, email: true, region: { select: { name: true } } } },
          consumable: { select: { name: true, category: true, unitType: true, region: { select: { name: true } } } },
        },
        orderBy: { issuedAt: "desc" },
      });

      // Get all consumable assignments
      const consAssignments = await db.consumableAssignment.findMany({
        include: {
          user: { select: { name: true, email: true, region: { select: { name: true } } } },
          consumable: { select: { name: true, category: true, unitType: true, region: { select: { name: true } } } },
        },
        orderBy: { assignedDate: "desc" },
      });

      // Build per-staff usage map
      const usageMap = new Map<string, { staffName: string; staffEmail: string; staffRegion: string; items: Map<string, { consumableName: string; category: string; unit: string; consumableRegion: string; totalQty: number }> }>();

      const addUsage = (email: string, name: string | null, staffRegion: string, consumableName: string, category: string, unit: string, consumableRegion: string, qty: number) => {
        if (!usageMap.has(email)) {
          usageMap.set(email, { staffName: name || "", staffEmail: email, staffRegion, items: new Map() });
        }
        const staff = usageMap.get(email)!;
        const key = `${consumableName}|${consumableRegion}`;
        if (!staff.items.has(key)) {
          staff.items.set(key, { consumableName, category, unit, consumableRegion, totalQty: 0 });
        }
        staff.items.get(key)!.totalQty += qty;
      };

      for (const req of issuedRequests) {
        addUsage(req.user.email, req.user.name, req.user.region?.name || "", req.consumable.name, req.consumable.category, req.consumable.unitType, req.consumable.region.name, req.quantity);
      }

      for (const a of consAssignments) {
        addUsage(a.user.email, a.user.name, a.user.region?.name || "", a.consumable.name, a.consumable.category, a.consumable.unitType, a.consumable.region.name, a.quantity);
      }

      // Flatten to rows
      const usageRows: string[][] = [];
      const sortedStaff = Array.from(usageMap.values()).sort((a, b) => a.staffName.localeCompare(b.staffName));
      for (const staff of sortedStaff) {
        const sortedItems = Array.from(staff.items.values()).sort((a, b) => a.consumableName.localeCompare(b.consumableName));
        for (const item of sortedItems) {
          usageRows.push([
            staff.staffName, staff.staffEmail, staff.staffRegion,
            item.consumableName, item.category, item.totalQty.toString(), item.unit, item.consumableRegion,
          ]);
        }
      }

      csv = toCSV(
        ["Staff Name", "Staff Email", "Staff Region", "Consumable", "Category", "Total Qty", "Unit", "Consumable Region"],
        usageRows
      );
      break;
    }

    case "damage-loss": {
      const reports = await db.damageReport.findMany({
        where: session.user.role === "BRANCH_MANAGER"
          ? { asset: { regionId: session.user.regionId! } }
          : {},
        include: { asset: true, reportedBy: true },
        orderBy: { createdAt: "desc" },
        take: 1000,
      });
      csv = toCSV(
        ["Date", "Asset", "Asset Code", "Type", "Description", "Reported By", "Resolved"],
        reports.map((r) => [
          r.createdAt.toISOString(), r.asset.name, r.asset.assetCode,
          r.type, r.description, r.reportedBy.name || r.reportedBy.email,
          r.isResolved ? "Yes" : "No",
        ])
      );
      break;
    }

    case "audit": {
      const logs = await db.auditLog.findMany({
        where: session.user.role === "BRANCH_MANAGER"
          ? {
              OR: [
                { performedBy: { regionId: session.user.regionId } },
                { asset: { regionId: session.user.regionId! } },
                { consumable: { regionId: session.user.regionId! } },
              ],
            }
          : {},
        include: { performedBy: true, targetUser: true, asset: true, consumable: true },
        orderBy: { createdAt: "desc" },
        take: 2000,
      });
      csv = toCSV(
        ["Date", "Action", "Description", "Performed By", "Target User", "Asset", "Consumable"],
        logs.map((l) => [
          l.createdAt.toISOString(), l.action, l.description,
          l.performedBy.name || l.performedBy.email,
          l.targetUser?.name || l.targetUser?.email || "",
          l.asset?.assetCode || "",
          l.consumable?.name || "",
        ])
      );
      break;
    }

    default:
      return NextResponse.json({ error: "Unknown report type" }, { status: 400 });
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="naturo-${type}-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
