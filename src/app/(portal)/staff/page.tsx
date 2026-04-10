import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdminOrManager } from "@/lib/permissions";
import { db } from "@/lib/db";
import { StaffClient } from "./staff-client";

export const dynamic = "force-dynamic";

export default async function StaffPage({ searchParams }: { searchParams: Promise<{ region?: string }> }) {
  const params = await searchParams;
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) redirect("/login");

  const organizationId = session.user.organizationId!;

  const where = session.user.role === "BRANCH_MANAGER"
    ? { regionId: session.user.regionId!, organizationId, deletedAt: null }
    : { organizationId, deletedAt: null };

  const [users, regions] = await Promise.all([
    db.user.findMany({
      where,
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

  // Consumable usage history — last 6 months for all staff
  const userIds = users.map((u) => u.id);
  const sixMonthsAgo = new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1);
  const usageRaw = await db.consumableAssignment.findMany({
    where: {
      userId: { in: userIds },
      isActive: false,
      returnCondition: "USED",
      returnedDate: { gte: sixMonthsAgo },
    },
    select: {
      userId: true,
      quantity: true,
      returnedDate: true,
      consumable: { select: { name: true, unitType: true } },
    },
  });

  // Build per-user usage map
  const usageMap = new Map<string, { month: string; label: string; totalUsed: number; items: { name: string; quantity: number; unitType: string }[] }[]>();
  for (const userId of userIds) {
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

  const usersWithUsage = users.map((u) => ({
    ...u,
    consumableUsageHistory: usageMap.get(u.id) || [],
  }));

  // Fetch starter kits for "Assign Starter Kit" button
  const starterKits = await db.starterKit.findMany({
    where: { organizationId },
    select: { id: true, name: true, isDefault: true },
    orderBy: { name: "asc" },
  });

  // Fetch deleted users for Super Admin
  const deletedUsers = session.user.role === "SUPER_ADMIN"
    ? await db.user.findMany({
        where: { organizationId, deletedAt: { not: null } },
        select: { id: true, name: true, email: true, role: true, deletedAt: true, region: { select: { name: true } } },
        orderBy: { deletedAt: "desc" },
      })
    : [];

  return (
    <StaffClient
      users={JSON.parse(JSON.stringify(usersWithUsage))}
      regions={JSON.parse(JSON.stringify(regions))}
      allRegions={JSON.parse(JSON.stringify(allRegions))}
      isSuperAdmin={session.user.role === "SUPER_ADMIN"}
      canViewStaffDetails={canViewStaffDetails}
      initialRegion={params.region}
      deletedUsers={JSON.parse(JSON.stringify(deletedUsers))}
      starterKits={starterKits}
    />
  );
}
