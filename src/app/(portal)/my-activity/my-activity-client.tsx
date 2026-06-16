"use client";

import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Icon, type IconName } from "@/components/ui/icon";
import { formatDate } from "@/lib/utils";

interface RecentAsset {
  id: string;
  checkoutDate: string;
  assignmentType: string;
  isActive: boolean;
  asset: { name: string; assetCode: string; category: string; imageUrl?: string | null };
}

interface RecentConsumable {
  id: string;
  assignedDate: string;
  quantity: number;
  isActive: boolean;
  consumable: { name: string; unitType: string; imageUrl?: string | null };
}

interface RecentRequest {
  id: string;
  createdAt: string;
  quantity: number;
  status: string;
  consumable: { name: string; unitType: string; imageUrl?: string | null };
}

type ActivityItem = {
  id: string;
  type: "asset" | "consumable" | "request";
  icon: IconName;
  iconBg: string;
  iconColor: string;
  imageUrl?: string | null;
  title: string;
  detail: string;
  date: string;
  badge?: string;
  isActive?: boolean;
};

export function MyActivityClient({
  recentAssets,
  recentConsumables,
  recentRequests,
}: {
  recentAssets: RecentAsset[];
  recentConsumables: RecentConsumable[];
  recentRequests: RecentRequest[];
}) {
  const activities: ActivityItem[] = [
    ...recentAssets.map((a) => ({
      id: `asset-${a.id}`,
      type: "asset" as const,
      icon: "package" as IconName,
      iconBg: "bg-action-50",
      iconColor: "text-action-500",
      imageUrl: a.asset.imageUrl,
      title: a.asset.name,
      detail: `${a.asset.category} · ${a.assignmentType.toLowerCase()}`,
      date: a.checkoutDate,
      isActive: a.isActive,
    })),
    ...recentConsumables.map((c) => ({
      id: `consumable-${c.id}`,
      type: "consumable" as const,
      icon: "droplet" as IconName,
      iconBg: "bg-action-50",
      iconColor: "text-action-500",
      imageUrl: c.consumable.imageUrl,
      title: c.consumable.name,
      detail: `${c.quantity} ${c.consumable.unitType} assigned`,
      date: c.assignedDate,
      isActive: c.isActive,
    })),
    ...recentRequests.map((r) => ({
      id: `request-${r.id}`,
      type: "request" as const,
      icon: "clipboard" as IconName,
      iconBg: "bg-action-50",
      iconColor: "text-action-500",
      imageUrl: r.consumable.imageUrl,
      title: r.consumable.name,
      detail: `${r.quantity} ${r.consumable.unitType} requested`,
      date: r.createdAt,
      badge: r.status,
    })),
  ];

  activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Card padding="none">
    <div className="px-5 py-4 space-y-8">
      <div>
        <h2 className="text-lg font-bold text-shark-900 dark:text-shark-100">Recent Activity</h2>
        <p className="text-xs text-shark-400 mt-0.5">Your assignment and request history</p>
      </div>

      {activities.length === 0 ? (
        <Card>
          <EmptyState
            icon="clock"
            title="No recent activity."
            description="Your assignment and request history will appear here."
          />
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-shark-50 dark:divide-shark-800">
              {activities.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={`w-9 h-9 rounded-[20px] overflow-hidden flex items-center justify-center flex-shrink-0 ${item.imageUrl ? "" : item.iconBg}`}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Icon name={item.icon} size={16} className={item.iconColor} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-shark-800 dark:text-shark-200 truncate">{item.title}</p>
                    <p className="text-xs text-shark-400">{item.detail}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {item.badge && <Badge status={item.badge} />}
                    {item.isActive !== undefined && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${item.isActive ? "bg-action-50 text-action-600" : "bg-shark-100 dark:bg-shark-800 text-shark-400"}`}>
                        {item.isActive ? "Active" : "Returned"}
                      </span>
                    )}
                    <span className="text-xs text-shark-400">{formatDate(item.date)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </Card>
  );
}
