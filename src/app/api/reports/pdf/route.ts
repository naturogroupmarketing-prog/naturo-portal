import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isAdminOrManager } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId = session.user.organizationId!;
  const type = req.nextUrl.searchParams.get("type") || "assets";

  const regionFilter = session.user.role === "BRANCH_MANAGER"
    ? { regionId: session.user.regionId!, organizationId }
    : { organizationId };

  if (type === "assets") {
    const assets = await db.asset.findMany({
      where: regionFilter,
      include: {
        region: { select: { name: true, state: { select: { name: true } } } },
        assignments: {
          where: { isActive: true },
          include: { user: { select: { name: true, email: true } } },
          take: 1,
        },
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    // Generate HTML-based PDF (simple, no binary dependencies)
    const rows = assets.map((a) => {
      const assignee = a.assignments[0]?.user;
      return `<tr>
        <td>${a.assetCode}</td>
        <td>${a.name}</td>
        <td>${a.category}</td>
        <td>${a.region.state.name} / ${a.region.name}</td>
        <td>${a.status}</td>
        <td>${assignee ? (assignee.name || assignee.email) : "-"}</td>
        <td>${a.purchaseCost ? "$" + a.purchaseCost.toFixed(2) : "-"}</td>
        <td>${a.warrantyExpiry ? new Date(a.warrantyExpiry).toLocaleDateString("en-AU") : "-"}</td>
      </tr>`;
    }).join("");

    const totalValue = assets.reduce((sum, a) => sum + (a.purchaseCost || 0), 0);
    const now = new Date().toLocaleDateString("en-AU", { year: "numeric", month: "long", day: "numeric" });

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        h1 { color: #7C3AED; font-size: 24px; margin-bottom: 4px; }
        .subtitle { color: #666; font-size: 14px; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { background: #7C3AED; color: white; padding: 8px 6px; text-align: left; }
        td { padding: 6px; border-bottom: 1px solid #eee; }
        tr:nth-child(even) { background: #f9f9f9; }
        .summary { margin-top: 24px; padding: 16px; background: #f3f0ff; border-radius: 8px; }
        .summary p { margin: 4px 0; font-size: 13px; }
        .footer { margin-top: 40px; font-size: 11px; color: #999; text-align: center; }
      </style>
    </head><body>
      <h1>Trackio - Asset Report</h1>
      <p class="subtitle">Generated on ${now}</p>
      <table>
        <thead><tr>
          <th>Code</th><th>Name</th><th>Category</th><th>Location</th>
          <th>Status</th><th>Assigned To</th><th>Cost</th><th>Warranty</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="summary">
        <p><strong>Total Assets:</strong> ${assets.length}</p>
        <p><strong>Total Value:</strong> $${totalValue.toLocaleString("en-AU", { minimumFractionDigits: 2 })}</p>
        <p><strong>Available:</strong> ${assets.filter(a => a.status === "AVAILABLE").length} |
           <strong>Assigned:</strong> ${assets.filter(a => a.status === "ASSIGNED").length} |
           <strong>Damaged:</strong> ${assets.filter(a => a.status === "DAMAGED").length} |
           <strong>Lost:</strong> ${assets.filter(a => a.status === "LOST").length}</p>
      </div>
      <p class="footer">Trackio - Asset & Consumable Tracker</p>
    </body></html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="asset-report-${new Date().toISOString().slice(0, 10)}.html"`,
      },
    });
  }

  if (type === "consumables") {
    const consumables = await db.consumable.findMany({
      where: { ...regionFilter, isActive: true },
      include: {
        region: { select: { name: true, state: { select: { name: true } } } },
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    const rows = consumables.map((c) => {
      const isLow = c.quantityOnHand <= c.minimumThreshold;
      return `<tr${isLow ? ' style="background:#fff5f5;"' : ""}>
        <td>${c.name}</td>
        <td>${c.category}</td>
        <td>${c.region.state.name} / ${c.region.name}</td>
        <td>${c.unitType}</td>
        <td style="${isLow ? "color:#e53e3e;font-weight:bold;" : ""}">${c.quantityOnHand}</td>
        <td>${c.minimumThreshold}</td>
        <td>${c.reorderLevel}</td>
        <td>${c.supplier || "-"}</td>
      </tr>`;
    }).join("");

    const lowStockCount = consumables.filter(c => c.quantityOnHand <= c.minimumThreshold).length;
    const now = new Date().toLocaleDateString("en-AU", { year: "numeric", month: "long", day: "numeric" });

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        h1 { color: #7C3AED; font-size: 24px; margin-bottom: 4px; }
        .subtitle { color: #666; font-size: 14px; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { background: #7C3AED; color: white; padding: 8px 6px; text-align: left; }
        td { padding: 6px; border-bottom: 1px solid #eee; }
        tr:nth-child(even) { background: #f9f9f9; }
        .summary { margin-top: 24px; padding: 16px; background: #f3f0ff; border-radius: 8px; }
        .summary p { margin: 4px 0; font-size: 13px; }
        .footer { margin-top: 40px; font-size: 11px; color: #999; text-align: center; }
      </style>
    </head><body>
      <h1>Trackio - Consumable Stock Report</h1>
      <p class="subtitle">Generated on ${now}</p>
      <table>
        <thead><tr>
          <th>Item</th><th>Category</th><th>Location</th><th>Unit</th>
          <th>Qty On Hand</th><th>Min Threshold</th><th>Reorder Level</th><th>Supplier</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="summary">
        <p><strong>Total Items:</strong> ${consumables.length}</p>
        <p><strong>Low Stock Items:</strong> <span style="color:#e53e3e;">${lowStockCount}</span></p>
      </div>
      <p class="footer">Trackio - Asset & Consumable Tracker</p>
    </body></html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="consumable-report-${new Date().toISOString().slice(0, 10)}.html"`,
      },
    });
  }

  if (type === "maintenance") {
    const schedules = await db.maintenanceSchedule.findMany({
      where: { asset: regionFilter },
      include: {
        asset: { select: { name: true, assetCode: true, region: { select: { name: true } } } },
        assignedTo: { select: { name: true, email: true } },
        logs: { orderBy: { completedAt: "desc" }, take: 1 },
      },
      orderBy: { nextDueDate: "asc" },
    });

    const rows = schedules.map((s) => {
      const isOverdue = new Date(s.nextDueDate) < new Date();
      return `<tr${isOverdue ? ' style="background:#fff5f5;"' : ""}>
        <td>${s.asset.assetCode}</td>
        <td>${s.asset.name}</td>
        <td>${s.title}</td>
        <td>${s.frequency}</td>
        <td style="${isOverdue ? "color:#e53e3e;font-weight:bold;" : ""}">${new Date(s.nextDueDate).toLocaleDateString("en-AU")}</td>
        <td>${s.lastCompletedDate ? new Date(s.lastCompletedDate).toLocaleDateString("en-AU") : "Never"}</td>
        <td>${s.assignedTo ? (s.assignedTo.name || s.assignedTo.email) : "-"}</td>
        <td>${s.asset.region.name}</td>
      </tr>`;
    }).join("");

    const now = new Date().toLocaleDateString("en-AU", { year: "numeric", month: "long", day: "numeric" });
    const overdueCount = schedules.filter(s => new Date(s.nextDueDate) < new Date()).length;

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        h1 { color: #7C3AED; font-size: 24px; margin-bottom: 4px; }
        .subtitle { color: #666; font-size: 14px; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { background: #7C3AED; color: white; padding: 8px 6px; text-align: left; }
        td { padding: 6px; border-bottom: 1px solid #eee; }
        tr:nth-child(even) { background: #f9f9f9; }
        .summary { margin-top: 24px; padding: 16px; background: #f3f0ff; border-radius: 8px; }
        .summary p { margin: 4px 0; font-size: 13px; }
        .footer { margin-top: 40px; font-size: 11px; color: #999; text-align: center; }
      </style>
    </head><body>
      <h1>Trackio - Maintenance Report</h1>
      <p class="subtitle">Generated on ${now}</p>
      <table>
        <thead><tr>
          <th>Code</th><th>Asset</th><th>Task</th><th>Frequency</th>
          <th>Next Due</th><th>Last Completed</th><th>Assigned To</th><th>Region</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="summary">
        <p><strong>Total Schedules:</strong> ${schedules.length}</p>
        <p><strong>Overdue:</strong> <span style="color:#e53e3e;">${overdueCount}</span></p>
      </div>
      <p class="footer">Trackio - Asset & Consumable Tracker</p>
    </body></html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="maintenance-report-${new Date().toISOString().slice(0, 10)}.html"`,
      },
    });
  }

  return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
}
