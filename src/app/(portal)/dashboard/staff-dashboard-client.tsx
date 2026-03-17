"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon, type IconName } from "@/components/ui/icon";
import { formatDate } from "@/lib/utils";

interface StatCard {
  label: string;
  value: number;
  icon: IconName;
  borderColor: string;
  iconBg: string;
  iconColor: string;
  href: string;
}

interface RecentAsset {
  id: string;
  checkoutDate: string;
  assignmentType: string;
  asset: {
    name: string;
    assetCode: string;
    category: string;
  };
}

interface RecentConsumable {
  id: string;
  quantity: number;
  assignedDate: string;
  consumable: {
    name: string;
    unitType: string;
  };
}

interface RecentRequest {
  id: string;
  quantity: number;
  status: string;
  createdAt: string;
  consumable: {
    name: string;
    unitType: string;
  };
}

interface Props {
  stats: StatCard[];
  recentAssets: RecentAsset[];
  recentConsumables: RecentConsumable[];
  recentRequests: RecentRequest[];
  unacknowledgedCount: number;
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
};

export function StaffDashboardClient({ stats, recentAssets, recentConsumables, recentRequests, unacknowledgedCount }: Props) {
  // Build merged activity feed
  const activities: ActivityItem[] = [
    ...recentAssets.map((a) => ({
      id: `asset-${a.id}`,
      type: "asset" as const,
      icon: "package" as IconName,
      iconBg: "bg-action-50",
      iconColor: "text-action-500",
      title: a.asset.name,
      detail: `${a.asset.assetCode} · ${a.asset.category} · ${a.assignmentType.toLowerCase()}`,
      date: a.checkoutDate,
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
    })),
    ...recentRequests.map((r) => ({
      id: `request-${r.id}`,
      type: "request" as const,
      icon: "clipboard" as IconName,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-500",
      title: r.consumable.name,
      detail: `${r.quantity} ${r.consumable.unitType} requested`,
      date: r.createdAt,
      badge: r.status,
    })),
  ];

  activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const topActivities = activities.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-shark-900">Dashboard</h1>
        <p className="text-sm text-shark-400 mt-1">Your personal overview</p>
      </div>

      {/* Unacknowledged Assets Banner */}
      {unacknowledgedCount > 0 && (
        <Link href="/my-assets">
          <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 hover:bg-amber-100 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Icon name="alert-triangle" size={16} className="text-amber-600" />
            </div>
            <p className="text-sm text-amber-800">
              You have <span className="font-semibold">{unacknowledgedCount}</span> asset{unacknowledgedCount !== 1 ? "s" : ""} awaiting receipt confirmation
            </p>
          </div>
        </Link>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className={`border-l-4 ${stat.borderColor} hover:shadow-md transition-shadow cursor-pointer`}>
              <CardContent className="py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-shark-400">{stat.label}</p>
                    <p className="text-3xl font-bold text-shark-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                    <Icon name={stat.icon} size={24} className={stat.iconColor} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {topActivities.length === 0 ? (
            <p className="text-sm text-shark-400 text-center py-6">No recent activity.</p>
          ) : (
            <div className="divide-y divide-shark-50">
              {topActivities.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-3">
                  <div className={`w-8 h-8 rounded-lg ${item.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <Icon name={item.icon} size={16} className={item.iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-shark-800 truncate">{item.title}</p>
                    <p className="text-xs text-shark-400">{item.detail}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.badge && <Badge status={item.badge} />}
                    <span className="text-xs text-shark-400">{formatDate(item.date)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-shark-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/request-consumables">
            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="py-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                  <Icon name="plus" size={24} className="text-emerald-500" />
                </div>
                <div>
                  <p className="font-semibold text-shark-900">Request Consumables</p>
                  <p className="text-xs text-shark-400">Request items from your region</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/report-damage">
            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="py-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                  <Icon name="alert-triangle" size={24} className="text-red-500" />
                </div>
                <div>
                  <p className="font-semibold text-shark-900">Report Damage/Loss</p>
                  <p className="text-xs text-shark-400">Report an issue with your assets</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
