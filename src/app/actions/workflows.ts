"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { WorkflowTrigger, WorkflowAction } from "@/lib/workflow-engine";
import type { Prisma } from "@/generated/prisma/client";

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createWorkflowRule(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const trigger = formData.get("trigger") as WorkflowTrigger;
  const action = formData.get("action") as WorkflowAction;
  const conditionsRaw = formData.get("conditions") as string;
  const actionConfigRaw = formData.get("actionConfig") as string;

  if (!name?.trim() || !trigger || !action) {
    throw new Error("Name, trigger, and action are required");
  }

  let conditions: Prisma.InputJsonValue = {};
  let actionConfig: Prisma.InputJsonValue = {};
  try {
    if (conditionsRaw) conditions = JSON.parse(conditionsRaw) as Prisma.InputJsonValue;
    if (actionConfigRaw) actionConfig = JSON.parse(actionConfigRaw) as Prisma.InputJsonValue;
  } catch {
    throw new Error("Invalid conditions or action config JSON");
  }

  if (!session.user.organizationId) throw new Error("No organization");

  await db.workflowRule.create({
    data: {
      organizationId: session.user.organizationId,
      name: name.trim(),
      trigger,
      conditions,
      action,
      actionConfig,
      enabled: true,
    },
  });

  revalidatePath("/admin/workflows");
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateWorkflowRule(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized");
  }

  const existing = await db.workflowRule.findUnique({ where: { id } });
  if (!existing || existing.organizationId !== session.user.organizationId) {
    throw new Error("Rule not found");
  }

  const name = formData.get("name") as string;
  const trigger = formData.get("trigger") as WorkflowTrigger;
  const action = formData.get("action") as WorkflowAction;
  const conditionsRaw = formData.get("conditions") as string;
  const actionConfigRaw = formData.get("actionConfig") as string;

  let conditions: Prisma.InputJsonValue = {};
  let actionConfig: Prisma.InputJsonValue = {};
  try {
    if (conditionsRaw) conditions = JSON.parse(conditionsRaw) as Prisma.InputJsonValue;
    if (actionConfigRaw) actionConfig = JSON.parse(actionConfigRaw) as Prisma.InputJsonValue;
  } catch {
    throw new Error("Invalid conditions or action config JSON");
  }

  await db.workflowRule.update({
    where: { id },
    data: { name: name.trim(), trigger, action, conditions, actionConfig },
  });

  revalidatePath("/admin/workflows");
}

// ─── Toggle enabled ───────────────────────────────────────────────────────────

export async function toggleWorkflowRule(id: string, enabled: boolean) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized");
  }

  const existing = await db.workflowRule.findUnique({ where: { id } });
  if (!existing || existing.organizationId !== session.user.organizationId) {
    throw new Error("Rule not found");
  }

  await db.workflowRule.update({ where: { id }, data: { enabled } });
  revalidatePath("/admin/workflows");
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteWorkflowRule(id: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized");
  }

  const existing = await db.workflowRule.findUnique({ where: { id } });
  if (!existing || existing.organizationId !== session.user.organizationId) {
    throw new Error("Rule not found");
  }

  await db.workflowRule.delete({ where: { id } });
  revalidatePath("/admin/workflows");
}
