import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdminOrManager } from "@/lib/permissions";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Activity Log",
  description: "View system-wide activity and audit trail",
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const ACTION_CONFIG: Record<string, { icon: "package" | "droplet" | "users" | "check" | "alert-triangle" | "clipboard" | "clock" | "plus" | "arrow-left" | "star"; label: string; color: string; bg: string }> = {
  ASSET_CREATED: { icon: "plus", label: "Created", color: "text-action-500", bg: "bg-action-50" },
  ASSET_ASSIGNED: { icon: "package", label: "Assigned", color: "text-blue-500", bg: "bg-blue-50" },
  ASSET_CHECKED_OUT: { icon: "package", label: "Checked Out", color: "text-blue-500", bg: "bg-blue-50" },
  ASSET_RETURNED: { icon: "arrow-left", label: "Returned", color: "text-action-500", bg: "bg-action-50" },
  ASSET_DAMAGED: { icon: "alert-triangle", label: "Damaged", color: "text-red-500", bg: "bg-red-50" },
  ASSET_LOST: { icon: "alert-triangle", label: "Lost", color: "text-red-500", bg: "bg-red-50" },
  ASSET_UPDATED: { icon: "package", label: "Updated", color: "text-shark-500 dark:text-shark-400", bg: "bg-shark-50 dark:bg-shark-800" },
  ASSET_DELETED: { icon: "package", label: "Deleted", color: "text-red-500", bg: "bg-red-50" },
  CONSUMABLE_CREATED: { icon: "plus", label: "Created", color: "text-action-500", bg: "bg-action-50" },
  CONSUMABLE_STOCK_ADDED: { icon: "droplet", label: "Restocked", color: "text-action-500", bg: "bg-action-50" },
  CONSUMABLE_REQUEST_CREATED: { icon: "clipboard", label: "Requested", color: "text-[#E8532E]", bg: "bg-amber-50" },
  CONSUMABLE_REQUEST_APPROVED: { icon: "check", label: "Approved", color: "text-action-500", bg: "bg-action-50" },
  CONSUMABLE_REQUEST_REJECTED: { icon: "alert-triangle", label: "Rejected", color: "text-red-500", bg: "bg-red-50" },
  CONSUMABLE_REQUEST_ISSUED: { icon: "check", label: "Issued", color: "text-blue-500", bg: "bg-blue-50" },
  CONSUMABLE_ASSIGNED: { icon: "droplet", label: "Assigned", color: "text-blue-500", bg: "bg-blue-50" },
  CONSUMABLE_RETURNED: { icon: "arrow-left", label: "Returned", color: "text-action-500", bg: "bg-action-50" },
  USER_CREATED: { icon: "users", label: "User Added", color: "text-action-500", bg: "bg-action-50" },
  USER_UPDATED: { icon: "users", label: "User Updated", color: "text-blue-500", bg: "bg-blue-50" },
  USER_DEACTIVATED: { icon: "users", label: "Deactivated", color: "text-red-500", bg: "bg-red-50" },
  STARTER_KIT_APPLIED: { icon: "star", label: "Kit Applied", color: "text-action-500", bg: "bg-action-50" },
  BULK_ITEMS_APPLIED: { icon: "star", label: "Items Applied", color: "text-action-500", bg: "bg-action-50" },
};

const defaultConfig = { icon: "clock" as const, label: "Activity", color: "text-shark-400", bg: "bg-shark-50 dark:bg-shark-800" };

/** Strip asset codes like (AST-001) from description to keep it clean */
function cleanDescription(desc: string): string {
  return desc
    .replace(/\s*\([A-Z]{2,5}-\d{3,6}\)/g, "") // remove (AST-001) patterns
    .replace(/\s*\([A-Z]+-[A-Z0-9-]+\)/g, "")  // remove other code patterns
    .replace(/"{1,2}/g, "")                       // remove quotes around names
    .trim();
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) redirect("/login");

  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam || "1", 10) || 1);
  const skip = (currentPage - 1) * PAGE_SIZE;

  const organizationId = session.user.organizationId!;

  const where = session.user.role === "BRANCH_MANAGER"
    ? {
        organizationId,
        OR: [
          { performedBy: { regionId: session.user.regionId } },
          { asset: { regionId: session.user.regionId! } },
          { consumable: { regionId: session.user.regionId! } },
        ],
      }
    : { organizationId };

  const [logs, totalCount] = await Promise.all([
    db.auditLog.findMany({
      where,
      include: {
        performedBy: { select: { name: true, email: true } },
        asset: { select: { name: true, assetCode: true } },
        consumable: { select: { name: true } },
        targetUser: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
    db.auditLog.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  // Group logs by date
  const grouped: Record<string, typeof logs> = {};
  for (const log of logs) {
    const dateKey = new Date(log.createdAt).toLocaleDateString("en-AU", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(log);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-shark-900 dark:text-shark-100 tracking-tight">Recent Activity</h1>
        <p className="text-sm text-shark-400 mt-1">
          {session.user.role === "SUPER_ADMIN" ? "All activity across locations" : "Activity in your region"}
        </p>
      </div>

      {logs.length === 0 && currentPage === 1 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-shark-400">No activity recorded yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([date, entries]) => (
            <div key={date}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-shark-400 mb-3 px-1">
                {date}
              </h2>
              <Card>
                <div className="divide-y divide-shark-50 dark:divide-shark-800">
                  {entries.map((log) => {
                    const config = ACTION_CONFIG[log.action] || defaultConfig;
                    const time = new Date(log.createdAt).toLocaleTimeString("en-AU", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const performer = log.performedBy.name || log.performedBy.email;
                    const cleaned = cleanDescription(log.description);

                    return (
                      <div key={log.id} className="flex items-center gap-3 px-4 sm:px-5 py-3">
                        {/* Icon */}
                        <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                          <Icon name={config.icon} size={15} className={config.color} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-shark-800 dark:text-shark-200 truncate">{cleaned}</p>
                          <p className="text-xs text-shark-400 mt-0.5">
                            {performer} · {time}
                          </p>
                        </div>

                        {/* Action label */}
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${config.bg} ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          ))}

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <p className="text-sm text-shark-400">
              Showing {skip + 1}&ndash;{Math.min(skip + PAGE_SIZE, totalCount)} of {totalCount}
            </p>
            <div className="flex items-center gap-2">
              {hasPrevious ? (
                <Link href={`/activity?page=${currentPage - 1}`}>
                  <Button variant="outline" size="sm">
                    <Icon name="arrow-left" size={14} className="mr-1.5" />
                    Previous
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  <Icon name="arrow-left" size={14} className="mr-1.5" />
                  Previous
                </Button>
              )}
              <span className="text-sm text-shark-500 dark:text-shark-400 px-2">
                {currentPage} / {totalPages}
              </span>
              {hasNext ? (
                <Link href={`/activity?page=${currentPage + 1}`}>
                  <Button variant="outline" size="sm">
                    Next
                    <Icon name="arrow-right" size={14} className="ml-1.5" />
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Next
                  <Icon name="arrow-right" size={14} className="ml-1.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
