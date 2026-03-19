"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { verifyReturn, rejectReturn, verifyAllReturns } from "@/app/actions/returns";

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
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());
  const [verifyingAll, setVerifyingAll] = useState(false);

  const pendingItems = returns.filter((r) => !checkedIds.has(r.id) && !rejectedIds.has(r.id));
  const checkedCount = checkedIds.size;
  const rejectedCount = rejectedIds.size;

  const handleCheck = async (id: string) => {
    setCheckedIds((prev) => new Set([...prev, id]));
    // Fire and forget — don't wait
    verifyReturn(id).catch(() => {
      setCheckedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    });
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Why was this item not returned? (e.g. damaged, missing, lost)");
    if (!reason) return;
    setRejectedIds((prev) => new Set([...prev, id]));
    rejectReturn(id, reason).catch(() => {
      setRejectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    });
  };

  const handleVerifyAll = async () => {
    if (!confirm(`Verify and restock all ${pendingItems.length} items?`)) return;
    setVerifyingAll(true);
    try {
      await verifyAllReturns();
      setCheckedIds(new Set(returns.map((r) => r.id)));
    } finally {
      setVerifyingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-shark-900">Return Checklist</h1>
          <p className="text-sm text-shark-400 mt-1">
            {pendingItems.length} pending
            {checkedCount > 0 && <span className="text-emerald-500"> · {checkedCount} verified</span>}
            {rejectedCount > 0 && <span className="text-red-500"> · {rejectedCount} rejected</span>}
          </p>
        </div>
        {pendingItems.length > 1 && (
          <Button onClick={handleVerifyAll} disabled={verifyingAll}>
            {verifyingAll ? "Verifying..." : `Verify All (${pendingItems.length})`}
          </Button>
        )}
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
              const isChecked = checkedIds.has(item.id);
              const isRejected = rejectedIds.has(item.id);
              const isDone = isChecked || isRejected;

              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 px-4 py-3 transition-all ${
                    isChecked ? "bg-emerald-50/50 opacity-60" : isRejected ? "bg-red-50/50 opacity-60" : ""
                  }`}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={isDone}
                    onChange={() => !isDone && handleCheck(item.id)}
                    className="w-5 h-5 rounded border-shark-300 text-emerald-500 focus:ring-emerald-400 cursor-pointer shrink-0"
                  />

                  {/* Icon */}
                  <Icon
                    name={item.itemType === "ASSET" ? "package" : "droplet"}
                    size={16}
                    className={`shrink-0 ${isChecked ? "text-emerald-400" : isRejected ? "text-red-400" : item.itemType === "ASSET" ? "text-action-500" : "text-blue-500"}`}
                  />

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isChecked ? "line-through text-emerald-600" : isRejected ? "line-through text-red-500" : "text-shark-800"}`}>
                      {item.itemType === "ASSET"
                        ? `${item.assetDetails?.name || "Unknown"}`
                        : `${item.quantity}x ${item.consumableDetails?.name || "Unknown"}`
                      }
                      {item.itemType === "ASSET" && item.assetDetails && (
                        <span className="font-mono text-xs text-shark-400 ml-1">{item.assetDetails.assetCode}</span>
                      )}
                    </p>
                    <p className="text-xs text-shark-400">
                      {item.returnedByName}
                      {item.returnCondition && ` · ${item.returnCondition}`}
                      {item.returnReason && ` · ${item.returnReason}`}
                    </p>
                  </div>

                  {/* Status or Reject button */}
                  {isChecked ? (
                    <span className="text-xs text-emerald-500 font-medium shrink-0">Restocked</span>
                  ) : isRejected ? (
                    <span className="text-xs text-red-500 font-medium shrink-0">Rejected</span>
                  ) : (
                    <button
                      onClick={() => handleReject(item.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-shark-400 hover:text-red-500 transition-colors shrink-0"
                      title="Not returned — reject"
                    >
                      <Icon name="x" size={16} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Summary when all done */}
      {pendingItems.length === 0 && returns.length > 0 && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
          <p className="text-sm font-medium text-emerald-700">
            All items processed. {checkedCount} restocked{rejectedCount > 0 ? `, ${rejectedCount} rejected` : ""}.
          </p>
        </div>
      )}
    </div>
  );
}
