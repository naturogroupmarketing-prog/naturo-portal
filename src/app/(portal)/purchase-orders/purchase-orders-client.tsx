"use client";

import { useState, useRef, useEffect } from "react";
import { PortalDropdown } from "@/components/ui/portal-dropdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Icon } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/empty-state";
import { approvePurchaseOrder, markPurchaseOrderOrdered, updatePurchaseOrder, createPurchaseOrder, receivePurchaseOrder, undoReceivedPurchaseOrder, batchUpdatePOStatus } from "@/app/actions/purchase-orders";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { formatDate, statusColor } from "@/lib/utils";

type PurchaseOrder = {
  id: string;
  consumableId: string;
  regionId: string;
  quantity: number;
  supplier: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
  consumable: { name: string; unitType: string; category: string; imageUrl: string | null; quantityOnHand: number; minimumThreshold: number; shopUrl: string | null };
  region: { id: string; name: string; state: { name: string } };
  createdBy: { name: string | null; email: string } | null;
  approvedBy: { name: string | null; email: string } | null;
};

type Region = {
  id: string;
  name: string;
  state: { name: string };
};

const TABS = ["Pending", "Approved", "Ordered", "Rejected", "Received", "All"] as const;

// Priority order for sorting — items needing action first
const STATUS_PRIORITY: Record<string, number> = {
  PENDING: 0,
  APPROVED: 1,
  ORDERED: 2,
  REJECTED: 3,
  RECEIVED: 4,
};

// Super Admin: all status transitions
const PO_STATUS_ACTIONS_ADMIN: Record<string, { value: string; label: string; icon: string; color: string }[]> = {
  PENDING: [
    { value: "APPROVED", label: "Approve", icon: "check", color: "text-action-600 hover:bg-action-50" },
    { value: "REJECTED", label: "Reject", icon: "x", color: "text-red-600 hover:bg-red-50" },
  ],
  APPROVED: [
    { value: "ORDERED", label: "Mark Ordered", icon: "package", color: "text-action-600 hover:bg-action-50" },
    { value: "PENDING", label: "Undo Approval", icon: "arrow-left", color: "text-shark-600 hover:bg-shark-50 dark:hover:bg-shark-800" },
  ],
  ORDERED: [
    { value: "RECEIVED", label: "Mark Received", icon: "check", color: "text-action-600 hover:bg-action-50" },
  ],
  RECEIVED: [
    { value: "UNDO_RECEIVED", label: "Undo Received", icon: "arrow-left", color: "text-shark-600 hover:bg-shark-50 dark:hover:bg-shark-800" },
  ],
  REJECTED: [
    { value: "PENDING", label: "Re-open", icon: "arrow-left", color: "text-shark-600 hover:bg-shark-50 dark:hover:bg-shark-800" },
  ],
};

// Branch Manager: only ORDERED ↔ RECEIVED
const PO_STATUS_ACTIONS_MANAGER: Record<string, { value: string; label: string; icon: string; color: string }[]> = {
  ORDERED: [
    { value: "RECEIVED", label: "Mark Received", icon: "check", color: "text-action-600 hover:bg-action-50" },
  ],
  RECEIVED: [
    { value: "UNDO_RECEIVED", label: "Undo Received", icon: "arrow-left", color: "text-shark-600 hover:bg-shark-50 dark:hover:bg-shark-800" },
  ],
};

