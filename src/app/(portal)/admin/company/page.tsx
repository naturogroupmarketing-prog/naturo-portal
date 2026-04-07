import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/permissions";
import { db } from "@/lib/db";
import { CompanyClient } from "./company-client";

export const dynamic = "force-dynamic";

export default async function CompanyPage() {
  const session = await auth();
  if (!session?.user || !isSuperAdmin(session.user.role)) redirect("/dashboard");

  const org = await db.organization.findUnique({
    where: { id: session.user.organizationId! },
    select: {
      id: true,
      name: true,
      logo: true,
      phone: true,
      email: true,
      address: true,
      website: true,
      abn: true,
    },
  });

  if (!org) redirect("/dashboard");

  return <CompanyClient org={JSON.parse(JSON.stringify(org))} />;
}
