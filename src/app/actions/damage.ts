"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { notifyAdminsAndManagers } from "@/lib/notifications";
import { revalidatePath } from "next/cache";

export async function reportDamage(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const assetId = formData.get("assetId") as string;
  const type = formData.get("type") as string; // "DAMAGE" or "LOSS"
  const description = formData.get("description") as string;
  const photoUrl = formData.get("photoUrl") as string;

  // Verify the asset is currently assigned to this staff member
  const assignment = await db.assetAssignment.findFirst({
    where: { assetId, userId: session.user.id, isActive: true },
    include: { asset: true },
  });

  if (!assignment && session.user.role === "STAFF") {
    throw new Error("Asset is not assigned to you");
  }

  const asset = assignment?.asset || await db.asset.findUnique({ where: { id: assetId } });
  if (!asset) throw new Error("Asset not found");

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  const report = await db.damageReport.create({
    data: {
      assetId,
      reportedById: session.user.id,
      organizationId,
      type,
      description,
      photoUrl: photoUrl || null,
    },
  });

  // Mark asset as damaged or lost
  if (type === "LOSS") {
    await db.asset.update({
      where: { id: assetId },
      data: { status: "LOST" },
    });
  } else {
    await db.asset.update({
      where: { id: assetId },
      data: { status: "DAMAGED" },
    });
  }

  // Deactivate active assignment — asset is no longer usable
  await db.assetAssignment.updateMany({
    where: { assetId: asset.id, isActive: true },
    data: { isActive: false, actualReturnDate: new Date() },
  });

  await createAuditLog({
    action: type === "LOSS" ? "LOSS_REPORTED" : "DAMAGE_REPORTED",
    description: `${type === "LOSS" ? "Loss" : "Damage"} reported for asset "${asset.name}" (${asset.assetCode}): ${description}`,
    performedById: session.user.id,
    assetId,
    organizationId,
    metadata: { type, description, photoUrl },
  });

  // Notify admins and managers
  await notifyAdminsAndManagers({
    organizationId,
    regionId: asset.regionId,
    type: "DAMAGE_REPORT",
    title: `${type === "LOSS" ? "Loss" : "Damage"} Reported: ${asset.name}`,
    message: `${session.user.name || session.user.email} reported ${type === "LOSS" ? "a loss" : "damage"} for ${asset.assetCode}: ${description}`,
    link: "/assets",
  });

  revalidatePath("/my-assets");
  revalidatePath("/assets");
  revalidatePath("/dashboard");
  revalidatePath("/inventory");
  return { success: true, reportId: report.id };
}

/**
 * Resolve a damage report — mark as resolved with resolution type and notes
 */
export async function resolveDamageReport(data: {
  reportId: string;
  resolution: string; // "REPAIRED" | "REPLACED" | "WRITTEN_OFF" | "INSURANCE_CLAIM"
  notes?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization");

  const report = await db.damageReport.findUnique({
    where: { id: data.reportId },
    include: { asset: true },
  });
  if (!report || report.organizationId !== organizationId) throw new Error("Not found");
  if (report.isResolved) throw new Error("Already resolved");

  await db.damageReport.update({
    where: { id: data.reportId },
    data: {
      isResolved: true,
      resolvedAt: new Date(),
      resolvedById: session.user.id,
      resolution: data.resolution,
      resolutionNotes: data.notes || null,
    },
  });

  // If repaired or replaced, set asset back to AVAILABLE
  if ((data.resolution === "REPAIRED" || data.resolution === "REPLACED") && report.assetId) {
    await db.asset.update({
      where: { id: report.assetId },
      data: { status: "AVAILABLE" },
    });
  }

  await createAuditLog({
    action: "ASSET_UPDATED",
    description: `Damage report resolved: ${report.asset?.name || "Unknown"} — ${data.resolution}${data.notes ? ` (${data.notes})` : ""}`,
    performedById: session.user.id,
    assetId: report.assetId || undefined,
    organizationId,
  });

  revalidatePath("/assets");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return { success: true };
}
