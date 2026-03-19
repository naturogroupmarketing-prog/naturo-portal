import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdminOrManager } from "@/lib/permissions";
import { db } from "@/lib/db";
import { MaintenanceClient } from "./maintenance-client";

export default async function MaintenancePage() {
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) redirect("/login");

  const organizationId = session.user.organizationId!;

  const regionFilter = session.user.role === "BRANCH_MANAGER"
    ? { regionId: session.user.regionId!, organizationId }
    : { organizationId };

  const [schedules, assets, users] = await Promise.all([
    db.maintenanceSchedule.findMany({
      where: { asset: regionFilter },
      include: {
        asset: { select: { id: true, name: true, assetCode: true, region: { select: { name: true } } } },
        assignedTo: { select: { id: true, name: true, email: true } },
        logs: { orderBy: { completedAt: "desc" }, take: 1 },
      },
      orderBy: { nextDueDate: "asc" },
    }),
    db.asset.findMany({
      where: regionFilter,
      select: { id: true, name: true, assetCode: true },
      orderBy: { name: "asc" },
    }),
    db.user.findMany({
      where: { organizationId, isActive: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <MaintenanceClient
      schedules={JSON.parse(JSON.stringify(schedules))}
      assets={JSON.parse(JSON.stringify(assets))}
      users={JSON.parse(JSON.stringify(users))}
    />
  );
}
