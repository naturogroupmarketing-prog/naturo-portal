import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdminOrManager } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PurchaseOrdersClient } from "./purchase-orders-client";
import { ReplenishmentBanner } from "./replenishment-banner";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Purchase Orders",
  description: "Track and manage purchase orders",
};

export const dynamic = "force-dynamic";

export default async function PurchaseOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; region?: string; showAll?: string }> }) {
  const params = await searchParams;
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) redirect("/login");

  const organizationId = session.user.organizationId!;
  const isSuperAdmin = session.user.role === "SUPER_ADMIN";
  const isBM = session.user.role === "BRANCH_MANAGER" && session.user.regionId;

  try {
    // Build region filter
    const poWhere = isBM
      ? { regionId: session.user.regionId!, organizationId }
      : { organizationId };

    const regionWhere = isBM
      ? { id: session.user.regionId!, organizationId }
      : { organizationId };

    // Hide received POs older than 7 days (unless Super Admin toggled "Show All History")
    const showAllHistory = isSuperAdmin && params.showAll === "true";
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Fetch sequentially to avoid exhausting Neon connection pool
    const purchaseOrders = await db.purchaseOrder.findMany({
      where: {
        ...poWhere,
        ...(!showAllHistory ? {
          OR: [
            { status: { not: "RECEIVED" } },
            { status: "RECEIVED", updatedAt: { gte: sevenDaysAgo } },
          ],
        } : {}),
      },
      select: {
        id: true,
        consumableId: true,
        regionId: true,
        organizationId: true,
        quantity: true,
        supplier: true,
        status: true,
        notes: true,
        createdById: true,
        approvedById: true,
        approvedAt: true,
        createdAt: true,
        updatedAt: true,
        consumable: { select: { name: true, unitType: true, category: true, imageUrl: true, quantityOnHand: true, minimumThreshold: true, shopUrl: true } },
        region: { select: { id: true, name: true, state: { select: { id: true, name: true } } } },
        createdBy: { select: { name: true, email: true } },
        approvedBy: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 1000,
    });

    const regions = await db.region.findMany({
      where: regionWhere,
      select: {
        id: true,
        name: true,
        state: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    });

    const consumables = await db.consumable.findMany({
      where: { regionId: isBM ? session.user.regionId! : undefined, organizationId, isActive: true },
      select: { id: true, name: true, category: true, unitType: true, supplier: true, regionId: true, quantityOnHand: true, minimumThreshold: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    // Fetch replenishment suggestions for Super Admin
    // Fetch ALL consumables with no active PO — filter in JS so we catch
    // both AI-predicted risk AND items simply below minimum threshold
    const replenishmentSuggestions = isSuperAdmin ? await db.consumable.findMany({
      where: {
        organizationId,
        isActive: true,
        deletedAt: null,
        // Exclude items that already have an active PO
        purchaseOrders: { none: { status: { in: ["PENDING", "APPROVED", "ORDERED"] } } },
      },
      select: {
        id: true,
        name: true,
        unitType: true,
        quantityOnHand: true,
        minimumThreshold: true,
        reorderLevel: true,
        avgDailyUsage: true,
        riskLevel: true,
        shopUrl: true,
        regionId: true,
        region: { select: { name: true } },
      },
      orderBy: { quantityOnHand: "asc" },
      take: 500,
    }).then((items) => {
      // Filter: AI-predicted risk OR below minimum threshold OR below reorder level OR out of stock
      const atRisk = items.filter((item) =>
        item.riskLevel === "critical" ||
        item.riskLevel === "warning" ||
        item.quantityOnHand === 0 ||
        (item.minimumThreshold > 0 && item.quantityOnHand <= item.minimumThreshold) ||
        (item.reorderLevel > 0 && item.quantityOnHand <= item.reorderLevel)
      );

      return atRisk
        .slice(0, 10) // cap at 10 suggestions
        .map((item) => {
          const dailyUsage = item.avgDailyUsage || 0;
          const thirtyDaySupply = Math.ceil(dailyUsage * 30);
          const safeReorder = Math.max(item.reorderLevel, item.minimumThreshold);
          const deficit = Math.max(0, safeReorder - item.quantityOnHand);
          const suggestedQty = Math.max(deficit, thirtyDaySupply, safeReorder, 1);
          const daysRemaining = dailyUsage > 0 ? Math.round(item.quantityOnHand / dailyUsage) : null;

          let reason = "";
          if (item.quantityOnHand === 0) reason = "Out of stock";
          else if (daysRemaining !== null && daysRemaining <= 3) reason = `~${daysRemaining}d left`;
          else if (daysRemaining !== null && daysRemaining <= 7) reason = `Low — ~${daysRemaining}d`;
          else reason = `Below min threshold (${item.minimumThreshold})`;

          // Risk level: use AI value if set, otherwise derive from stock
          const riskLevel = item.riskLevel && item.riskLevel !== "ok"
            ? item.riskLevel
            : item.quantityOnHand === 0 ? "critical" : "warning";

          return {
            consumableId: item.id,
            consumableName: item.name,
            regionId: item.regionId,
            regionName: item.region.name,
            currentStock: item.quantityOnHand,
            avgDailyUsage: dailyUsage,
            daysRemaining,
            riskLevel,
            suggestedOrderQty: suggestedQty,
            unitType: item.unitType,
            reason,
            shopUrl: item.shopUrl || null,
          };
        });
    }) : [];

    return (
      <div className="space-y-4">
      {isSuperAdmin && (
        <ReplenishmentBanner suggestions={replenishmentSuggestions} />
      )}
      <PurchaseOrdersClient
        purchaseOrders={JSON.parse(JSON.stringify(purchaseOrders))}
        regions={JSON.parse(JSON.stringify(regions))}
        isSuperAdmin={isSuperAdmin}
        canManagePO={isSuperAdmin}
        canApprovePO={isSuperAdmin}
        canEditQty={isSuperAdmin}
        consumables={JSON.parse(JSON.stringify(consumables))}
        initialStatus={params.status}
        initialRegion={params.region}
        showAllHistory={showAllHistory}
      />
      </div>
    );
  } catch (error) {
    // Show the actual error so we can debug
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Purchase Orders Error</h1>
        <pre className="bg-red-50 p-4 rounded-lg text-sm text-red-800 overflow-auto">
          {error instanceof Error ? `${error.message}\n\nStack: ${error.stack}` : JSON.stringify(error)}
        </pre>
      </div>
    );
  }
}
