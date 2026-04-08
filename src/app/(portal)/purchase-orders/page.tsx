import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdminOrManager } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PurchaseOrdersClient } from "./purchase-orders-client";
import { autoSyncLowStockPOs } from "@/lib/auto-sync-pos";

export const dynamic = "force-dynamic";

export default async function PurchaseOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; region?: string }> }) {
  const params = await searchParams;
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) redirect("/login");

  const organizationId = session.user.organizationId!;
  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  // Auto-sync (non-blocking)
  try { await autoSyncLowStockPOs(organizationId); } catch {}

  // Build region filter
  const regionWhere = session.user.role === "BRANCH_MANAGER" && session.user.regionId
    ? { regionId: session.user.regionId, organizationId }
    : { organizationId };

  // Fetch POs and regions
  const [purchaseOrders, regions, consumables] = await Promise.all([
    db.purchaseOrder.findMany({
      where: regionWhere,
      include: {
        consumable: { select: { name: true, unitType: true, category: true, imageUrl: true } },
        region: { include: { state: true } },
        createdBy: { select: { name: true, email: true } },
        approvedBy: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 1000,
    }),
    db.region.findMany({
      where: session.user.role === "BRANCH_MANAGER" && session.user.regionId
        ? { id: session.user.regionId, organizationId }
        : { organizationId },
      include: { state: true },
      orderBy: { name: "asc" },
    }),
    db.consumable.findMany({
      where: { ...regionWhere, isActive: true },
      select: { id: true, name: true, category: true, unitType: true, supplier: true, regionId: true, quantityOnHand: true, minimumThreshold: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
  ]);

  return (
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
    />
  );
}
