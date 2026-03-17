import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/permissions";
import { db } from "@/lib/db";
import { ImportClient } from "./import-client";

export default async function AdminImportPage() {
  const session = await auth();
  if (!session?.user || !isSuperAdmin(session.user.role)) redirect("/dashboard");

  const organizationId = session.user.organizationId!;

  const regions = await db.region.findMany({
    where: { organizationId },
    include: { state: true },
    orderBy: { name: "asc" },
  });

  return (
    <ImportClient regions={JSON.parse(JSON.stringify(regions))} />
  );
}
