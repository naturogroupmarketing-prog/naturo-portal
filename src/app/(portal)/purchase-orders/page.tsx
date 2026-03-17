import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdminOrManager, hasPermission } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PurchaseOrdersClient } from "./purchase-orders-client";

export default async function PurchaseOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; region?: string }> }) {
  const params = await searchParams;
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) redirect("/login");

  const organizationId = session.user.organizationId!;

  const regionFilter = session.user.role === "BRANCH_MANAGER"
    ? { regionId: session.user.regionId!, organizationId }
    : { organizationId };

  const [purchaseOrders, regions, canManagePO] = await Promise.all([
    db.purchaseOrder.findMany({
      where: regionFilter,
      include: {
        consumable: { select: { name: true, unitType: true, category: true } },
        region: { include: { state: true } },
        createdBy: { select: { name: true, email: true } },
        approvedBy: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.region.findMany({
      where: session.user.role === "BRANCH_MANAGER"
        ? { id: session.user.regionId!, organizationId }
        : { organizationId },
      include: { state: true },
      orderBy: { name: "asc" },
    }),
    hasPermission(session.user.id, session.user.role, "purchaseOrderManage"),
  ]);

  return (
    <PurchaseOrdersClient
      purchaseOrders={JSON.parse(JSON.stringify(purchaseOrders))}
      regions={JSON.parse(JSON.stringify(regions))}
      isSuperAdmin={session.user.role === "SUPER_ADMIN"}
      canManagePO={canManagePO}
      initialStatus={params.status}
      initialRegion={params.region}
    />
  );
}
