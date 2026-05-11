"use server";
import { withAuth } from "@/lib/action-utils";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  stockConsumptionMultiplier: z.number().min(1.1).max(10),
  overdueReturnDays: z.number().min(1).max(90),
  damageReportsThreshold: z.number().min(1).max(20),
  maxAnomalies: z.number().min(10).max(200),
});

export async function updateAnomalySettings(formData: FormData) {
  const session = await withAuth();
  if (session.user.role !== "SUPER_ADMIN") {
    return { success: false, error: "Only Super Admins can change anomaly settings." };
  }
  const data = {
    stockConsumptionMultiplier: Number(formData.get("stockConsumptionMultiplier")),
    overdueReturnDays: Number(formData.get("overdueReturnDays")),
    damageReportsThreshold: Number(formData.get("damageReportsThreshold")),
    maxAnomalies: Number(formData.get("maxAnomalies")),
  };
  try {
    const validated = schema.parse(data);
    await db.organization.update({
      where: { id: session.user.organizationId! },
      data: { anomalySettings: validated },
    });
    return { success: true };
  } catch {
    return { success: false, error: "Invalid settings values." };
  }
}

export async function getAnomalySettings(organizationId: string) {
  const org = await db.organization.findUnique({
    where: { id: organizationId },
    select: { anomalySettings: true },
  });
  const defaults = {
    stockConsumptionMultiplier: 2.0,
    overdueReturnDays: 14,
    damageReportsThreshold: 3,
    maxAnomalies: 50,
  };
  if (!org?.anomalySettings || typeof org.anomalySettings !== "object") return defaults;
  return { ...defaults, ...(org.anomalySettings as object) };
}
