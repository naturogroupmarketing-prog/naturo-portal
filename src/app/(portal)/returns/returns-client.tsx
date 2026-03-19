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

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function ReturnsClient({ returns }: { returns: PendingReturnItem[] }) {
  const [verifiedIds, setVerifiedIds] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState<string | null>(null);
  const [verifyingAll, setVerifyingAll] = useState(false);

  const pendingItems = returns.filter((r) => !verifiedIds.has(r.id));

  const handleVerify = async (id: string) => {
    setProcessing(id);
    try {
      await verifyReturn(id);
      setVerifiedIds((prev) => new Set([...prev, id]));
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Reason for rejecting this return (e.g., damaged, missing parts):");
    if (!reason) return;
    setProcessing(id);
    try {
      await rejectReturn(id, reason);
      setVerifiedIds((prev) => new Set([...prev, id]));
    } finally {
      setProcessing(null);
    }
  };

  const handleVerifyAll = async () => {
    if (!confirm(`Verify and restock all ${pendingItems.length} items?`)) return;
    setVerifyingAll(true);
    try {
      await verifyAllReturns();
      setVerifiedIds(new Set(returns.map((r) => r.id)));
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
            {pendingItems.length} item{pendingItems.length !== 1 ? "s" : ""} pending verification
          </p>
        </div>
        {pendingItems.length > 1 && (
          <Button onClick={handleVerifyAll} disabled={verifyingAll}>
            {verifyingAll ? "Verifying..." : `Verify All (${pendingItems.length})`}
          </Button>
        )}
      </div>

      {pendingItems.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <Icon name="check-circle" size={32} className="text-emerald-400 mx-auto mb-3" />
            <p className="text-sm text-shark-400">All returns verified. Nothing pending.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {pendingItems.map((item) => (
            <Card key={item.id}>
              <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${item.itemType === "ASSET" ? "bg-action-50" : "bg-blue-50"}`}>
                  <Icon
                    name={item.itemType === "ASSET" ? "package" : "droplet"}
                    size={18}
                    className={item.itemType === "ASSET" ? "text-action-500" : "text-blue-500"}
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-shark-900">
                      {item.itemType === "ASSET"
                        ? item.assetDetails?.name || "Unknown Asset"
                        : `${item.quantity}x ${item.consumableDetails?.name || "Unknown Consumable"}`
                      }
                    </h3>
                    {item.itemType === "ASSET" && item.assetDetails && (
                      <span className="text-xs font-mono text-shark-400">{item.assetDetails.assetCode}</span>
                    )}
                    {item.returnCondition && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        item.returnCondition === "GOOD" ? "bg-emerald-50 text-emerald-600"
                        : item.returnCondition === "FAIR" ? "bg-amber-50 text-amber-600"
                        : "bg-red-50 text-red-600"
                      }`}>
                        {item.returnCondition}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-shark-500 mt-0.5">
                    Returned by <span className="font-medium">{item.returnedByName}</span>
                    {item.returnReason && <span className="text-shark-400"> · {item.returnReason}</span>}
                  </p>
                  {item.returnNotes && (
                    <p className="text-xs text-shark-400 mt-0.5">Notes: {item.returnNotes}</p>
                  )}
                  <p className="text-xs text-shark-300 mt-0.5">{timeAgo(item.createdAt)}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => handleVerify(item.id)}
                    disabled={processing === item.id}
                  >
                    <Icon name="check" size={14} className="mr-1" />
                    {processing === item.id ? "..." : "Verify & Restock"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleReject(item.id)}
                    disabled={processing === item.id}
                  >
                    <Icon name="x" size={14} className="text-red-500" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
