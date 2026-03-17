import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { MyRequestsClient } from "./my-requests-client";

export const dynamic = "force-dynamic";

export default async function MyRequestsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const requests = await db.consumableRequest.findMany({
    where: { userId: session.user.id, status: { not: "CLOSED" } },
    include: {
      consumable: {
        include: { region: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <MyRequestsClient
      requests={JSON.parse(JSON.stringify(requests))}
    />
  );
}
