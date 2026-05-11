import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/permissions";
import { db } from "@/lib/db";
import { BackupClient } from "./backup-client";

export const dynamic = "force-dynamic";

export default async function BackupPage() {
  const session = await auth();
  if (!session?.user || !isSuperAdmin(session.user.role)) redirect("/dashboard");

  const organizationId = session.user.organizationId!;

  const [assetCount, consumableCount, staffCount, regionCount] = await Promise.all([
    db.asset.count({ where: { organizationId } }),
    db.consumable.count({ where: { organizationId, isActive: true } }),
    db.user.count({ where: { organizationId, isActive: true } }),
    db.region.count({ where: { organizationId, archivedAt: null } }),
  ]);

  return (
    <BackupClient
      assetCount={assetCount}
      consumableCount={consumableCount}
      staffCount={staffCount}
      regionCount={regionCount}
    />
  );
}
