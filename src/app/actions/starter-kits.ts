"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit";
import { notifyAdminsAndManagers } from "@/lib/notifications";
import { revalidatePath } from "next/cache";

export async function getStarterKits() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!(await hasPermission(session.user.id, session.user.role, "starterKitsManage"))) throw new Error("Unauthorized");
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
  if (!session?.user) throw new Error("Unauthorized");
  if (!(await hasPermission(session.user.id, session.user.role, "starterKitsManage"))) throw new Error("Unauthorized");
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
  if (!session?.user) throw new Error("Unauthorized");
  if (!(await hasPermission(session.user.id, session.user.role, "starterKitsManage"))) throw new Error("Unauthorized");
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
  if (!session?.user) throw new Error("Unauthorized");
  if (!(await hasPermission(session.user.id, session.user.role, "starterKitsManage"))) throw new Error("Unauthorized");

  await db.starterKit.delete({ where: { id } });

  revalidatePath("/staff");
  revalidatePath("/starter-kits");
  return { success: true };
}

export async function addStarterKitItem(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!(await hasPermission(session.user.id, session.user.role, "starterKitsManage"))) throw new Error("Unauthorized");

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
  if (!session?.user) throw new Error("Unauthorized");
  if (!(await hasPermission(session.user.id, session.user.role, "starterKitsManage"))) throw new Error("Unauthorized");

  await db.starterKitItem.delete({ where: { id: itemId } });

  revalidatePath("/staff");
  revalidatePath("/starter-kits");
  return { success: true };
}

export async function updateStarterKitItemQuantity(itemId: string, quantity: number) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!(await hasPermission(session.user.id, session.user.role, "starterKitsManage"))) throw new Error("Unauthorized");

  if (quantity < 1) throw new Error("Quantity must be at least 1");

  await db.starterKitItem.update({
    where: { id: itemId },
    data: { quantity },
  });

  revalidatePath("/staff");
  revalidatePath("/starter-kits");
  return { success: true };
}

/**
 * Apply a starter kit to a user — assigns available assets and deducts consumables
 */
