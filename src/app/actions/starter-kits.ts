"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { notifyAdminsAndManagers } from "@/lib/notifications";
import { revalidatePath } from "next/cache";

export async function getStarterKits() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");
  const organizationId = session.user.organizationId;
  if (!organizationId) return [];

  return db.starterKit.findMany({
    where: { organizationId },
    include: { items: true },
    orderBy: { name: "asc" },
  });
}

export async function createStarterKit(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");
  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization");

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const isDefault = formData.get("isDefault") === "true";

  if (!name) throw new Error("Name is required");

  // If setting as default, unset any existing defaults
  if (isDefault) {
    await db.starterKit.updateMany({
      where: { organizationId, isDefault: true },
      data: { isDefault: false },
    });
  }

  await db.starterKit.create({
    data: { organizationId, name, description, isDefault },
  });

  revalidatePath("/staff");
  revalidatePath("/starter-kits");
  return { success: true };
}

export async function updateStarterKit(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");
  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization");

  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const isDefault = formData.get("isDefault") === "true";

  if (isDefault) {
    await db.starterKit.updateMany({
      where: { organizationId, isDefault: true, id: { not: id } },
      data: { isDefault: false },
    });
  }

  await db.starterKit.update({
    where: { id },
    data: { name, description, isDefault },
  });

  revalidatePath("/staff");
  revalidatePath("/starter-kits");
  return { success: true };
}

export async function deleteStarterKit(id: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

  await db.starterKit.delete({ where: { id } });

  revalidatePath("/staff");
  revalidatePath("/starter-kits");
  return { success: true };
}

export async function addStarterKitItem(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

  const starterKitId = formData.get("starterKitId") as string;
  const itemType = formData.get("itemType") as string;
  const category = (formData.get("category") as string)?.trim() || null;
  const consumableId = (formData.get("consumableId") as string) || null;
  const quantity = parseInt(formData.get("quantity") as string) || 1;

  await db.starterKitItem.create({
    data: { starterKitId, itemType, category, consumableId, quantity },
  });

  revalidatePath("/staff");
  revalidatePath("/starter-kits");
  return { success: true };
}

export async function removeStarterKitItem(itemId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

  await db.starterKitItem.delete({ where: { id: itemId } });

  revalidatePath("/staff");
  revalidatePath("/starter-kits");
  return { success: true };
}

/**
 * Apply a starter kit to a user — assigns available assets and deducts consumables
 */
