import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdminOrManager } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PurchaseOrdersClient } from "./purchase-orders-client";

export const dynamic = "force-dynamic";

export default async function PurchaseOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; region?: string }> }) {
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

    // Fetch POs, regions, consumables — using explicit select to avoid column mismatches
    const [purchaseOrders, regions, consumables] = await Promise.all([
      db.purchaseOrder.findMany({
        where: poWhere,
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
          consumable: { select: { name: true, unitType: true, category: true, imageUrl: true } },
          region: { select: { id: true, name: true, state: { select: { id: true, name: true, abbreviation: true } } } },
          createdBy: { select: { name: true, email: true } },
          approvedBy: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 1000,
      }),
      db.region.findMany({
        where: regionWhere,
        select: {
          id: true,
          name: true,
          state: { select: { id: true, name: true, abbreviation: true } },
        },
        orderBy: { name: "asc" },
      }),
      db.consumable.findMany({
        where: { regionId: isBM ? session.user.regionId! : undefined, organizationId, isActive: true },
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
