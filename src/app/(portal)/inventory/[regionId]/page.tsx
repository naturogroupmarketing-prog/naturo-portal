import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { isAdminOrManager, isSuperAdmin, hasPermission } from "@/lib/permissions";
import { db } from "@/lib/db";
import { InventoryDetailClient } from "./inventory-detail-client";

export default async function InventoryDetailPage({ params, searchParams }: { params: Promise<{ regionId: string }>; searchParams: Promise<{ tab?: string; action?: string; highlight?: string }> }) {
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) redirect("/dashboard");

  const { regionId } = await params;
  const { tab, action, highlight } = await searchParams;

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
      where: { regionId, deletedAt: null },
      include: {
        region: { include: { state: true } },
        assignments: { where: { isActive: true }, include: { user: { select: { name: true, email: true } } } },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      take: 5000,
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
      where: { regionId, isActive: true, deletedAt: null },
      include: {
        region: true,
        assetAssignments: {
          where: { isActive: true },
          include: { asset: { select: { name: true, assetCode: true, category: true, imageUrl: true } } },
        },
        consumableAssignments: {
          where: { isActive: true },
          include: { consumable: { select: { name: true, unitType: true, category: true, imageUrl: true } } },
        },
        consumableRequests: {
          where: { status: { in: ["PENDING", "ISSUED", "CLOSED"] } },
          include: { consumable: { select: { name: true, unitType: true, category: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        damageReports: {
          include: { asset: { select: { name: true, assetCode: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        conditionChecks: {
          select: { id: true, monthYear: true, condition: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
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
  const [canAddAsset, canEditAsset, canDeleteAsset, canAssignAsset, canAddConsumable, canEditConsumable, canDeleteConsumable, canAdjustStock] = isAdmin
    ? [true, true, true, true, true, true, true, true]
    : await Promise.all([
        hasPermission(session.user.id, session.user.role, "assetAdd"),
        hasPermission(session.user.id, session.user.role, "assetEdit"),
        hasPermission(session.user.id, session.user.role, "assetDelete"),
        hasPermission(session.user.id, session.user.role, "assetAssign"),
        hasPermission(session.user.id, session.user.role, "consumableAdd"),
        hasPermission(session.user.id, session.user.role, "consumableEdit"),
        hasPermission(session.user.id, session.user.role, "consumableDelete"),
        hasPermission(session.user.id, session.user.role, "consumableStockAdjust"),
      ]);

  // Build consumable usage history for staff (last 6 months)
  const staffIds = staff.map((u) => u.id);
  const sixMonthsAgo = new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1);
  const usageRaw = staffIds.length > 0 ? await db.consumableAssignment.findMany({
    where: { userId: { in: staffIds }, isActive: false, returnCondition: "USED", returnedDate: { gte: sixMonthsAgo } },
    select: { userId: true, quantity: true, returnedDate: true, consumable: { select: { name: true, unitType: true } } },
  }) : [];

  const usageMap = new Map<string, { month: string; label: string; totalUsed: number; items: { name: string; quantity: number; unitType: string }[] }[]>();
  for (const userId of staffIds) {
    const months: typeof usageMap extends Map<string, infer V> ? V : never = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1);
      months.push({ month: d.toISOString().slice(0, 7), label: d.toLocaleDateString("en-AU", { month: "short", year: "numeric" }), totalUsed: 0, items: [] });
    }
    usageMap.set(userId, months);
  }
  for (const u of usageRaw) {
    if (!u.returnedDate) continue;
    const key = u.returnedDate.toISOString().slice(0, 7);
    const userMonths = usageMap.get(u.userId);
    if (!userMonths) continue;
    const bucket = userMonths.find((m) => m.month === key);
    if (!bucket) continue;
    bucket.totalUsed += u.quantity;
    const existing = bucket.items.find((i) => i.name === u.consumable.name);
    if (existing) existing.quantity += u.quantity;
    else bucket.items.push({ name: u.consumable.name, quantity: u.quantity, unitType: u.consumable.unitType });
  }

  const staffWithUsage = staff.map((u) => ({
    ...u,
    consumableUsageHistory: usageMap.get(u.id) || [],
  }));

  // All regions for staff management (reassign dropdown)
  const allRegions = isAdmin
    ? await db.region.findMany({ where: { organizationId }, include: { state: true }, orderBy: { name: "asc" } })
    : [region];

  return (
    <InventoryDetailClient
      region={JSON.parse(JSON.stringify({ ...region, state: region.state }))}
      assets={JSON.parse(JSON.stringify(assets))}
      consumables={JSON.parse(JSON.stringify(consumables))}
      staff={JSON.parse(JSON.stringify(staffWithUsage))}
      users={JSON.parse(JSON.stringify(users))}
      assetCategories={JSON.parse(JSON.stringify(assetCategories))}
      consumableCategories={JSON.parse(JSON.stringify(consumableCategories))}
      pendingRequests={JSON.parse(JSON.stringify(pendingRequests))}
      lowStockCount={lowStockCount}
      permissions={{ canAddAsset, canEditAsset, canDeleteAsset, canAssignAsset, canAddConsumable, canEditConsumable, canDeleteConsumable, canAdjustStock }}
      isSuperAdmin={isAdmin}
      allRegions={JSON.parse(JSON.stringify(allRegions.map((r) => ({ id: r.id, name: r.name, state: { name: r.state.name } }))))}
      initialTab={tab as "assets" | "consumables" | "staff" | undefined}
      initialAction={action}
      highlightId={highlight}
    />
  );
}
