import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { MyConsumablesClient } from "./my-consumables-client";

export default async function MyConsumablesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const organizationId = session.user.organizationId!;

  const [consumableAssignments, categories, regionConsumables, recentRequests] = await Promise.all([
    // Active assignments for this user
    db.consumableAssignment.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
        OR: [
          { starterKitApplicationId: null },
          { acknowledgedAt: { not: null } },
        ],
      },
      include: {
        consumable: {
          include: { region: true },
        },
      },
      orderBy: { assignedDate: "desc" },
    }),
    // All consumable categories (sections)
    db.category.findMany({
      where: { type: "CONSUMABLE", organizationId },
      orderBy: { sortOrder: "asc" },
    }),
    // All consumables in the staff's region (for requesting + display)
    db.consumable.findMany({
      where: {
        isActive: true,
        organizationId,
        ...(session.user.regionId ? { regionId: session.user.regionId } : {}),
      },
      include: { region: true },
      orderBy: { name: "asc" },
    }),
    // Pending requests for this user
    db.consumableRequest.findMany({
      where: {
        userId: session.user.id,
        status: { in: ["PENDING", "REJECTED"] },
      },
      include: {
        consumable: {
          include: { region: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <MyConsumablesClient
      assignments={JSON.parse(JSON.stringify(consumableAssignments))}
      categories={JSON.parse(JSON.stringify(categories))}
      consumables={JSON.parse(JSON.stringify(regionConsumables))}
      recentRequests={JSON.parse(JSON.stringify(recentRequests))}
    />
  );
}
