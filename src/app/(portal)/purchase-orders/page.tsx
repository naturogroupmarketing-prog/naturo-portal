import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdminOrManager, hasPermission } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PurchaseOrdersClient } from "./purchase-orders-client";
import { autoSyncLowStockPOs } from "@/lib/auto-sync-pos";

export const dynamic = "force-dynamic";

export default async function PurchaseOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; region?: string }> }) {
  const params = await searchParams;
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) redirect("/login");

  const organizationId = session.user.organizationId!;

  // Auto-sync: create missing POs for low-stock items (don't crash page if this fails)
  try { await autoSyncLowStockPOs(organizationId); } catch {}

  const regionFilter = session.user.role === "BRANCH_MANAGER" && session.user.regionId
    ? { regionId: session.user.regionId, organizationId }
    : { organizationId };

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Clean up rejected POs older than 24 hours
  try { await db.purchaseOrder.deleteMany({
    where: { organizationId, status: "REJECTED", approvedAt: { lt: twentyFourHoursAgo } },
  }); } catch {}

  let canManagePO = false;
  let canApprovePO = false;
  let canEditQty = false;
  try {
    [canManagePO, canApprovePO, canEditQty] = await Promise.all([
      hasPermission(session.user.id, session.user.role, "purchaseOrderManage"),
      session.user.role === "SUPER_ADMIN" ? true : hasPermission(session.user.id, session.user.role, "purchaseOrderApprove"),
      session.user.role === "SUPER_ADMIN" ? true : hasPermission(session.user.id, session.user.role, "purchaseOrderEditQty"),
    ]);
  } catch {}

  const [purchaseOrders, regions, consumables] = await Promise.all([
    db.purchaseOrder.findMany({
      where: {
        ...regionFilter,
      },
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
      where: { ...regionFilter, isActive: true },
      select: { id: true, name: true, category: true, unitType: true, supplier: true, regionId: true, quantityOnHand: true, minimumThreshold: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
  ]);

  return (
    <PurchaseOrdersClient
      purchaseOrders={JSON.parse(JSON.stringify(purchaseOrders))}
      regions={JSON.parse(JSON.stringify(regions))}
      isSuperAdmin={session.user.role === "SUPER_ADMIN"}
      canManagePO={canManagePO}
      canApprovePO={canApprovePO}
      canEditQty={canEditQty}
      consumables={JSON.parse(JSON.stringify(consumables))}
      initialStatus={params.status}
      initialRegion={params.region}
    />
  );
}