export async function applyStarterKit(userId: string, starterKitId?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization");

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  // Find the kit to apply
  let kit;
  if (starterKitId) {
    kit = await db.starterKit.findUnique({
      where: { id: starterKitId },
      include: { items: true },
    });
  } else {
    // Find the default kit
    kit = await db.starterKit.findFirst({
      where: { organizationId, isDefault: true },
      include: { items: true },
    });
  }

  if (!kit || kit.items.length === 0) return { success: true, applied: 0 };

  // Create application record first so we can link assignments
  const application = await db.starterKitApplication.create({
    data: {
      starterKitId: kit.id,
      userId,
      appliedById: session.user.id,
      results: "[]",
    },
  });

  let appliedCount = 0;
  const results: string[] = [];

  for (const item of kit.items) {
    if (item.itemType === "ASSET_CATEGORY" && item.category) {
      // Find an available asset in this category — prefer user's region, then any region
      let availableAsset = null;
      if (user.regionId) {
        availableAsset = await db.asset.findFirst({
          where: {
            category: item.category,
            regionId: user.regionId,
            organizationId,
            status: "AVAILABLE",
          },
          orderBy: { createdAt: "asc" },
        });
      }

      // If none in user's region (or no region), search all regions
      if (!availableAsset) {
        availableAsset = await db.asset.findFirst({
          where: {
            category: item.category,
            organizationId,
            status: "AVAILABLE",
          },
          orderBy: { createdAt: "asc" },
        });
      }

      if (availableAsset) {
        // Assign the asset — pending acknowledgment
        await db.$transaction(async (tx) => {
          await tx.asset.update({
            where: { id: availableAsset.id },
            data: { status: "ASSIGNED" },
          });
          await tx.assetAssignment.create({
            data: {
              assetId: availableAsset.id,
              userId,
              assignmentType: "PERMANENT",
              checkoutDate: new Date(),
              starterKitApplicationId: application.id,
              // acknowledgedAt left null — pending confirmation
            },
          });
        });
        results.push(`Assigned ${availableAsset.name} (${availableAsset.assetCode})`);
        appliedCount++;
      } else {
        results.push(`No available ${item.category} asset found`);
      }
    } else if (item.itemType === "CONSUMABLE" && item.consumableId) {
      // Assign consumable
      const consumable = await db.consumable.findUnique({
        where: { id: item.consumableId },
      });

      if (consumable && consumable.quantityOnHand >= item.quantity) {
        await db.$transaction(async (tx) => {
          await tx.consumable.update({
            where: { id: item.consumableId! },
            data: { quantityOnHand: { decrement: item.quantity } },
          });
          await tx.consumableAssignment.create({
            data: {
              consumableId: item.consumableId!,
              userId,
              quantity: item.quantity,
              starterKitApplicationId: application.id,
              // acknowledgedAt left null — pending confirmation
            },
          });
        });
        results.push(`Assigned ${item.quantity}x ${consumable.name}`);
        appliedCount++;
      } else {
        results.push(`Insufficient stock for ${consumable?.name || "consumable"}`);
      }
    }
  }

  // Update application with results
  await db.starterKitApplication.update({
    where: { id: application.id },
    data: { results: JSON.stringify(results) },
  });

  // Audit log
  await createAuditLog({
    action: "USER_UPDATED",
    description: `Starter kit "${kit.name}" applied to ${user.name || user.email}: ${results.join(", ")}`,
    performedById: session.user.id,
    targetUserId: userId,
    organizationId,
    metadata: { starterKitId: kit.id, results },
  });

  // Notify the user to acknowledge receipt
  await db.notification.create({
    data: {
      userId,
      type: "GENERAL",
      title: "Equipment Assigned — Please Acknowledge",
      message: `You've been assigned a starter kit "${kit.name}". Please review and confirm receipt.`,
      link: "/my-assets",
    },
  });

  revalidatePath("/staff");
  revalidatePath("/assets");
  revalidatePath("/consumables");
  revalidatePath("/dashboard");
  return { success: true, applied: appliedCount, results, applicationId: application.id };
}

/**
 * Staff acknowledges receipt of an individual asset assignment
 */
