"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { verifyReturn, rejectReturn } from "@/app/actions/returns";

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
  assetDetails: { id: string; name: string; assetCode: string; category: string; imageUrl: string | null } | null;
  consumableDetails: { id: string; name: string; unitType: string; imageUrl: string | null } | null;
}

export function ReturnsClient({ returns }: { returns: PendingReturnItem[] }) {
  // Track each item's state: "verified" | "rejected" | undefined (pending)
  const [itemStates, setItemStates] = useState<Record<string, { status: "verified" | "rejected"; reason?: string }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const totalItems = returns.length;
  const processedCount = Object.keys(itemStates).length;
  const allProcessed = processedCount >= totalItems && totalItems > 0;
  const verifiedCount = Object.values(itemStates).filter((s) => s.status === "verified").length;
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

  const handleFinalConfirm = async () => {
    setSubmitting(true);
    try {
      for (const item of returns) {
        const state = itemStates[item.id];
        if (state?.status === "verified") {
          await verifyReturn(item.id);
        } else if (state?.status === "rejected") {
          await rejectReturn(item.id, state.reason || "Not returned");
        }
      }
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-shark-900">Return Checklist</h1>
        </div>
        <div className="p-6 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
          <Icon name="check-circle" size={32} className="text-emerald-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-emerald-700">
            All items processed. {verifiedCount} restocked{rejectedCount > 0 ? `, ${rejectedCount} rejected` : ""}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-shark-900">Return Checklist</h1>
        <p className="text-sm text-shark-400 mt-1">
          {totalItems} items to process
          {processedCount > 0 && (
            <span> · {processedCount} of {totalItems} marked</span>
          )}
        </p>
      </div>

      {returns.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <Icon name="check-circle" size={32} className="text-emerald-400 mx-auto mb-3" />
            <p className="text-sm text-shark-400">No returns pending. All clear.</p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-shark-100">
            {returns.map((item) => {
              const state = itemStates[item.id];
              const isVerified = state?.status === "verified";
              const isRejected = state?.status === "rejected";
              const isNotReturned = item.returnCondition === "NOT_RETURNED";

              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 px-4 py-3 transition-all ${
                    isNotReturned ? "bg-amber-50/50 border-l-4 border-l-amber-400" : isVerified ? "bg-emerald-50/50" : isRejected ? "bg-red-50/50" : ""
                  }`}
                >
                  {/* Checkbox — toggles verified */}
                  <input
                    type="checkbox"
                    checked={isVerified}
                    onChange={() => toggleItem(item.id, "verified")}
                    className="w-5 h-5 rounded border-shark-300 text-emerald-500 focus:ring-emerald-400 cursor-pointer shrink-0"
                  />

                  {/* Icon */}
                  <Icon
                    name={isNotReturned ? "alert-triangle" : item.itemType === "ASSET" ? "package" : "droplet"}
                    size={16}
                    className={`shrink-0 ${isNotReturned ? "text-amber-500" : isVerified ? "text-emerald-400" : isRejected ? "text-red-400" : item.itemType === "ASSET" ? "text-action-500" : "text-blue-500"}`}
                  />

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium ${isVerified ? "line-through text-emerald-600" : isRejected ? "line-through text-red-500" : "text-shark-800"}`}>
                        {item.itemType === "ASSET"
                          ? `${item.assetDetails?.name || "Unknown"}`
                          : `${item.quantity}x ${item.consumableDetails?.name || "Unknown"}`
                        }
                        {item.itemType === "ASSET" && item.assetDetails && (
                          <span className="font-mono text-xs text-shark-400 ml-1">{item.assetDetails.assetCode}</span>
                        )}
                      </p>
                      {isNotReturned && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 uppercase tracking-wide">Not Returned</span>
                      )}
                    </div>
                    <p className="text-xs text-shark-400">
                      {item.returnedByName}
                      {item.returnCondition && item.returnCondition !== "NOT_RETURNED" && ` · ${item.returnCondition}`}
                      {item.returnReason && ` · ${item.returnReason}`}
                    </p>
                    {isNotReturned && item.returnNotes && (
                      <p className="text-xs text-amber-600 mt-0.5 font-medium">Staff note: {item.returnNotes}</p>
                    )}
                    {isRejected && state.reason && (
                      <p className="text-xs text-red-400 mt-0.5">Reason: {state.reason}</p>
                    )}
                  </div>

                  {/* Status label or X button */}
                  {isVerified ? (
                    <span className="text-xs text-emerald-500 font-medium shrink-0">Restocked</span>
                  ) : isRejected ? (
                    <span className="text-xs text-red-500 font-medium shrink-0">Rejected</span>
                  ) : null}

                  {/* Red X — toggles rejected */}
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
                </div>
              );
            })}
          </div>

          {/* Final confirm button */}
          {allProcessed && (
            <div className="p-4 border-t border-shark-100">
              <Button
                className="w-full"
                onClick={handleFinalConfirm}
                disabled={submitting}
              >
                {submitting ? "Processing..." : `Confirm & Restock (${verifiedCount} verified, ${rejectedCount} rejected)`}
              </Button>
            </div>
          )}
          {!allProcessed && totalItems > 0 && (
            <p className="text-xs text-shark-400 text-center py-3">
              {processedCount} of {totalItems} items marked — mark all items to confirm
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
