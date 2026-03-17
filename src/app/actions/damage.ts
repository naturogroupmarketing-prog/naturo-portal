"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
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

  await createAuditLog({
    action: type === "LOSS" ? "LOSS_REPORTED" : "DAMAGE_REPORTED",
    description: `${type === "LOSS" ? "Loss" : "Damage"} reported for asset "${asset.name}" (${asset.assetCode}): ${description}`,
    performedById: session.user.id,
    assetId,
    organizationId,
    metadata: { type, description, photoUrl },
  });

  revalidatePath("/my-assets");
  revalidatePath("/assets");
  revalidatePath("/dashboard");
  return { success: true, reportId: report.id };
}
