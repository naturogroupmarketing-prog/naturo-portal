import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { StarterKitsClient } from "./starter-kits-client";

export default async function StarterKitsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/dashboard");

  const organizationId = session.user.organizationId!;

  const [kits, categories, consumables] = await Promise.all([
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
      select: { id: true, name: true, unitType: true, quantityOnHand: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <StarterKitsClient
      kits={JSON.parse(JSON.stringify(kits))}
      categories={JSON.parse(JSON.stringify(categories))}
      consumables={JSON.parse(JSON.stringify(consumables))}
    />
  );
}
