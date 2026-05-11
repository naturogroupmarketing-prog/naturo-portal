import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasPermission, isAdminOrManager } from "@/lib/permissions";
import { StarterKitsClient } from "./starter-kits-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Starter Kits",
  description: "Manage onboarding starter kit templates",
};

export default async function StarterKitsPage() {
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) redirect("/dashboard");

  const canManage = await hasPermission(session.user.id, session.user.role, "starterKitsManage");
  if (!canManage) redirect("/dashboard");

  const organizationId = session.user.organizationId!;

  const [kits, categories, consumables, users, assetPhotos] = await Promise.all([
    db.starterKit.findMany({
      where: { organizationId },
      include: {
        items: true,
      },
      orderBy: { name: "asc" },
    }),
    db.category.findMany({
      where: { organizationId, type: "ASSET" },
      orderBy: { sortOrder: "asc" },
    }),
    db.consumable.findMany({
      where: { organizationId, isActive: true },
      select: { id: true, name: true, unitType: true, quantityOnHand: true, category: true, imageUrl: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    db.user.findMany({
      where: { organizationId, isActive: true, role: { in: ["STAFF", "BRANCH_MANAGER"] } },
      select: { id: true, name: true, email: true, region: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
    // Get one photo per asset category for display
    db.asset.findMany({
      where: { organizationId, imageUrl: { not: null } },
      select: { category: true, imageUrl: true },
      distinct: ["category"],
    }),
  ]);

  return (
    <StarterKitsClient
      kits={JSON.parse(JSON.stringify(kits))}
      categories={JSON.parse(JSON.stringify(categories))}
      consumables={JSON.parse(JSON.stringify(consumables))}
      users={JSON.parse(JSON.stringify(users))}
      assetPhotos={JSON.parse(JSON.stringify(Object.fromEntries(assetPhotos.map((a) => [a.category, a.imageUrl]))))}
    />
  );
}
