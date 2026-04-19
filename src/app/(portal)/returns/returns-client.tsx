"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { batchProcessReturns } from "@/app/actions/returns";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

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
  regionName?: string;
  assetDetails: { id: string; name: string; assetCode: string; category: string; imageUrl: string | null; isHighValue: boolean } | null;
  consumableDetails: { id: string; name: string; unitType: string; imageUrl: string | null } | null;
}

interface StaffGroup {
  name: string;
  email: string;
  regionName: string;
  items: PendingReturnItem[];
}

export function ReturnsClient({ returns }: { returns: PendingReturnItem[] }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [itemStates, setItemStates] = useState<Record<string, { status: "verified" | "rejected"; reason?: string }>>({});
  const [submitting, setSubmitting] = useState<string | boolean>(false);
  const [submitted, setSubmitted] = useState(false);
  const [expandedStaff, setExpandedStaff] = useState<Set<string>>(new Set());
  const [processedStaff, setProcessedStaff] = useState<Set<string>>(new Set());

  // Group returns by staff
  const staffGroups = useMemo(() => {
    const groups = new Map<string, StaffGroup>();
    for (const r of returns) {
      const key = r.returnedByEmail;
      if (!groups.has(key)) {
        groups.set(key, {
          name: r.returnedByName,
          email: r.returnedByEmail,
          regionName: r.regionName || "",
          items: [],
        });
      }
      groups.get(key)!.items.push(r);
    }
    return Array.from(groups.values());
  }, [returns]);

  const totalItems = returns.length;
  const processedCount = Object.keys(itemStates).length;
  const allProcessed = processedCount >= totalItems && totalItems > 0;

  const toggleItem = (id: string, status: "verified" | "rejected", reason?: string) => {
    setItemStates((prev) => {
      const next = { ...prev };
      if (next[id]?.status === status) {
        delete next[id];
      } else {
        next[id] = { status, reason };
      }
      return next;
    });
  };

  const toggleStaff = (email: string) => {
    setExpandedStaff((prev) => {
      const next = new Set(prev);
      next.has(email) ? next.delete(email) : next.add(email);
      return next;
    });
  };

  // Select all items for a staff group
  const selectAllForStaff = (group: StaffGroup) => {
    const allVerified = group.items.every((r) => itemStates[r.id]?.status === "verified");
    setItemStates((prev) => {
      const next = { ...prev };
      if (allVerified) {
        group.items.forEach((r) => delete next[r.id]);
      } else {
        group.items.forEach((r) => { next[r.id] = { status: "verified" }; });
      }
      return next;
    });
  };

  const handleConfirmStaff = async (group: StaffGroup) => {
    setSubmitting(group.email);
    try {
      const batchItems = group.items
        .filter((item) => itemStates[item.id])
        .map((item) => {
          const state = itemStates[item.id];
          const isNotReturned = item.returnCondition === "NOT_RETURNED";
          return {
            id: item.id,
            status: state.status,
            reason: state.status === "rejected"
              ? (state.reason || "Not returned")
              : isNotReturned
              ? (item.returnNotes || "Not returned by staff")
              : undefined,
          };
        });

      if (batchItems.length === 0) return;
      await batchProcessReturns(batchItems);
      setProcessedStaff((prev) => new Set(prev).add(group.email));
      addToast(`Returns for ${group.name} processed`, "success");
      router.refresh();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to process returns", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-action-100 flex items-center justify-center shrink-0">
            <Icon name="arrow-left" size={14} className="text-action-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-shark-900">Returns</h3>
            <p className="text-xs text-shark-400">All returns processed</p>
          </div>
        </div>
        <Card>
          <div className="py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-action-50 flex items-center justify-center mx-auto mb-4">
              <Icon name="check" size={28} className="text-action-500" />
            </div>
            <p className="text-lg font-semibold text-shark-900">All returns processed</p>
            <p className="text-sm text-shark-400 mt-1">Items have been restocked and staff notified.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <Card padding="none">
    <div className="p-4 sm:p-5 space-y-8">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-action-100 flex items-center justify-center shrink-0">
          <Icon name="arrow-left" size={14} className="text-action-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-shark-900">Returns</h3>
          <p className="text-xs text-shark-400">
            {totalItems} item{totalItems !== 1 ? "s" : ""} pending verification
            {processedCount > 0 && <span> · {processedCount} marked</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <p className="text-lg font-bold text-shark-900">{totalItems}</p>
            <p className="text-[10px] text-shark-400">pending</p>
          </div>
          {totalItems > 0 && (
            <Link
              href="/returns/quick"
              className="inline-flex items-center gap-1.5 rounded-xl bg-action-600 px-3 py-2 text-sm font-semibold text-white hover:bg-action-700 transition-colors shadow-sm"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              Quick Mode
            </Link>
          )}
        </div>
      </div>

      {returns.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <Icon name="check" size={32} className="text-action-400 mx-auto mb-3" />
            <p className="text-sm text-shark-400">No returns pending. All clear.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {staffGroups.filter((g) => !processedStaff.has(g.email)).map((group) => {
            const isExpanded = expandedStaff.has(group.email);
            const groupProcessed = group.items.filter((r) => itemStates[r.id]).length;
            const allGroupVerified = group.items.every((r) => itemStates[r.id]?.status === "verified");
            const allGroupMarked = groupProcessed === group.items.length;
            const isSubmittingThis = submitting === group.email;

            return (
              <Card key={group.email}>
                {/* Staff header — click to expand */}
                <button
                  onClick={() => toggleStaff(group.email)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-shark-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-action-500 flex items-center justify-center shrink-0">
                      <span className="text-white text-sm font-semibold">{(group.name || group.email)[0].toUpperCase()}</span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-shark-900">{group.name}</p>
                      <p className="text-xs text-shark-400">{group.regionName}{group.regionName ? " · " : ""}{group.items.length} item{group.items.length !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {groupProcessed > 0 && (
                      <span className="text-xs font-medium text-action-500">{groupProcessed}/{group.items.length} marked</span>
                    )}
                    <Icon name="chevron-down" size={16} className={`text-shark-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {/* Expanded items */}
                {isExpanded && (
                  <div className="border-t border-shark-100">
                    {/* Select all for this staff */}
                    <div className="flex items-center justify-between px-5 py-2 bg-shark-50/50">
                      <span className="text-xs text-shark-400">{groupProcessed} of {group.items.length} marked</span>
                      <button
                        onClick={() => selectAllForStaff(group)}
                        className="text-xs font-medium text-action-600 hover:text-action-700 transition-colors"
                      >
                        {allGroupVerified ? "Deselect All" : "Select All"}
                      </button>
                    </div>

                    <div className="divide-y divide-shark-50">
                      {group.items.map((item) => {
                        const state = itemStates[item.id];
                        const isVerified = state?.status === "verified";
                        const isRejected = state?.status === "rejected";
                        const isNotReturned = item.returnCondition === "NOT_RETURNED";
                        const photo = item.assetDetails?.imageUrl || item.consumableDetails?.imageUrl;
                        const name = item.itemType === "ASSET"
                          ? item.assetDetails?.name || "Unknown"
                          : `${item.quantity}x ${item.consumableDetails?.name || "Unknown"}`;

                        return (
                          <div
                            key={item.id}
                            className={`flex items-center gap-3 px-5 py-3 transition-all ${
                              isVerified ? "bg-action-50/30" : isRejected ? "bg-red-50/30" : ""
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isVerified}
                              onChange={() => toggleItem(item.id, "verified")}
                              className={`w-5 h-5 rounded border-shark-300 cursor-pointer shrink-0 ${
                                isNotReturned ? "text-[#E8532E] focus:ring-amber-400" : "text-action-500 focus:ring-action-400"
                              }`}
                            />
                            <div className="w-9 h-9 rounded-lg overflow-hidden bg-shark-50 border border-shark-100 flex items-center justify-center shrink-0">
                              {photo ? (
                                <img src={photo} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Icon name={item.itemType === "ASSET" ? "package" : "droplet"} size={14} className="text-shark-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={`text-sm font-medium truncate ${isVerified ? "line-through text-action-600" : isRejected ? "line-through text-red-500" : "text-shark-800"}`}>
                                  {name}
                                </p>
                                {isNotReturned && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-[#E8532E] uppercase shrink-0">Not Returned</span>
                                )}
                              </div>
                              {item.returnCondition && item.returnCondition !== "NOT_RETURNED" && (
                                <p className="text-xs text-shark-400">Condition: {item.returnCondition}</p>
                              )}
                              {isRejected && state.reason && (
                                <p className="text-xs text-red-400 mt-0.5">Reason: {state.reason}</p>
                              )}
                            </div>

                            {isVerified && (
                              <span className={`text-xs font-medium shrink-0 ${isNotReturned ? "text-[#E8532E]" : "text-action-500"}`}>
                                {isNotReturned ? "Acknowledged" : "Restocked"}
                              </span>
                            )}

                            {!isNotReturned && (
                              <button
                                onClick={() => {
                                  if (isRejected) {
                                    toggleItem(item.id, "rejected");
                                  } else {
                                    const reason = prompt("Why is this item not being returned?");
                                    if (reason) toggleItem(item.id, "rejected", reason);
                                  }
                                }}
                                className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                                  isRejected ? "bg-red-100 text-red-500" : "hover:bg-red-50 text-shark-400 hover:text-red-500"
                                }`}
                                title={isRejected ? "Undo rejection" : "Reject"}
                              >
                                <Icon name="x" size={16} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Per-staff confirm button */}
                    {allGroupMarked && (
                      <div className="px-5 py-3 border-t border-shark-100">
                        <Button
                          className="w-full"
                          size="sm"
                          onClick={() => handleConfirmStaff(group)}
                          loading={isSubmittingThis}
                        >
                          Confirm {group.name}&apos;s Returns
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}

          {totalItems > 0 && processedCount === 0 && (
            <p className="text-xs text-shark-400 text-center">
              Expand a staff member and mark items to confirm
            </p>
          )}
        </div>
      )}
    </div>
    </Card>
  );
}
