"use client";

import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Icon } from "@/components/ui/icon";
import { approvePurchaseOrder, markPurchaseOrderOrdered, updatePurchaseOrder, createPurchaseOrder, receivePurchaseOrder, batchUpdatePOStatus } from "@/app/actions/purchase-orders";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";

const SECTION_COLORS = [
  { color: "text-blue-600", bg: "bg-blue-50" },
  { color: "text-[#E8532E]", bg: "bg-amber-50" },
  { color: "text-cyan-600", bg: "bg-cyan-50" },
  { color: "text-red-600", bg: "bg-red-50" },
  { color: "text-action-600", bg: "bg-action-50" },
  { color: "text-violet-600", bg: "bg-violet-50" },
];

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
  consumable: { name: string; unitType: string; category: string; imageUrl: string | null };
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
}

function mapStatusToTab(status?: string): string {
  if (!status) return "Pending";
  const map: Record<string, string> = { PENDING: "Pending", APPROVED: "Approved", ORDERED: "Ordered", RECEIVED: "Received", REJECTED: "Rejected" };
  return map[status.toUpperCase()] || "Pending";
}

export function PurchaseOrdersClient({ purchaseOrders, regions, consumables = [], isSuperAdmin, canManagePO, canApprovePO = false, canEditQty = false, initialStatus, initialRegion }: Props) {
  const { addToast } = useToast();
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(mapStatusToTab(initialStatus));
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("ALL");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(() => {
    if (!initialRegion) return new Set();
    // Collapse all regions except the one linked from dashboard
    return new Set(regions.filter((r) => r.id !== initialRegion).map((r) => r.id));
  });
  const [loading, setLoading] = useState<string | null>(null);
  const [viewOrder, setViewOrder] = useState<PurchaseOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

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

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Filter by tab + search + region, then sort by priority (most urgent first)
  const filtered = purchaseOrders.filter((po) => {
    if (activeTab !== "All" && po.status !== activeTab.toUpperCase()) return false;
    if (regionFilter !== "ALL" && po.region.id !== regionFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        po.consumable.name.toLowerCase().includes(q) ||
        po.consumable.category.toLowerCase().includes(q) ||
        (po.supplier || "").toLowerCase().includes(q)
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

  const pendingCount = purchaseOrders.filter((po) => po.status === "PENDING").length;
  const tabCounts: Record<string, number> = {
    Pending: pendingCount,
    Approved: purchaseOrders.filter((po) => po.status === "APPROVED").length,
    Ordered: purchaseOrders.filter((po) => po.status === "ORDERED").length,
    Rejected: purchaseOrders.filter((po) => po.status === "REJECTED").length,
    Received: purchaseOrders.filter((po) => po.status === "RECEIVED").length,
    All: purchaseOrders.length,
  };

  const handleAction = async (purchaseOrderId: string, action: string) => {
    setLoading(purchaseOrderId + action);
    setError(null);
    try {
      if (action === "ordered") {
        const fd = new FormData();
        fd.set("purchaseOrderId", purchaseOrderId);
        await markPurchaseOrderOrdered(fd);
      } else if (action === "received") {
        const fd = new FormData();
        fd.set("purchaseOrderId", purchaseOrderId);
        await receivePurchaseOrder(fd);
        addToast("PO received — stock updated", "success");
      } else {
        const fd = new FormData();
        fd.set("purchaseOrderId", purchaseOrderId);
        fd.set("action", action);
        await approvePurchaseOrder(fd);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  // Status display — Badge for all, plus "Received" button for Branch Manager when ORDERED
  const renderStatus = (po: PurchaseOrder) => {
    // Branch Manager: show "Received" button when item arrives
    if (!isSuperAdmin && canManagePO && po.status === "ORDERED") return (
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <Badge status={po.status} />
        <Button size="sm" onClick={() => handleAction(po.id, "received")} disabled={!!loading} loading={loading === po.id + "received"}>Received</Button>
      </div>
    );
    // Everyone else: just the badge (click row to edit)
    return <Badge status={po.status} />;
  };

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
    } catch (e) { addToast(e instanceof Error ? e.message : "Failed", "error"); }
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
              className={`border rounded-xl p-4 bg-white transition-shadow cursor-pointer ${selected.has(po.id) ? "border-action-400 bg-action-50/20" : "border-shark-100 hover:shadow-sm"}`}
            >
              <div className="flex items-start gap-3">
                {canApprovePO && (
                  <input type="checkbox" checked={selected.has(po.id)} onChange={(e) => { e.stopPropagation(); toggleSelect(po.id); }} className="w-4 h-4 mt-1 rounded border-shark-300 text-action-500 focus:ring-action-400 shrink-0" />
                )}
                {po.consumable.imageUrl ? (
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-shark-100 shrink-0">
                    <img src={po.consumable.imageUrl} alt={po.consumable.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-shark-50 border border-shark-100 flex items-center justify-center shrink-0">
                    <Icon name="droplet" size={16} className="text-shark-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-shark-800 truncate">{po.consumable.name}</p>
                    {renderStatus(po)}
                  </div>
                  <p className="text-xs text-shark-400 mt-0.5">Qty: {po.quantity} · {po.region.name}</p>
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
            <tr className="border-b border-shark-100 text-left text-xs font-medium text-shark-400 uppercase tracking-wider">
              {canApprovePO && <th className="px-3 py-3 w-10"><input type="checkbox" checked={selected.size > 0 && selected.size === orders.length} onChange={() => { if (selected.size === orders.length) setSelected(new Set()); else setSelected(new Set(orders.map((o) => o.id))); }} className="rounded border-shark-300 text-action-500" /></th>}
              <th className="px-5 py-3">Item</th>
              <th className="px-5 py-3">Qty</th>
              <th className="px-5 py-3">Region</th>
              <th className="px-5 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-shark-50">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={canApprovePO ? 5 : 4} className="px-5 py-8 text-center text-shark-400">
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
                        <div className="w-8 h-8 rounded-lg overflow-hidden border border-shark-100 shrink-0">
                          <img src={po.consumable.imageUrl} alt={po.consumable.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-shark-50 border border-shark-100 flex items-center justify-center shrink-0">
                          <Icon name="droplet" size={14} className="text-shark-300" />
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-shark-800">{po.consumable.name}</span>
                        <span className="ml-1 text-xs text-shark-400">({po.consumable.unitType})</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-shark-800">{po.quantity}</td>
                  <td className="px-5 py-3.5 text-shark-500">{po.region.name}</td>
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

  // Group by region for super admin
  const regionGroups = isSuperAdmin
    ? regions.map((region) => ({
        region,
        orders: filtered.filter((po) => po.regionId === region.id),
      }))
      .sort((a, b) => {
        // Count pending (most urgent) orders per region
        const aPending = a.orders.filter((o) => o.status === "PENDING").length;
        const bPending = b.orders.filter((o) => o.status === "PENDING").length;
        if (bPending !== aPending) return bPending - aPending;
        // Then by total outstanding (non-received/rejected)
        const aOutstanding = a.orders.filter((o) => o.status !== "RECEIVED" && o.status !== "REJECTED").length;
        const bOutstanding = b.orders.filter((o) => o.status !== "RECEIVED" && o.status !== "REJECTED").length;
        return bOutstanding - aOutstanding;
      })
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-shark-900">Purchase Orders</h1>
          <p className="text-sm text-shark-400 mt-1">
            {purchaseOrders.length} total orders
            {pendingCount > 0 && ` · ${pendingCount} pending`}
          </p>
        </div>
        {canManagePO && (
          <Button onClick={() => setShowCreate(true)}>
            <Icon name="plus" size={14} className="mr-1.5" />
            Create Order
          </Button>
        )}
      </div>

      {/* Mobile: compact status dropdown + search in one row */}
      {/* Desktop: full tab bar */}
      <div className="space-y-3">
        {/* Row 1: Status + Search */}
        <div className="flex items-center gap-2">
          {/* Mobile: dropdown for status */}
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
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          {isSuperAdmin && regions.length > 1 && (
            <Select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="w-auto min-w-[100px] sm:min-w-[160px] shrink-0 hidden sm:block"
            >
              <option value="ALL">All regions</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </Select>
          )}
          <div className="relative shrink-0" ref={columnMenuRef}>
            <button
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border border-shark-200 text-shark-500 hover:bg-shark-50 transition-colors"
              title="Columns"
            >
              <Icon name="settings" size={16} />
            </button>
            {showColumnMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-shark-900 border border-shark-200 dark:border-shark-700 rounded-lg shadow-lg z-50 py-2 min-w-[160px]">
                {PO_COL_LABELS.map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 px-3 py-1.5 hover:bg-shark-50 dark:hover:bg-shark-800 cursor-pointer text-sm text-shark-700 dark:text-shark-300">
                    <input
                      type="checkbox"
                      checked={visibleColumns[key]}
                      onChange={() => toggleColumn(key)}
                      className="rounded border-shark-300 text-action-500 focus:ring-action-400"
                    />
                    {label}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile: region filter (below search if super admin) */}
        {isSuperAdmin && regions.length > 1 && (
          <Select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="sm:hidden"
          >
            <option value="ALL">All regions</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </Select>
        )}

        {/* Desktop: full tab bar */}
        <div className="hidden sm:flex gap-1 bg-shark-50 p-1 rounded-lg w-fit">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeTab === tab
                  ? "bg-white text-shark-900 shadow-sm"
                  : "text-shark-500 hover:text-shark-700"
              }`}
            >
              {tab}
              {tabCounts[tab] > 0 && (
                <span className={`ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold rounded-full ${
                  tab === "Pending" ? "text-white bg-[#E8532E]" : "text-shark-500 bg-shark-200"
                }`}>
                  {tabCounts[tab]}
                </span>
              )}
            </button>
          ))}
        </div>
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

      {/* Content */}
      {isSuperAdmin ? (
        // Region-grouped view
        <div className="space-y-4">
          {regionGroups.map(({ region, orders }, idx) => {
            const colors = SECTION_COLORS[idx % SECTION_COLORS.length];
            const isCollapsed = collapsedSections.has(region.id);

            return (
              <Card key={region.id} className="overflow-hidden">
                <button
                  onClick={() => toggleSection(region.id)}
                  className="w-full flex items-center justify-between px-5 py-3 hover:bg-shark-25 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg ${colors.bg} flex items-center justify-center`}>
                      <Icon name="map-pin" size={14} className={colors.color} />
                    </div>
                    <div className="text-left">
                      <span className="font-semibold text-shark-900">{region.name}</span>
                      <span className="ml-2 text-xs text-shark-400">{region.state.name}</span>
                    </div>
                    <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-shark-100 text-shark-600 rounded-full">
                      {orders.length}
                    </span>
                  </div>
                  <Icon
                    name="chevron-down"
                    size={16}
                    className={`text-shark-400 transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                  />
                </button>
                {!isCollapsed && renderTable(orders)}
              </Card>
            );
          })}
        </div>
      ) : (
        // Single region view
        <Card className="overflow-hidden">
          {renderTable(filtered)}
        </Card>
      )}
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
              <div className="bg-shark-50 rounded-lg p-4">
                <h3 className="text-base font-semibold text-shark-900">{viewOrder.consumable.name}</h3>
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
                  <label className="block text-sm font-medium text-shark-700 mb-1">Status</label>
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
                  <label className="block text-sm font-medium text-shark-700 mb-1">Quantity</label>
                  <Input name="quantity" type="number" min={1} defaultValue={viewOrder.quantity} required disabled={!canEditQty} className={!canEditQty ? "opacity-60 cursor-not-allowed" : ""} />
                  {!canEditQty && <p className="text-xs text-shark-400 mt-1">Permission required to edit qty</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-shark-700 mb-1">Supplier</label>
                <Input name="supplier" defaultValue={viewOrder.supplier || ""} placeholder="Supplier name" />
              </div>

              <div>
                <label className="block text-sm font-medium text-shark-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  defaultValue={viewOrder.notes || ""}
                  placeholder="Order notes..."
                  rows={3}
                  className="w-full rounded-lg border border-shark-200 bg-white px-3 py-2 text-sm text-shark-900 placeholder:text-shark-400 focus:outline-none focus:ring-2 focus:ring-action-500 focus:border-transparent"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-shark-100">
                <Button variant="outline" type="button" onClick={() => setViewOrder(null)}>Cancel</Button>
                <Button type="submit" disabled={loading === viewOrder.id + "update"} loading={loading === viewOrder.id + "update"}>Save Changes</Button>
              </div>
            </form>
          ) : (
            /* Read-only view for Branch Manager */
            <div className="space-y-5">
              <div className="bg-shark-50 rounded-lg p-4">
                <h3 className="text-base font-semibold text-shark-900">{viewOrder.consumable.name}</h3>
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
                  <p className="font-semibold text-shark-900">{viewOrder.quantity} {viewOrder.consumable.unitType}</p>
                </div>
              </div>

              {viewOrder.supplier && (
                <div>
                  <p className="text-xs font-medium text-shark-400 uppercase mb-1">Supplier</p>
                  <p className="text-sm text-shark-800">{viewOrder.supplier}</p>
                </div>
              )}

              {viewOrder.notes && (
                <div>
                  <p className="text-xs font-medium text-shark-400 uppercase mb-1">Notes</p>
                  <p className="text-sm text-shark-600 whitespace-pre-wrap bg-shark-50 rounded-lg p-3">{viewOrder.notes}</p>
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-shark-100">
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
            <label className="block text-sm font-medium text-shark-700 mb-1">Consumable *</label>
            <Select name="consumableId" required>
              <option value="">Select consumable</option>
              {consumables.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.category}) — {c.quantityOnHand} {c.unitType} in stock
                  {c.quantityOnHand <= c.minimumThreshold ? " ⚠ LOW" : ""}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 mb-1">Quantity *</label>
            <Input name="quantity" type="number" min="1" required placeholder="e.g. 50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 mb-1">Supplier</label>
            <Input name="supplier" placeholder="Leave blank to use default" />
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 mb-1">Notes</label>
            <textarea name="notes" placeholder="Optional notes..." className="w-full rounded-xl border border-shark-200 px-3.5 py-2 text-sm text-shark-900 focus:border-action-400 focus:outline-none focus:ring-2 focus:ring-action-400/20 transition-colors" rows={2} />
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
