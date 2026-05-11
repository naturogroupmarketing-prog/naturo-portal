import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/permissions";
import { getLocations } from "@/app/actions/locations";
import { LocationsClient } from "./locations-client";

export default async function LocationsPage() {
  const session = await auth();
  if (!session?.user || !isSuperAdmin(session.user.role)) redirect("/dashboard");

  const locations = await getLocations();

  return <LocationsClient locations={JSON.parse(JSON.stringify(locations))} />;
}