export async function acknowledgeAssetItem(assignmentId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const assignment = await db.assetAssignment.findUnique({
    where: { id: assignmentId },
  });

  if (!assignment || assignment.userId !== session.user.id) {
    throw new Error("Not found");
  }

  await db.assetAssignment.update({
    where: { id: assignmentId },
    data: { acknowledgedAt: new Date() },
  });

  // Check if all items in this application are now acknowledged
  if (assignment.starterKitApplicationId) {
    await checkApplicationComplete(assignment.starterKitApplicationId);
  }

  revalidatePath("/my-assets");
  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Staff acknowledges receipt of an individual consumable assignment
 */
export async function acknowledgeConsumableItem(assignmentId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const assignment = await db.consumableAssignment.findUnique({
    where: { id: assignmentId },
  });

  if (!assignment || assignment.userId !== session.user.id) {
    throw new Error("Not found");
  }

  await db.consumableAssignment.update({
    where: { id: assignmentId },
    data: { acknowledgedAt: new Date() },
  });

  // Check if all items in this application are now acknowledged
  if (assignment.starterKitApplicationId) {
    await checkApplicationComplete(assignment.starterKitApplicationId);
  }

  revalidatePath("/my-consumables");
  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Check if all items in a starter kit application have been acknowledged
 */
async function checkApplicationComplete(applicationId: string) {
  const [unackedAssets, unackedConsumables] = await Promise.all([
    db.assetAssignment.count({
      where: { starterKitApplicationId: applicationId, acknowledgedAt: null, isActive: true },
    }),
    db.consumableAssignment.count({
      where: { starterKitApplicationId: applicationId, acknowledgedAt: null, isActive: true },
    }),
  ]);

  if (unackedAssets === 0 && unackedConsumables === 0) {
    await db.starterKitApplication.update({
      where: { id: applicationId },
      data: { acknowledged: true, acknowledgedAt: new Date() },
    });
  }
}

/**
 * Staff marks a kit asset item as not received — just removes assignment, no stock changes
 * The item was never physically given, so nothing to return or deduct.
 * Manager is notified to investigate.
 */
export async function rejectKitAssetItem(assignmentId: string, reason: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const assignment = await db.assetAssignment.findUnique({
    where: { id: assignmentId },
    include: { asset: true },
  });

  if (!assignment || assignment.userId !== session.user.id) {
    throw new Error("Not found");
  }

  await db.$transaction(async (tx) => {
    // Deactivate the assignment — staff never had the item
    await tx.assetAssignment.update({
      where: { id: assignmentId },
      data: { isActive: false, acknowledgedAt: new Date(), actualReturnDate: new Date() },
    });

    // Return asset to AVAILABLE — it was never given out
    await tx.asset.update({
      where: { id: assignment.assetId },
      data: { status: "AVAILABLE" },
    });
  });

  // Check if application is complete
  if (assignment.starterKitApplicationId) {
    await checkApplicationComplete(assignment.starterKitApplicationId);
  }

  // Notify managers to investigate
  await notifyAdminsAndManagers({
    organizationId: assignment.asset.organizationId,
    regionId: assignment.asset.regionId,
    type: "ASSET_RETURNED",
    title: "Kit Item Not Received",
    message: `${session.user.name || session.user.email} reports they did not receive "${assignment.asset.name}" (${assignment.asset.assetCode}). Reason: ${reason}. Asset returned to available — no stock changes made.`,
    link: "/assets",
  });

  revalidatePath("/my-assets");
  revalidatePath("/dashboard");
  revalidatePath("/assets");
  return { success: true };
}

/**
 * Staff marks a kit consumable item as not received — just removes assignment, no stock changes
 * The item was never physically given, so nothing to return or deduct.
 */
export async function rejectKitConsumableItem(assignmentId: string, reason: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const assignment = await db.consumableAssignment.findUnique({
    where: { id: assignmentId },
    include: { consumable: true },
  });

  if (!assignment || assignment.userId !== session.user.id) {
    throw new Error("Not found");
  }

  await db.$transaction(async (tx) => {
    // Deactivate the assignment — staff never had the item
    await tx.consumableAssignment.update({
      where: { id: assignmentId },
      data: { isActive: false, acknowledgedAt: new Date() },
    });

    // Restock — the consumable was deducted but never given
    await tx.consumable.update({
      where: { id: assignment.consumableId },
      data: { quantityOnHand: { increment: assignment.quantity } },
    });
  });

  // Check if application is complete
  if (assignment.starterKitApplicationId) {
    await checkApplicationComplete(assignment.starterKitApplicationId);
  }

  // Notify managers to investigate
  await notifyAdminsAndManagers({
    organizationId: assignment.consumable.organizationId,
    regionId: assignment.consumable.regionId,
    type: "ASSET_RETURNED",
    title: "Kit Item Not Received",
    message: `${session.user.name || session.user.email} reports they did not receive ${assignment.quantity}x "${assignment.consumable.name}". Reason: ${reason}. Stock has been returned — no further action needed.`,
    link: "/consumables",
  });

  revalidatePath("/my-consumables");
  revalidatePath("/dashboard");
  revalidatePath("/consumables");
  return { success: true };
}