// Portal-based status dropdown for PO — consistent with asset status dropdown
function POStatusDropdown({ po, canManage, isSuperAdmin, onAction, loading }: {
  po: { id: string; status: string; updatedAt: string };
  canManage: boolean;
  isSuperAdmin: boolean;
  onAction: (poId: string, action: string) => void;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Super Admin gets all transitions, Branch Manager only ORDERED ↔ RECEIVED
  const actionMap = isSuperAdmin ? PO_STATUS_ACTIONS_ADMIN : PO_STATUS_ACTIONS_MANAGER;

  // For RECEIVED, only allow undo within 7 days
  const actions = (() => {
    const base = actionMap[po.status] || [];
    if (po.status === "RECEIVED") {
      const receivedDate = new Date(po.updatedAt);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      if (receivedDate < sevenDaysAgo) return [];
    }
    return base;
  })();

  // Branch managers always have access to their limited actions (ORDERED ↔ RECEIVED)
  const hasActions = (canManage || actions.length > 0) && actions.length > 0;

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <button
        ref={btnRef}
        onClick={() => hasActions && setOpen(!open)}
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor(po.status)} ${hasActions ? "hover:opacity-80 cursor-pointer" : ""} transition-colors`}
      >
        {po.status.replace(/_/g, " ")}
        {hasActions && <Icon name="chevron-down" size={10} className={`transition-transform ${open ? "rotate-180" : ""}`} />}
      </button>
      <PortalDropdown triggerRef={btnRef} open={open} onClose={() => setOpen(false)} align="right" width={180}>
        {actions.map((action) => (
          <button
            key={action.value}
            onClick={() => { onAction(po.id, action.value); setOpen(false); }}
            disabled={loading}
            className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors flex items-center gap-2 dark:hover:bg-shark-700 ${action.color} disabled:opacity-50`}
          >
            <Icon name={action.icon as any} size={12} /> {action.label}
          </button>
        ))}
      </PortalDropdown>
    </div>
  );
}

const PO_COLS_KEY = "trackio-purchase-orders-columns";
type POCols = { item: boolean; category: boolean; supplier: boolean; qty: boolean; status: boolean; createdBy: boolean; date: boolean };
const defaultPOCols: POCols = { item: true, category: false, supplier: false, qty: true, status: true, createdBy: false, date: false };
const PO_COL_LABELS: [keyof POCols, string][] = [
  ["item", "Item"],
  ["category", "Category"],
  ["supplier", "Supplier"],
  ["qty", "Qty"],
  ["status", "Status"],
  ["createdBy", "Created By"],
  ["date", "Date"],
];

type ConsumableOption = {
  id: string;
  name: string;
  category: string;
  unitType: string;
  supplier: string | null;
  regionId: string;
  quantityOnHand: number;
  minimumThreshold: number;
};

interface Props {
  purchaseOrders: PurchaseOrder[];
  regions: Region[];
  consumables?: ConsumableOption[];
  isSuperAdmin: boolean;
  canManagePO: boolean;
  canApprovePO?: boolean;
  canEditQty?: boolean;
  initialStatus?: string;
  initialRegion?: string;
  showAllHistory?: boolean;
}

function mapStatusToTab(status?: string, isSuperAdmin?: boolean): string {
  if (!status) return isSuperAdmin ? "Pending" : "Ordered";
  const map: Record<string, string> = { PENDING: "Pending", APPROVED: "Approved", ORDERED: "Ordered", RECEIVED: "Received", REJECTED: "Rejected" };
  return map[status.toUpperCase()] || (isSuperAdmin ? "Pending" : "Ordered");
}

