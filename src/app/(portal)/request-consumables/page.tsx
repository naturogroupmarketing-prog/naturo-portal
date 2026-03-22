import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { RequestConsumablesClient } from "./request-client";

export default async function RequestConsumablesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const organizationId = session.user.organizationId!;

  const [consumables, categories, recentRequests] = await Promise.all([
    db.consumable.findMany({
      where: {
        isActive: true,
        organizationId,
        ...(session.user.regionId ? { regionId: session.user.regionId } : {}),
      },
      include: { region: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    db.category.findMany({
      where: { type: "CONSUMABLE", organizationId },
      orderBy: { sortOrder: "asc" },
    }),
    db.consumableRequest.findMany({
      where: {
        userId: session.user.id,
        status: { in: ["PENDING", "REJECTED"] },
      },
      include: {
        consumable: { include: { region: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <RequestConsumablesClient
      consumables={JSON.parse(JSON.stringify(consumables))}
      categories={JSON.parse(JSON.stringify(categories))}
      recentRequests={JSON.parse(JSON.stringify(recentRequests))}
    />
  );
}
