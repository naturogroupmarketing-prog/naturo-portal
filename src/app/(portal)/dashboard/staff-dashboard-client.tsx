"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
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
  recentAssets?: unknown[];
  recentConsumables?: unknown[];
  recentRequests?: unknown[];
  unacknowledgedCount: number;
  pendingAssetItems?: PendingAssetItem[];
  pendingConsumableItems?: PendingConsumableItem[];
}

export function StaffDashboardClient({ stats, unacknowledgedCount, pendingAssetItems = [], pendingConsumableItems = [] }: Props) {
  // Track item states: "received" | "not_received" | undefined (pending)
  const [itemStates, setItemStates] = useState<Record<string, { status: "received" | "not_received"; reason?: string }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const hasPendingKit = (pendingAssetItems.length > 0 || pendingConsumableItems.length > 0) && !submitted;

  const totalItems = pendingAssetItems.length + pendingConsumableItems.length;
  const processedCount = Object.keys(itemStates).length;
  const allProcessed = processedCount >= totalItems && totalItems > 0;

  const toggleItem = (key: string, status: "received" | "not_received", reason?: string) => {
    setItemStates((prev) => {
      const next = { ...prev };
      // If clicking same status, remove it (toggle off)
      if (next[key]?.status === status) {
        delete next[key];
      } else {
        next[key] = { status, reason };
      }
      return next;
    });
  };

  const handleFinalConfirm = async () => {
    setSubmitting(true);
    try {
      // Process all received items
      for (const item of pendingAssetItems) {
        const state = itemStates[`asset-${item.id}`];
        if (state?.status === "received") {
          await acknowledgeAssetItem(item.id);
        }
      }
      for (const item of pendingConsumableItems) {
        const state = itemStates[`consumable-${item.id}`];
        if (state?.status === "received") {
          await acknowledgeConsumableItem(item.id);
        }
      }
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

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
                const key = `asset-${item.id}`;
                const state = itemStates[key];
                const isReceived = state?.status === "received";
                const isNotReceived = state?.status === "not_received";
                return (
                  <div
                    key={key}
                    className={`flex items-center gap-3 px-3 py-2.5 transition-all ${
                      isReceived ? "bg-emerald-50/50" : isNotReceived ? "bg-red-50/50" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isReceived}
                      onChange={() => toggleItem(key, "received")}
                      className="w-5 h-5 rounded border-shark-300 text-emerald-500 focus:ring-emerald-400 cursor-pointer shrink-0"
                    />
                    <Icon name="package" size={16} className={`shrink-0 ${isReceived ? "text-emerald-400" : isNotReceived ? "text-red-400" : "text-action-500"}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isReceived ? "line-through text-emerald-600" : isNotReceived ? "line-through text-red-500" : "text-shark-800"}`}>
                        {item.asset.name}
                      </p>
                      <p className="text-xs text-shark-400">{item.asset.assetCode} · {item.asset.category}</p>
                      {isNotReceived && state.reason && (
                        <p className="text-xs text-red-400 mt-0.5">Reason: {state.reason}</p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        if (isNotReceived) {
                          toggleItem(key, "not_received");
                        } else {
                          const reason = prompt("Why was this item not received?");
                          if (reason) toggleItem(key, "not_received", reason);
                        }
                      }}
                      className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                        isNotReceived ? "bg-red-100 text-red-500" : "hover:bg-red-50 text-shark-400 hover:text-red-500"
                      }`}
                      title={isNotReceived ? "Undo not received" : "Not received"}
                    >
                      <Icon name="x" size={16} />
                    </button>
                  </div>
                );
              })}

              {/* Pending Consumables */}
              {pendingConsumableItems.map((item) => {
                const key = `consumable-${item.id}`;
                const state = itemStates[key];
                const isReceived = state?.status === "received";
                const isNotReceived = state?.status === "not_received";
                return (
                  <div
                    key={key}
                    className={`flex items-center gap-3 px-3 py-2.5 transition-all ${
                      isReceived ? "bg-emerald-50/50" : isNotReceived ? "bg-red-50/50" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isReceived}
                      onChange={() => toggleItem(key, "received")}
                      className="w-5 h-5 rounded border-shark-300 text-emerald-500 focus:ring-emerald-400 cursor-pointer shrink-0"
                    />
                    <Icon name="droplet" size={16} className={`shrink-0 ${isReceived ? "text-emerald-400" : isNotReceived ? "text-red-400" : "text-blue-500"}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isReceived ? "line-through text-emerald-600" : isNotReceived ? "line-through text-red-500" : "text-shark-800"}`}>
                        {item.quantity}x {item.consumable.name}
                      </p>
                      <p className="text-xs text-shark-400">{item.consumable.unitType}</p>
                      {isNotReceived && state.reason && (
                        <p className="text-xs text-red-400 mt-0.5">Reason: {state.reason}</p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        if (isNotReceived) {
                          toggleItem(key, "not_received");
                        } else {
                          const reason = prompt("Why was this item not received?");
                          if (reason) toggleItem(key, "not_received", reason);
                        }
                      }}
                      className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                        isNotReceived ? "bg-red-100 text-red-500" : "hover:bg-red-50 text-shark-400 hover:text-red-500"
                      }`}
                      title={isNotReceived ? "Undo not received" : "Not received"}
                    >
                      <Icon name="x" size={16} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Final confirm button */}
            {allProcessed && (
              <div className="mt-4 pt-3 border-t border-shark-100">
                <Button
                  className="w-full"
                  onClick={handleFinalConfirm}
                  disabled={submitting}
                >
                  {submitting ? "Confirming..." : `Confirm Receipt (${Object.values(itemStates).filter(s => s.status === "received").length} received, ${Object.values(itemStates).filter(s => s.status === "not_received").length} not received)`}
                </Button>
              </div>
            )}
            {!allProcessed && totalItems > 0 && (
              <p className="text-xs text-shark-400 text-center mt-3">
                {processedCount} of {totalItems} items marked — mark all items to confirm
              </p>
            )}
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
