import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

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
  const notification = await db.notification.create({
    data: { userId, type, title, message, link },
  });

  // Send email notification (non-blocking)
  sendNotificationEmail(userId, title, message, link).catch(() => {});

  return notification;
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
    select: { id: true, email: true, emailNotifications: true },
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

  // Batch email sends — non-blocking, 5 at a time
  const emailUsers = users.filter((u) => u.emailNotifications && u.email);
  if (emailUsers.length > 0) {
    batchSendEmails(emailUsers.map((u) => ({
      to: u.email!,
      subject: `Trackio: ${title}`,
      html: buildNotificationEmailHtml(title, message, link),
    }))).catch(() => {});
  }
}

/**
 * Bulk create notifications for multiple users
 */
export async function createNotifications(items: { userId: string; type: NotificationType; title: string; message: string; link?: string }[]) {
  if (items.length === 0) return;
  await db.notification.createMany({ data: items });
}

/**
 * Send emails in batches of 5 to avoid overwhelming the email provider
 */
async function batchSendEmails(emails: { to: string; subject: string; html: string }[]) {
  const BATCH_SIZE = 5;
  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(batch.map((e) => sendEmail(e)));
  }
}

/**
 * Send an email notification to a single user (checks their preference)
 */
async function sendNotificationEmail(userId: string, title: string, message: string, link?: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, emailNotifications: true },
  });

  if (!user?.email || !user.emailNotifications) return;

  await sendEmail({
    to: user.email,
    subject: `Trackio: ${title}`,
    html: buildNotificationEmailHtml(title, message, link),
  });
}

function buildNotificationEmailHtml(title: string, message: string, link?: string) {
  const appUrl = process.env.AUTH_URL || "https://naturo-portal.vercel.app";
  const linkHtml = link
    ? `<p style="margin:24px 0 0;"><a href="${appUrl}${link}" style="display:inline-block;padding:10px 24px;background:#1F3DD9;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;">View in Trackio</a></p>`
    : "";

  return `
    <p style="color:#495057;font-size:15px;line-height:1.6;">${message}</p>
    ${linkHtml}
    <p style="color:#868e96;font-size:12px;margin-top:24px;">You're receiving this because you have email notifications enabled. You can disable them in your profile settings.</p>
  `;
}
