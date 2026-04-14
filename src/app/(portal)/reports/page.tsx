import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdminOrManager } from "@/lib/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { ReportsClient } from "./reports-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reports",
  description: "Export data as CSV or printable reports",
};

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) redirect("/login");

  return <ReportsClient isSuperAdmin={session.user.role === "SUPER_ADMIN"} />;
}
