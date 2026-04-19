"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon, type IconName } from "@/components/ui/icon";
import { formatDate } from "@/lib/utils";

interface RecentAsset {
  id: string;
  checkoutDate: string;
  assignmentType: string;
  isActive: boolean;
  asset: { name: string; assetCode: string; category: string };
}

interface RecentConsumable {
  id: string;
  assignedDate: string;
  quantity: number;
  isActive: boolean;
  consumable: { name: string; unitType: string };
}

interface RecentRequest {
  id: string;
  createdAt: string;
  quantity: number;
  status: string;
  consumable: { name: string; unitType: string };
}

type ActivityItem = {
  id: string;
  type: "asset" | "consumable" | "request";
  icon: IconName;
  iconBg: string;
  iconColor: string;
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
      title: a.asset.name,
      detail: `${a.asset.category} · ${a.assignmentType.toLowerCase()}`,
      date: a.checkoutDate,
      isActive: a.isActive,
    })),
    ...recentConsumables.map((c) => ({
      id: `consumable-${c.id}`,
      type: "consumable" as const,
      icon: "droplet" as IconName,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
      title: c.consumable.name,
      detail: `${c.quantity} ${c.consumable.unitType} assigned`,
      date: c.assignedDate,
      isActive: c.isActive,
    })),
    ...recentRequests.map((r) => ({
      id: `request-${r.id}`,
      type: "request" as const,
      icon: "clipboard" as IconName,
      iconBg: "bg-amber-50",
      iconColor: "text-[#E8532E]",
      title: r.consumable.name,
      detail: `${r.quantity} ${r.consumable.unitType} requested`,
      date: r.createdAt,
      badge: r.status,
    })),
  ];

  activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Card padding="none">
    <div className="p-4 sm:p-5 space-y-8">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-action-100 flex items-center justify-center shrink-0">
          <Icon name="clock" size={14} className="text-action-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-shark-900 dark:text-shark-100">Recent Activity</h3>
          <p className="text-xs text-shark-400">Your assignment and request history</p>
        </div>
      </div>

      {activities.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <Icon name="clock" size={32} className="text-shark-300 mx-auto mb-3" />
            <p className="text-sm text-shark-400">No recent activity.</p>
          </div>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-shark-50 dark:divide-shark-800">
              {activities.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={`w-8 h-8 rounded-lg ${item.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <Icon name={item.icon} size={16} className={item.iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-shark-800 dark:text-shark-200 truncate">{item.title}</p>
                    <p className="text-xs text-shark-400">{item.detail}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {item.badge && <Badge status={item.badge} />}
                    {item.isActive !== undefined && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${item.isActive ? "bg-action-50 text-action-600" : "bg-shark-100 text-shark-400"}`}>
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
