import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdminOrManager, isSuperAdmin } from "@/lib/permissions";
import { getConditionChecksForReview, getInspectionConfig, getInspectionSchedules, getStaffSchedules } from "@/app/actions/condition-checks";
import { db } from "@/lib/db";
import { ConditionChecksClient } from "./condition-checks-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inspections",
  description: "Conduct and review asset condition checks",
};

export const dynamic = "force-dynamic";

export default async function ConditionChecksPage() {
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) redirect("/dashboard");

  const organizationId = session.user.organizationId;
  if (!organizationId) redirect("/dashboard");

  const result = await getConditionChecksForReview();

  // Get regions and config for super admin
  const isAdmin = isSuperAdmin(session.user.role);
  const [regions, inspectionConfig, schedules, staffScheduleData] = await Promise.all([
    isAdmin
      ? db.region.findMany({
          where: { state: { organizationId } },
          include: { state: true },
          orderBy: { name: "asc" },
        })
      : [],
    isAdmin ? getInspectionConfig() : [],
    isAdmin ? getInspectionSchedules() : [],
    isAdmin ? getStaffSchedules() : null,
  ]);

  return (
    <ConditionChecksClient
      checks={JSON.parse(JSON.stringify(result.checks))}
      staffStatus={result.staffStatus}
      monthYear={result.monthYear}
      regions={JSON.parse(JSON.stringify(regions))}
      isSuperAdmin={isAdmin}
      inspectionConfig={JSON.parse(JSON.stringify(inspectionConfig))}
      schedules={JSON.parse(JSON.stringify(schedules))}
      staffSchedules={staffScheduleData?.schedules || []}
      unscheduledStaff={staffScheduleData?.unscheduledStaff || []}
    />
  );
}
