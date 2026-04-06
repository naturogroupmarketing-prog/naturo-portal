import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { isAdminOrManager, isSuperAdmin, hasPermission } from "@/lib/permissions";
import { db } from "@/lib/db";
import { InventoryDetailClient } from "./inventory-detail-client";

export default async function InventoryDetailPage({ params, searchParams }: { params: Promise<{ regionId: string }>; searchParams: Promise<{ tab?: string; action?: string }> }) {
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) redirect("/dashboard");

  const { regionId } = await params;
  const { tab, action } = await searchParams;

  // Branch Manager can only see their own region
  if (session.user.role === "BRANCH_MANAGER" && session.user.regionId && session.user.regionId !== regionId) {
    redirect(`/inventory/${session.user.regionId}`);
  }

  const region = await db.region.findUnique({
    where: { id: regionId },
    include: { state: true },
  });
  if (!region) notFound();

  const organizationId = session.user.organizationId!;

  // Fetch all data needed for both asset and consumable tabs
  const [assets, consumables, staff, users, assetCategories, consumableCategories, lowStockCount] = await Promise.all([
    db.asset.findMany({
      where: { regionId },
      include: {
        region: { include: { state: true } },
        assignments: { where: { isActive: true }, include: { user: { select: { name: true, email: true } } } },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    db.consumable.findMany({
      where: { regionId, isActive: true },
      include: {
        region: { include: { state: true } },
        assignments: { where: { isActive: true }, include: { user: { select: { name: true, email: true } } } },
        requests: { where: { status: "PENDING" }, select: { id: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    db.user.findMany({
      where: { regionId, isActive: true },
      orderBy: { name: "asc" },
    }),
    db.user.findMany({
      where: { organizationId, isActive: true },
      select: { id: true, name: true, email: true, regionId: true },
      orderBy: { name: "asc" },
    }),
    db.category.findMany({
      where: { type: "ASSET", organizationId },
      orderBy: { sortOrder: "asc" },
    }),
    db.category.findMany({
      where: { type: "CONSUMABLE", organizationId },
      orderBy: { sortOrder: "asc" },
    }),
    db.consumable.count({
      where: { regionId, isActive: true, quantityOnHand: { lte: db.consumable.fields.minimumThreshold } },
    }).catch(() => 0),
  ]);

  // Get pending consumable requests for this region
  const pendingRequests = await db.consumableRequest.findMany({
    where: { consumable: { regionId }, status: { in: ["PENDING", "APPROVED"] } },
    include: { consumable: true, user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Permissions
  const isAdmin = isSuperAdmin(session.user.role);
  const [canAddAsset, canEditAsset, canDeleteAsset, canAddConsumable, canEditConsumable, canDeleteConsumable, canAdjustStock] = isAdmin
    ? [true, true, true, true, true, true, true]
    : await Promise.all([
        hasPermission(session.user.id, session.user.role, "assetAdd"),
        hasPermission(session.user.id, session.user.role, "assetEdit"),
        hasPermission(session.user.id, session.user.role, "assetDelete"),
        hasPermission(session.user.id, session.user.role, "consumableAdd"),
        hasPermission(session.user.id, session.user.role, "consumableEdit"),
        hasPermission(session.user.id, session.user.role, "consumableDelete"),
        hasPermission(session.user.id, session.user.role, "consumableStockAdjust"),
      ]);

  return (
    <InventoryDetailClient
      region={JSON.parse(JSON.stringify({ ...region, state: region.state }))}
      assets={JSON.parse(JSON.stringify(assets))}
      consumables={JSON.parse(JSON.stringify(consumables))}
      staff={JSON.parse(JSON.stringify(staff))}
      users={JSON.parse(JSON.stringify(users))}
      assetCategories={JSON.parse(JSON.stringify(assetCategories))}
      consumableCategories={JSON.parse(JSON.stringify(consumableCategories))}
      pendingRequests={JSON.parse(JSON.stringify(pendingRequests))}
      lowStockCount={lowStockCount}
      permissions={{ canAddAsset, canEditAsset, canDeleteAsset, canAddConsumable, canEditConsumable, canDeleteConsumable, canAdjustStock }}
      isSuperAdmin={isAdmin}
      initialTab={tab as "assets" | "consumables" | "staff" | undefined}
      initialAction={action}
    />
  );
}