export function PurchaseOrdersClient({ purchaseOrders, regions, consumables = [], isSuperAdmin, canManagePO, canApprovePO = false, canEditQty = false, initialStatus, initialRegion, showAllHistory = false }: Props) {
  const { addToast } = useToast();
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(mapStatusToTab(initialStatus, isSuperAdmin));
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [viewOrder, setViewOrder] = useState<PurchaseOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  // Region selector state (super admin only)
  const [selectedRegionId, setSelectedRegionId] = useState<string>(() => {
    if (initialRegion && regions.some((r) => r.id === initialRegion)) return initialRegion;
    return regions[0]?.id || "";
  });
  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false);
  const [regionSearch, setRegionSearch] = useState("");
  const regionDropdownRef = useRef<HTMLDivElement>(null);

  // Close region dropdown on outside click
  useEffect(() => {
    if (!regionDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (regionDropdownRef.current && !regionDropdownRef.current.contains(e.target as Node)) {
        setRegionDropdownOpen(false);
        setRegionSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [regionDropdownOpen]);

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState<POCols>(() => {
    if (typeof window === "undefined") return defaultPOCols;
    try {
      const saved = localStorage.getItem(PO_COLS_KEY);
      if (saved) return { ...defaultPOCols, ...JSON.parse(saved) };
    } catch {}
    return defaultPOCols;
  });
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const columnMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showColumnMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(e.target as Node)) {
        setShowColumnMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showColumnMenu]);

  const toggleColumn = (col: keyof POCols) => {
    setVisibleColumns((prev) => {
      const next = { ...prev, [col]: !prev[col] };
      try { localStorage.setItem(PO_COLS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const visibleCount = Object.values(visibleColumns).filter(Boolean).length + 1; // +1 for actions

  // Selected region object
  const selectedRegion = isSuperAdmin
    ? (regions.find((r) => r.id === selectedRegionId) || regions[0])
    : null;

  // Orders scoped to the selected region (super admin) or all (branch manager)
  const regionPOs = isSuperAdmin && selectedRegionId
    ? purchaseOrders.filter((po) => po.regionId === selectedRegionId)
    : purchaseOrders;

  // Filter by tab + search within the region's orders, then sort by priority
  const filtered = regionPOs.filter((po) => {
    if (activeTab !== "All" && po.status !== activeTab.toUpperCase()) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        po.consumable.name.toLowerCase().includes(q) ||
        po.consumable.category.toLowerCase().includes(q) ||
        (po.supplier || "").toLowerCase().includes(q) ||
        po.region.name.toLowerCase().includes(q)
      );
    }
    return true;
  }).sort((a, b) => {
    const pa = STATUS_PRIORITY[a.status] ?? 99;
    const pb = STATUS_PRIORITY[b.status] ?? 99;
    if (pa !== pb) return pa - pb;
    // Within same status, newest first
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const pendingCount = regionPOs.filter((po) => po.status === "PENDING").length;
  const tabCounts: Record<string, number> = {
    Pending: pendingCount,
    Approved: regionPOs.filter((po) => po.status === "APPROVED").length,
    Ordered: regionPOs.filter((po) => po.status === "ORDERED").length,
    Rejected: regionPOs.filter((po) => po.status === "REJECTED").length,
    Received: regionPOs.filter((po) => po.status === "RECEIVED").length,
    All: regionPOs.length,
  };

  const handleAction = async (purchaseOrderId: string, action: string) => {
    setLoading(purchaseOrderId + action);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("purchaseOrderId", purchaseOrderId);

      if (action === "ORDERED") {
        await markPurchaseOrderOrdered(fd);
        addToast("Marked as ordered", "success");
      } else if (action === "RECEIVED") {
        await receivePurchaseOrder(fd);
        addToast("PO received — stock updated", "success");
      } else if (action === "UNDO_RECEIVED") {
        await undoReceivedPurchaseOrder(fd);
        addToast("Receipt undone — stock reverted", "success");
      } else if (action === "APPROVED" || action === "REJECTED") {
        fd.set("action", action === "APPROVED" ? "approve" : "reject");
        await approvePurchaseOrder(fd);
        addToast(action === "APPROVED" ? "Order approved" : "Order rejected", "success");
      } else if (action === "PENDING") {
        // Re-open / undo approval — use updatePurchaseOrder
        fd.set("status", "PENDING");
        await updatePurchaseOrder(fd);
        addToast("Order re-opened", "success");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  // Status display — dropdown matching asset pattern
  const renderStatus = (po: PurchaseOrder) => (
    <POStatusDropdown
      po={po}
      canManage={canManagePO || canApprovePO}
      isSuperAdmin={isSuperAdmin}
      onAction={handleAction}
      loading={!!loading}
    />
  );

  // Bulk selection
  const toggleSelect = (id: string) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectedPending = filtered.filter((po) => selected.has(po.id) && po.status === "PENDING").length;
  const selectedApproved = filtered.filter((po) => selected.has(po.id) && po.status === "APPROVED").length;
  const selectedOrdered = filtered.filter((po) => selected.has(po.id) && po.status === "ORDERED").length;

  const handleBulk = async (newStatus: string) => {
    setBulkLoading(true);
    try {
      const ids = filtered.filter((po) => selected.has(po.id) && (
        (newStatus === "APPROVED" && po.status === "PENDING") ||
        (newStatus === "ORDERED" && po.status === "APPROVED") ||
        (newStatus === "RECEIVED" && po.status === "ORDERED") ||
        (newStatus === "REJECTED" && po.status === "PENDING")
      )).map((po) => po.id);
      if (ids.length === 0) return;
      const result = await batchUpdatePOStatus(ids, newStatus);
      addToast(`${result.updated} order${result.updated > 1 ? "s" : ""} updated`, "success");
      setSelected(new Set());
      router.refresh();
    } catch (e) { addToast(e instanceof Error ? e.message : "Something went wrong — please try again", "error"); }
    setBulkLoading(false);
  };

  const renderTable = (orders: PurchaseOrder[]) => (
    <>
      {/* Mobile: card layout */}
      <div className="sm:hidden space-y-2">
        {orders.length === 0 ? (
          <p className="text-center text-shark-400 py-8">No purchase orders found.</p>
        ) : (
          orders.map((po) => (
            <div
              key={po.id}
              onClick={() => setViewOrder(po)}
              className={`border rounded-xl p-4 bg-white dark:bg-shark-900 transition-shadow cursor-pointer ${selected.has(po.id) ? "border-action-400 bg-action-50/20 dark:bg-action-500/10" : "border-shark-100 dark:border-shark-800 hover:shadow-sm"}`}
            >
              <div className="flex items-start gap-3">
                {canApprovePO && (
                  <input type="checkbox" checked={selected.has(po.id)} onChange={(e) => { e.stopPropagation(); toggleSelect(po.id); }} className="w-4 h-4 mt-1 rounded border-shark-300 text-action-500 focus:ring-action-400 shrink-0" />
                )}
                {po.consumable.imageUrl ? (
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-shark-100 dark:border-shark-700 shrink-0">
                    <img src={po.consumable.imageUrl} alt={po.consumable.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-shark-50 dark:bg-shark-800 border border-shark-100 dark:border-shark-700 flex items-center justify-center shrink-0">
                    <Icon name="droplet" size={16} className="text-shark-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-shark-800 dark:text-shark-200 truncate">{po.consumable.name}</p>
                    {renderStatus(po)}
                  </div>
                  <p className="text-xs text-shark-400 mt-0.5">In stock: {po.consumable.quantityOnHand} · Order: {po.quantity} {po.consumable.unitType} · {po.region.name}</p>
                  {po.consumable.shopUrl && (
                    <a href={po.consumable.shopUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-[10px] font-medium text-action-600 mt-0.5 hover:underline">
                      <Icon name="arrow-right" size={10} />
                      Open shop to order
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop: table layout */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-shark-100 dark:border-shark-700 text-left text-xs font-medium text-shark-400 uppercase tracking-wider">
              {canApprovePO && <th scope="col" className="px-3 py-3 w-10"><input type="checkbox" checked={selected.size > 0 && selected.size === orders.length} onChange={() => { if (selected.size === orders.length) setSelected(new Set()); else setSelected(new Set(orders.map((o) => o.id))); }} className="rounded border-shark-300 text-action-500" /></th>}
              <th scope="col" className="px-5 py-3">Item</th>
              <th scope="col" className="px-5 py-3">In Stock</th>
              <th scope="col" className="px-5 py-3">Order Qty</th>
              <th scope="col" className="px-5 py-3">Region</th>
              <th scope="col" className="px-5 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-shark-50 dark:divide-shark-800">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={canApprovePO ? 6 : 5} className="px-5 py-8 text-center text-shark-400">
                  No purchase orders found.
                </td>
              </tr>
            ) : (
              orders.map((po) => (
                <tr key={po.id} onClick={() => setViewOrder(po)} className={`hover:bg-shark-25 transition-colors cursor-pointer ${selected.has(po.id) ? "bg-action-50/30" : ""}`}>
                  {canApprovePO && (
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.has(po.id)} onChange={() => toggleSelect(po.id)} className="rounded border-shark-300 text-action-500 focus:ring-action-400" />
                    </td>
                  )}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {po.consumable.imageUrl ? (
                        <div className="w-8 h-8 rounded-lg overflow-hidden border border-shark-100 dark:border-shark-700 shrink-0">
                          <img src={po.consumable.imageUrl} alt={po.consumable.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-shark-50 dark:bg-shark-800 border border-shark-100 dark:border-shark-700 flex items-center justify-center shrink-0">
                          <Icon name="droplet" size={14} className="text-shark-300" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-shark-800 dark:text-shark-200">{po.consumable.name}</span>
                          {po.consumable.shopUrl && (
                            <a
                              href={po.consumable.shopUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-[10px] font-medium bg-action-50 text-action-600 hover:bg-action-100 px-1.5 py-0.5 rounded transition-colors"
                              title="Open shop page"
                            >
                              <Icon name="arrow-right" size={10} />
                              Buy
                            </a>
                          )}
                        </div>
                        <span className="text-xs text-shark-400">({po.consumable.unitType})</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`font-semibold ${po.consumable.quantityOnHand <= po.consumable.minimumThreshold ? "text-red-500" : "text-shark-800 dark:text-shark-200"}`}>
                      {po.consumable.quantityOnHand}
                    </span>
                    <span className="text-xs text-shark-400 ml-1">{po.consumable.unitType}</span>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-shark-800 dark:text-shark-200">{po.quantity} <span className="font-normal text-xs text-shark-400">{po.consumable.unitType}</span></td>
                  <td className="px-5 py-3.5 text-shark-500 dark:text-shark-400">{po.region.name}</td>
                  <td className="px-5 py-3.5 text-right">
                    {renderStatus(po)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );

  return (
    <div className="space-y-4">
      <Card>
        {/* Region selector — super admin only */}
        {isSuperAdmin && regions.length > 0 && selectedRegion && (
          <div className="relative" ref={regionDropdownRef}>
            <button
              onClick={() => { setRegionDropdownOpen((o) => !o); setRegionSearch(""); }}
              className="w-full flex items-center gap-3 px-4 sm:px-5 py-4 border-b border-shark-100 dark:border-shark-700 hover:bg-shark-50 dark:hover:bg-shark-800/50 dark:hover:bg-shark-800/50 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-action-100 flex items-center justify-center shrink-0">
                <Icon name="map-pin" size={15} className="text-action-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base font-semibold text-shark-900 dark:text-shark-100">{selectedRegion.name}</h2>
                  {regions.length > 1 && (
                    <Icon
                      name="chevron-down"
                      size={14}
                      className={`text-shark-400 transition-transform shrink-0 ${regionDropdownOpen ? "rotate-180" : ""}`}
                    />
                  )}
                </div>
                <p className="text-xs text-shark-400">{selectedRegion.state.name} · tap to switch region</p>
              </div>
              {pendingCount > 0 && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-red-500 bg-red-50 border border-red-100 px-2.5 py-1.5 rounded-lg shrink-0">
                  <Icon name="alert-triangle" size={12} />
                  {pendingCount} pending
                </span>
              )}
            </button>

            {/* Region dropdown */}
            {regionDropdownOpen && regions.length > 1 && (
              <div className="absolute left-0 right-0 top-full z-50 bg-white dark:bg-shark-900 border border-shark-100 dark:border-shark-700 shadow-xl rounded-b-xl overflow-hidden">
                {/* Search */}
                <div className="px-3 py-2.5 border-b border-shark-100 dark:border-shark-700">
                  <div className="flex items-center gap-2 bg-shark-50 dark:bg-shark-800 rounded-lg px-3 py-1.5">
                    <Icon name="search" size={13} className="text-shark-400 shrink-0" />
                    <input
                      autoFocus
                      value={regionSearch}
                      onChange={(e) => setRegionSearch(e.target.value)}
                      placeholder="Search regions..."
                      className="flex-1 bg-transparent text-sm text-shark-800 dark:text-shark-100 placeholder-shark-400 outline-none"
                    />
                  </div>
                </div>
                {/* Region list grouped by state */}
                <div className="max-h-72 overflow-y-auto">
                  {(() => {
                    const q = regionSearch.toLowerCase();
                    const filteredRegions = regions.filter(
                      (r) => r.name.toLowerCase().includes(q) || r.state.name.toLowerCase().includes(q)
                    );
                    if (filteredRegions.length === 0) {
                      return <p className="text-sm text-shark-400 text-center py-6">No regions found</p>;
                    }
                    const byState = filteredRegions.reduce<Record<string, typeof regions>>((acc, r) => {
                      const s = r.state.name;
                      if (!acc[s]) acc[s] = [];
                      acc[s].push(r);
                      return acc;
                    }, {});
                    return Object.entries(byState).map(([stateName, stateRegions]) => (
                      <div key={stateName}>
                        <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-shark-400 bg-shark-50/80 dark:bg-shark-800/60 border-b border-shark-50 dark:border-shark-700">
                          {stateName}
                        </p>
                        {stateRegions.map((r) => {
                          const rPending = purchaseOrders.filter((po) => po.regionId === r.id && po.status === "PENDING").length;
                          return (
                            <button
                              key={r.id}
                              onClick={() => { setSelectedRegionId(r.id); setRegionDropdownOpen(false); setRegionSearch(""); }}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-action-50 dark:hover:bg-action-500/10 transition-colors text-left ${r.id === selectedRegionId ? "bg-action-50 dark:bg-action-500/10" : ""}`}
                            >
                              <Icon
                                name="map-pin"
                                size={13}
                                className={r.id === selectedRegionId ? "text-action-500" : "text-shark-300"}
                              />
                              <span className={`text-sm flex-1 ${r.id === selectedRegionId ? "font-semibold text-action-600 dark:text-action-400" : "text-shark-700 dark:text-shark-200"}`}>
                                {r.name}
                              </span>
                              {rPending > 0 && (
                                <span className="text-[10px] font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full shrink-0">
                                  {rPending} pending
                                </span>
                              )}
                              {r.id === selectedRegionId && (
                                <Icon name="check" size={12} className="text-action-500 ml-auto shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="p-4 sm:p-5 space-y-4">
          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-action-100 flex items-center justify-center shrink-0">
                <Icon name="truck" size={14} className="text-action-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-shark-900 dark:text-shark-100">Purchase Orders</h3>
                <p className="text-xs text-shark-400">
                  {regionPOs.length} total · {pendingCount} pending
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isSuperAdmin && (
                <Button
                  size="sm"
                  variant={showAllHistory ? "primary" : "secondary"}
                  onClick={() => {
                    const url = new URL(window.location.href);
                    if (showAllHistory) {
                      url.searchParams.delete("showAll");
                    } else {
                      url.searchParams.set("showAll", "true");
                    }
                    router.push(url.pathname + url.search);
                  }}
                >
                  <Icon name="clock" size={14} className="mr-1.5" />
                  {showAllHistory ? "Recent Only" : "All History"}
                </Button>
              )}
              {canManagePO && (
                <Button size="sm" onClick={() => setShowCreate(true)}>
                  <Icon name="plus" size={14} className="mr-1.5" />
                  Create Order
                </Button>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2">
            <Select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as typeof activeTab)}
              className="sm:hidden w-auto min-w-[120px] shrink-0"
            >
              {TABS.map((tab) => (
                <option key={tab} value={tab}>
                  {tab}{tabCounts[tab] > 0 ? ` (${tabCounts[tab]})` : ""}
                </option>
              ))}
            </Select>
            <Input
              placeholder="Search items, regions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
          </div>

          {/* Tab bar */}
          <div className="hidden sm:flex overflow-x-auto gap-1 bg-shark-50 dark:bg-shark-800/60 rounded-xl p-1 scrollbar-none">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab
                    ? "bg-action-500 text-white shadow-sm"
                    : "text-shark-500 dark:text-shark-400 hover:bg-shark-100 dark:hover:bg-shark-700 hover:text-shark-700 dark:text-shark-300 dark:hover:text-shark-200"
                }`}
              >
                {tab}
                {tabCounts[tab] > 0 && (
                  <span className={`ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold rounded-full ${
                    tab === "Pending" ? "text-white bg-[#E8532E]" : "text-shark-500 dark:text-shark-400 bg-shark-200"
                  }`}>
                    {tabCounts[tab]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Bulk Action Bar */}
          {selected.size > 0 && canApprovePO && (
            <div className="sticky top-14 z-20 bg-action-500 text-white rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-lg">
              <span className="text-sm font-medium">{selected.size} selected</span>
              <div className="flex items-center gap-2">
                {selectedPending > 0 && (
                  <>
                    <Button size="sm" variant="secondary" onClick={() => handleBulk("APPROVED")} disabled={bulkLoading} loading={bulkLoading}>Approve ({selectedPending})</Button>
                    <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" onClick={() => handleBulk("REJECTED")} disabled={bulkLoading}>Reject ({selectedPending})</Button>
                  </>
                )}
                {selectedApproved > 0 && (
                  <Button size="sm" variant="secondary" onClick={() => handleBulk("ORDERED")} disabled={bulkLoading} loading={bulkLoading}>Mark Ordered ({selectedApproved})</Button>
                )}
                {selectedOrdered > 0 && (
                  <Button size="sm" variant="secondary" onClick={() => handleBulk("RECEIVED")} disabled={bulkLoading} loading={bulkLoading}>Mark Received ({selectedOrdered})</Button>
                )}
                <button onClick={() => setSelected(new Set())} className="text-white/80 hover:text-white p-1 ml-1"><Icon name="x" size={16} /></button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                <Icon name="x" size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        {purchaseOrders.length === 0 ? (
          <div className="px-4 sm:px-5 pb-4">
            <EmptyState
              icon="truck"
              title="No purchase orders"
              description="Create your first purchase order to replenish stock"
              action={{ label: "Create PO", href: "/purchase-orders?action=create" }}
            />
          </div>
        ) : (
          <div className="border-t border-shark-100 dark:border-shark-700">
            {renderTable(filtered)}
          </div>
        )}
      </Card>

      {/* Order Detail / Edit Modal */}
      {viewOrder && (
        <Modal open onClose={() => setViewOrder(null)} title={canManagePO ? "Edit Purchase Order" : "Purchase Order Details"}>
          {canManagePO ? (
            <form
              action={async (fd) => {
                fd.set("purchaseOrderId", viewOrder.id);
                setLoading(viewOrder.id + "update");
                try {
                  await updatePurchaseOrder(fd);
                  setViewOrder(null);
                } catch {
                  // silent
                } finally {
                  setLoading(null);
                }
              }}
              className="space-y-5"
            >
              {/* Read-only item info */}
              <div className="bg-shark-50 dark:bg-shark-800 rounded-lg p-4">
                <h3 className="text-base font-semibold text-shark-900 dark:text-shark-100">{viewOrder.consumable.name}</h3>
                <div className="flex gap-4 mt-1 text-xs text-shark-400">
                  <span>{viewOrder.consumable.category}</span>
                  <span>{viewOrder.consumable.unitType}</span>
                  <span>{viewOrder.region.name}, {viewOrder.region.state.name}</span>
                </div>
                <div className="flex gap-4 mt-2 text-xs text-shark-400">
                  <span>Created {formatDate(viewOrder.createdAt)}</span>
                  <span>
                    by{" "}
                    {viewOrder.createdBy ? (viewOrder.createdBy.name || viewOrder.createdBy.email) : (
                      <span className="inline-flex items-center gap-1 text-action-600 font-medium">
                        <Icon name="star" size={12} />
                        AI
                      </span>
                    )}
                  </span>
                  {viewOrder.approvedBy && (
                    <span>Approved by {viewOrder.approvedBy.name || viewOrder.approvedBy.email}</span>
                  )}
                </div>
              </div>

              {/* Editable fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 dark:text-shark-300 mb-1">Status</label>
                  <Select name="status" defaultValue={viewOrder.status}>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="ORDERED">Ordered</option>
                    <option value="RECEIVED">Received</option>
                    <option value="REJECTED">Rejected</option>
                  </Select>
                  <p className="text-xs text-shark-400 mt-1">Change status to correct mistakes</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 dark:text-shark-300 mb-1">Quantity</label>
                  <Input name="quantity" type="number" min={1} defaultValue={viewOrder.quantity} required disabled={!canEditQty} className={!canEditQty ? "opacity-60 cursor-not-allowed" : ""} />
                  {!canEditQty && <p className="text-xs text-shark-400 mt-1">Permission required to edit qty</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 dark:text-shark-300 mb-1">Supplier</label>
                <Input name="supplier" defaultValue={viewOrder.supplier || ""} placeholder="Supplier name" />
              </div>

              <div>
                <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 dark:text-shark-300 mb-1">Notes</label>
                <textarea
                  name="notes"
                  defaultValue={viewOrder.notes || ""}
                  placeholder="Order notes..."
                  rows={3}
                  className="w-full rounded-lg border border-shark-200 dark:border-shark-700 bg-white dark:bg-shark-800 px-3 py-2 text-sm text-shark-900 dark:text-shark-100 placeholder:text-shark-400 focus:outline-none focus:ring-2 focus:ring-action-500 focus:border-transparent"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-shark-100 dark:border-shark-700">
                <Button variant="outline" type="button" onClick={() => setViewOrder(null)}>Cancel</Button>
                <Button type="submit" disabled={loading === viewOrder.id + "update"} loading={loading === viewOrder.id + "update"}>Save Changes</Button>
              </div>
            </form>
          ) : (
            /* Read-only view for Branch Manager */
            <div className="space-y-5">
              <div className="bg-shark-50 dark:bg-shark-800 rounded-lg p-4">
                <h3 className="text-base font-semibold text-shark-900 dark:text-shark-100">{viewOrder.consumable.name}</h3>
                <div className="flex gap-4 mt-1 text-xs text-shark-400">
                  <span>{viewOrder.consumable.category}</span>
                  <span>{viewOrder.consumable.unitType}</span>
                  <span>{viewOrder.region.name}, {viewOrder.region.state.name}</span>
                </div>
                <div className="flex gap-4 mt-2 text-xs text-shark-400">
                  <span>Created {formatDate(viewOrder.createdAt)}</span>
                  <span>
                    by{" "}
                    {viewOrder.createdBy ? (viewOrder.createdBy.name || viewOrder.createdBy.email) : (
                      <span className="inline-flex items-center gap-1 text-action-600 font-medium">
                        <Icon name="star" size={12} />
                        AI
                      </span>
                    )}
                  </span>
                  {viewOrder.approvedBy && (
                    <span>Approved by {viewOrder.approvedBy.name || viewOrder.approvedBy.email}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-medium text-shark-400 uppercase mb-1">Status</p>
                  <Badge status={viewOrder.status} />
                </div>
                <div>
                  <p className="text-xs font-medium text-shark-400 uppercase mb-1">Quantity</p>
                  <p className="font-semibold text-shark-900 dark:text-shark-100">{viewOrder.quantity} {viewOrder.consumable.unitType}</p>
                </div>
              </div>

              {viewOrder.supplier && (
                <div>
                  <p className="text-xs font-medium text-shark-400 uppercase mb-1">Supplier</p>
                  <p className="text-sm text-shark-800 dark:text-shark-200">{viewOrder.supplier}</p>
                </div>
              )}

              {viewOrder.notes && (
                <div>
                  <p className="text-xs font-medium text-shark-400 uppercase mb-1">Notes</p>
                  <p className="text-sm text-shark-600 dark:text-shark-300 whitespace-pre-wrap bg-shark-50 dark:bg-shark-800 rounded-lg p-3">{viewOrder.notes}</p>
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-shark-100 dark:border-shark-700">
                <Button variant="outline" onClick={() => setViewOrder(null)}>Close</Button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Create PO Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Purchase Order">
        <form id="create-po-form" className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 dark:text-shark-300 mb-1">Supply *</label>
            <Select name="consumableId" required>
              <option value="">Select supply</option>
              {consumables.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.category}) — {c.quantityOnHand} {c.unitType} in stock
                  {c.quantityOnHand <= c.minimumThreshold ? " ⚠ LOW" : ""}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 dark:text-shark-300 mb-1">Quantity *</label>
            <Input name="quantity" type="number" min="1" required placeholder="e.g. 50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 dark:text-shark-300 mb-1">Supplier</label>
            <Input name="supplier" placeholder="Leave blank to use default" />
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 dark:text-shark-300 mb-1">Notes</label>
            <textarea name="notes" placeholder="Optional notes..." className="w-full rounded-xl border border-shark-200 dark:border-shark-700 bg-white dark:bg-shark-800 px-3.5 py-2 text-sm text-shark-900 dark:text-shark-100 focus:border-action-400 focus:outline-none focus:ring-2 focus:ring-action-400/20 transition-colors" rows={2} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="button" disabled={creating} loading={creating} onClick={async () => {
              const form = document.getElementById("create-po-form") as HTMLFormElement;
              if (!form) return;
              setCreating(true);
              try {
                const fd = new FormData(form);
                await createPurchaseOrder(fd);
                addToast("Purchase order created", "success");
                setShowCreate(false);
              } catch (e) {
                addToast(e instanceof Error ? e.message : "Failed to create order", "error");
              } finally {
                setCreating(false);
              }
            }}>Create Order</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
