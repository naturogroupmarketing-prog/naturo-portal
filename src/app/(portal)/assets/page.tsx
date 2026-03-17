import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdminOrManager, hasPermission } from "@/lib/permissions";
import { db } from "@/lib/db";
import { AssetsClient } from "./assets-client";

export default async function AssetsPage({ searchParams }: { searchParams: Promise<{ status?: string; region?: string }> }) {
  const params = await searchParams;
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) redirect("/login");

  const organizationId = session.user.organizationId!;

  const regionFilter = session.user.role === "BRANCH_MANAGER"
    ? { regionId: session.user.regionId!, organizationId }
    : { organizationId };

  const [assets, regions, users, categories, canAdd, canEdit, canDelete] = await Promise.all([
    db.asset.findMany({
      where: regionFilter,
      include: {
        region: { include: { state: true } },
        assignments: {
          where: { isActive: true },
          include: { user: { select: { id: true, name: true, email: true } } },
        },
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
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    db.category.findMany({
      where: { type: "ASSET", organizationId },
      orderBy: { sortOrder: "asc" },
    }),
    hasPermission(session.user.id, session.user.role, "assetAdd"),
    hasPermission(session.user.id, session.user.role, "assetEdit"),
    hasPermission(session.user.id, session.user.role, "assetDelete"),
  ]);

  return (
    <AssetsClient
      assets={JSON.parse(JSON.stringify(assets))}
      regions={JSON.parse(JSON.stringify(regions))}
      users={JSON.parse(JSON.stringify(users))}
      categories={JSON.parse(JSON.stringify(categories))}
      isSuperAdmin={session.user.role === "SUPER_ADMIN"}
      permissions={{ canAdd, canEdit, canDelete }}
      initialStatus={params.status}
      initialRegion={params.region}
    />
  );
}