export async function applyStarterKit(userId: string, starterKitId?: string, excludedItemIds?: string[]) {
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

  const excludedSet = new Set(excludedItemIds || []);

  for (const item of kit.items) {
    // Skip excluded items
    if (excludedSet.has(item.id)) {
      results.push(`Skipped: ${item.itemType === "ASSET_CATEGORY" ? item.category : "consumable"} (deselected)`);
      continue;
    }

    if (item.itemType === "ASSET_CATEGORY" && item.category) {
      // Assign item.quantity assets from this category
      const alreadyAssignedIds: string[] = [];
      let assignedInCategory = 0;

      for (let q = 0; q < item.quantity; q++) {
        // Find an available asset in this category — restricted to user's region
        let availableAsset = null;
        if (user.regionId) {
          availableAsset = await db.asset.findFirst({
            where: {
              category: item.category,
              regionId: user.regionId,
              organizationId,
              status: "AVAILABLE",
              id: { notIn: alreadyAssignedIds },
            },
            orderBy: { createdAt: "asc" },
          });
        }

        if (availableAsset) {
          alreadyAssignedIds.push(availableAsset.id);
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
          assignedInCategory++;
          appliedCount++;
        } else {
          const remaining = item.quantity - assignedInCategory;
          results.push(`No available ${item.category} asset found (${remaining} of ${item.quantity} unfulfilled)`);
          break; // No more available assets in this category
        }
      }
    } else if (item.itemType === "CONSUMABLE" && item.consumableId) {
      // Assign consumable
      const consumable = await db.consumable.findUnique({
        where: { id: item.consumableId },
      });

      // Skip consumables not in user's region
      if (consumable && user.regionId && consumable.regionId !== user.regionId) {
        results.push(`Skipped ${consumable.name} (not in staff's region)`);
      } else if (consumable && consumable.quantityOnHand >= item.quantity) {
        // Don't deduct stock yet — only deduct when staff confirms receipt
        await db.consumableAssignment.create({
          data: {
            consumableId: item.consumableId!,
            userId,
            quantity: item.quantity,
            starterKitApplicationId: application.id,
            // acknowledgedAt left null — pending confirmation
            // Stock deducted in acknowledgeConsumableItem when staff confirms
          },
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

  // Deduct stock NOW — staff confirmed they received it
  await db.$transaction(async (tx) => {
    await tx.consumableAssignment.update({
      where: { id: assignmentId },
      data: { acknowledgedAt: new Date() },
    });

    // Only deduct if this is a starter kit item (stock wasn't deducted on apply)
    if (assignment.starterKitApplicationId) {
      await tx.consumable.update({
        where: { id: assignment.consumableId },
        data: { quantityOnHand: { decrement: assignment.quantity } },
      });
    }
  });

  // Check if all items in this application are now acknowledged
  if (assignment.starterKitApplicationId) {
    await checkApplicationComplete(assignment.starterKitApplicationId);
  }

  revalidatePath("/my-consumables");
  revalidatePath("/dashboard");
  revalidatePath("/consumables");
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

  // Notify managers — no return needed, just investigation
  await notifyAdminsAndManagers({
    organizationId: assignment.asset.organizationId,
    regionId: assignment.asset.regionId,
    type: "ASSET_RETURNED",
    title: "Kit Item Not Received",
    message: `${session.user.name || session.user.email} reports they did not receive "${assignment.asset.name}" (${assignment.asset.assetCode}). Reason: ${reason}. Asset has been returned to available.`,
    link: "/staff",
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

  // Deactivate the assignment — staff never had the item
  // Stock was never deducted (only deducted on confirm), so no changes needed
  await db.consumableAssignment.update({
    where: { id: assignmentId },
    data: { isActive: false, acknowledgedAt: new Date() },
  });

  // Check if application is complete
  if (assignment.starterKitApplicationId) {
    await checkApplicationComplete(assignment.starterKitApplicationId);
  }

  // Notify managers — link to returns checklist
  await notifyAdminsAndManagers({
    organizationId: assignment.consumable.organizationId,
    regionId: assignment.consumable.regionId,
    type: "ASSET_RETURNED",
    title: "Kit Item Not Received",
    message: `${session.user.name || session.user.email} reports they did not receive ${assignment.quantity}x "${assignment.consumable.name}". Reason: ${reason}. No stock changes made.`,
    link: "/staff",
  });

  revalidatePath("/my-consumables");
  revalidatePath("/dashboard");
  revalidatePath("/consumables");
  return { success: true };
}

/**
 * Staff returns an entire starter kit — creates PendingReturn for each item, manager verifies
 */
export async function returnStarterKit(
  applicationId: string,
  condition: string,
  notes: string,
  excludedItems?: { itemType: string; itemId: string; note: string }[]
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const application = await db.starterKitApplication.findUnique({
    where: { id: applicationId },
    include: { starterKit: true },
  });

  if (!application || application.userId !== session.user.id) {
    throw new Error("Application not found");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization");

  // Build sets of excluded item IDs
  const excludedAssetIds = new Set(
    (excludedItems || []).filter((e) => e.itemType === "ASSET").map((e) => e.itemId)
  );
  const excludedConsumableIds = new Set(
    (excludedItems || []).filter((e) => e.itemType === "CONSUMABLE").map((e) => e.itemId)
  );

  // Find all active assignments linked to this kit application
  const [activeAssets, activeConsumables] = await Promise.all([
    db.assetAssignment.findMany({
      where: { starterKitApplicationId: applicationId, isActive: true },
      include: { asset: true },
    }),
    db.consumableAssignment.findMany({
      where: { starterKitApplicationId: applicationId, isActive: true },
      include: { consumable: true },
    }),
  ]);

  // Filter to only items being returned (not excluded)
  const assetsToReturn = activeAssets.filter((a) => !excludedAssetIds.has(a.id));
  const consumablesToReturn = activeConsumables.filter((a) => !excludedConsumableIds.has(a.id));

  if (assetsToReturn.length === 0 && consumablesToReturn.length === 0) {
    throw new Error("No items selected for return");
  }

  const returnResults: string[] = [];
  const excludedResults: string[] = [];

  // Return each asset (only non-excluded)
  for (const assignment of assetsToReturn) {
    await db.assetAssignment.update({
      where: { id: assignment.id },
      data: { isActive: false, actualReturnDate: new Date() },
    });
    await db.asset.update({
      where: { id: assignment.assetId },
      data: { status: "PENDING_RETURN" },
    });
    await db.pendingReturn.create({
      data: {
        itemType: "ASSET",
        assetId: assignment.assetId,
        quantity: 1,
        returnedByName: session.user.name || session.user.email || "Unknown",
        returnedByEmail: session.user.email || "",
        returnReason: `Starter kit "${application.starterKit.name}" returned`,
        returnCondition: condition || "GOOD",
        returnNotes: notes || null,
        organizationId,
        regionId: assignment.asset.regionId,
      },
    });
    returnResults.push(`${assignment.asset.name} (${assignment.asset.assetCode})`);
  }

  // Track excluded assets
  for (const assignment of activeAssets.filter((a) => excludedAssetIds.has(a.id))) {
    const excl = excludedItems?.find((e) => e.itemType === "ASSET" && e.itemId === assignment.id);
    excludedResults.push(`${assignment.asset.name} (${assignment.asset.assetCode}) - ${excl?.note || "not returned"}`);
  }

  // Return each consumable (only non-excluded)
  for (const assignment of consumablesToReturn) {
    await db.consumableAssignment.update({
      where: { id: assignment.id },
      data: { isActive: false },
    });
    await db.pendingReturn.create({
      data: {
        itemType: "CONSUMABLE",
        consumableId: assignment.consumableId,
        quantity: assignment.quantity,
        returnedByName: session.user.name || session.user.email || "Unknown",
        returnedByEmail: session.user.email || "",
        returnReason: `Starter kit "${application.starterKit.name}" returned`,
        returnCondition: condition || "GOOD",
        returnNotes: notes || null,
        organizationId,
        regionId: assignment.consumable.regionId,
      },
    });
    returnResults.push(`${assignment.quantity}x ${assignment.consumable.name}`);
  }

  // Track excluded consumables
  for (const assignment of activeConsumables.filter((a) => excludedConsumableIds.has(a.id))) {
    const excl = excludedItems?.find((e) => e.itemType === "CONSUMABLE" && e.itemId === assignment.id);
    excludedResults.push(`${assignment.quantity}x ${assignment.consumable.name} - ${excl?.note || "not returned"}`);
  }

  // Audit log
  const auditDescription = excludedResults.length > 0
    ? `Starter kit "${application.starterKit.name}" partially returned by ${session.user.name || session.user.email}. Returned: ${returnResults.join(", ")}. Not returned: ${excludedResults.join(", ")}`
    : `Starter kit "${application.starterKit.name}" returned by ${session.user.name || session.user.email}: ${returnResults.join(", ")}`;

  await createAuditLog({
    action: "USER_UPDATED",
    description: auditDescription,
    performedById: session.user.id,
    targetUserId: session.user.id,
    organizationId,
    metadata: { starterKitId: application.starterKitId, applicationId, returnResults, excludedResults },
  });

  // Notify managers to verify and restock
  const notifMessage = excludedResults.length > 0
    ? `${session.user.name || session.user.email} partially returned starter kit "${application.starterKit.name}" (${returnResults.length} of ${returnResults.length + excludedResults.length} items). ${excludedResults.length} item(s) not returned. Please verify and restock.`
    : `${session.user.name || session.user.email} returned starter kit "${application.starterKit.name}" (${returnResults.length} items). Please verify and restock.`;

  await notifyAdminsAndManagers({
    organizationId,
    type: "ASSET_RETURNED",
    title: "Starter Kit Return Pending",
    message: notifMessage,
    link: "/returns",
  });

  revalidatePath("/my-assets");
  revalidatePath("/my-consumables");
  revalidatePath("/returns");
  revalidatePath("/assets");
  revalidatePath("/consumables");
  revalidatePath("/dashboard");
  return { success: true, returnedCount: returnResults.length };
}
