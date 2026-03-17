"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { isAdminOrManager, canManageRegion, hasPermission } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit";
import { generateAssetCode } from "@/lib/utils";
import { buildAssetQRData, generateQRCodeDataURL } from "@/lib/qr";
import { sendEmail, emailAssetAssigned, emailAssetReturned } from "@/lib/email";
import { revalidatePath } from "next/cache";
import { AssetStatus, AssignmentType } from "@/generated/prisma/client";
import { enforceAssetLimit } from "@/lib/tenant";

export async function createAsset(formData: FormData) {
  const session = await auth();
  if (!session?.user || !(await hasPermission(session.user.id, session.user.role, "assetAdd"))) {
    throw new Error("Unauthorized");
  }

  const name = (formData.get("name") as string)?.trim();
  const category = (formData.get("category") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const serialNumber = (formData.get("serialNumber") as string)?.trim();
  const regionId = formData.get("regionId") as string;
  const isHighValue = formData.get("isHighValue") === "true";
  const purchaseDate = formData.get("purchaseDate") as string;
  const purchaseCost = formData.get("purchaseCost") as string;
  const supplier = (formData.get("supplier") as string)?.trim();
  const notes = (formData.get("notes") as string)?.trim();
  const imageUrl = formData.get("imageUrl") as string;

  // Verify region access
  if (!canManageRegion(session.user.role, session.user.regionId, regionId)) {
    throw new Error("Cannot manage this region");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  await enforceAssetLimit(organizationId);

  const assetCode = generateAssetCode();
  const qrCodeData = await generateQRCodeDataURL(buildAssetQRData(assetCode));

  const asset = await db.asset.create({
    data: {
      assetCode,
      name,
      category,
      description: description || null,
      serialNumber: serialNumber || null,
      imageUrl: imageUrl || null,
      qrCodeData,
      regionId,
      organizationId,
      isHighValue,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      purchaseCost: purchaseCost ? parseFloat(purchaseCost) : null,
      supplier: supplier || null,
      notes: notes || null,
    },
  });

  await createAuditLog({
    action: "ASSET_CREATED",
    description: `Asset "${name}" (${assetCode}) created`,
    performedById: session.user.id,
    assetId: asset.id,
    organizationId,
  });

  revalidatePath("/assets");
  return { success: true, assetId: asset.id };
}

export async function assignAsset(formData: FormData) {
  const session = await auth();
  if (!session?.user || !(await hasPermission(session.user.id, session.user.role, "assetEdit"))) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  const assetId = formData.get("assetId") as string;
  const userId = formData.get("userId") as string;
  const assignmentType = formData.get("assignmentType") as AssignmentType;
  const expectedReturnDate = formData.get("expectedReturnDate") as string;

  const asset = await db.asset.findUnique({
    where: { id: assetId },
  });
  if (!asset) throw new Error("Asset not found");
  if (asset.organizationId !== organizationId) throw new Error("Asset not found");
  if (asset.status !== "AVAILABLE") throw new Error("Asset is not available");

  if (!canManageRegion(session.user.role, session.user.regionId, asset.regionId)) {
    throw new Error("Cannot manage this region");
  }

  const targetUser = await db.user.findUnique({ where: { id: userId } });
  if (!targetUser) throw new Error("User not found");

  const newStatus: AssetStatus = assignmentType === "PERMANENT" ? "ASSIGNED" : "CHECKED_OUT";

  await db.$transaction([
    db.asset.update({
      where: { id: assetId },
      data: { status: newStatus },
    }),
    db.assetAssignment.create({
      data: {
        assetId,
        userId,
        assignmentType,
        expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
      },
    }),
  ]);

  await createAuditLog({
    action: assignmentType === "PERMANENT" ? "ASSET_ASSIGNED" : "ASSET_CHECKED_OUT",
    description: `Asset "${asset.name}" (${asset.assetCode}) ${assignmentType.toLowerCase()} to ${targetUser.name || targetUser.email}`,
    performedById: session.user.id,
    targetUserId: userId,
    assetId,
    organizationId,
  });

  if (targetUser.email) {
    const returnDateStr = expectedReturnDate
      ? new Date(expectedReturnDate).toLocaleDateString("en-AU")
      : undefined;
    await sendEmail({
      to: targetUser.email,
      subject: `Asset Assigned: ${asset.name}`,
      html: emailAssetAssigned(
        targetUser.name || "Team Member",
        asset.name,
        asset.assetCode,
        assignmentType,
        returnDateStr
      ),
    });
  }

  revalidatePath("/assets");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function returnAsset(formData: FormData) {
  const session = await auth();
  if (!session?.user || !(await hasPermission(session.user.id, session.user.role, "assetEdit"))) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  const assignmentId = formData.get("assignmentId") as string;
  const returnCondition = formData.get("returnCondition") as string;
  const returnNotes = formData.get("returnNotes") as string;
  const isDamaged = formData.get("isDamaged") === "true";

  const assignment = await db.assetAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      asset: true,
      user: true,
    },
  });
  if (!assignment || !assignment.isActive) throw new Error("Assignment not found or already returned");
  if (assignment.asset.organizationId !== organizationId) throw new Error("Asset not found");

  if (!canManageRegion(session.user.role, session.user.regionId, assignment.asset.regionId)) {
    throw new Error("Cannot manage this region");
  }

  const newStatus: AssetStatus = isDamaged ? "DAMAGED" : "AVAILABLE";

  await db.$transaction([
    db.assetAssignment.update({
      where: { id: assignmentId },
      data: {
        isActive: false,
        actualReturnDate: new Date(),
        returnCondition,
        returnNotes: returnNotes || null,
      },
    }),
    db.asset.update({
      where: { id: assignment.assetId },
      data: { status: newStatus },
    }),
  ]);

  await createAuditLog({
    action: "ASSET_RETURNED",
    description: `Asset "${assignment.asset.name}" (${assignment.asset.assetCode}) returned by ${assignment.user.name || assignment.user.email}. Condition: ${returnCondition}${isDamaged ? " (DAMAGED)" : ""}`,
    performedById: session.user.id,
    targetUserId: assignment.userId,
    assetId: assignment.assetId,
    organizationId,
    metadata: { returnCondition, isDamaged, returnNotes },
  });

  if (assignment.user.email) {
    await sendEmail({
      to: assignment.user.email,
      subject: `Asset Returned: ${assignment.asset.name}`,
      html: emailAssetReturned(
        assignment.user.name || "Team Member",
        assignment.asset.name,
        assignment.asset.assetCode
      ),
    });
  }

  revalidatePath("/assets");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function acknowledgeAsset(assignmentId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "STAFF") {
    throw new Error("Unauthorized");
  }

  const assignment = await db.assetAssignment.findUnique({
    where: { id: assignmentId },
    include: { asset: true },
  });

  if (!assignment || !assignment.isActive) {
    throw new Error("Assignment not found or inactive");
  }
  if (assignment.userId !== session.user.id) {
    throw new Error("This assignment does not belong to you");
  }
  if (assignment.acknowledgedAt) {
    throw new Error("Already acknowledged");
  }

  await db.assetAssignment.update({
    where: { id: assignmentId },
    data: { acknowledgedAt: new Date() },
  });

  await createAuditLog({
    action: "ASSET_ACKNOWLEDGED",
    description: `Asset "${assignment.asset.name}" (${assignment.asset.assetCode}) receipt confirmed by ${session.user.name || session.user.email}`,
    performedById: session.user.id,
    assetId: assignment.assetId,
    organizationId: session.user.organizationId || undefined,
  });

  revalidatePath("/my-assets");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteAsset(formData: FormData) {
  const session = await auth();
  if (!session?.user || !(await hasPermission(session.user.id, session.user.role, "assetDelete"))) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  const assetId = formData.get("assetId") as string;

  const asset = await db.asset.findUnique({
    where: { id: assetId },
    include: { assignments: { where: { isActive: true } } },
  });
  if (!asset) throw new Error("Asset not found");
  if (asset.organizationId !== organizationId) throw new Error("Asset not found");

  if (!canManageRegion(session.user.role, session.user.regionId, asset.regionId)) {
    throw new Error("Cannot manage this region");
  }

  if (asset.assignments.length > 0) {
    throw new Error("Cannot delete asset with active assignments. Return it first.");
  }

  // Delete related records first, then the asset
  await db.$transaction([
    db.auditLog.deleteMany({ where: { assetId } }),
    db.assetAssignment.deleteMany({ where: { assetId } }),
    db.damageReport.deleteMany({ where: { assetId } }),
    db.assetPhoto.deleteMany({ where: { assetId } }),
    db.asset.delete({ where: { id: assetId } }),
  ]);

  revalidatePath("/assets");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function bulkDeleteAssets(assetIds: string[]) {
  const session = await auth();
  if (!session?.user || !(await hasPermission(session.user.id, session.user.role, "assetDelete"))) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  let deleted = 0;
  const errors: string[] = [];

  for (const assetId of assetIds) {
    const asset = await db.asset.findUnique({
      where: { id: assetId },
      include: { assignments: { where: { isActive: true } } },
    });

    if (!asset) {
      errors.push(`Asset not found`);
      continue;
    }

    if (asset.organizationId !== organizationId) {
      errors.push(`Asset not found`);
      continue;
    }

    if (!canManageRegion(session.user.role, session.user.regionId, asset.regionId)) {
      errors.push(`No permission for: ${asset.name}`);
      continue;
    }

    if (asset.assignments.length > 0) {
      errors.push(`${asset.name} has active assignments`);
      continue;
    }

    await db.$transaction([
      db.auditLog.deleteMany({ where: { assetId } }),
      db.assetAssignment.deleteMany({ where: { assetId } }),
      db.damageReport.deleteMany({ where: { assetId } }),
      db.assetPhoto.deleteMany({ where: { assetId } }),
      db.asset.delete({ where: { id: assetId } }),
    ]);

    deleted++;
  }

  revalidatePath("/assets");
  revalidatePath("/dashboard");
  return { deleted, errors };
}

export async function updateAsset(formData: FormData) {
  const session = await auth();
  if (!session?.user || !(await hasPermission(session.user.id, session.user.role, "assetEdit"))) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  const assetId = formData.get("assetId") as string;
  const name = (formData.get("name") as string)?.trim();
  const category = (formData.get("category") as string)?.trim();
  const regionId = formData.get("regionId") as string;
  const serialNumber = (formData.get("serialNumber") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const purchaseDate = formData.get("purchaseDate") as string;
  const purchaseCost = formData.get("purchaseCost") as string;
  const supplier = (formData.get("supplier") as string)?.trim();
  const isHighValue = formData.get("isHighValue") === "true";
  const notes = (formData.get("notes") as string)?.trim();
  const status = formData.get("status") as AssetStatus;
  const imageUrl = formData.get("imageUrl") as string | null;

  const asset = await db.asset.findUnique({ where: { id: assetId } });
  if (!asset) throw new Error("Asset not found");
  if (asset.organizationId !== organizationId) throw new Error("Asset not found");

  if (!canManageRegion(session.user.role, session.user.regionId, asset.regionId)) {
    throw new Error("Cannot manage this region");
  }

  // If moving to a new region, verify access to that region too
  if (regionId !== asset.regionId) {
    if (!canManageRegion(session.user.role, session.user.regionId, regionId)) {
      throw new Error("Cannot manage target region");
    }
  }

  const updateData: Record<string, unknown> = {
    name,
    category,
    regionId,
    serialNumber: serialNumber || null,
    description: description || null,
    purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
    purchaseCost: purchaseCost ? parseFloat(purchaseCost) : null,
    supplier: supplier || null,
    isHighValue,
    notes: notes || null,
    status,
  };

  // Only update imageUrl if it was explicitly provided in the form
  if (formData.has("imageUrl")) {
    updateData.imageUrl = imageUrl || null;
  }

  const updated = await db.asset.update({
    where: { id: assetId },
    data: updateData,
  });

  await createAuditLog({
    action: "ASSET_UPDATED",
    description: `Asset "${updated.name}" (${updated.assetCode}) updated`,
    performedById: session.user.id,
    assetId,
    organizationId,
  });

  revalidatePath("/assets");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getAssets(regionId?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const where: Record<string, unknown> = {};
  where.organizationId = session.user.organizationId;

  if (session.user.role === "BRANCH_MANAGER") {
    where.regionId = session.user.regionId;
  } else if (session.user.role === "STAFF") {
    throw new Error("Staff cannot list all assets");
  }
  if (regionId) {
    where.regionId = regionId;
  }

  return db.asset.findMany({
    where,
    include: {
      region: { include: { state: true } },
      assignments: {
        where: { isActive: true },
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
