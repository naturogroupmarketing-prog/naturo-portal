"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { batchConfirmKitReceipt, returnStarterKit } from "@/app/actions/starter-kits";
import { staffReturnAsset, staffReturnConsumable } from "@/app/actions/returns";
import { submitConditionCheck } from "@/app/actions/condition-checks";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";

// Custom styled condition dropdown matching app design
function ConditionSelect({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const options = [
    { value: "GOOD", label: "Good", color: "text-green-600" },
    { value: "FAIR", label: "Fair", color: "text-blue-600" },
    { value: "POOR", label: "Poor", color: "text-amber-600" },
    { value: "DAMAGED", label: "Damaged", color: "text-red-600" },
  ];
  const selected = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    if (!open) return;
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    const handle = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return;
      if (menuRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between rounded-xl border border-shark-200 dark:border-shark-700 bg-white dark:bg-shark-800 px-3.5 py-2.5 text-sm min-h-[44px] transition-all ${
          open ? "border-action-400 ring-2 ring-action-400/20" : "hover:border-shark-300 dark:hover:border-shark-600"
        }`}
      >
        <span className={`font-medium ${selected.color}`}>{selected.label}</span>
        <Icon name="chevron-down" size={16} className={`text-shark-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
          style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
          className="bg-white dark:bg-shark-800 rounded-xl shadow-lg border border-shark-100 dark:border-shark-700 py-1"
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-3.5 py-2.5 text-sm transition-colors flex items-center justify-between ${
                opt.value === value ? "bg-action-50 dark:bg-action-500/20 font-medium" : "hover:bg-shark-50 dark:hover:bg-shark-700"
              } ${opt.color}`}
            >
              {opt.label}
              {opt.value === value && <Icon name="check" size={16} className="text-action-500" />}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

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
  starterKitApplicationId: string | null;
  asset: { name: string; assetCode: string; category: string; imageUrl: string | null };
}

interface PendingConsumableItem {
  id: string;
  starterKitApplicationId: string | null;
  quantity: number;
  consumable: { name: string; unitType: string; category: string; imageUrl: string | null };
}

interface ActiveKitApplication {
  id: string;
  kitName: string;
  appliedAt: string;
  assets: { id: string; name: string; assetCode: string; category: string; imageUrl: string | null }[];
  consumables: { id: string; name: string; unitType: string; quantity: number; imageUrl: string | null }[];
}

interface IndividualAsset {
  id: string;
  name: string;
  assetCode: string;
  category: string;
  imageUrl: string | null;
}

interface IndividualConsumable {
  id: string;
  name: string;
  unitType: string;
  quantity: number;
  imageUrl: string | null;
}

interface ConditionCheckItem {
  id: string;
  type: "ASSET" | "CONSUMABLE";
  name: string;
  code: string | null;
  category: string | null;
  imageUrl: string | null;
  photoLabel: string | null;
  checked: boolean;
  condition: string | null;
}

interface UsageMonth {
  month: string;
  label: string;
  totalUsed: number;
  items: { name: string; quantity: number; unitType: string }[];
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
  conditionCheckItems?: ConditionCheckItem[];
  conditionCheckMonth?: string;
  conditionCheckFrequency?: string | null;
  conditionCheckDueDate?: string | null;
  inspectionSchedules?: { id: string; title: string; dueDate: string; notes: string | null }[];
  consumableUsageHistory?: UsageMonth[];
}

export function StaffDashboardClient({ stats, unacknowledgedCount, pendingAssetItems = [], pendingConsumableItems = [], activeKitApplications = [], individualAssets = [], individualConsumables = [], conditionCheckItems = [], conditionCheckMonth = "", conditionCheckFrequency = null, conditionCheckDueDate = null, inspectionSchedules = [], consumableUsageHistory = [] }: Props) {
  const router = useRouter();
  const { addToast } = useToast();
  // Track item states: "received" | "not_received" | undefined (pending)
  const [itemStates, setItemStates] = useState<Record<string, { status: "received" | "not_received"; reason?: string }>>({});
  const [submitting, setSubmitting] = useState(false);

  // Condition check state
  const [checkStates, setCheckStates] = useState<Record<string, { condition: string; photoUrl: string; notes: string; uploading: boolean; submitting: boolean }>>({});
  const [showConditionChecks, setShowConditionChecks] = useState(false);
  const [showUsageHistory, setShowUsageHistory] = useState(false);
  const getCheckKey = (item: ConditionCheckItem) => item.photoLabel ? `${item.type}-${item.id}-${item.photoLabel}` : `${item.type}-${item.id}`;
  const checkedCount = conditionCheckItems.filter((i) => i.checked || checkStates[getCheckKey(i)]?.photoUrl).length;

  const handleCheckPhotoUpload = async (key: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      addToast("Image must be under 5MB", "error");
      return;
    }
    setCheckStates((prev) => ({ ...prev, [key]: { ...prev[key], condition: prev[key]?.condition || "GOOD", notes: prev[key]?.notes || "", photoUrl: "", uploading: true, submitting: false } }));
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const { url } = await res.json();
        setCheckStates((prev) => ({ ...prev, [key]: { ...prev[key], photoUrl: url, uploading: false } }));
      } else {
        addToast("Failed to upload photo", "error");
        setCheckStates((prev) => ({ ...prev, [key]: { ...prev[key], uploading: false } }));
      }
    } catch {
      addToast("Failed to upload photo", "error");
      setCheckStates((prev) => ({ ...prev, [key]: { ...prev[key], uploading: false } }));
    }
  };

  const handleSubmitCheck = async (item: ConditionCheckItem) => {
    const key = getCheckKey(item);
    const state = checkStates[key];
    if (!state?.photoUrl) { addToast("Please take a photo first", "error"); return; }
    setCheckStates((prev) => ({ ...prev, [key]: { ...prev[key], submitting: true } }));
    try {
      await submitConditionCheck({
        itemType: item.type,
        assetId: item.type === "ASSET" ? item.id : undefined,
        consumableId: item.type === "CONSUMABLE" ? item.id : undefined,
        condition: state.condition || "GOOD",
        photoUrl: state.photoUrl,
        photoLabel: item.photoLabel || undefined,
        notes: state.notes || undefined,
      });
      addToast(`Condition check submitted for ${item.name}`, "success");
      router.refresh();
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed to submit", "error");
    } finally {
      setCheckStates((prev) => ({ ...prev, [key]: { ...prev[key], submitting: false } }));
    }
  };
  const [submitted, setSubmitted] = useState(false);

  // Return kit modal state
  const [returningKitId, setReturningKitId] = useState<string | null>(null);
  const [returnCondition, setReturnCondition] = useState("GOOD");
  const [returnNotes, setReturnNotes] = useState("");
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [returnedKitIds, setReturnedKitIds] = useState<Set<string>>(new Set());
  const [equipmentExpanded, setEquipmentExpanded] = useState(false);
  // Per-item exclusion state: keyed by "asset-{id}" or "consumable-{id}"
  const [kitItemExclusions, setKitItemExclusions] = useState<Record<string, { excluded: boolean; note: string }>>({});

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

  // Select All toggle for kit receipt
  const allReceivedAlready = totalItems > 0 &&
    pendingAssetItems.every((item) => itemStates[`asset-${item.id}`]?.status === "received") &&
    pendingConsumableItems.every((item) => itemStates[`consumable-${item.id}`]?.status === "received");

  const handleSelectAll = () => {
    if (allReceivedAlready) {
      setItemStates({});
    } else {
      const newStates: typeof itemStates = {};
      pendingAssetItems.forEach((item) => { newStates[`asset-${item.id}`] = { status: "received" }; });
      pendingConsumableItems.forEach((item) => { newStates[`consumable-${item.id}`] = { status: "received" }; });
      setItemStates(newStates);
    }
  };

  const handleFinalConfirm = async () => {
    setSubmitting(true);
    try {
      // Get applicationId from first item
      const applicationId = pendingAssetItems[0]?.starterKitApplicationId || pendingConsumableItems[0]?.starterKitApplicationId;
      if (!applicationId) throw new Error("No application ID found");

      // Build batch items
      const batchItems: { id: string; type: "asset" | "consumable"; status: "received" | "not_received"; reason?: string }[] = [];

      for (const item of pendingAssetItems) {
        const state = itemStates[`asset-${item.id}`];
        if (state) {
          batchItems.push({ id: item.id, type: "asset", status: state.status, reason: state.reason });
        }
      }
      for (const item of pendingConsumableItems) {
        const state = itemStates[`consumable-${item.id}`];
        if (state) {
          batchItems.push({ id: item.id, type: "consumable", status: state.status, reason: state.reason });
        }
      }

      await batchConfirmKitReceipt(applicationId, batchItems);
      setSubmitted(true);
      addToast("Kit receipt confirmed successfully", "success");
      router.refresh();
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed to confirm receipt. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Return All state
  const [showReturnAll, setShowReturnAll] = useState(false);
  const [returnAllSelected, setReturnAllSelected] = useState<Set<string>>(new Set());

  // Individual item return state
  const [returningItemId, setReturningItemId] = useState<string | null>(null);
  const [returningItemType, setReturningItemType] = useState<"asset" | "consumable">("asset");
  const [returnedItemIds, setReturnedItemIds] = useState<Set<string>>(new Set());

  const [returnError, setReturnError] = useState<string | null>(null);

  const handleReturnKit = async () => {
    if (!returningKitId) return;
    setReturnSubmitting(true);
    setReturnError(null);
    try {
      // Build excluded items list from exclusion state
      const excludedItems = Object.entries(kitItemExclusions)
        .filter(([, v]) => v.excluded)
        .map(([key, v]) => {
          const [itemType, itemId] = key.startsWith("asset-")
            ? ["ASSET", key.replace("asset-", "")]
            : ["CONSUMABLE", key.replace("consumable-", "")];
          return { itemType, itemId, note: v.note };
        });

      await returnStarterKit(
        returningKitId,
        returnCondition,
        returnNotes,
        excludedItems.length > 0 ? excludedItems : undefined
      );
      setReturnedKitIds((prev) => new Set(prev).add(returningKitId));
      setReturningKitId(null);
      setReturnCondition("GOOD");
      setReturnNotes("");
      setKitItemExclusions({});
      addToast("Kit returned successfully", "success");
      router.refresh();
    } catch (err) {
      setReturnError(err instanceof Error ? err.message : "Failed to return kit. Please try again.");
    } finally {
      setReturnSubmitting(false);
    }
  };

  const handleReturnIndividualItem = async () => {
    if (!returningItemId) return;
    setReturnSubmitting(true);
    setReturnError(null);
    try {
      if (returningItemType === "asset") {
        await staffReturnAsset(returningItemId, returnCondition, returnNotes);
      } else {
        const item = individualConsumables.find((c) => c.id === returningItemId);
        await staffReturnConsumable(returningItemId, item?.quantity || 1, returnCondition, returnNotes);
      }
      setReturnedItemIds((prev) => new Set(prev).add(returningItemId));
      setReturningItemId(null);
      addToast("Item returned successfully", "success");
      router.refresh();
      setReturnCondition("GOOD");
      setReturnNotes("");
    } catch (err) {
      setReturnError(err instanceof Error ? err.message : "Failed to return item. Please try again.");
    } finally {
      setReturnSubmitting(false);
    }
  };

  // Build all returnable items list for "Return All"
  const allReturnableItems: { key: string; type: "asset" | "consumable"; id: string; name: string; code?: string; category?: string; quantity?: number; unitType?: string; kitName?: string; imageUrl?: string | null }[] = [];
  for (const app of activeKitApplications) {
    if (returnedKitIds.has(app.id)) continue;
    for (const a of app.assets) allReturnableItems.push({ key: `kit-asset-${a.id}`, type: "asset", id: a.id, name: a.name, code: a.assetCode, category: a.category, kitName: app.kitName, imageUrl: a.imageUrl });
    for (const c of app.consumables) allReturnableItems.push({ key: `kit-consumable-${c.id}`, type: "consumable", id: c.id, name: c.name, quantity: c.quantity, unitType: c.unitType, kitName: app.kitName, imageUrl: c.imageUrl });
  }
  for (const a of individualAssets) {
    if (returnedItemIds.has(a.id)) continue;
    allReturnableItems.push({ key: `ind-asset-${a.id}`, type: "asset", id: a.id, name: a.name, code: a.assetCode, category: a.category, imageUrl: a.imageUrl });
  }
  for (const c of individualConsumables) {
    if (returnedItemIds.has(c.id)) continue;
    allReturnableItems.push({ key: `ind-consumable-${c.id}`, type: "consumable", id: c.id, name: c.name, quantity: c.quantity, unitType: c.unitType, imageUrl: c.imageUrl });
  }

  const openReturnAll = () => {
    setReturnAllSelected(new Set(allReturnableItems.map((i) => i.key)));
    setReturnCondition("GOOD");
    setReturnNotes("");
    setShowReturnAll(true);
  };

  const handleReturnAll = async () => {
    setReturnSubmitting(true);
    setReturnError(null);
    try {
      // Return kits that have ALL their items selected
      for (const app of activeKitApplications) {
        if (returnedKitIds.has(app.id)) continue;
        const kitAssetKeys = app.assets.map((a) => `kit-asset-${a.id}`);
        const kitConsumableKeys = app.consumables.map((c) => `kit-consumable-${c.id}`);
        const allKitKeys = [...kitAssetKeys, ...kitConsumableKeys];
        const selectedKitKeys = allKitKeys.filter((k) => returnAllSelected.has(k));

        if (selectedKitKeys.length > 0) {
          // Build exclusion list for unselected kit items
          const excludedItems = allKitKeys
            .filter((k) => !returnAllSelected.has(k))
            .map((k) => {
              const [, itemType, itemId] = k.split("-");
              return { itemType: itemType === "asset" ? "ASSET" : "CONSUMABLE", itemId, note: "Not returned" };
            });
          await returnStarterKit(app.id, returnCondition, returnNotes, excludedItems.length > 0 ? excludedItems : undefined);
          setReturnedKitIds((prev) => new Set(prev).add(app.id));
        }
      }

      // Return selected individual items
      for (const item of allReturnableItems) {
        if (!returnAllSelected.has(item.key)) continue;
        if (item.key.startsWith("kit-")) continue; // handled above
        if (item.type === "asset") {
          await staffReturnAsset(item.id, returnCondition, returnNotes);
        } else {
          await staffReturnConsumable(item.id, item.quantity || 1, returnCondition, returnNotes);
        }
        setReturnedItemIds((prev) => new Set(prev).add(item.id));
      }

      setShowReturnAll(false);
      addToast("Items returned successfully", "success");
      router.refresh();
    } catch (err) {
      setReturnError(err instanceof Error ? err.message : "Failed to return items.");
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
    <PullToRefresh>
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-action-100 flex items-center justify-center shrink-0">
          <Icon name="home" size={14} className="text-action-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-shark-900">Dashboard</h3>
          <p className="text-xs text-shark-400">Your personal overview</p>
        </div>
      </div>

      {/* Pending Starter Kit Checklist */}
      {hasPendingKit && (
        <Card className="">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Icon name="clipboard" size={16} className="text-[#E8532E]" />
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
            {/* Select All toggle */}
            <div className="flex items-center justify-between px-3 py-2 mb-1">
              <p className="text-xs text-shark-400">
                {processedCount} of {totalItems} items marked
              </p>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs font-medium text-action-600 hover:text-action-700 transition-colors"
              >
                {allReceivedAlready ? "Deselect All" : "Select All as Received"}
              </button>
            </div>
            <div className="space-y-4">
              {/* Assets — grouped by category */}
              {(() => {
                const assetsByCategory = new Map<string, PendingAssetItem[]>();
                for (const item of pendingAssetItems) {
                  const cat = item.asset.category || "Other";
                  if (!assetsByCategory.has(cat)) assetsByCategory.set(cat, []);
                  assetsByCategory.get(cat)!.push(item);
                }
                return Array.from(assetsByCategory.entries()).map(([cat, items]) => (
                  <div key={`asset-cat-${cat}`}>
                    <p className="text-[10px] font-semibold text-shark-400 uppercase tracking-wider px-3 mb-1">{cat}</p>
                    <div className="divide-y divide-shark-100 dark:divide-shark-700">
                      {items.map((item) => {
                        const key = `asset-${item.id}`;
                        const state = itemStates[key];
                        const isReceived = state?.status === "received";
                        const isNotReceived = state?.status === "not_received";
                        return (
                          <div key={key} className={`flex items-center gap-3 px-3 py-2.5 transition-all ${isReceived ? "bg-action-50/50" : isNotReceived ? "bg-red-50/50" : ""}`}>
                            <input type="checkbox" checked={isReceived} onChange={() => toggleItem(key, "received")} className="w-5 h-5 rounded border-shark-300 text-action-500 focus:ring-action-400 cursor-pointer shrink-0" />
                            <div className="w-9 h-9 rounded-lg overflow-hidden bg-shark-50 dark:bg-shark-800 border border-shark-100 dark:border-shark-700 flex items-center justify-center shrink-0">
                              {item.asset.imageUrl ? <img src={item.asset.imageUrl} alt="" className="w-full h-full object-cover" /> : <Icon name="package" size={14} className="text-shark-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${isReceived ? "line-through text-action-600" : isNotReceived ? "line-through text-red-500" : "text-shark-800"}`}>{item.asset.name}</p>
                              <p className="text-xs text-shark-400">{item.asset.category}</p>
                              {isNotReceived && state.reason && <p className="text-xs text-red-400 mt-0.5">Reason: {state.reason}</p>}
                            </div>
                            <button onClick={() => { if (isNotReceived) { toggleItem(key, "not_received"); } else { const reason = prompt("Why was this item not received?"); if (reason) toggleItem(key, "not_received", reason); } }} className={`p-1.5 rounded-lg transition-colors shrink-0 ${isNotReceived ? "bg-red-100 text-red-500" : "hover:bg-red-50 text-shark-400 hover:text-red-500"}`} title={isNotReceived ? "Undo not received" : "Not received"}>
                              <Icon name="x" size={16} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()}

              {/* Consumables — grouped by category */}
              {(() => {
                const consumablesByCategory = new Map<string, PendingConsumableItem[]>();
                for (const item of pendingConsumableItems) {
                  const cat = item.consumable.category || "Other";
                  if (!consumablesByCategory.has(cat)) consumablesByCategory.set(cat, []);
                  consumablesByCategory.get(cat)!.push(item);
                }
                return Array.from(consumablesByCategory.entries()).map(([cat, items]) => (
                  <div key={`consumable-cat-${cat}`}>
                    <p className="text-[10px] font-semibold text-shark-400 uppercase tracking-wider px-3 mb-1">{cat}</p>
                    <div className="divide-y divide-shark-100 dark:divide-shark-700">
                      {items.map((item) => {
                        const key = `consumable-${item.id}`;
                        const state = itemStates[key];
                        const isReceived = state?.status === "received";
                        const isNotReceived = state?.status === "not_received";
                        return (
                          <div key={key} className={`flex items-center gap-3 px-3 py-2.5 transition-all ${isReceived ? "bg-action-50/50" : isNotReceived ? "bg-red-50/50" : ""}`}>
                            <input type="checkbox" checked={isReceived} onChange={() => toggleItem(key, "received")} className="w-5 h-5 rounded border-shark-300 text-action-500 focus:ring-action-400 cursor-pointer shrink-0" />
                            <div className="w-9 h-9 rounded-lg overflow-hidden bg-shark-50 dark:bg-shark-800 border border-shark-100 dark:border-shark-700 flex items-center justify-center shrink-0">
                              {item.consumable.imageUrl ? <img src={item.consumable.imageUrl} alt="" className="w-full h-full object-cover" /> : <Icon name="droplet" size={14} className="text-shark-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${isReceived ? "line-through text-action-600" : isNotReceived ? "line-through text-red-500" : "text-shark-800"}`}>{item.quantity}x {item.consumable.name}</p>
                              <p className="text-xs text-shark-400">{item.consumable.unitType}</p>
                              {isNotReceived && state.reason && <p className="text-xs text-red-400 mt-0.5">Reason: {state.reason}</p>}
                            </div>
                            <button onClick={() => { if (isNotReceived) { toggleItem(key, "not_received"); } else { const reason = prompt("Why was this item not received?"); if (reason) toggleItem(key, "not_received", reason); } }} className={`p-1.5 rounded-lg transition-colors shrink-0 ${isNotReceived ? "bg-red-100 text-red-500" : "hover:bg-red-50 text-shark-400 hover:text-red-500"}`} title={isNotReceived ? "Undo not received" : "Not received"}>
                              <Icon name="x" size={16} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()}
            </div>

            {/* Processing overlay */}
            {submitting && (
              <div className="relative mt-4 pt-3 border-t border-shark-100 dark:border-shark-700">
                <div className="flex flex-col items-center py-6 animate-fade-in">
                  <div className="w-12 h-12 rounded-full bg-action-50 flex items-center justify-center mb-3">
                    <svg className="animate-spinner text-action-500" width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
                      <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-shark-700">Processing your receipt...</p>
                  <p className="text-xs text-shark-400 mt-1">Updating inventory records</p>
                  <div className="w-48 h-1.5 bg-shark-100 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-action-400 rounded-full animate-progress-bar" />
                  </div>
                </div>
              </div>
            )}

            {/* Final confirm button */}
            {allProcessed && !submitting && (
              <div className="mt-4 pt-3 border-t border-shark-100 dark:border-shark-700">
                <Button
                  className="w-full"
                  onClick={handleFinalConfirm}
                  loading={submitting}
                >
                  Confirm Receipt ({Object.values(itemStates).filter(s => s.status === "received").length} received, {Object.values(itemStates).filter(s => s.status === "not_received").length} not received)
                </Button>
              </div>
            )}
            {!allProcessed && !submitting && totalItems > 0 && (
              <p className="text-xs text-shark-400 text-center mt-3">
                {processedCount} of {totalItems} items marked — mark all items to confirm
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Starter Kit — All assigned items */}
      {hasEquipment && (
        <Card className="">
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
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 shrink-0"
                onClick={(e) => { e.stopPropagation(); openReturnAll(); }}
              >
                <Icon name="arrow-left" size={14} className="mr-1.5" />
                Return All
              </Button>
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
                      setKitItemExclusions({});
                    }}
                  >
                    <Icon name="arrow-left" size={14} className="mr-1.5" />
                    Return Kit
                  </Button>
                </div>

                {/* Kit items list */}
                <div className="divide-y divide-shark-50 dark:divide-shark-800">
                  {app.assets.map((asset) => (
                    <div key={asset.id} className="flex items-center gap-3 px-4 py-2.5">
                      <div className="w-9 h-9 rounded-lg overflow-hidden bg-shark-50 flex items-center justify-center shrink-0">
                        {asset.imageUrl ? <img src={asset.imageUrl} alt={asset.name} className="w-full h-full object-cover" /> : <Icon name="package" size={14} className="text-shark-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-shark-800">{asset.name}</p>
                        <p className="text-xs text-shark-400">{asset.category}</p>
                      </div>
                    </div>
                  ))}
                  {app.consumables.map((consumable) => (
                    <div key={consumable.id} className={`flex items-center gap-3 px-4 py-2.5 ${consumable.quantity === 0 ? "opacity-40" : ""}`}>
                      <div className="w-9 h-9 rounded-lg overflow-hidden bg-shark-50 flex items-center justify-center shrink-0">
                        {consumable.imageUrl ? <img src={consumable.imageUrl} alt={consumable.name} className="w-full h-full object-cover" /> : <Icon name="droplet" size={14} className="text-shark-400" />}
                      </div>
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
                <div className="px-4 py-3 bg-shark-50/50">
                  <p className="text-sm font-semibold text-shark-900">Individually Assigned Items</p>
                  <p className="text-xs text-shark-400">These items are not part of a starter kit</p>
                </div>
                <div className="divide-y divide-shark-50 dark:divide-shark-800">
                  {visibleIndividualAssets.map((asset) => (
                    <div key={asset.id} className="flex items-center gap-3 px-4 py-2.5">
                      <div className="w-9 h-9 rounded-lg overflow-hidden bg-shark-50 flex items-center justify-center shrink-0">
                        {asset.imageUrl ? <img src={asset.imageUrl} alt={asset.name} className="w-full h-full object-cover" /> : <Icon name="package" size={14} className="text-shark-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-shark-800">{asset.name}</p>
                        <p className="text-xs text-shark-400">{asset.category}</p>
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
                    <div key={consumable.id} className={`flex items-center gap-3 px-4 py-2.5 ${consumable.quantity === 0 ? "opacity-40" : ""}`}>
                      <div className="w-9 h-9 rounded-lg overflow-hidden bg-shark-50 flex items-center justify-center shrink-0">
                        {consumable.imageUrl ? <img src={consumable.imageUrl} alt={consumable.name} className="w-full h-full object-cover" /> : <Icon name="droplet" size={14} className="text-action-500" />}
                      </div>
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
        <Modal open onClose={() => { setReturningKitId(null); setReturnError(null); }} title={`Return "${returningKit.kitName}"`}>
          <div className="space-y-4">
            <p className="text-sm text-shark-500">Uncheck any items you are not returning and provide a reason.</p>

            {/* Items grouped by category with photos */}
            {(() => {
              const assetsByCategory = new Map<string, typeof returningKit.assets>();
              for (const a of returningKit.assets) {
                const cat = a.category || "Assets";
                if (!assetsByCategory.has(cat)) assetsByCategory.set(cat, []);
                assetsByCategory.get(cat)!.push(a);
              }

              const renderExclusionInput = (key: string) => {
                const isExcluded = kitItemExclusions[key]?.excluded || false;
                if (!isExcluded) return null;
                return (
                  <div className="ml-12 mt-1.5">
                    <Input
                      value={kitItemExclusions[key]?.note || ""}
                      onChange={(e) => setKitItemExclusions((prev) => ({ ...prev, [key]: { excluded: true, note: e.target.value } }))}
                      placeholder="Reason not returning..."
                      className="text-xs"
                    />
                    {kitItemExclusions[key]?.note === "" && <p className="text-xs text-red-500 mt-0.5">Please provide a reason</p>}
                  </div>
                );
              };

              return (
                <div className="space-y-3">
                  {Array.from(assetsByCategory.entries()).map(([cat, assets]) => (
                    <div key={cat}>
                      <p className="text-[10px] font-semibold text-shark-400 uppercase tracking-wider mb-1.5">{cat}</p>
                      <div className="space-y-1">
                        {assets.map((a) => {
                          const key = `asset-${a.id}`;
                          const isExcluded = kitItemExclusions[key]?.excluded || false;
                          return (
                            <div key={a.id}>
                              <label className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${isExcluded ? "opacity-50" : "bg-shark-50"}`}>
                                <input type="checkbox" checked={!isExcluded} onChange={() => setKitItemExclusions((prev) => ({ ...prev, [key]: { excluded: !isExcluded, note: prev[key]?.note || "" } }))} className="rounded border-shark-300 text-action-500 focus:ring-action-400" />
                                <div className="w-8 h-8 rounded-lg overflow-hidden bg-white dark:bg-shark-800 border border-shark-100 dark:border-shark-700 flex items-center justify-center shrink-0">
                                  {a.imageUrl ? <img src={a.imageUrl} alt="" className="w-full h-full object-cover" /> : <Icon name="package" size={14} className="text-shark-400" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm truncate ${isExcluded ? "line-through text-shark-400" : "text-shark-800"}`}>{a.name}</p>
                                  <p className="text-xs text-shark-400">{a.category}</p>
                                </div>
                              </label>
                              {renderExclusionInput(key)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {returningKit.consumables.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-shark-400 uppercase tracking-wider mb-1.5">Supplies</p>
                      <div className="space-y-1">
                        {returningKit.consumables.map((c) => {
                          const key = `consumable-${c.id}`;
                          const isExcluded = kitItemExclusions[key]?.excluded || false;
                          return (
                            <div key={c.id}>
                              <label className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${isExcluded ? "opacity-50" : "bg-shark-50"}`}>
                                <input type="checkbox" checked={!isExcluded} onChange={() => setKitItemExclusions((prev) => ({ ...prev, [key]: { excluded: !isExcluded, note: prev[key]?.note || "" } }))} className="rounded border-shark-300 text-action-500 focus:ring-action-400" />
                                <div className="w-8 h-8 rounded-lg overflow-hidden bg-white dark:bg-shark-800 border border-shark-100 dark:border-shark-700 flex items-center justify-center shrink-0">
                                  {c.imageUrl ? <img src={c.imageUrl} alt="" className="w-full h-full object-cover" /> : <Icon name="droplet" size={14} className="text-shark-400" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm truncate ${isExcluded ? "line-through text-shark-400" : "text-shark-800"}`}>{c.quantity}x {c.name}</p>
                                  <p className="text-xs text-shark-400">{c.unitType}</p>
                                </div>
                              </label>
                              {renderExclusionInput(key)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Condition */}
            <div>
              <label className="text-xs font-medium text-shark-600 block mb-1">Return Condition</label>
              <ConditionSelect value={returnCondition} onChange={setReturnCondition} />
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-medium text-shark-600 block mb-1">Notes (optional)</label>
              <Input value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)} placeholder="Any additional details about the return..." />
            </div>

            {returnError && <p className="text-sm text-red-600">{returnError}</p>}

            <div className="flex gap-2 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => { setReturningKitId(null); setReturnError(null); }}>Cancel</Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={handleReturnKit}
                loading={returnSubmitting}
                disabled={returnSubmitting || Object.entries(kitItemExclusions).some(([, v]) => v.excluded && v.note.trim() === "")}
              >
                Confirm Return
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Return All Modal */}
      {showReturnAll && (
        <Modal open onClose={() => setShowReturnAll(false)} title="Return All Items">
          <div className="space-y-4">
            <p className="text-sm text-shark-500">Select the items you are returning. Deselect any items you don&apos;t have.</p>

            {/* Select/Deselect All */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-shark-500">{returnAllSelected.size} of {allReturnableItems.length} selected</span>
              <div className="flex gap-2">
                <button onClick={() => setReturnAllSelected(new Set(allReturnableItems.map((i) => i.key)))} className="text-xs text-action-500 hover:underline">Select All</button>
                <button onClick={() => setReturnAllSelected(new Set())} className="text-xs text-shark-400 hover:underline">Deselect All</button>
              </div>
            </div>

            {/* Items list */}
            <div className="max-h-72 overflow-y-auto space-y-1 -mx-1 px-1">
              {allReturnableItems.map((item) => (
                <label key={item.key} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${returnAllSelected.has(item.key) ? "bg-action-50/50" : "bg-shark-50/50 opacity-60"}`}>
                  <input
                    type="checkbox"
                    checked={returnAllSelected.has(item.key)}
                    onChange={() => setReturnAllSelected((prev) => {
                      const next = new Set(prev);
                      next.has(item.key) ? next.delete(item.key) : next.add(item.key);
                      return next;
                    })}
                    className="rounded border-shark-300 text-action-500 focus:ring-action-400"
                  />
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-shark-50 flex items-center justify-center shrink-0">
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" /> : <Icon name={item.type === "asset" ? "package" : "droplet"} size={14} className="text-shark-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-shark-800 truncate">{item.type === "consumable" && item.quantity ? `${item.quantity}x ` : ""}{item.name}</p>
                  </div>
                </label>
              ))}
            </div>

            {/* Condition */}
            <div>
              <label className="text-xs font-medium text-shark-600 block mb-1">Return Condition</label>
              <ConditionSelect value={returnCondition} onChange={setReturnCondition} />
            </div>

            <div>
              <label className="text-xs font-medium text-shark-600 block mb-1">Notes (optional)</label>
              <Input value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)} placeholder="Any notes about the return..." />
            </div>

            {returnError && <p className="text-sm text-red-600">{returnError}</p>}

            <div className="flex gap-2 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => setShowReturnAll(false)}>Cancel</Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={handleReturnAll}
                loading={returnSubmitting}
                disabled={returnSubmitting || returnAllSelected.size === 0}
              >
                Return {returnAllSelected.size} Item{returnAllSelected.size !== 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Return Individual Item Modal */}
      {returningItemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-shark-900 rounded-xl shadow-2xl w-full max-w-md my-auto animate-fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-shark-100 dark:border-shark-800">
              <h3 className="text-lg font-semibold text-shark-900 dark:text-shark-100">Return Item</h3>
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
            {returnError && (
              <div className="mx-6 mb-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p className="text-sm text-red-700">{returnError}</p>
              </div>
            )}
            {/* Processing overlay for individual return */}
            {returnSubmitting && (
              <div className="px-6 py-8 flex flex-col items-center animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
                  <svg className="animate-spinner text-red-500" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
                    <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-shark-700">Processing return...</p>
                <p className="text-xs text-shark-400 mt-1">Notifying your manager</p>
                <div className="w-48 h-1.5 bg-shark-100 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-red-400 rounded-full animate-progress-bar" />
                </div>
              </div>
            )}
            {!returnSubmitting && (
              <div className="flex gap-3 px-6 py-4 border-t border-shark-100 dark:border-shark-700">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setReturningItemId(null); setReturnError(null); }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  onClick={handleReturnIndividualItem}
                >
                  Confirm Return
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inspection Schedule Alerts */}
      {inspectionSchedules.length > 0 && (() => {
        const now = new Date();
        const overdue = inspectionSchedules.filter((s) => new Date(s.dueDate) < now);
        const upcoming = inspectionSchedules.filter((s) => {
          const due = new Date(s.dueDate);
          const daysLeft = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return daysLeft >= 0 && daysLeft <= 14;
        });
        const checkedCount = conditionCheckItems.filter((i) => i.checked).length;
        const allDone = checkedCount === conditionCheckItems.length && conditionCheckItems.length > 0;

        return (
          <>
            {overdue.length > 0 && !allDone && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-500 flex items-center justify-center shrink-0">
                  <Icon name="alert-triangle" size={18} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-800">Inspection Overdue!</p>
                  <p className="text-xs text-red-600 mt-0.5">
                    {overdue[0].title} was due {new Date(overdue[0].dueDate).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}.
                    Complete your condition check below.
                  </p>
                </div>
              </div>
            )}
            {upcoming.length > 0 && !allDone && overdue.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#E8532E] flex items-center justify-center shrink-0">
                  <Icon name="clock" size={18} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-800">Inspection Due Soon</p>
                  <p className="text-xs text-[#E8532E] mt-0.5">
                    {upcoming[0].title} — due by {new Date(upcoming[0].dueDate).toLocaleDateString("en-AU", { day: "numeric", month: "long" })}.
                    {upcoming[0].notes && ` ${upcoming[0].notes}`}
                  </p>
                </div>
              </div>
            )}
            {allDone && upcoming.length > 0 && (
              <div className="bg-action-50 border border-action-200 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-action-500 flex items-center justify-center shrink-0">
                  <Icon name="check" size={18} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-action-800">Inspection Complete</p>
                  <p className="text-xs text-action-600 mt-0.5">
                    All {conditionCheckItems.length} items checked for {upcoming[0].title}. Well done!
                  </p>
                </div>
              </div>
            )}
          </>
        );
      })()}

      {/* Stat Cards */}
      <p className="text-[11px] font-semibold text-shark-400 uppercase tracking-widest">Overview</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="block group">
            <Card className="hover:shadow-md transition-all duration-200 cursor-pointer">
              <CardContent className="px-3 py-3">
                <div className="flex items-center gap-2">
                  <div className={`w-9 h-9 rounded-lg ${stat.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <Icon name={stat.icon} size={16} className={stat.iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-shark-500 truncate">{stat.label}</p>
                    <p className="text-xl font-bold text-shark-900">{stat.value}</p>
                  </div>
                  <Icon name="arrow-right" size={14} className="text-shark-400 group-hover:text-action-500 transition-colors flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Consumable Usage History */}
      {consumableUsageHistory.some((m) => m.totalUsed > 0) && (
        <Card>
          <div
            className="px-4 py-4 flex items-center justify-between cursor-pointer"
            onClick={() => setShowUsageHistory(!showUsageHistory)}
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-action-100 flex items-center justify-center shrink-0">
                <Icon name="droplet" size={14} className="text-action-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-shark-900">Supply Usage</h3>
                <p className="text-xs text-shark-400">Last 6 months</p>
              </div>
            </div>
            <Icon name="chevron-down" size={16} className={`text-shark-400 transition-transform ${showUsageHistory ? "" : "-rotate-90"}`} />
          </div>
          {showUsageHistory && (
            <CardContent>
              <div className="space-y-3">
                {consumableUsageHistory.map((m) => (
                  <div key={m.month} className="flex items-start gap-3">
                    <div className="w-16 shrink-0 text-xs font-medium text-shark-500 pt-0.5">{m.label}</div>
                    <div className="flex-1">
                      {m.totalUsed === 0 ? (
                        <span className="text-xs text-shark-400">No usage</span>
                      ) : (
                        <div className="space-y-1">
                          {m.items.map((item) => (
                            <div key={item.name} className="flex items-center justify-between text-sm">
                              <span className="text-shark-700">{item.name}</span>
                              <span className="text-xs font-semibold text-shark-900">{item.quantity} {item.unitType}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="w-12 text-right text-sm font-bold text-shark-900 pt-0.5">{m.totalUsed}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Condition Check */}
      {conditionCheckItems.length > 0 && (() => {
        const freqLabel = conditionCheckFrequency === "FORTNIGHTLY" ? "Fortnightly" : conditionCheckFrequency === "QUARTERLY" ? "Quarterly" : conditionCheckFrequency === "BIANNUAL" ? "6-Monthly" : "Monthly";
        const dueDate = conditionCheckDueDate ? new Date(conditionCheckDueDate) : null;
        const now = new Date();
        const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
        const dueDateColor = daysUntilDue === null ? "" : daysUntilDue < 0 ? "text-red-600" : daysUntilDue <= 7 ? "text-[#E8532E]" : "text-action-600";
        const dueDateLabel = dueDate ? `Due ${daysUntilDue !== null && daysUntilDue < 0 ? "overdue" : `by ${dueDate.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}`}` : null;

        return (
        <Card className="">
          <div
            className="px-4 py-4 flex items-center justify-between cursor-pointer"
            onClick={() => setShowConditionChecks(!showConditionChecks)}
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-action-100 flex items-center justify-center shrink-0">
                <Icon name="search" size={14} className="text-action-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-shark-900">{freqLabel} Condition Check</h3>
                <p className="text-xs text-shark-400">
                  {checkedCount === conditionCheckItems.length ? (
                    <span className="text-action-600 font-medium">All {conditionCheckItems.length} items checked ✓</span>
                  ) : (
                    <>{checkedCount} of {conditionCheckItems.length} items — take photos of your assigned equipment</>
                  )}
                </p>
                {dueDateLabel && checkedCount < conditionCheckItems.length && (
                  <p className={`text-xs font-medium mt-0.5 ${dueDateColor}`}>
                    {dueDateLabel}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {checkedCount < conditionCheckItems.length && (
                <span className="text-xs font-medium text-white bg-action-500 px-2.5 py-1 rounded-full">
                  {conditionCheckItems.length - checkedCount} remaining
                </span>
              )}
              <Icon
                name="chevron-down"
                size={18}
                className={`text-shark-400 transition-transform ${showConditionChecks ? "" : "-rotate-90"}`}
              />
            </div>
          </div>

          {showConditionChecks && (
            <div className="border-t border-shark-100 dark:border-shark-700 divide-y divide-shark-50 dark:divide-shark-800">
              {conditionCheckItems.map((item, idx) => {
                const key = getCheckKey(item);
                const state = checkStates[key];
                const isChecked = item.checked;
                const isUploading = state?.uploading;
                const isSubmitting = state?.submitting;
                const hasPhoto = !!state?.photoUrl;

                return (
                  <div key={`${key}-${idx}`} className={`px-6 py-4 ${isChecked ? "bg-action-50/30" : ""}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Item photo or status indicator */}
                        <div className={`w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center shrink-0 ${
                          isChecked ? "ring-2 ring-action-400" : "bg-shark-50"
                        }`}>
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : isChecked ? (
                            <div className="w-full h-full bg-action-100 flex items-center justify-center">
                              <Icon name="check" size={16} className="text-action-600" />
                            </div>
                          ) : (
                            <Icon name={item.type === "ASSET" ? "package" : "droplet"} size={16} className="text-shark-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-shark-800 truncate">
                            {item.name}
                            {item.photoLabel && <span className="text-xs text-blue-500 ml-1.5 font-normal">— {item.photoLabel}</span>}
                          </p>
                          {item.code && <p className="text-xs font-mono text-shark-400">{item.code}</p>}
                          {isChecked && item.condition && (
                            <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                              item.condition === "GOOD" ? "bg-action-100 text-action-700" :
                              item.condition === "FAIR" ? "bg-blue-100 text-blue-700" :
                              item.condition === "POOR" ? "bg-amber-100 text-[#E8532E]" :
                              "bg-red-100 text-red-700"
                            }`}>
                              {item.condition}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action area */}
                      {!isChecked && (
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Photo preview */}
                          {hasPhoto && (
                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-shark-200">
                              <img src={state.photoUrl} alt={`${item.name} condition photo`} className="w-full h-full object-cover" />
                            </div>
                          )}

                          {/* Take photo button */}
                          <label className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            hasPhoto ? "bg-shark-100 text-shark-600 hover:bg-shark-200" : "bg-blue-500 text-white hover:bg-blue-600"
                          } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}>
                            {isUploading ? (
                              <span className="animate-pulse">Uploading...</span>
                            ) : (
                              <>
                                <Icon name="upload" size={12} />
                                {hasPhoto ? "Retake" : "Photo"}
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleCheckPhotoUpload(key, file);
                                e.target.value = "";
                              }}
                            />
                          </label>
                        </div>
                      )}
                    </div>

                    {/* Condition + Notes + Submit (only visible after photo taken) */}
                    {!isChecked && hasPhoto && (
                      <div className="mt-3 ml-11 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <Select
                          value={state?.condition || "GOOD"}
                          onChange={(e) => setCheckStates((prev) => ({ ...prev, [key]: { ...prev[key], condition: e.target.value } }))}
                          className="text-xs w-32"
                        >
                          <option value="GOOD">Good</option>
                          <option value="FAIR">Fair</option>
                          <option value="POOR">Poor</option>
                          <option value="DAMAGED">Damaged</option>
                        </Select>
                        <input
                          type="text"
                          placeholder="Notes (optional)"
                          value={state?.notes || ""}
                          onChange={(e) => setCheckStates((prev) => ({ ...prev, [key]: { ...prev[key], notes: e.target.value } }))}
                          className="flex-1 text-xs border border-shark-200 rounded-lg px-2.5 py-1.5 focus:border-action-400 focus:outline-none focus:ring-1 focus:ring-action-400/20"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSubmitCheck(item)}
                          disabled={isSubmitting}
                          loading={isSubmitting}
                          className="text-xs"
                        >
                          Submit
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
        );
      })()}

      {/* Quick Actions */}
      <div>
        <p className="text-[11px] font-semibold text-shark-400 uppercase tracking-widest mb-4">Quick Actions</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/report-damage">
            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="py-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#E8532E] flex items-center justify-center group-hover:bg-[#d14a28] transition-colors">
                  <Icon name="alert-triangle" size={24} className="text-white" />
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
    </PullToRefresh>
  );
}
