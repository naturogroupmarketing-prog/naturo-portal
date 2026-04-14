import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdminOrManager, hasPermission, hasPermissions } from "@/lib/permissions";
import { db } from "@/lib/db";
import { ConsumablesClient } from "./consumables-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Consumables",
  description: "Manage consumable supplies and stock levels",
};

export default async function ConsumablesPage({ searchParams }: { searchParams: Promise<{ tab?: string; region?: string; stock?: string; category?: string }> }) {
  const params = await searchParams;
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) redirect("/login");

  const organizationId = session.user.organizationId!;

  const regionFilter = session.user.role === "BRANCH_MANAGER"
    ? { regionId: session.user.regionId!, organizationId }
    : { organizationId };

  const [consumables, pendingRequests, regions, users, categories, canAdjustStock, canAdd] = await Promise.all([
    db.consumable.findMany({
      where: { ...regionFilter, isActive: true },
      include: {
        region: { include: { state: true } },
        assignments: {
          where: { isActive: true },
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      take: 5000,
    }),
    db.consumableRequest.findMany({
      where: {
        status: "PENDING",
        consumable: { ...regionFilter },
      },
      include: {
        consumable: true,
        user: { select: { id: true, name: true, email: true } },
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
    db.user.findMany({
      where: {
        isActive: true,
        organizationId,
        ...(session.user.role === "BRANCH_MANAGER"
          ? { regionId: session.user.regionId! }
          : {}),
      },
      select: { id: true, name: true, email: true, regionId: true },
      orderBy: { name: "asc" },
    }),
    db.category.findMany({
      where: { type: "CONSUMABLE", organizationId },
      orderBy: { sortOrder: "asc" },
    }),
    hasPermission(session.user.id, session.user.role, "consumableStockAdjust"),
    hasPermission(session.user.id, session.user.role, "consumableAdd"),
  ]);

  return (
    <ConsumablesClient
      consumables={JSON.parse(JSON.stringify(consumables))}
      pendingRequests={JSON.parse(JSON.stringify(pendingRequests))}
      regions={JSON.parse(JSON.stringify(regions))}
      users={JSON.parse(JSON.stringify(users))}
      categories={JSON.parse(JSON.stringify(categories))}
      isSuperAdmin={session.user.role === "SUPER_ADMIN"}
      canAdd={canAdd}
      canAdjustStock={canAdjustStock}
      initialTab={params.tab}
      initialStock={params.stock}
      initialCategory={params.category}
    />
  );
}
