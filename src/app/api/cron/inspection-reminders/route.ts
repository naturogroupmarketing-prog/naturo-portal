import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { createNotification, createNotifications } from "@/lib/notifications";

/**
 * Cron endpoint — sends 48hr and 24hr inspection reminders
 * Called daily by Vercel Cron or external scheduler
 * Protected by CRON_SECRET header
 */
export async function GET(request: NextRequest) {
  // Verify cron secret — block ALL requests if secret is not configured
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  // Find schedules due within 48 hours
  const upcomingSchedules = await db.inspectionSchedule.findMany({
    where: {
      isActive: true,
      dueDate: {
        gte: now,
        lte: in48h,
      },
    },
    include: {
      organization: { select: { id: true } },
    },
  });

  let emailsSent = 0;
  let notificationsSent = 0;

  for (const schedule of upcomingSchedules) {
    const hoursUntilDue = Math.round((schedule.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60));
    const is24h = hoursUntilDue <= 24;
    const is48h = hoursUntilDue > 24 && hoursUntilDue <= 48;

    // Determine reminder type based on hours remaining
    const reminderKey = is24h ? "24h" : "48h";
    const urgency = is24h ? "FINAL" : "UPCOMING";

    // Get inspection categories for this org
    const inspectionCategories = await db.category.findMany({
      where: { organizationId: schedule.organizationId, requiresInspection: true },
      select: { name: true },
    });
    const catNames = inspectionCategories.map((c) => c.name);
    if (catNames.length === 0) continue;

    // Find staff who have inspection-eligible items
    const staffToRemind = await db.user.findMany({
      where: {
        organizationId: schedule.organizationId,
        isActive: true,
        emailNotifications: true,
        OR: [
          { assetAssignments: { some: { isActive: true, asset: { category: { in: catNames } } } } },
          { consumableAssignments: { some: { isActive: true, consumable: { category: { in: catNames } } } } },
        ],
      },
      select: { id: true, email: true, name: true },
    });

    // Check which staff have already completed their checks this month
    const monthYear = schedule.dueDate.toISOString().slice(0, 7);
    const completedChecks = await db.conditionCheck.findMany({
      where: {
        organizationId: schedule.organizationId,
        monthYear,
      },
      select: { userId: true },
    });
    const completedUserIds = new Set(completedChecks.map((c) => c.userId));

    const formattedDate = schedule.dueDate.toLocaleDateString("en-AU", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    // Batch collect emails and notifications
    const emailBatch: { to: string; subject: string; html: string }[] = [];
    const notifBatch: { userId: string; type: "MAINTENANCE_DUE"; title: string; message: string; link: string }[] = [];

    for (const staff of staffToRemind) {
      const subject = is24h
        ? `FINAL REMINDER: ${schedule.title} — due tomorrow`
        : `Reminder: ${schedule.title} — due in 2 days`;

      const message = is24h
        ? `This is your final reminder. "${schedule.title}" is due tomorrow (${formattedDate}). Please complete your equipment condition check before the deadline.`
        : `"${schedule.title}" is due in 2 days (${formattedDate}). Please take photos of your assigned equipment and submit your condition check.`;

      emailBatch.push({
        to: staff.email,
        subject: `trackio: ${subject}`,
        html: buildReminderEmail(staff.name || "Team Member", schedule.title, formattedDate, is24h, schedule.notes),
      });

      notifBatch.push({
        userId: staff.id,
        type: "MAINTENANCE_DUE",
        title: is24h ? `Final Reminder: ${schedule.title}` : `Reminder: ${schedule.title}`,
        message,
        link: "/dashboard",
      });
    }

    // Batch create notifications
    if (notifBatch.length > 0) {
      await createNotifications(notifBatch);
      notificationsSent += notifBatch.length;
    }

    // Batch send emails (5 at a time)
    for (let i = 0; i < emailBatch.length; i += 5) {
      await Promise.allSettled(emailBatch.slice(i, i + 5).map((e) => sendEmail(e)));
    }
    emailsSent += emailBatch.length;
  }

  // Also check for OVERDUE org-wide schedules and notify admins
  const overdueSchedules = await db.inspectionSchedule.findMany({
    where: {
      isActive: true,
      dueDate: {
        lt: now,
        gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Only alert once (within 24h of overdue)
      },
    },
  });

  for (const schedule of overdueSchedules) {
    const { notifyAdminsAndManagers } = await import("@/lib/notifications");
    await notifyAdminsAndManagers({
      organizationId: schedule.organizationId,
      type: "MAINTENANCE_DUE",
      title: `Inspection Overdue: ${schedule.title}`,
      message: `"${schedule.title}" is now overdue. Some staff may not have completed their condition checks.`,
      link: "/condition-checks",
    });
  }

  // ─── Per-Staff Condition Check Schedule Reminders ────
  // Find staff whose personal condition check schedule is due within 48h
  const staffDueSoon = await db.conditionCheckSchedule.findMany({
    where: {
      isActive: true,
      nextDueDate: { gte: now, lte: in48h },
    },
    include: {
      user: { select: { id: true, email: true, name: true, emailNotifications: true, organizationId: true } },
    },
  });

  const FREQ_LABELS: Record<string, string> = {
    FORTNIGHTLY: "fortnightly",
    MONTHLY: "monthly",
    QUARTERLY: "quarterly",
    BIANNUAL: "6-monthly",
  };

  for (const sched of staffDueSoon) {
    if (!sched.user.emailNotifications) continue;

    const hoursLeft = Math.round((sched.nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60));
    const is24h = hoursLeft <= 24;
    const freqLabel = FREQ_LABELS[sched.frequency] || "scheduled";
    const formattedDate = sched.nextDueDate.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" });

    const subject = is24h
      ? `FINAL REMINDER: ${freqLabel} condition check — due tomorrow`
      : `Reminder: ${freqLabel} condition check — due in 2 days`;

    await sendEmail({
      to: sched.user.email,
      subject: `trackio: ${subject}`,
      html: buildReminderEmail(
        sched.user.name || "Team Member",
        `${freqLabel.charAt(0).toUpperCase() + freqLabel.slice(1)} Condition Check`,
        formattedDate,
        is24h,
        null,
      ),
    });
    emailsSent++;

    await createNotification({
      userId: sched.user.id,
      type: "MAINTENANCE_DUE",
      title: is24h ? "Final Reminder: Condition Check Due Tomorrow" : "Reminder: Condition Check Due Soon",
      message: `Your ${freqLabel} condition check is due by ${formattedDate}. Please take photos of your assigned equipment.`,
      link: "/dashboard",
    });
    notificationsSent++;
  }

  // Notify admins of overdue per-staff schedules
  const overdueStaffSchedules = await db.conditionCheckSchedule.findMany({
    where: {
      isActive: true,
      nextDueDate: {
        lt: now,
        gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      },
    },
    include: {
      user: { select: { name: true, email: true, organizationId: true } },
    },
  });

  for (const sched of overdueStaffSchedules) {
    if (!sched.user.organizationId) continue;
    const { notifyAdminsAndManagers } = await import("@/lib/notifications");
    await notifyAdminsAndManagers({
      organizationId: sched.user.organizationId,
      type: "MAINTENANCE_DUE",
      title: `Overdue Condition Check: ${sched.user.name || sched.user.email}`,
      message: `${sched.user.name || sched.user.email} has not completed their condition check by the due date.`,
      link: "/condition-checks",
    });
  }

  return NextResponse.json({
    success: true,
    emailsSent,
    notificationsSent,
    schedulesProcessed: upcomingSchedules.length,
    overdueAlerts: overdueSchedules.length,
    staffScheduleReminders: staffDueSoon.length,
    overdueStaffSchedules: overdueStaffSchedules.length,
  });
}

function buildReminderEmail(
  staffName: string,
  title: string,
  dueDate: string,
  isFinal: boolean,
  notes: string | null
) {
  const appUrl = process.env.AUTH_URL || "https://naturo-portal.vercel.app";
  const urgencyColor = isFinal ? "#E8532E" : "#1F3DD9";
  const urgencyLabel = isFinal ? "FINAL REMINDER" : "REMINDER";

  return `
    <div style="max-width:480px;margin:0 auto;padding:24px;">
      <div style="background:${urgencyColor};color:white;padding:4px 12px;border-radius:4px;display:inline-block;font-size:11px;font-weight:700;letter-spacing:1px;margin-bottom:16px;">
        ${urgencyLabel}
      </div>
      <h2 style="color:#292d34;font-size:20px;font-weight:700;margin:0 0 8px;">
        ${title}
      </h2>
      <p style="color:#6b7080;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Hi ${staffName}, this is a reminder to complete your equipment condition check.
      </p>
      <div style="background:#f6f6f7;border-radius:8px;padding:16px;margin-bottom:16px;">
        <p style="color:#3f424a;font-size:14px;margin:0;">
          <strong>Due:</strong> ${dueDate}
        </p>
        ${notes ? `<p style="color:#6b7080;font-size:13px;margin:8px 0 0;">Notes: ${notes}</p>` : ""}
      </div>
      <p style="color:#6b7080;font-size:14px;line-height:1.6;margin:0 0 20px;">
        ${isFinal
          ? "This is your final reminder. Please complete your inspection today to avoid being marked as overdue."
          : "Take photos of your assigned equipment and submit your condition assessment."}
      </p>
      <a href="${appUrl}/dashboard" style="display:inline-block;padding:12px 24px;background:${urgencyColor};color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
        Complete Inspection
      </a>
    </div>
  `;
}
