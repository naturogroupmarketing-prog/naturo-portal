"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { acknowledgeAssetItem, acknowledgeConsumableItem, rejectKitAssetItem, rejectKitConsumableItem, returnStarterKit } from "@/app/actions/starter-kits";
import { staffReturnAsset, staffReturnConsumable } from "@/app/actions/returns";

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

interface ActiveKitApplication {
  id: string;
  kitName: string;
  appliedAt: string;
  assets: { id: string; name: string; assetCode: string; category: string }[];
  consumables: { id: string; name: string; unitType: string; quantity: number }[];
}

interface IndividualAsset {
  id: string;
  name: string;
  assetCode: string;
  category: string;
}

interface IndividualConsumable {
  id: string;
  name: string;
  unitType: string;
  quantity: number;
}

interface Props {
  stats: StatCard[];
  recentAssets?: unknown[];
  recentConsumables?: unknown[];
  recentRequests?: unknown[];
  unacknowledgedCount: number;
  pendingAssetItems?: PendingAssetItem[];
  pendingConsumableItems?: PendingConsumableItem[];
  activeKitApplications?: ActiveKitApplication[];
  individualAssets?: IndividualAsset[];
  individualConsumables?: IndividualConsumable[];
}

export function StaffDashboardClient({ stats, unacknowledgedCount, pendingAssetItems = [], pendingConsumableItems = [], activeKitApplications = [], individualAssets = [], individualConsumables = [] }: Props) {
  // Track item states: "received" | "not_received" | undefined (pending)
  const [itemStates, setItemStates] = useState<Record<string, { status: "received" | "not_received"; reason?: string }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Return kit modal state
  const [returningKitId, setReturningKitId] = useState<string | null>(null);
  const [returnCondition, setReturnCondition] = useState("GOOD");
  const [returnNotes, setReturnNotes] = useState("");
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [returnedKitIds, setReturnedKitIds] = useState<Set<string>>(new Set());
  const [equipmentExpanded, setEquipmentExpanded] = useState(false);

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
      // Process all items — both received and not received
      for (const item of pendingAssetItems) {
        const state = itemStates[`asset-${item.id}`];
        if (state?.status === "received") {
          await acknowledgeAssetItem(item.id);
        } else if (state?.status === "not_received") {
          await rejectKitAssetItem(item.id, state.reason || "Not received");
        }
      }
      for (const item of pendingConsumableItems) {
        const state = itemStates[`consumable-${item.id}`];
        if (state?.status === "received") {
          await acknowledgeConsumableItem(item.id);
        } else if (state?.status === "not_received") {
          await rejectKitConsumableItem(item.id, state.reason || "Not received");
        }
      }
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  // Individual item return state
  const [returningItemId, setReturningItemId] = useState<string | null>(null);
  const [returningItemType, setReturningItemType] = useState<"asset" | "consumable">("asset");
  const [returnedItemIds, setReturnedItemIds] = useState<Set<string>>(new Set());

  const handleReturnKit = async () => {
    if (!returningKitId) return;
    setReturnSubmitting(true);
    try {
      await returnStarterKit(returningKitId, returnCondition, returnNotes);
      setReturnedKitIds((prev) => new Set(prev).add(returningKitId));
      setReturningKitId(null);
      setReturnCondition("GOOD");
      setReturnNotes("");
    } finally {
      setReturnSubmitting(false);
    }
  };

  const handleReturnIndividualItem = async () => {
    if (!returningItemId) return;
    setReturnSubmitting(true);
    try {
      if (returningItemType === "asset") {
        await staffReturnAsset(returningItemId, returnCondition, returnNotes);
      } else {
        const item = individualConsumables.find((c) => c.id === returningItemId);
        await staffReturnConsumable(returningItemId, item?.quantity || 1, returnCondition, returnNotes);
      }
      setReturnedItemIds((prev) => new Set(prev).add(returningItemId));
      setReturningItemId(null);
      setReturnCondition("GOOD");
      setReturnNotes("");
    } finally {
      setReturnSubmitting(false);
    }
  };

  const visibleKitApplications = activeKitApplications.filter((app) => !returnedKitIds.has(app.id));
  const returningKit = activeKitApplications.find((app) => app.id === returningKitId);
  const visibleIndividualAssets = individualAssets.filter((a) => !returnedItemIds.has(a.id));
  const visibleIndividualConsumables = individualConsumables.filter((c) => !returnedItemIds.has(c.id));
  const hasEquipment = visibleKitApplications.length > 0 || visibleIndividualAssets.length > 0 || visibleIndividualConsumables.length > 0;

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

      {/* My Equipment — All assigned items */}
      {hasEquipment && (
        <Card className="border-l-4 border-l-action-400">
          <CardHeader
            className="cursor-pointer select-none"
            onClick={() => setEquipmentExpanded((prev) => !prev)}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-action-50 flex items-center justify-center">
                <Icon name="package" size={16} className="text-action-600" />
              </div>
              <div className="flex-1">
                <CardTitle>My Equipment</CardTitle>
                <p className="text-xs text-shark-400 mt-0.5">
                  Equipment currently assigned to you · {visibleKitApplications.reduce((n, a) => n + a.assets.length + a.consumables.length, 0) + visibleIndividualAssets.length + visibleIndividualConsumables.length} items
                </p>
              </div>
              <Icon
                name="chevron-down"
                size={18}
                className={`text-shark-400 transition-transform duration-200 ${equipmentExpanded ? "rotate-180" : ""}`}
              />
            </div>
          </CardHeader>
          {equipmentExpanded && <CardContent className="space-y-4">
            {/* Kit-based assignments */}
            {visibleKitApplications.map((app) => (
              <div key={app.id} className="border border-shark-100 rounded-lg overflow-hidden">
                {/* Kit header */}
                <div className="flex items-center justify-between px-4 py-3 bg-shark-50/50">
                  <div>
                    <p className="text-sm font-semibold text-shark-900">{app.kitName}</p>
                    <p className="text-xs text-shark-400">
                      Assigned {new Date(app.appliedAt).toLocaleDateString("en-AU")} · {app.assets.length + app.consumables.length} items
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                    onClick={() => {
                      setReturningKitId(app.id);
                      setReturnCondition("GOOD");
                      setReturnNotes("");
                    }}
                  >
                    <Icon name="arrow-left" size={14} className="mr-1.5" />
                    Return Kit
                  </Button>
                </div>

                {/* Kit items list */}
                <div className="divide-y divide-shark-50">
                  {app.assets.map((asset) => (
                    <div key={asset.id} className="flex items-center gap-3 px-4 py-2.5">
                      <Icon name="package" size={14} className="text-action-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-shark-800">{asset.name}</p>
                        <p className="text-xs text-shark-400">{asset.assetCode} · {asset.category}</p>
                      </div>
                    </div>
                  ))}
                  {app.consumables.map((consumable) => (
                    <div key={consumable.id} className="flex items-center gap-3 px-4 py-2.5">
                      <Icon name="droplet" size={14} className="text-blue-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-shark-800">{consumable.quantity}x {consumable.name}</p>
                        <p className="text-xs text-shark-400">{consumable.unitType}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Individual (non-kit) assignments */}
            {(visibleIndividualAssets.length > 0 || visibleIndividualConsumables.length > 0) && (
              <div className="border border-shark-100 rounded-lg overflow-hidden">
                {visibleKitApplications.length > 0 && (
                  <div className="px-4 py-3 bg-shark-50/50">
                    <p className="text-sm font-semibold text-shark-900">Other Assigned Items</p>
                  </div>
                )}
                <div className="divide-y divide-shark-50">
                  {visibleIndividualAssets.map((asset) => (
                    <div key={asset.id} className="flex items-center gap-3 px-4 py-2.5">
                      <Icon name="package" size={14} className="text-action-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-shark-800">{asset.name}</p>
                        <p className="text-xs text-shark-400">{asset.assetCode} · {asset.category}</p>
                      </div>
                      <button
                        onClick={() => {
                          setReturningItemId(asset.id);
                          setReturningItemType("asset");
                          setReturnCondition("GOOD");
                          setReturnNotes("");
                        }}
                        className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-md transition-colors shrink-0"
                      >
                        Return
                      </button>
                    </div>
                  ))}
                  {visibleIndividualConsumables.map((consumable) => (
                    <div key={consumable.id} className="flex items-center gap-3 px-4 py-2.5">
                      <Icon name="droplet" size={14} className="text-blue-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-shark-800">{consumable.quantity}x {consumable.name}</p>
                        <p className="text-xs text-shark-400">{consumable.unitType}</p>
                      </div>
                      <button
                        onClick={() => {
                          setReturningItemId(consumable.id);
                          setReturningItemType("consumable");
                          setReturnCondition("GOOD");
                          setReturnNotes("");
                        }}
                        className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-md transition-colors shrink-0"
                      >
                        Return
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>}
        </Card>
      )}

      {/* Return Kit Confirmation Modal */}
      {returningKitId && returningKit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-shark-100">
              <h3 className="text-lg font-semibold text-shark-900">Return Starter Kit</h3>
              <button
                onClick={() => setReturningKitId(null)}
                className="p-1.5 rounded-lg hover:bg-shark-100 text-shark-400"
              >
                <Icon name="x" size={18} />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <p className="text-sm text-amber-800">
                  You are returning <span className="font-semibold">&quot;{returningKit.kitName}&quot;</span> ({returningKit.assets.length + returningKit.consumables.length} items). This will be sent to your manager for verification before restocking.
                </p>
              </div>

              {/* Items being returned */}
              <div>
                <p className="text-xs font-medium text-shark-500 uppercase mb-2">Items to return</p>
                <div className="border border-shark-100 rounded-lg divide-y divide-shark-50 max-h-40 overflow-y-auto">
                  {returningKit.assets.map((a) => (
                    <div key={a.id} className="flex items-center gap-2 px-3 py-2">
                      <Icon name="package" size={12} className="text-action-500 shrink-0" />
                      <span className="text-sm text-shark-700">{a.name} ({a.assetCode})</span>
                    </div>
                  ))}
                  {returningKit.consumables.map((c) => (
                    <div key={c.id} className="flex items-center gap-2 px-3 py-2">
                      <Icon name="droplet" size={12} className="text-blue-500 shrink-0" />
                      <span className="text-sm text-shark-700">{c.quantity}x {c.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-sm font-medium text-shark-700 mb-1">Condition</label>
                <select
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value)}
                  className="w-full border border-shark-200 rounded-lg px-3 py-2 text-sm text-shark-800 focus:ring-2 focus:ring-action-500 focus:border-action-500"
                >
                  <option value="GOOD">Good</option>
                  <option value="FAIR">Fair</option>
                  <option value="POOR">Poor</option>
                  <option value="DAMAGED">Damaged</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-shark-700 mb-1">Notes (optional)</label>
                <textarea
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Any additional details about the return..."
                  rows={3}
                  className="w-full border border-shark-200 rounded-lg px-3 py-2 text-sm text-shark-800 focus:ring-2 focus:ring-action-500 focus:border-action-500 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-shark-100">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setReturningKitId(null)}
                disabled={returnSubmitting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={handleReturnKit}
                disabled={returnSubmitting}
              >
                {returnSubmitting ? "Returning..." : "Confirm Return"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Return Individual Item Modal */}
      {returningItemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-shark-100">
              <h3 className="text-lg font-semibold text-shark-900">Return Item</h3>
              <button
                onClick={() => setReturningItemId(null)}
                className="p-1.5 rounded-lg hover:bg-shark-100 text-shark-400"
              >
                <Icon name="x" size={18} />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <p className="text-sm text-amber-800">
                  This return will be sent to your manager for verification before restocking.
                </p>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-sm font-medium text-shark-700 mb-1">Condition</label>
                <select
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value)}
                  className="w-full border border-shark-200 rounded-lg px-3 py-2 text-sm text-shark-800 focus:ring-2 focus:ring-action-500 focus:border-action-500"
                >
                  <option value="GOOD">Good</option>
                  <option value="FAIR">Fair</option>
                  <option value="POOR">Poor</option>
                  <option value="DAMAGED">Damaged</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-shark-700 mb-1">Notes (optional)</label>
                <textarea
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Any additional details about the return..."
                  rows={3}
                  className="w-full border border-shark-200 rounded-lg px-3 py-2 text-sm text-shark-800 focus:ring-2 focus:ring-action-500 focus:border-action-500 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-shark-100">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setReturningItemId(null)}
                disabled={returnSubmitting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={handleReturnIndividualItem}
                disabled={returnSubmitting}
              >
                {returnSubmitting ? "Returning..." : "Confirm Return"}
              </Button>
            </div>
          </div>
        </div>
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
