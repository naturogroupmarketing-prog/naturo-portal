"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Select } from "@/components/ui/select";
import { batchProcessReturns } from "@/app/actions/returns";

interface PendingReturnItem {
  id: string;
  itemType: string;
  quantity: number;
  returnedByName: string;
  returnedByEmail: string;
  returnReason: string | null;
  returnCondition: string | null;
  returnNotes: string | null;
  createdAt: string;
  assetDetails: { id: string; name: string; assetCode: string; category: string; imageUrl: string | null; isHighValue: boolean } | null;
  consumableDetails: { id: string; name: string; unitType: string; imageUrl: string | null } | null;
}

export function ReturnsClient({ returns }: { returns: PendingReturnItem[] }) {
  // Track each item's state: "verified" | "rejected" | undefined (pending)
  const [itemStates, setItemStates] = useState<Record<string, { status: "verified" | "rejected"; reason?: string }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<"none" | "staff" | "type">("none");

  const totalItems = returns.length;
  const processedCount = Object.keys(itemStates).length;
  const allProcessed = processedCount >= totalItems && totalItems > 0;
  const notReturnedItems = new Set(returns.filter((r) => r.returnCondition === "NOT_RETURNED").map((r) => r.id));
  const restockedCount = Object.entries(itemStates).filter(([id, s]) => s.status === "verified" && !notReturnedItems.has(id)).length;
  const acknowledgedCount = Object.entries(itemStates).filter(([id, s]) => s.status === "verified" && notReturnedItems.has(id)).length;
  const rejectedCount = Object.values(itemStates).filter((s) => s.status === "rejected").length;

  const toggleItem = (id: string, status: "verified" | "rejected", reason?: string) => {
    setItemStates((prev) => {
      const next = { ...prev };
      // If clicking same status, toggle off
      if (next[id]?.status === status) {
        delete next[id];
      } else {
        next[id] = { status, reason };
      }
      return next;
    });
  };

  // Select All / Clear All
  const allVerified = totalItems > 0 && returns.every((r) => itemStates[r.id]?.status === "verified");
  const handleSelectAll = () => {
    if (allVerified) {
      setItemStates({});
    } else {
      const newStates: typeof itemStates = {};
      returns.forEach((r) => { newStates[r.id] = { status: "verified" }; });
      setItemStates(newStates);
    }
  };

  // Grouping
  const groupedReturns = useMemo(() => {
    if (groupBy === "staff") {
      const groups: Record<string, PendingReturnItem[]> = {};
      for (const r of returns) {
        const key = r.returnedByName || "Unknown";
        if (!groups[key]) groups[key] = [];
        groups[key].push(r);
      }
      return groups;
    } else if (groupBy === "type") {
      const groups: Record<string, PendingReturnItem[]> = {};
      for (const r of returns) {
        const key = r.itemType === "ASSET" ? "Assets" : "Consumables";
        if (!groups[key]) groups[key] = [];
        groups[key].push(r);
      }
      return groups;
    }
    return { "All Items": returns };
  }, [returns, groupBy]);

  const handleFinalConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      // Build batch items — handle NOT_RETURNED logic
      const batchItems: { id: string; status: "verified" | "rejected"; reason?: string }[] = [];

      for (const item of returns) {
        const state = itemStates[item.id];
        if (!state) continue;

        const isNotReturned = item.returnCondition === "NOT_RETURNED";

        if (state.status === "verified") {
          if (isNotReturned) {
            // NOT_RETURNED items: send as rejected (acknowledge without restocking)
            batchItems.push({ id: item.id, status: "verified", reason: item.returnNotes || "Not returned by staff" });
          } else {
            batchItems.push({ id: item.id, status: "verified" });
          }
        } else if (state.status === "rejected") {
          batchItems.push({ id: item.id, status: "rejected", reason: state.reason || "Not returned" });
        }
      }

      if (batchItems.length === 0) {
        setError("No items to process");
        setSubmitting(false);
        return;
      }

      await batchProcessReturns(batchItems);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process returns. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = (item: PendingReturnItem) => {
    const state = itemStates[item.id];
    const isVerified = state?.status === "verified";
    const isRejected = state?.status === "rejected";
    const isNotReturned = item.returnCondition === "NOT_RETURNED";

    return (
      <div
        key={item.id}
        className={`flex items-center gap-3 px-4 py-3 transition-all ${
          isNotReturned ? "bg-amber-50/50" : isVerified ? "bg-action-50/50" : isRejected ? "bg-red-50/50" : ""
        }`}
      >
        {/* Checkbox — toggles verified/acknowledged */}
        <input
          type="checkbox"
          checked={isVerified}
          onChange={() => toggleItem(item.id, "verified")}
          className={`w-5 h-5 rounded border-shark-300 cursor-pointer shrink-0 ${
            isNotReturned ? "text-[#E8532E] focus:ring-amber-400" : "text-action-500 focus:ring-action-400"
          }`}
        />

        {/* Icon */}
        <Icon
          name={isNotReturned ? "alert-triangle" : item.itemType === "ASSET" ? "package" : "droplet"}
          size={16}
          className={`shrink-0 ${isNotReturned ? "text-[#E8532E]" : isVerified ? "text-action-400" : isRejected ? "text-red-400" : item.itemType === "ASSET" ? "text-action-500" : "text-blue-500"}`}
        />

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm font-medium ${isVerified ? "line-through text-action-600" : isRejected ? "line-through text-red-500" : "text-shark-800"}`}>
              {item.itemType === "ASSET"
                ? `${item.assetDetails?.name || "Unknown"}`
                : `${item.quantity}x ${item.consumableDetails?.name || "Unknown"}`
              }
            </p>
            {isNotReturned && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-[#E8532E] uppercase tracking-wide">Not Returned</span>
            )}
            {item.assetDetails?.isHighValue && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700 uppercase tracking-wide">High Value</span>
            )}
          </div>
          {item.itemType === "ASSET" && item.assetDetails && (
            <p className="text-xs font-mono text-shark-400 mt-0.5">{item.assetDetails.assetCode}</p>
          )}
          <p className="text-xs text-shark-400">
            {item.returnedByName}
            {item.returnCondition && item.returnCondition !== "NOT_RETURNED" && ` · ${item.returnCondition}`}
            {item.returnReason && ` · ${item.returnReason}`}
          </p>
          {isNotReturned && item.returnNotes && (
            <p className="text-xs text-[#E8532E] mt-0.5 font-medium">Staff note: {item.returnNotes}</p>
          )}
          {isRejected && state.reason && (
            <p className="text-xs text-red-400 mt-0.5">Reason: {state.reason}</p>
          )}
        </div>

        {/* Status label */}
        {isVerified ? (
          <span className={`text-xs font-medium shrink-0 ${isNotReturned ? "text-[#E8532E]" : "text-action-500"}`}>
            {isNotReturned ? "Acknowledged" : "Restocked"}
          </span>
        ) : isRejected ? (
          <span className="text-xs text-red-500 font-medium shrink-0">Rejected</span>
        ) : null}

        {/* Red X — toggles rejected (hidden for NOT_RETURNED items) */}
        {!isNotReturned && (
          <button
            onClick={() => {
              if (isRejected) {
                // Undo rejection
                toggleItem(item.id, "rejected");
              } else {
                const reason = prompt("Why was this item not returned? (e.g. damaged, missing, lost)");
                if (reason) toggleItem(item.id, "rejected", reason);
              }
            }}
            className={`p-1.5 rounded-lg transition-colors shrink-0 ${
              isRejected ? "bg-red-100 text-red-500" : "hover:bg-red-50 text-shark-400 hover:text-red-500"
            }`}
            title={isRejected ? "Undo rejection" : "Not returned — reject"}
          >
            <Icon name="x" size={16} />
          </button>
        )}
      </div>
    );
  };

  if (submitted) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-shark-900 tracking-tight">Return Checklist</h1>
        </div>
        <div className="p-6 rounded-lg bg-action-50 border border-action-200 text-center animate-fade-in">
          <Icon name="check-circle" size={32} className="text-action-400 mx-auto mb-3 animate-check-pop" />
          <p className="text-sm font-medium text-action-700">
            All items processed. {restockedCount > 0 ? `${restockedCount} restocked` : ""}{acknowledgedCount > 0 ? `${restockedCount > 0 ? ", " : ""}${acknowledgedCount} not-returned acknowledged` : ""}{rejectedCount > 0 ? `, ${rejectedCount} rejected` : ""}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-3xl font-bold text-shark-900 tracking-tight">Return Checklist</h1>
          <p className="text-sm text-shark-400 mt-1">
            {totalItems} items to process
            {processedCount > 0 && (
              <span> · {processedCount} of {totalItems} marked</span>
            )}
          </p>
        </div>
        {totalItems > 0 && (
          <div className="flex items-center gap-2">
            <Select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as "none" | "staff" | "type")}
              className="text-xs h-8"
            >
              <option value="none">No grouping</option>
              <option value="staff">By Staff</option>
              <option value="type">By Type</option>
            </Select>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs font-medium text-action-600 hover:text-action-700 transition-colors whitespace-nowrap"
            >
              {allVerified ? "Clear All" : "Mark All Restocked"}
            </button>
          </div>
        )}
      </div>

      {returns.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <Icon name="check-circle" size={32} className="text-action-400 mx-auto mb-3" />
            <p className="text-sm text-shark-400">No returns pending. All clear.</p>
          </div>
        </Card>
      ) : (
        <Card>
          {Object.entries(groupedReturns).map(([groupName, groupItems]) => (
            <div key={groupName}>
              {groupBy !== "none" && (
                <div className="px-4 py-2 bg-shark-50 border-b border-shark-100">
                  <p className="text-xs font-semibold text-shark-500 uppercase tracking-wide">
                    {groupName} ({groupItems.length})
                  </p>
                </div>
              )}
              <div className="divide-y divide-shark-100">
                {groupItems.map(renderItem)}
              </div>
            </div>
          ))}

          {/* Error message */}
          {error && (
            <div className="p-4 border-t border-shark-100">
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            </div>
          )}

          {/* Processing overlay */}
          {submitting && (
            <div className="p-6 border-t border-shark-100 animate-fade-in">
              <div className="flex flex-col items-center py-4">
                <div className="w-12 h-12 rounded-full bg-action-50 flex items-center justify-center mb-3">
                  <svg className="animate-spinner text-action-500" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
                    <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-shark-700">Processing returns...</p>
                <p className="text-xs text-shark-400 mt-1">
                  {restockedCount > 0 && `Restocking ${restockedCount} items`}
                  {acknowledgedCount > 0 && `${restockedCount > 0 ? ", a" : "A"}cknowledging ${acknowledgedCount} items`}
                  {rejectedCount > 0 && `, rejecting ${rejectedCount} items`}
                </p>
                <div className="w-48 h-1.5 bg-shark-100 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-action-400 rounded-full animate-progress-bar" />
                </div>
              </div>
            </div>
          )}

          {/* Final confirm button */}
          {allProcessed && !submitting && (
            <div className="p-4 border-t border-shark-100">
              <Button
                className="w-full"
                onClick={handleFinalConfirm}
              >
                Confirm ({restockedCount > 0 ? `${restockedCount} restock` : ""}{acknowledgedCount > 0 ? `${restockedCount > 0 ? ", " : ""}${acknowledgedCount} acknowledged` : ""}{rejectedCount > 0 ? `, ${rejectedCount} rejected` : ""})
              </Button>
            </div>
          )}
          {!allProcessed && !submitting && totalItems > 0 && (
            <p className="text-xs text-shark-400 text-center py-3">
              {processedCount} of {totalItems} items marked — mark all items to confirm
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
