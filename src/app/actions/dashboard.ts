"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { isAdminOrManager } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { type DashboardPreferences, parsePreferences } from "@/lib/dashboard-types";

async function getPreferences(userId: string): Promise<DashboardPreferences> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { dashboardPreferences: true },
  });
  return parsePreferences(user?.dashboardPreferences);
}

async function savePreferences(userId: string, prefs: DashboardPreferences) {
  await db.user.update({
    where: { id: userId },
    data: { dashboardPreferences: prefs as never },
  });
  revalidatePath("/dashboard");
}

export async function updateWidgetVisibility(widgetId: string, visible: boolean) {
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const prefs = await getPreferences(session.user.id);

  if (visible) {
    prefs.hiddenWidgets = prefs.hiddenWidgets.filter((id) => id !== widgetId);
  } else {
    if (!prefs.hiddenWidgets.includes(widgetId)) {
      prefs.hiddenWidgets.push(widgetId);
    }
  }

  await savePreferences(session.user.id, prefs);
  return { success: true };
}

export async function addCustomShortcut(label: string, href: string, icon: string) {
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const prefs = await getPreferences(session.user.id);

  prefs.customShortcuts.push({
    id: crypto.randomUUID(),
    label,
    href: href.startsWith("/") ? href : `/${href}`,
    icon: icon as never,
  });

  await savePreferences(session.user.id, prefs);
  return { success: true };
}

export async function removeCustomShortcut(shortcutId: string) {
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const prefs = await getPreferences(session.user.id);
  prefs.customShortcuts = prefs.customShortcuts.filter((s) => s.id !== shortcutId);

  await savePreferences(session.user.id, prefs);
  return { success: true };
}
