"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { withAuth } from "@/lib/action-utils";

export async function getCustomFieldDefinitions(entityType: "ASSET" | "CONSUMABLE") {
  const session = await withAuth();
  const organizationId = session.user.organizationId!;

  return db.customFieldDefinition.findMany({
    where: { organizationId, entityType },
    orderBy: { sortOrder: "asc" },
  });
}

export async function createCustomField(formData: FormData) {
  const session = await withAuth();
  if (session.user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

  const organizationId = session.user.organizationId!;

  const entityType = formData.get("entityType") as string;
  const fieldName = (formData.get("fieldName") as string)?.trim();
  const fieldType = formData.get("fieldType") as string;
  const options = (formData.get("options") as string)?.trim() || null;
  const isRequired = formData.get("isRequired") === "true";

  if (!fieldName || !fieldType || !entityType) throw new Error("Missing fields");

  const count = await db.customFieldDefinition.count({
    where: { organizationId, entityType },
  });

  await db.customFieldDefinition.create({
    data: {
      organizationId,
      entityType,
      fieldName,
      fieldType,
      options,
      isRequired,
      sortOrder: count,
    },
  });

  revalidatePath("/assets");
  revalidatePath("/consumables");
  revalidatePath("/settings");
  return { success: true };
}

export async function deleteCustomField(fieldId: string) {
  const session = await withAuth();
  if (session.user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

  const organizationId = session.user.organizationId!;

  const field = await db.customFieldDefinition.findUnique({ where: { id: fieldId } });
  if (!field || field.organizationId !== organizationId) throw new Error("Not found");

  await db.customFieldDefinition.delete({ where: { id: fieldId } });

  revalidatePath("/assets");
  revalidatePath("/consumables");
  revalidatePath("/settings");
  return { success: true };
}
