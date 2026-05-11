import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ReportDamageClient } from "./report-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Report Damage",
  description: "Submit a damage or loss report",
};

export default async function ReportDamagePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const assignments = await db.assetAssignment.findMany({
    where: { userId: session.user.id, isActive: true },
    include: { asset: true },
    orderBy: { asset: { name: "asc" } },
  });

  return (
    <ReportDamageClient
      assignments={JSON.parse(JSON.stringify(assignments))}
    />
  );
}
