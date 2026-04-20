"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { verifyReturn } from "@/app/actions/returns";
import { useToast } from "@/components/ui/toast";

interface PendingReturnItem {
  id: string;
  assetName?: string;
  consumableName?: string;
  assignedTo: string;
  daysOverdue: number;
  type: "asset" | "consumable";
}

interface QuickReturnClientProps {
  pendingReturns: PendingReturnItem[];
}

function OverdueBadge({ days }: { days: number }) {
  const label = days === 0 ? "Due today" : days === 1 ? "1 day overdue" : `${days} days overdue`;
  const cls =
    days > 7
      ? "bg-red-100 text-red-700 ring-1 ring-red-200"
      : days >= 1
      ? "bg-amber-100 text-amber-700 ring-1 ring-amber-200"
      : "bg-green-100 text-green-700 ring-1 ring-green-200";
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${cls}`}>
      {label}
    </span>
  );
}

export default function QuickReturnClient({ pendingReturns }: QuickReturnClientProps) {
  const { addToast } = useToast();
  const [search, setSearch] = useState("");
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
  const [notReturned, setNotReturned] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return pendingReturns;
    return pendingReturns.filter((r) => {
      const name = (r.assetName ?? r.consumableName ?? "").toLowerCase();
      const person = r.assignedTo.toLowerCase();
      return name.includes(q) || person.includes(q);
    });
  }, [pendingReturns, search]);

  const active = filtered.filter(
    (r) => !confirmed.has(r.id) && !notReturned.has(r.id)
  );

  async function handleConfirm(id: string) {
    if (processing.has(id)) return;
    setProcessing((prev) => new Set(prev).add(id));
    try {
      await verifyReturn(id);
      setConfirmed((prev) => new Set(prev).add(id));
      setSelected((prev) => { const s = new Set(prev); s.delete(id); return s; });
      addToast("Return confirmed", "success");
    } catch {
      addToast("Failed to confirm. Please try again.", "error");
    } finally {
      setProcessing((prev) => { const s = new Set(prev); s.delete(id); return s; });
    }
  }

  function handleNotReturned(id: string) {
    setNotReturned((prev) => new Set(prev).add(id));
    setSelected((prev) => { const s = new Set(prev); s.delete(id); return s; });
    addToast("Marked as not returned", "info");
  }

  async function handleConfirmAll() {
    const ids = [...selected];
    for (const id of ids) {
      await handleConfirm(id);
    }
    setSelected(new Set());
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  }

  const totalPending = pendingReturns.filter(
    (r) => !confirmed.has(r.id) && !notReturned.has(r.id)
  ).length;

  return (
    <div className="min-h-screen bg-shark-50">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-shark-900 border-b border-shark-100 dark:border-shark-800 shadow-sm">
        <div className="flex items-center gap-3 px-4 py-4">
          <Link
            href="/returns"
            className="flex items-center gap-1.5 text-sm font-medium text-shark-500 dark:text-shark-400 hover:text-shark-900 dark:text-shark-100 transition-colors min-h-[44px] pr-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-shark-900 dark:text-shark-100 leading-tight">Quick Returns</h1>
          </div>
          {totalPending > 0 && (
            <span className="shrink-0 inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full bg-action-600 text-white text-xs font-bold">
              {totalPending}
            </span>
          )}
        </div>

        {/* Search bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-shark-400"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or person..."
              className="w-full rounded-xl border border-shark-200 dark:border-shark-700 bg-shark-50 dark:bg-shark-800 pl-10 pr-4 text-base text-shark-900 dark:text-shark-100 placeholder:text-shark-400 focus:border-action-400 focus:outline-none focus:ring-2 focus:ring-action-400/20 transition-colors"
              style={{ height: "48px" }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 pb-32 space-y-3 max-w-lg mx-auto">
        {/* Empty state — all clear */}
        {totalPending === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-5">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <path d="m9 11 3 3L22 4" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-green-600">All Returns Cleared</p>
            <p className="mt-2 text-base text-shark-400">No pending returns — great work.</p>
            <Link
              href="/returns"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-shark-900 px-5 py-3 text-sm font-semibold text-white hover:bg-shark-800 transition-colors"
            >
              Back to Returns
            </Link>
          </div>
        )}

        {/* Active return cards */}
        {active.map((item) => {
          const itemName = item.assetName ?? item.consumableName ?? "Unknown Item";
          const isProcessing = processing.has(item.id);
          const isSelected = selected.has(item.id);

          return (
            <div
              key={item.id}
              className={`rounded-2xl bg-white dark:bg-shark-900 border transition-all shadow-sm overflow-hidden ${
                isSelected ? "border-action-400 ring-2 ring-action-400/20" : "border-shark-100 dark:border-shark-800"
              }`}
            >
              {/* Card header — tap to select */}
              <button
                type="button"
                onClick={() => toggleSelect(item.id)}
                className="w-full text-left px-5 py-4 flex items-start gap-3"
              >
                {/* Checkbox */}
                <div
                  className={`mt-0.5 shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                    isSelected
                      ? "border-action-500 bg-action-500"
                      : "border-shark-300"
                  }`}
                >
                  {isSelected && (
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m2 6 3 3 5-5" />
                    </svg>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xl font-bold text-shark-900 dark:text-shark-100 leading-tight truncate">
                    {item.assignedTo}
                  </p>
                  <p className="mt-0.5 text-base text-shark-500 dark:text-shark-400 truncate">{itemName}</p>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <OverdueBadge days={item.daysOverdue} />
                    <span className="text-xs font-medium text-shark-400 bg-shark-100 dark:bg-shark-800 rounded-full px-2.5 py-1 capitalize">
                      {item.type}
                    </span>
                  </div>
                </div>
              </button>

              {/* Action buttons */}
              <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleConfirm(item.id)}
                  disabled={isProcessing}
                  className="flex items-center justify-center gap-2 rounded-xl bg-green-600 text-white font-semibold text-base hover:bg-green-700 active:scale-[0.97] transition-all disabled:opacity-60"
                  style={{ minHeight: "52px" }}
                >
                  {isProcessing ? (
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="white" strokeOpacity="0.3" strokeWidth="3" />
                      <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      Confirm Return
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleNotReturned(item.id)}
                  disabled={isProcessing}
                  className="flex items-center justify-center gap-2 rounded-xl border-2 border-red-300 text-red-600 font-semibold text-base hover:bg-red-50 active:scale-[0.97] transition-all disabled:opacity-60"
                  style={{ minHeight: "52px" }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                  Not Returned
                </button>
              </div>
            </div>
          );
        })}

        {/* Already processed */}
        {(confirmed.size > 0 || notReturned.size > 0) && (
          <div className="text-center text-sm text-shark-400 pt-2">
            {confirmed.size} confirmed · {notReturned.size} not returned this session
          </div>
        )}

        {/* No search results */}
        {active.length === 0 && totalPending > 0 && search && (
          <div className="text-center py-12 text-shark-400">
            <p className="text-base font-medium">No results for &quot;{search}&quot;</p>
            <button
              type="button"
              onClick={() => setSearch("")}
              className="mt-2 text-sm text-action-600 hover:underline"
            >
              Clear search
            </button>
          </div>
        )}
      </div>

      {/* Sticky batch footer */}
      {selected.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-shark-900 border-t border-shark-100 dark:border-shark-700 shadow-lg px-4 py-4 safe-area-pb">
          <button
            type="button"
            onClick={handleConfirmAll}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-green-600 text-white font-bold text-lg hover:bg-green-700 active:scale-[0.98] transition-all shadow-sm"
            style={{ minHeight: "56px" }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Confirm All ({selected.size} selected)
          </button>
        </div>
      )}
    </div>
  );
}
