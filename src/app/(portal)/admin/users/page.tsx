import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/permissions";
import { db } from "@/lib/db";
import { UsersClient } from "./users-client";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user || !isSuperAdmin(session.user.role)) redirect("/dashboard");

  const organizationId = session.user.organizationId!;

  const [users, regions] = await Promise.all([
    db.user.findMany({
      where: { organizationId },
      include: { region: { include: { state: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.region.findMany({
      where: { organizationId },
      include: { state: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <UsersClient
      users={JSON.parse(JSON.stringify(users))}
      regions={JSON.parse(JSON.stringify(regions))}
    />
  );
}
