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

  return (
    <StaffClient
      users={JSON.parse(JSON.stringify(users))}
      regions={JSON.parse(JSON.stringify(regions))}
    />
  );
}
