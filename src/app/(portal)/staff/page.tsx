import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdminOrManager } from "@/lib/permissions";
import { db } from "@/lib/db";
import { StaffClient } from "./staff-client";

export default async function StaffPage() {
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) redirect("/login");

  const organizationId = session.user.organizationId!;

  const where = session.user.role === "BRANCH_MANAGER"
    ? { regionId: session.user.regionId!, organizationId }
    : { organizationId };

  const [users, regions] = await Promise.all([
    db.user.findMany({
      where,
      include: {
        region: true,
        assetAssignments: {
          where: { isActive: true },
          include: { asset: { select: { name: true, assetCode: true } } },
        },
      },
      orderBy: { name: "asc" },
    }),
    db.region.findMany({
      where: session.user.role === "BRANCH_MANAGER"
        ? { id: session.user.regionId!, organizationId }
        : { organizationId },
      include: { state: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const allRegions = session.user.role === "SUPER_ADMIN"
    ? await db.region.findMany({
        where: { organizationId },
        include: { state: true },
        orderBy: { name: "asc" },
      })
    : regions;

  // Check branch manager permissions for viewing staff details
  let canViewStaffDetails = true; // Super admin always can
  if (session.user.role === "BRANCH_MANAGER") {
    const perms = await db.managerPermission.findUnique({
      where: { userId: session.user.id },
    });
    canViewStaffDetails = perms?.staffViewDetails ?? false;
  }

  return (
    <StaffClient
      users={JSON.parse(JSON.stringify(users))}
      regions={JSON.parse(JSON.stringify(regions))}
      allRegions={JSON.parse(JSON.stringify(allRegions))}
      isSuperAdmin={session.user.role === "SUPER_ADMIN"}
      canViewStaffDetails={canViewStaffDetails}
    />
  );
}
