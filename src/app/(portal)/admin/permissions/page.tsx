import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PermissionsClient } from "./permissions-client";

export default async function PermissionsPage() {
  const session = await auth();
  if (!session?.user || !isSuperAdmin(session.user.role)) redirect("/dashboard");

  const organizationId = session.user.organizationId!;

  const managers = await db.user.findMany({
    where: { role: "BRANCH_MANAGER", isActive: true, organizationId },
    include: {
      permissions: true,
      region: { include: { state: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <PermissionsClient
      managers={JSON.parse(JSON.stringify(managers))}
    />
  );
}
