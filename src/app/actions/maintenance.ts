"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { isAdminOrManager } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

export async function createMaintenanceSchedule(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) throw new Error("Unauthorized");

  const assetId = formData.get("assetId") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string | null;
  const frequency = formData.get("frequency") as string;
  const nextDueDate = formData.get("nextDueDate") as string;
  const assignedToId = formData.get("assignedToId") as string | null;

  if (!assetId || !title || !frequency || !nextDueDate) throw new Error("Missing required fields");

  await db.maintenanceSchedule.create({
    data: {
      assetId,
      title,
      description: description || null,
      frequency,
      nextDueDate: new Date(nextDueDate),
      assignedToId: assignedToId || null,
    },
  });

  revalidatePath("/assets");
  revalidatePath("/maintenance");
  return { success: true };
}

export async function completeMaintenanceTask(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization");

  const scheduleId = formData.get("scheduleId") as string;
  const notes = formData.get("notes") as string | null;
  const cost = formData.get("cost") as string | null;
  const condition = formData.get("condition") as string | null;

  const schedule = await db.maintenanceSchedule.findUnique({
    where: { id: scheduleId },
    include: { asset: { select: { organizationId: true } } },
  });
  if (!schedule || schedule.asset.organizationId !== organizationId) throw new Error("Schedule not found");

  // Create log entry
  await db.maintenanceLog.create({
    data: {
      scheduleId,
      performedById: session.user.id,
      notes: notes || null,
      cost: cost ? parseFloat(cost) : null,
      condition: condition || null,
    },
  });

  // Calculate next due date based on frequency
  const now = new Date();
  let nextDue = new Date(now);
  switch (schedule.frequency) {
    case "DAILY": nextDue.setDate(nextDue.getDate() + 1); break;
    case "WEEKLY": nextDue.setDate(nextDue.getDate() + 7); break;
    case "MONTHLY": nextDue.setMonth(nextDue.getMonth() + 1); break;
    case "QUARTERLY": nextDue.setMonth(nextDue.getMonth() + 3); break;
    case "YEARLY": nextDue.setFullYear(nextDue.getFullYear() + 1); break;
    case "ONCE": break;
  }

  await db.maintenanceSchedule.update({
    where: { id: scheduleId },
    data: {
      lastCompletedDate: now,
      nextDueDate: schedule.frequency === "ONCE" ? schedule.nextDueDate : nextDue,
      isActive: schedule.frequency !== "ONCE" ? true : false,
    },
  });

  revalidatePath("/assets");
  revalidatePath("/maintenance");
  return { success: true };
}

export async function deleteMaintenanceSchedule(scheduleId: string) {
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) throw new Error("Unauthorized");

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization");

  const schedule = await db.maintenanceSchedule.findUnique({
    where: { id: scheduleId },
    include: { asset: { select: { organizationId: true } } },
  });
  if (!schedule || schedule.asset.organizationId !== organizationId) throw new Error("Not found");

  // Delete related logs first
  await db.maintenanceLog.deleteMany({ where: { scheduleId } });
  await db.maintenanceSchedule.delete({ where: { id: scheduleId } });

  revalidatePath("/assets");
  revalidatePath("/maintenance");
  return { success: true };
}

export async function getMaintenanceSchedules(regionId?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const organizationId = session.user.organizationId;
  if (!organizationId) throw new Error("No organization found");

  const where: Record<string, unknown> = {
    isActive: true,
    asset: regionId
      ? { regionId, organizationId }
      : { organizationId },
  };

  return db.maintenanceSchedule.findMany({
    where,
    include: {
      asset: { select: { id: true, name: true, assetCode: true, region: { select: { name: true } } } },
      assignedTo: { select: { id: true, name: true, email: true } },
      logs: { orderBy: { completedAt: "desc" }, take: 1 },
    },
    orderBy: { nextDueDate: "asc" },
  });
}
