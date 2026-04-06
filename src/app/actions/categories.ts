"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { isAdminOrManager } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

export async function getCategories(type: "ASSET" | "CONSUMABLE") {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  return db.category.findMany({
    where: { type, organizationId },
    orderBy: { sortOrder: "asc" },
  });
}

export async function createCategory(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const name = (formData.get("name") as string)?.trim();
  const type = formData.get("type") as string;

  if (!name) throw new Error("Name is required");
  if (!["ASSET", "CONSUMABLE"].includes(type)) throw new Error("Invalid type");

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  // Check for duplicate
  const existing = await db.category.findUnique({
    where: { name_type_organizationId: { name, type, organizationId } },
  });
  if (existing) throw new Error(`"${name}" already exists`);

  // Get max sortOrder for this type
  const maxSort = await db.category.findFirst({
    where: { type, organizationId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  await db.category.create({
    data: {
      name,
      type,
      organizationId,
      sortOrder: (maxSort?.sortOrder ?? -1) + 1,
    },
  });

  revalidatePath("/assets");
  revalidatePath("/consumables");
  return { success: true };
}

export async function updateCategory(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  const id = formData.get("id") as string;
  const newName = (formData.get("name") as string)?.trim();

  if (!newName) throw new Error("Name is required");

  const cat = await db.category.findUnique({ where: { id } });
  if (!cat) throw new Error("Category not found");
  if (cat.organizationId !== organizationId) throw new Error("Category not found");

  if (newName === cat.name) return { success: true };

  // Check for duplicate name
  const existing = await db.category.findFirst({
    where: { name: newName, type: cat.type, organizationId: cat.organizationId },
  });
  if (existing) throw new Error(`"${newName}" already exists`);

  // Update category name
  await db.category.update({ where: { id }, data: { name: newName } });

  // Sync all assets/consumables that reference the old category name
  if (cat.type === "ASSET") {
    await db.asset.updateMany({
      where: { category: cat.name, organizationId },
      data: { category: newName },
    });
  } else {
    await db.consumable.updateMany({
      where: { category: cat.name, organizationId },
      data: { category: newName },
    });
  }

  // Sync starter kit items that reference the old category name
  await db.starterKitItem.updateMany({
    where: { category: cat.name, starterKit: { organizationId } },
    data: { category: newName },
  });

  revalidatePath("/assets");
  revalidatePath("/consumables");
  revalidatePath("/inventory");
  revalidatePath("/starter-kits");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteCategory(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  const id = formData.get("id") as string;
  const cat = await db.category.findUnique({ where: { id } });
  if (!cat) throw new Error("Category not found");
  if (cat.organizationId !== organizationId) throw new Error("Category not found");

  // Check if any items use this category
  if (cat.type === "ASSET") {
    const count = await db.asset.count({ where: { category: cat.name, organizationId } });
    if (count > 0) throw new Error(`Cannot delete: ${count} asset(s) use this section`);
  } else {
    const count = await db.consumable.count({ where: { category: cat.name, organizationId } });
    if (count > 0) throw new Error(`Cannot delete: ${count} consumable(s) use this section`);
  }

  await db.category.delete({ where: { id } });

  revalidatePath("/assets");
  revalidatePath("/consumables");
  return { success: true };
}

export async function addEquipmentItem(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  const categoryId = formData.get("categoryId") as string;
  const name = (formData.get("name") as string)?.trim();

  if (!name) throw new Error("Equipment name is required");

  const cat = await db.category.findUnique({ where: { id: categoryId } });
  if (!cat) throw new Error("Category not found");
  if (cat.organizationId !== organizationId) throw new Error("Category not found");

  const existing = cat.equipment || [];
  if (existing.includes(name)) {
    throw new Error(`"${name}" already exists in this section`);
  }

  await db.category.update({
    where: { id: categoryId },
    data: { equipment: [...existing, name] },
  });

  revalidatePath("/assets");
  return { success: true };
}

export async function reorderCategories(orderedIds: string[]) {
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  // Verify all categories belong to this org, then update sortOrder
  const categories = await db.category.findMany({ where: { id: { in: orderedIds }, organizationId } });
  const validIds = new Set(categories.map((c) => c.id));
  await Promise.all(
    orderedIds.filter((id) => validIds.has(id)).map((id, index) =>
      db.category.update({ where: { id }, data: { sortOrder: index } })
    )
  );

  revalidatePath("/assets");
  revalidatePath("/consumables");
  return { success: true };
}

export async function reorderItems(orderedIds: string[], type: "ASSET" | "CONSUMABLE") {
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  if (type === "ASSET") {
    const assets = await db.asset.findMany({ where: { id: { in: orderedIds }, organizationId } });
    const validIds = new Set(assets.map((a) => a.id));
    await Promise.all(
      orderedIds.filter((id) => validIds.has(id)).map((id, index) =>
        db.asset.update({ where: { id }, data: { sortOrder: index } })
      )
    );
    revalidatePath("/assets");
  } else {
    const consumables = await db.consumable.findMany({ where: { id: { in: orderedIds }, organizationId } });
    const validIds = new Set(consumables.map((c) => c.id));
    await Promise.all(
      orderedIds.filter((id) => validIds.has(id)).map((id, index) =>
        db.consumable.update({ where: { id }, data: { sortOrder: index } })
      )
    );
    revalidatePath("/consumables");
  }

  return { success: true };
}

export async function removeEquipmentItem(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  const categoryId = formData.get("categoryId") as string;
  const name = formData.get("name") as string;

  const cat = await db.category.findUnique({ where: { id: categoryId } });
  if (!cat) throw new Error("Category not found");
  if (cat.organizationId !== organizationId) throw new Error("Category not found");

  await db.category.update({
    where: { id: categoryId },
    data: { equipment: (cat.equipment || []).filter((e) => e !== name) },
  });

  revalidatePath("/assets");
  return { success: true };
}
