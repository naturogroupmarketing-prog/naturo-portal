"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit";
import { notifyAdminsAndManagers } from "@/lib/notifications";
import { handleLowStockAlert } from "@/lib/low-stock-handler";
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

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization");

  const kit = await db.starterKit.findUnique({ where: { id } });
  if (!kit || kit.organizationId !== organizationId) throw new Error("Not found");

  await db.starterKit.delete({ where: { id } });

  revalidatePath("/staff");
  revalidatePath("/starter-kits");
  return { success: true };
}

export async function addStarterKitItem(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!(await hasPermission(session.user.id, session.user.role, "starterKitsManage"))) throw new Error("Unauthorized");

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization");

  const starterKitId = formData.get("starterKitId") as string;
  const itemType = formData.get("itemType") as string;
  const category = (formData.get("category") as string)?.trim() || null;
  const consumableId = (formData.get("consumableId") as string) || null;
  const quantity = parseInt(formData.get("quantity") as string) || 1;

  // Verify kit belongs to this org
  const kit = await db.starterKit.findUnique({ where: { id: starterKitId } });
  if (!kit || kit.organizationId !== organizationId) throw new Error("Not found");

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

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization");

  const item = await db.starterKitItem.findUnique({ where: { id: itemId }, include: { starterKit: true } });
  if (!item || item.starterKit.organizationId !== organizationId) throw new Error("Not found");

  await db.starterKitItem.delete({ where: { id: itemId } });

  revalidatePath("/staff");
  revalidatePath("/starter-kits");
  return { success: true };
}

