import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdminOrManager } from "@/lib/permissions";
import { detectAnomalies } from "@/lib/anomaly-detection";
import AnomaliesClient from "./anomalies-client";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Anomaly Alerts",
  description: "AI-detected anomalies across stock, assets, staff, and procurement",
};

export default async function AnomaliesPage() {
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) redirect("/dashboard");

  const organizationId = session.user.organizationId!;
  const anomalies = await detectAnomalies(organizationId);

  return <AnomaliesClient anomalies={JSON.parse(JSON.stringify(anomalies))} />;
}
