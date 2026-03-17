"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Icon } from "@/components/ui/icon";
import { approvePurchaseOrder, markPurchaseOrderOrdered, updatePurchaseOrder } from "@/app/actions/purchase-orders";
import { formatDate } from "@/lib/utils";

const SECTION_COLORS = [
  { color: "text-blue-600", bg: "bg-blue-50" },
  { color: "text-amber-600", bg: "bg-amber-50" },
  { color: "text-cyan-600", bg: "bg-cyan-50" },
  { color: "text-red-600", bg: "bg-red-50" },
  { color: "text-emerald-600", bg: "bg-emerald-50" },
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

const TABS = ["All", "Pending", "Approved", "Ordered", "Rejected"] as const;

interface Props {
  purchaseOrders: PurchaseOrder[];
  regions: Region[];
  isSuperAdmin: boolean;
  canManagePO: boolean;
  initialStatus?: string;
  initialRegion?: string;
}

function mapStatusToTab(status?: string): string {
  if (!status) return "All";
  const map: Record<string, string> = { PENDING: "Pending", APPROVED: "Approved", ORDERED: "Ordered", REJECTED: "Rejected" };
  return map[status.toUpperCase()] || "All";
}

export function PurchaseOrdersClient({ purchaseOrders, regions, isSuperAdmin, canManagePO, initialStatus, initialRegion }: Props) {
  const [activeTab, setActiveTab] = useState<string>(mapStatusToTab(initialStatus));
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState(initialRegion || "ALL");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<string | null>(null);
  const [viewOrder, setViewOrder] = useState<PurchaseOrder | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Filter by tab + search + region
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
  });

  const pendingCount = purchaseOrders.filter((po) => po.status === "PENDING").length;

  const handleAction = async (purchaseOrderId: string, action: string) => {
    setLoading(purchaseOrderId + action);
    setError(null);
    try {
      if (action === "ordered") {
        const fd = new FormData();
        fd.set("purchaseOrderId", purchaseOrderId);
        await markPurchaseOrderOrdered(fd);
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

  const renderTable = (orders: PurchaseOrder[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-shark-100 text-left text-xs font-medium text-shark-400 uppercase tracking-wider">
            <th className="px-5 py-3">Item</th>
            <th className="px-5 py-3">Category</th>
            <th className="px-5 py-3">Supplier</th>
            <th className="px-5 py-3">Qty</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3">Created By</th>
            <th className="px-5 py-3">Date</th>
            <th className="px-5 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-shark-50">
          {orders.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-5 py-8 text-center text-shark-400">
                No purchase orders found.
              </td>
            </tr>
          ) : (
            orders.map((po) => (
              <tr key={po.id} onClick={() => setViewOrder(po)} className="hover:bg-shark-25 transition-colors cursor-pointer">
                <td className="px-5 py-3.5 font-medium text-shark-800">
                  {po.consumable.name}
                  <span className="ml-1 text-xs text-shark-400">({po.consumable.unitType})</span>
                </td>
                <td className="px-5 py-3.5 text-shark-500">{po.consumable.category}</td>
                <td className="px-5 py-3.5 text-shark-500">{po.supplier || "—"}</td>
                <td className="px-5 py-3.5 font-semibold text-shark-800">{po.quantity}</td>
                <td className="px-5 py-3.5"><Badge status={po.status} /></td>
                <td className="px-5 py-3.5 text-shark-500">
                  {po.createdBy ? (po.createdBy.name || po.createdBy.email) : (
                    <span className="inline-flex items-center gap-1 text-action-600 font-medium">
                      <Icon name="star" size={14} />
                      AI
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-shark-400">{formatDate(po.createdAt)}</td>
                <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                  {canManagePO ? (
                    <div className="flex gap-1.5">
                      {po.status === "PENDING" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleAction(po.id, "approve")}
                            disabled={loading === po.id + "approve"}
                          >
                            {loading === po.id + "approve" ? "..." : "Approve"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(po.id, "reject")}
                            disabled={loading === po.id + "reject"}
                          >
                            {loading === po.id + "reject" ? "..." : "Reject"}
                          </Button>
                        </>
                      )}
                      {po.status === "APPROVED" && (
                        <Button
                          size="sm"
                          onClick={() => handleAction(po.id, "ordered")}
                          disabled={loading === po.id + "ordered"}
                        >
                          {loading === po.id + "ordered" ? "..." : "Mark Ordered"}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-shark-400">View only</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  // Group by region for super admin
  const regionGroups = isSuperAdmin
    ? regions.map((region) => ({
        region,
        orders: filtered.filter((po) => po.regionId === region.id),
      }))
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
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-shark-50 p-1 rounded-lg w-fit">
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
            {tab === "Pending" && pendingCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-amber-500 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <Icon name="x" size={14} />
          </button>
        </div>
      )}

      {/* Search + Region Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Input
          placeholder="Search by item, category, or supplier..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-md"
        />
        {isSuperAdmin && regions.length > 1 && (
          <Select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="sm:max-w-[200px]"
          >
            <option value="ALL">All regions</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </Select>
        )}
      </div>

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
                    <option value="REJECTED">Rejected</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-shark-700 mb-1">Quantity</label>
                  <Input name="quantity" type="number" min={1} defaultValue={viewOrder.quantity} required />
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
                <Button type="submit" disabled={loading === viewOrder.id + "update"}>
                  {loading === viewOrder.id + "update" ? "Saving..." : "Save Changes"}
                </Button>
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
    </div>
  );
}
