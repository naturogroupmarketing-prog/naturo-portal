import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdminOrManager } from "@/lib/permissions";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const PAGE_SIZE = 50;

const actionIcons: Record<string, { icon: "package" | "droplet" | "users" | "check" | "alert-triangle" | "clipboard" | "clock"; color: string; bg: string }> = {
  ASSET_CREATED: { icon: "package", color: "text-action-500", bg: "bg-action-50" },
  ASSET_ASSIGNED: { icon: "package", color: "text-blue-500", bg: "bg-blue-50" },
  ASSET_CHECKED_OUT: { icon: "package", color: "text-blue-500", bg: "bg-blue-50" },
  ASSET_RETURNED: { icon: "check", color: "text-action-500", bg: "bg-action-50" },
  ASSET_DAMAGED: { icon: "alert-triangle", color: "text-red-500", bg: "bg-red-50" },
  ASSET_LOST: { icon: "alert-triangle", color: "text-red-500", bg: "bg-red-50" },
  CONSUMABLE_CREATED: { icon: "droplet", color: "text-action-500", bg: "bg-action-50" },
  CONSUMABLE_STOCK_ADDED: { icon: "droplet", color: "text-action-500", bg: "bg-action-50" },
  CONSUMABLE_REQUEST_CREATED: { icon: "clipboard", color: "text-[#E8532E]", bg: "bg-amber-50" },
  CONSUMABLE_REQUEST_APPROVED: { icon: "check", color: "text-action-500", bg: "bg-action-50" },
  CONSUMABLE_REQUEST_REJECTED: { icon: "alert-triangle", color: "text-red-500", bg: "bg-red-50" },
  CONSUMABLE_REQUEST_ISSUED: { icon: "droplet", color: "text-blue-500", bg: "bg-blue-50" },
  CONSUMABLE_ASSIGNED: { icon: "droplet", color: "text-blue-500", bg: "bg-blue-50" },
  CONSUMABLE_RETURNED: { icon: "check", color: "text-action-500", bg: "bg-action-50" },
  USER_CREATED: { icon: "users", color: "text-action-500", bg: "bg-action-50" },
  USER_UPDATED: { icon: "users", color: "text-blue-500", bg: "bg-blue-50" },
  USER_DEACTIVATED: { icon: "users", color: "text-red-500", bg: "bg-red-50" },
};

const defaultIcon = { icon: "clock" as const, color: "text-shark-400", bg: "bg-shark-50" };

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-shark-900">Recent Activity</h1>
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
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, entries]) => (
            <div key={date}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-shark-400 mb-3 px-1">
                {date}
              </h2>
              <Card>
                <div className="divide-y divide-shark-50">
                  {entries.map((log) => {
                    const style = actionIcons[log.action] || defaultIcon;
                    return (
                      <div key={log.id} className="flex items-start gap-3 px-5 py-4">
                        <div className={`w-8 h-8 rounded-lg ${style.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <Icon name={style.icon} size={16} className={style.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-shark-800">{log.description}</p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                            <span className="text-xs text-shark-400">
                              {log.performedBy.name || log.performedBy.email}
                            </span>
                            <span className="text-xs text-shark-300">&middot;</span>
                            <span className="text-xs text-shark-400">
                              {new Date(log.createdAt).toLocaleTimeString("en-AU", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {log.asset && (
                              <>
                                <span className="text-xs text-shark-300">&middot;</span>
                                <span className="text-xs font-mono text-shark-400">{log.asset.assetCode}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <Badge status={log.action.replace(/_/g, " ")} />
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          ))}

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-shark-400">
              Showing {skip + 1}&ndash;{Math.min(skip + PAGE_SIZE, totalCount)} of {totalCount} entries
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
              <span className="text-sm text-shark-500 px-2">
                Page {currentPage} of {totalPages}
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
