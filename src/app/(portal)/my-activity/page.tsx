import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { MyActivityClient } from "./my-activity-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recent Activity",
  description: "View your recent activity",
};

export const dynamic = "force-dynamic";

export default async function MyActivityPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [recentAssets, recentConsumables, recentRequests] = await Promise.all([
    db.assetAssignment.findMany({
      where: { userId: session.user.id },
      include: { asset: true },
      orderBy: { checkoutDate: "desc" },
      take: 20,
    }),
    db.consumableAssignment.findMany({
      where: { userId: session.user.id },
      include: { consumable: true },
      orderBy: { assignedDate: "desc" },
      take: 20,
    }),
    db.consumableRequest.findMany({
      where: { userId: session.user.id },
      include: { consumable: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <MyActivityClient
      recentAssets={JSON.parse(JSON.stringify(recentAssets))}
      recentConsumables={JSON.parse(JSON.stringify(recentConsumables))}
      recentRequests={JSON.parse(JSON.stringify(recentRequests))}
    />
  );
}
