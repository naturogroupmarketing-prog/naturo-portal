"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { formatDate } from "@/lib/utils";
import { acknowledgeAssetItem, acknowledgeConsumableItem } from "@/app/actions/starter-kits";

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

interface PendingAssetItem {
  id: string;
  asset: { name: string; assetCode: string; category: string; imageUrl: string | null };
}

interface PendingConsumableItem {
  id: string;
  quantity: number;
  consumable: { name: string; unitType: string; imageUrl: string | null };
}

interface Props {
  stats: StatCard[];
  recentAssets: RecentAsset[];
  recentConsumables: RecentConsumable[];
  recentRequests: RecentRequest[];
  unacknowledgedCount: number;
  pendingAssetItems?: PendingAssetItem[];
  pendingConsumableItems?: PendingConsumableItem[];
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

export function StaffDashboardClient({ stats, recentAssets, recentConsumables, recentRequests, unacknowledgedCount, pendingAssetItems = [], pendingConsumableItems = [] }: Props) {
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState<string | null>(null);

  const hasPendingKit = pendingAssetItems.length > 0 || pendingConsumableItems.length > 0;

  const handleConfirmAsset = async (id: string) => {
    setConfirming(id);
    try {
      await acknowledgeAssetItem(id);
      setConfirmedIds((prev) => new Set([...prev, `asset-${id}`]));
    } finally {
      setConfirming(null);
    }
  };

  const handleConfirmConsumable = async (id: string) => {
    setConfirming(id);
    try {
      await acknowledgeConsumableItem(id);
      setConfirmedIds((prev) => new Set([...prev, `consumable-${id}`]));
    } finally {
      setConfirming(null);
    }
  };
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

      {/* Pending Starter Kit Checklist */}
      {hasPendingKit && (
        <Card className="border-l-4 border-l-amber-400">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Icon name="clipboard" size={16} className="text-amber-600" />
              </div>
              <div>
                <CardTitle>Equipment Checklist</CardTitle>
                <p className="text-xs text-shark-400 mt-0.5">
                  Confirm receipt of each item below. Items will appear on your dashboard once confirmed.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-shark-100">
              {/* Pending Assets */}
              {pendingAssetItems.map((item) => {
                const isConfirmed = confirmedIds.has(`asset-${item.id}`);
                const isRejected = confirmedIds.has(`rejected-asset-${item.id}`);
                const isDone = isConfirmed || isRejected;
                return (
                  <div
                    key={`asset-${item.id}`}
                    className={`flex items-center gap-3 px-3 py-2.5 transition-all ${
                      isConfirmed ? "bg-emerald-50/50 opacity-60" : isRejected ? "bg-red-50/50 opacity-60" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isConfirmed}
                      disabled={isDone}
                      onChange={() => { if (!isDone) handleConfirmAsset(item.id); }}
                      className="w-5 h-5 rounded border-shark-300 text-emerald-500 focus:ring-emerald-400 cursor-pointer shrink-0"
                    />
                    <Icon name="package" size={16} className={`shrink-0 ${isConfirmed ? "text-emerald-400" : isRejected ? "text-red-400" : "text-action-500"}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isConfirmed ? "line-through text-emerald-600" : isRejected ? "line-through text-red-500" : "text-shark-800"}`}>
                        {item.asset.name}
                      </p>
                      <p className="text-xs text-shark-400">{item.asset.assetCode} · {item.asset.category}</p>
                    </div>
                    {isConfirmed ? (
                      <span className="text-xs text-emerald-500 font-medium shrink-0">Received</span>
                    ) : isRejected ? (
                      <span className="text-xs text-red-500 font-medium shrink-0">Not received</span>
                    ) : (
                      <button
                        onClick={() => {
                          const reason = prompt("Why was this item not received?");
                          if (reason) {
                            setConfirmedIds((prev) => new Set([...prev, `rejected-asset-${item.id}`]));
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-shark-400 hover:text-red-500 transition-colors shrink-0"
                        title="Not received"
                      >
                        <Icon name="x" size={16} />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Pending Consumables */}
              {pendingConsumableItems.map((item) => {
                const isConfirmed = confirmedIds.has(`consumable-${item.id}`);
                const isRejected = confirmedIds.has(`rejected-consumable-${item.id}`);
                const isDone = isConfirmed || isRejected;
                return (
                  <div
                    key={`consumable-${item.id}`}
                    className={`flex items-center gap-3 px-3 py-2.5 transition-all ${
                      isConfirmed ? "bg-emerald-50/50 opacity-60" : isRejected ? "bg-red-50/50 opacity-60" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isConfirmed}
                      disabled={isDone}
                      onChange={() => { if (!isDone) handleConfirmConsumable(item.id); }}
                      className="w-5 h-5 rounded border-shark-300 text-emerald-500 focus:ring-emerald-400 cursor-pointer shrink-0"
                    />
                    <Icon name="droplet" size={16} className={`shrink-0 ${isConfirmed ? "text-emerald-400" : isRejected ? "text-red-400" : "text-blue-500"}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isConfirmed ? "line-through text-emerald-600" : isRejected ? "line-through text-red-500" : "text-shark-800"}`}>
                        {item.quantity}x {item.consumable.name}
                      </p>
                      <p className="text-xs text-shark-400">{item.consumable.unitType}</p>
                    </div>
                    {isConfirmed ? (
                      <span className="text-xs text-emerald-500 font-medium shrink-0">Received</span>
                    ) : isRejected ? (
                      <span className="text-xs text-red-500 font-medium shrink-0">Not received</span>
                    ) : (
                      <button
                        onClick={() => {
                          const reason = prompt("Why was this item not received?");
                          if (reason) {
                            setConfirmedIds((prev) => new Set([...prev, `rejected-consumable-${item.id}`]));
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-shark-400 hover:text-red-500 transition-colors shrink-0"
                        title="Not received"
                      >
                        <Icon name="x" size={16} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Summary when all processed */}
            {(() => {
              const totalItems = pendingAssetItems.length + pendingConsumableItems.length;
              const processedCount = [...confirmedIds].filter(id => !id.startsWith("rejected-")).length +
                [...confirmedIds].filter(id => id.startsWith("rejected-")).length;
              if (processedCount >= totalItems && totalItems > 0) {
                return (
                  <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
                    <p className="text-sm font-medium text-emerald-700">
                      All items processed! Confirmed items will now appear on your dashboard.
                    </p>
                  </div>
                );
              }
              return null;
            })()}
          </CardContent>
        </Card>
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
