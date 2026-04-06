import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { createNotification } from "@/lib/notifications";

/**
 * Daily cron — sends reminders for overdue returns and pending approvals
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let returnReminders = 0;
  let approvalReminders = 0;

  // 1. Overdue returns — items pending verification for 3+ days
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const overdueReturns = await db.pendingReturn.findMany({
    where: { isVerified: false, createdAt: { lte: threeDaysAgo } },
    select: { organizationId: true, regionId: true, returnedByName: true, returnedByEmail: true, itemType: true },
  });

  // Group by org+region and notify managers
  const returnsByOrg = new Map<string, { count: number; regionId: string | null; orgId: string }>();
  for (const r of overdueReturns) {
    const key = `${r.organizationId}-${r.regionId}`;
    if (!returnsByOrg.has(key)) returnsByOrg.set(key, { count: 0, regionId: r.regionId, orgId: r.organizationId });
    returnsByOrg.get(key)!.count++;
  }

  for (const [, data] of returnsByOrg) {
    const managers = await db.user.findMany({
      where: {
        organizationId: data.orgId, isActive: true, emailNotifications: true,
        OR: [{ role: "SUPER_ADMIN" }, ...(data.regionId ? [{ role: "BRANCH_MANAGER" as const, regionId: data.regionId }] : [])],
      },
      select: { id: true, email: true, name: true },
    });

    for (const mgr of managers) {
      await createNotification({
        userId: mgr.id,
        type: "OVERDUE_RETURN",
        title: `${data.count} Overdue Return${data.count > 1 ? "s" : ""}`,
        message: `${data.count} item${data.count > 1 ? "s" : ""} pending verification for 3+ days. Please review and restock.`,
        link: "/returns",
      });

      await sendEmail({
        to: mgr.email,
        subject: `Trackio: ${data.count} Overdue Returns Need Attention`,
        html: `<p>Hi ${mgr.name || "Manager"},</p><p>${data.count} returned item${data.count > 1 ? "s are" : " is"} awaiting your verification for over 3 days.</p><p><a href="${process.env.AUTH_URL || "https://naturo-portal.vercel.app"}/returns" style="display:inline-block;padding:10px 24px;background:#1F3DD9;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Review Returns</a></p>`,
      });
      returnReminders++;
    }
  }

  // 2. Pending approval reminders — consumable requests pending 24+ hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const pendingRequests = await db.consumableRequest.findMany({
    where: { status: "PENDING", createdAt: { lte: oneDayAgo } },
    include: { consumable: { select: { regionId: true, organizationId: true } }, user: { select: { name: true } } },
  });

  const reqsByOrg = new Map<string, { count: number; regionId: string; orgId: string }>();
  for (const r of pendingRequests) {
    const key = `${r.consumable.organizationId}-${r.consumable.regionId}`;
    if (!reqsByOrg.has(key)) reqsByOrg.set(key, { count: 0, regionId: r.consumable.regionId, orgId: r.consumable.organizationId });
    reqsByOrg.get(key)!.count++;
  }

  for (const [, data] of reqsByOrg) {
    const managers = await db.user.findMany({
      where: {
        organizationId: data.orgId, isActive: true, emailNotifications: true,
        OR: [{ role: "SUPER_ADMIN" }, { role: "BRANCH_MANAGER", regionId: data.regionId }],
      },
      select: { id: true, email: true },
    });

    for (const mgr of managers) {
      await createNotification({
        userId: mgr.id,
        type: "PENDING_REQUEST",
        title: `${data.count} Pending Request${data.count > 1 ? "s" : ""}`,
        message: `${data.count} consumable request${data.count > 1 ? "s" : ""} awaiting approval for 24+ hours.`,
        link: "/consumables",
      });
      approvalReminders++;
    }
  }

  return NextResponse.json({ success: true, returnReminders, approvalReminders });
}
