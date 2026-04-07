"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Icon } from "@/components/ui/icon";
import { approvePurchaseOrder, markPurchaseOrderOrdered, updatePurchaseOrder, createPurchaseOrder, receivePurchaseOrder, batchUpdatePOStatus } from "@/app/actions/purchase-orders";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";

// Section colors removed — using flat list now

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
  consumable: { name: string; unitType: string; category: string };
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

// Column visibility removed — all key info shown on cards

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
  const [activeTab, setActiveTab] = useState<string>(mapStatusToTab(initialStatus));
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [viewOrder, setViewOrder] = useState<PurchaseOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  // Filter by tab + search, sort by priority
  const filtered = purchaseOrders.filter((po) => {
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
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((po) => po.id)));
  };

  // Bulk action helpers
  const selectedPOs = filtered.filter((po) => selected.has(po.id));
  const pendingSelected = selectedPOs.filter((po) => po.status === "PENDING").length;
  const approvedSelected = selectedPOs.filter((po) => po.status === "APPROVED").length;
  const orderedSelected = selectedPOs.filter((po) => po.status === "ORDERED").length;

  const handleBulkAction = async (newStatus: string) => {
    setBulkLoading(true);
    try {
      const ids = selectedPOs.filter((po) => {
        if (newStatus === "APPROVED") return po.status === "PENDING";
        if (newStatus === "ORDERED") return po.status === "APPROVED";
        if (newStatus === "RECEIVED") return po.status === "ORDERED";
        if (newStatus === "REJECTED") return po.status === "PENDING";
        return false;
      }).map((po) => po.id);
      if (ids.length === 0) return;
      const result = await batchUpdatePOStatus(ids, newStatus);
      addToast(`${result.updated} order${result.updated > 1 ? "s" : ""} updated`, "success");
      setSelected(new Set());
      router.refresh();
    } catch (e) { addToast(e instanceof Error ? e.message : "Failed", "error"); }
    setBulkLoading(false);
  };

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

  const renderNextAction = (po: PurchaseOrder) => {
    if (!canManagePO) return null;
    if (po.status === "PENDING" && canApprovePO) return (
      <div className="flex gap-1.5">
        <Button size="sm" onClick={(e) => { e.stopPropagation(); handleAction(po.id, "approve"); }} disabled={loading === po.id + "approve"} loading={loading === po.id + "approve"}>Approve</Button>
        <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); handleAction(po.id, "reject"); }} disabled={loading === po.id + "reject"}>Reject</Button>
      </div>
    );
    if (po.status === "APPROVED" && canApprovePO) return (
      <Button size="sm" onClick={(e) => { e.stopPropagation(); handleAction(po.id, "ordered"); }} disabled={loading === po.id + "ordered"} loading={loading === po.id + "ordered"}>Mark Ordered</Button>
    );
    if (po.status === "ORDERED") return (
      <Button size="sm" onClick={(e) => { e.stopPropagation(); handleAction(po.id, "received"); }} disabled={loading === po.id + "received"} loading={loading === po.id + "received"}>Mark Received</Button>
    );
    return null;
  };

  // No renderTable or regionGroups — using flat list below

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

      {/* Controls: status tabs + search */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Select
            value={activeTab}
            onChange={(e) => { setActiveTab(e.target.value as typeof activeTab); setSelected(new Set()); }}
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

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <Icon name="x" size={14} />
          </button>
        </div>
      )}

      {/* Bulk Action Bar */}
      {selected.size > 0 && (
        <div className="sticky top-14 z-20 bg-action-500 text-white rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{selected.size} selected</span>
          </div>
          <div className="flex items-center gap-2">
            {pendingSelected > 0 && canApprovePO && (
              <>
                <Button size="sm" variant="secondary" onClick={() => handleBulkAction("APPROVED")} disabled={bulkLoading} loading={bulkLoading}>
                  Approve ({pendingSelected})
                </Button>
                <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" onClick={() => handleBulkAction("REJECTED")} disabled={bulkLoading}>
                  Reject ({pendingSelected})
                </Button>
              </>
            )}
            {approvedSelected > 0 && (
              <Button size="sm" variant="secondary" onClick={() => handleBulkAction("ORDERED")} disabled={bulkLoading} loading={bulkLoading}>
                Mark Ordered ({approvedSelected})
              </Button>
            )}
            {orderedSelected > 0 && (
              <Button size="sm" variant="secondary" onClick={() => handleBulkAction("RECEIVED")} disabled={bulkLoading} loading={bulkLoading}>
                Mark Received ({orderedSelected})
              </Button>
            )}
            <button onClick={() => setSelected(new Set())} className="text-white/80 hover:text-white p-1 ml-1">
              <Icon name="x" size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Flat PO List */}
      {filtered.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <Icon name="truck" size={40} className="text-shark-200 mx-auto mb-3" />
            <p className="text-shark-500">No purchase orders found</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((po) => (
            <Card key={po.id} className={`transition-all ${selected.has(po.id) ? "ring-2 ring-action-400 bg-action-50/20" : "hover:shadow-sm"}`}>
              <div className="px-4 py-3 flex items-center gap-3">
                {canManagePO && (
                  <input
                    type="checkbox"
                    checked={selected.has(po.id)}
                    onChange={() => toggleSelect(po.id)}
                    className="w-4 h-4 rounded border-shark-300 text-action-500 focus:ring-action-400 shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setViewOrder(po)}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-shark-800">{po.consumable.name}</p>
                    <span className="text-xs text-shark-500 font-medium">× {po.quantity}</span>
                    <Badge status={po.status} />
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-shark-400 flex-wrap">
                    <span className="bg-shark-100 px-1.5 py-0.5 rounded text-shark-500">{po.region.name}</span>
                    {po.supplier && <span>· {po.supplier}</span>}
                    <span>· {formatDate(po.createdAt)}</span>
                  </div>
                </div>
                <div className="shrink-0">
                  {renderNextAction(po)}
                </div>
              </div>
            </Card>
          ))}
        </div>
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
