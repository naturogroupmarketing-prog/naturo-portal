import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdminOrManager } from "@/lib/permissions";
import { db } from "@/lib/db";
import { LowStockClient } from "./low-stock-client";

export default async function LowStockPage({ searchParams }: { searchParams: Promise<{ region?: string }> }) {
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) redirect("/dashboard");

  const organizationId = session.user.organizationId!;
  const regionWhere = session.user.role === "BRANCH_MANAGER" && session.user.regionId
    ? { regionId: session.user.regionId }
    : {};

  const lowStockItems = await db.consumable.findMany({
    where: { organizationId, isActive: true, ...regionWhere },
    include: { region: { include: { state: true } } },
    orderBy: [{ region: { name: "asc" } }, { name: "asc" }],
    take: 500,
  });

  // Filter to only items at or below threshold
  const filtered = lowStockItems.filter((c) => c.quantityOnHand <= c.minimumThreshold);

  const { region: focusRegion } = await searchParams;
  return <LowStockClient items={JSON.parse(JSON.stringify(filtered))} focusRegionId={focusRegion} />;
}
