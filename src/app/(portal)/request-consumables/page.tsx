import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { RequestConsumablesClient } from "./request-client";

export default async function RequestConsumablesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const organizationId = session.user.organizationId!;

  // Staff can only request from their own region; admins see all
  const consumables = await db.consumable.findMany({
    where: {
      isActive: true,
      organizationId,
      ...(session.user.regionId
        ? { regionId: session.user.regionId }
        : {}),
    },
    include: { region: true },
    orderBy: { name: "asc" },
  });

  return (
    <RequestConsumablesClient
      consumables={JSON.parse(JSON.stringify(consumables))}
    />
  );
}