export async function updateStarterKitItemQuantity(itemId: string, quantity: number) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!(await hasPermission(session.user.id, session.user.role, "starterKitsManage"))) throw new Error("Unauthorized");

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization");

  if (quantity < 1) throw new Error("Quantity must be at least 1");

  const item = await db.starterKitItem.findUnique({ where: { id: itemId }, include: { starterKit: true } });
  if (!item || item.starterKit.organizationId !== organizationId) throw new Error("Not found");

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
      // Batch-fetch all available assets for this category upfront (eliminates N+1)
      const availableAssets = user.regionId ? await db.asset.findMany({
        where: { category: item.category, regionId: user.regionId, organizationId, status: "AVAILABLE" },
        orderBy: { createdAt: "asc" },
        take: item.quantity,
      }) : [];

      for (const asset of availableAssets) {
        // Don't change status yet — stays AVAILABLE until staff confirms receipt
        // Status changes to ASSIGNED only when staff acknowledges the item
        await db.assetAssignment.create({
          data: { assetId: asset.id, userId, assignmentType: "PERMANENT", checkoutDate: new Date(), starterKitApplicationId: application.id },
          // acknowledgedAt is null by default — pending confirmation
        });
        results.push(`Assigned ${asset.name} (${asset.assetCode})`);
        appliedCount++;
      }

      if (availableAssets.length < item.quantity) {
        const unfulfilled = item.quantity - availableAssets.length;
        results.push(`No available ${item.category} asset found (${unfulfilled} of ${item.quantity} unfulfilled)`);
      }
    } else if (item.itemType === "CONSUMABLE" && item.consumableId) {
      // Find the template consumable (to get the name)
      const templateConsumable = await db.consumable.findUnique({
        where: { id: item.consumableId },
      });
      if (!templateConsumable) {
        results.push("Consumable not found");
        continue;
      }

      // Find the same consumable BY NAME in the staff's region
      let consumable = templateConsumable;
      if (user.regionId && templateConsumable.regionId !== user.regionId) {
        const regionMatch = await db.consumable.findFirst({
          where: { name: templateConsumable.name, regionId: user.regionId, isActive: true },
        });
        if (regionMatch) {
          consumable = regionMatch;
        } else {
          results.push(`No "${templateConsumable.name}" found in staff's region`);
          continue;
        }
      }

      if (consumable.quantityOnHand >= item.quantity) {
        await db.consumableAssignment.create({
          data: {
            consumableId: consumable.id,
            userId,
            quantity: item.quantity,
            starterKitApplicationId: application.id,
          },
        });
        results.push(`Assigned ${item.quantity}x ${consumable.name}`);
        appliedCount++;
      } else {
        results.push(`Insufficient stock for ${consumable.name} (${consumable.quantityOnHand} available, ${item.quantity} needed)`);
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
      message: `You've been assigned a starter kit "${kit.name}". Go to your Dashboard to review and confirm your equipment.`,
      link: "/dashboard",
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

  // Now set asset status to ASSIGNED — staff confirmed they have it
  await db.asset.update({
    where: { id: assignment.assetId },
    data: { status: "ASSIGNED" },
  });

  // Check if all items in this application are now acknowledged
  if (assignment.starterKitApplicationId) {
    await checkApplicationComplete(assignment.starterKitApplicationId);
  }

  revalidatePath("/my-assets");
  revalidatePath("/assets");
  revalidatePath("/inventory");
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
    // Check low stock after deduction
    await handleLowStockAlert({ consumableId: assignment.consumableId, performedById: session.user.id });
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
 * Batch confirm/reject all kit receipt items in a single transaction
 * Replaces N sequential calls to acknowledgeAssetItem/acknowledgeConsumableItem/rejectKitAssetItem/rejectKitConsumableItem
 */
export async function batchConfirmKitReceipt(
  applicationId: string,
  items: { id: string; type: "asset" | "consumable"; status: "received" | "not_received"; reason?: string }[]
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const receivedAssets = items.filter((i) => i.type === "asset" && i.status === "received");
  const receivedConsumables = items.filter((i) => i.type === "consumable" && i.status === "received");
  const rejectedAssets = items.filter((i) => i.type === "asset" && i.status === "not_received");
  const rejectedConsumables = items.filter((i) => i.type === "consumable" && i.status === "not_received");

  const rejectedAssetDetails: { name: string; code: string; reason: string }[] = [];

  // Process sequentially (no interactive transaction for Neon compatibility)

  // 1. Batch acknowledge received assets
  if (receivedAssets.length > 0) {
    await db.assetAssignment.updateMany({
      where: {
        id: { in: receivedAssets.map((i) => i.id) },
        userId: session.user.id,
      },
      data: { acknowledgedAt: new Date() },
    });

    // Set asset status to ASSIGNED — staff confirmed receipt
    const acknowledgedAssignments = await db.assetAssignment.findMany({
      where: { id: { in: receivedAssets.map((i) => i.id) } },
      select: { assetId: true },
    });
    if (acknowledgedAssignments.length > 0) {
      await db.asset.updateMany({
        where: { id: { in: acknowledgedAssignments.map((a) => a.assetId) } },
        data: { status: "ASSIGNED" },
      });
    }
  }

  // 2. Acknowledge received consumables + deduct stock (per-item since each has different consumableId)
  for (const item of receivedConsumables) {
    const assignment = await db.consumableAssignment.findUnique({
      where: { id: item.id },
    });
    if (!assignment || assignment.userId !== session.user.id) continue;

    await db.consumableAssignment.update({
      where: { id: item.id },
      data: { acknowledgedAt: new Date() },
    });

    if (assignment.starterKitApplicationId) {
      await db.consumable.update({
        where: { id: assignment.consumableId },
        data: { quantityOnHand: { decrement: assignment.quantity } },
      });
      await handleLowStockAlert({ consumableId: assignment.consumableId, performedById: session.user.id });
    }
  }

  // 3. Reject assets — batch fetch, then batch update
  if (rejectedAssets.length > 0) {
    const rejectedAssignments = await db.assetAssignment.findMany({
      where: { id: { in: rejectedAssets.map((i) => i.id) }, userId: session.user.id },
      include: { asset: true },
    });

    if (rejectedAssignments.length > 0) {
      // Batch deactivate assignments
      await db.assetAssignment.updateMany({
        where: { id: { in: rejectedAssignments.map((a) => a.id) } },
        data: { isActive: false, acknowledgedAt: new Date(), actualReturnDate: new Date() },
      });
      // Batch return assets to AVAILABLE
      await db.asset.updateMany({
        where: { id: { in: rejectedAssignments.map((a) => a.assetId) } },
        data: { status: "AVAILABLE" },
      });

      const reasonMap = new Map(rejectedAssets.map((i) => [i.id, i.reason]));
      for (const a of rejectedAssignments) {
        rejectedAssetDetails.push({ name: a.asset.name, code: a.asset.assetCode, reason: reasonMap.get(a.id) || "Not received" });
      }
    }
  }

  // 4. Batch reject consumables — deactivate assignments
  if (rejectedConsumables.length > 0) {
    await db.consumableAssignment.updateMany({
      where: {
        id: { in: rejectedConsumables.map((i) => i.id) },
        userId: session.user.id,
      },
      data: { isActive: false, acknowledgedAt: new Date() },
    });
  }

  // Check if application is complete
  await checkApplicationComplete(applicationId);

  // Send batch notification for rejected items
  const allRejected = [...rejectedAssets, ...rejectedConsumables];
  if (allRejected.length > 0) {
    // Get org/region info from one of the assignments
    const sampleAssignment = await db.assetAssignment.findFirst({
      where: { starterKitApplicationId: applicationId },
      include: { asset: true },
    }) || await db.consumableAssignment.findFirst({
      where: { starterKitApplicationId: applicationId },
      include: { consumable: true },
    });

    if (sampleAssignment) {
      const orgId = "asset" in sampleAssignment
        ? (sampleAssignment as { asset: { organizationId: string } }).asset.organizationId
        : (sampleAssignment as { consumable: { organizationId: string } }).consumable.organizationId;
      const regId = "asset" in sampleAssignment
        ? (sampleAssignment as { asset: { regionId: string } }).asset.regionId
        : (sampleAssignment as { consumable: { regionId: string } }).consumable.regionId;

      await notifyAdminsAndManagers({
        organizationId: orgId,
        regionId: regId,
        type: "ASSET_RETURNED",
        title: `${allRejected.length} Kit Item(s) Not Received`,
        message: `${session.user.name || session.user.email} reports ${allRejected.length} item(s) were not received from their starter kit.`,
        link: "/staff",
      });
    }
  }

  revalidatePath("/my-assets");
  revalidatePath("/my-consumables");
  revalidatePath("/dashboard");
  revalidatePath("/assets");
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

  if (activeAssets.length === 0 && activeConsumables.length === 0) {
    throw new Error("No active items to return");
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

  // Create PendingReturn records for excluded assets (so managers can see them)
  for (const assignment of activeAssets.filter((a) => excludedAssetIds.has(a.id))) {
    const excl = excludedItems?.find((e) => e.itemType === "ASSET" && e.itemId === assignment.id);
    // Deactivate the assignment since staff is surrendering the kit
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
        returnReason: `Not returned from kit "${application.starterKit.name}"`,
        returnCondition: "NOT_RETURNED",
        returnNotes: excl?.note || "Not returned",
        organizationId,
        regionId: assignment.asset.regionId,
      },
    });
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

  // Create PendingReturn records for excluded consumables (so managers can see them)
  for (const assignment of activeConsumables.filter((a) => excludedConsumableIds.has(a.id))) {
    const excl = excludedItems?.find((e) => e.itemType === "CONSUMABLE" && e.itemId === assignment.id);
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
        returnReason: `Not returned from kit "${application.starterKit.name}"`,
        returnCondition: "NOT_RETURNED",
        returnNotes: excl?.note || "Not returned",
        organizationId,
        regionId: assignment.consumable.regionId,
      },
    });
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
