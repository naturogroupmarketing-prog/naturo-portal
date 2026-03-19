import { db } from "@/lib/db";

type NotificationType =
  | "LOW_STOCK"
  | "OVERDUE_RETURN"
  | "PENDING_REQUEST"
  | "DAMAGE_REPORT"
  | "ASSET_ASSIGNED"
  | "ASSET_RETURNED"
  | "REQUEST_APPROVED"
  | "REQUEST_REJECTED"
  | "MAINTENANCE_DUE"
  | "WARRANTY_EXPIRING"
  | "PO_STATUS_CHANGED"
  | "GENERAL";

export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
}: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}) {
  return db.notification.create({
    data: { userId, type, title, message, link },
  });
}

export async function notifyAdminsAndManagers({
  organizationId,
  regionId,
  type,
  title,
  message,
  link,
}: {
  organizationId: string;
  regionId?: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}) {
  const where: Record<string, unknown> = {
    organizationId,
    isActive: true,
    role: { in: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
  };

  // If regionId specified, also include managers of that region
  if (regionId) {
    where.OR = [
      { role: "SUPER_ADMIN" },
      { role: "BRANCH_MANAGER", regionId },
    ];
    delete where.role;
  }

  const users = await db.user.findMany({
    where,
    select: { id: true },
  });

  if (users.length === 0) return;

  await db.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      type,
      title,
      message,
      link,
    })),
  });
}
