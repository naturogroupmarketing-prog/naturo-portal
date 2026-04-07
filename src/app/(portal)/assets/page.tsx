import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdminOrManager, hasPermissions } from "@/lib/permissions";
import { db } from "@/lib/db";
import { AssetsClient } from "./assets-client";

export default async function AssetsPage({ searchParams }: { searchParams: Promise<{ status?: string; region?: string; category?: string }> }) {
  const params = await searchParams;
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) redirect("/login");

  const organizationId = session.user.organizationId!;

  const regionFilter = session.user.role === "BRANCH_MANAGER"
    ? { regionId: session.user.regionId!, organizationId }
    : { organizationId };

  const PAGE_LIMIT = 5000;
  const [assets, totalAssetCount, regions, users, categories, perms] = await Promise.all([
    db.asset.findMany({
      where: { ...regionFilter },
      select: {
        id: true, name: true, assetCode: true, category: true, status: true,
        serialNumber: true, isHighValue: true, imageUrl: true, description: true,
        sortOrder: true, supplier: true, purchaseCost: true, purchaseDate: true,
        regionId: true, organizationId: true,
        region: { select: { id: true, name: true, state: { select: { id: true, name: true } } } },
        assignments: {
          where: { isActive: true },
          select: { id: true, user: { select: { id: true, name: true, email: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: PAGE_LIMIT,
    }),
    db.asset.count({ where: { ...regionFilter } }),
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
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    db.category.findMany({
      where: { type: "ASSET", organizationId },
      orderBy: { sortOrder: "asc" },
    }),
    hasPermissions(session.user.id, session.user.role, ["assetAdd", "assetEdit", "assetDelete"]),
  ]);

  return (
    <AssetsClient
      assets={JSON.parse(JSON.stringify(assets))}
      regions={JSON.parse(JSON.stringify(regions))}
      users={JSON.parse(JSON.stringify(users))}
      categories={JSON.parse(JSON.stringify(categories))}
      isSuperAdmin={session.user.role === "SUPER_ADMIN"}
      permissions={{ canAdd: perms.assetAdd, canEdit: perms.assetEdit, canDelete: perms.assetDelete }}
      initialStatus={params.status}
      initialRegion={params.region}
      initialCategory={params.category}
    />
  );
}
