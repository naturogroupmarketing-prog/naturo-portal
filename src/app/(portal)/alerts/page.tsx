import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdminOrManager } from "@/lib/permissions";
import { db } from "@/lib/db";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Alerts",
  description: "View alerts for low stock, damages, and overdue items",
};

export default async function AlertsPage() {
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) redirect("/dashboard");

  const organizationId = session.user.organizationId!;
  const regionWhere =
    session.user.role === "BRANCH_MANAGER" && session.user.regionId
      ? { regionId: session.user.regionId }
      : {};

  const [damageCount, lostCount, lowStockItems] = await Promise.all([
    db.damageReport.count({
      where: {
        organizationId,
        isResolved: false,
        ...(session.user.role === "BRANCH_MANAGER" && session.user.regionId
          ? { asset: { regionId: session.user.regionId } }
          : {}),
      },
    }),
    db.asset.count({
      where: { organizationId, status: "LOST", ...regionWhere },
    }),
    db.consumable.findMany({
      where: { organizationId, isActive: true, ...regionWhere },
      select: { quantityOnHand: true, minimumThreshold: true },
    }),
  ]);

  const lowStockCount = lowStockItems.filter(
    (c) => c.quantityOnHand <= c.minimumThreshold
  ).length;

  const cards = [
    {
      title: "Damage Reports",
      description: "Unresolved damage reports requiring attention",
      href: "/alerts/damage",
      count: damageCount,
    },
    {
      title: "Lost Items",
      description: "Assets reported as lost and unresolved",
      href: "/alerts/lost",
      count: lostCount,
    },
    {
      title: "Low Stock",
      description: "Supplies below their minimum threshold",
      href: "/alerts/low-stock",
      count: lowStockCount,
    },
    {
      title: "Anomalies",
      description: "AI-detected unusual patterns in stock and asset activity",
      href: "/alerts/anomalies",
      count: 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-shark-900 dark:text-shark-100">
          Alerts
        </h1>
        <p className="mt-1 text-sm text-shark-500 dark:text-shark-400">
          Monitor damage reports, lost items, and low stock levels across your
          organization.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="cursor-pointer h-full">
              <CardContent className="flex flex-col items-start gap-4">
                <div
                  className={`flex items-center justify-center h-10 w-10 rounded-[28px] ${
                    card.count > 0
                      ? "bg-[#E8532E]/10 text-[#E8532E]"
                      : "bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20 dark:text-emerald-400"
                  }`}
                >
                  <Icon name="alert-triangle" size={20} />
                </div>

                <div className="space-y-1">
                  <h2 className="text-base font-semibold text-shark-900 dark:text-shark-100">
                    {card.title}
                  </h2>
                  <p className="text-sm text-shark-500 dark:text-shark-400">
                    {card.description}
                  </p>
                </div>

                <div className="mt-auto pt-2">
                  <span
                    className={`text-3xl font-bold ${
                      card.count > 0
                        ? "text-[#E8532E]"
                        : "text-emerald-500 dark:text-emerald-400"
                    }`}
                  >
                    {card.count}
                  </span>
                  <span className="ml-2 text-sm text-shark-400 dark:text-shark-500 dark:text-shark-400">
                    {card.count === 1 ? "item" : "items"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
