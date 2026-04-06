import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdminOrManager } from "@/lib/permissions";
import { getLocations } from "@/app/actions/locations";
import { InventoryListClient } from "./inventory-client";

export default async function InventoryPage() {
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) redirect("/dashboard");

  // Branch Manager → auto-redirect to their region
  if (session.user.role === "BRANCH_MANAGER" && session.user.regionId) {
    redirect(`/inventory/${session.user.regionId}`);
  }

  const locations = await getLocations();

  return (
    <InventoryListClient
      locations={JSON.parse(JSON.stringify(locations))}
      isSuperAdmin={session.user.role === "SUPER_ADMIN"}
    />
  );
}
