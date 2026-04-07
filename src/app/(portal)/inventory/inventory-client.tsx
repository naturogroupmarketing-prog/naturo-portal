"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import {
  createState,
  createRegion,
  updateState,
  updateRegion,
  deleteState,
  deleteRegion,
} from "@/app/actions/locations";

const STATE_COLORS = [
  { bg: "bg-blue-50", color: "text-blue-600" },
  { bg: "bg-action-50", color: "text-action-600" },
  { bg: "bg-amber-50", color: "text-[#E8532E]" },
  { bg: "bg-cyan-50", color: "text-cyan-600" },
  { bg: "bg-violet-50", color: "text-violet-600" },
  { bg: "bg-rose-50", color: "text-rose-600" },
  { bg: "bg-teal-50", color: "text-teal-600" },
  { bg: "bg-orange-50", color: "text-orange-600" },
];

interface Location {
  id: string;
  name: string;
  regions: Array<{
    id: string;
    name: string;
    address: string | null;
    _count: { assets: number; consumables: number; users: number };
  }>;
}

interface RegionAlerts { damaged: number; lost: number; lowStock: number; unresolvedDamage: number }

export function InventoryListClient({ locations, regionAlerts = {}, isSuperAdmin }: { locations: Location[]; regionAlerts?: Record<string, RegionAlerts>; isSuperAdmin: boolean }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [modal, setModal] = useState<"state" | "region" | null>(null);
  const [collapsedStates, setCollapsedStates] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [editLocationRegion, setEditLocationRegion] = useState<Location["regions"][0] | null>(null);

  const toggleState = (id: string) => {
    setCollapsedStates((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalRegions = locations.reduce((sum, s) => sum + s.regions.length, 0);
  const totalAssets = locations.reduce((sum, s) => sum + s.regions.reduce((r, reg) => r + reg._count.assets, 0), 0);
  const totalConsumables = locations.reduce((sum, s) => sum + s.regions.reduce((r, reg) => r + reg._count.consumables, 0), 0);

  const filteredLocations = search
    ? locations.map((s) => ({
        ...s,
        regions: s.regions.filter((r) =>
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          s.name.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter((s) => s.regions.length > 0 || s.name.toLowerCase().includes(search.toLowerCase()))
    : locations;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-shark-900">Inventory</h1>
          <p className="text-sm text-shark-400 mt-1">{totalRegions} locations &middot; {totalAssets} assets &middot; {totalConsumables} consumables</p>
        </div>
        {isSuperAdmin && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setModal("region")}>
              <Icon name="plus" size={14} className="mr-1.5" />
              Location
            </Button>
            <Button size="sm" onClick={() => setModal("state")}>
              <Icon name="plus" size={14} className="mr-1.5" />
              State
            </Button>
          </div>
        )}
      </div>

      {/* Search */}
      <Input
        placeholder="Search locations..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs"
      />

      {/* Location List */}
      {filteredLocations.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <Icon name="map-pin" size={40} className="text-shark-200 mx-auto mb-3" />
            <p className="text-shark-400">{search ? "No locations match your search." : "No locations yet."}</p>
          </div>
        </Card>
      ) : (
        filteredLocations.map((state, sIdx) => {
          const sc = STATE_COLORS[sIdx % STATE_COLORS.length];
          const isCollapsed = collapsedStates.has(state.id);

          return (
            <div key={state.id} className="space-y-3">
              {/* State Header */}
              <button
                onClick={() => toggleState(state.id)}
                className="flex items-center gap-3 px-1 pt-2 w-full text-left group"
              >
                <div className={`w-9 h-9 rounded-xl ${sc.bg} flex items-center justify-center`}>
                  <Icon name="map-pin" size={18} className={sc.color} />
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <h2 className="text-xl font-bold text-shark-900">{state.name}</h2>
                  <span className="text-xs font-medium text-shark-400 bg-shark-100 px-2 py-0.5 rounded-full">
                    {state.regions.length} location{state.regions.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {isSuperAdmin && state.regions.length === 0 && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const fd = new FormData(); fd.set("id", state.id);
                      try { await deleteState(fd); addToast("State deleted", "success"); } catch { addToast("Failed", "error"); }
                    }}
                    className="text-shark-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100"
                  >
                    <Icon name="x" size={14} />
                  </button>
                )}
                <Icon
                  name="chevron-down"
                  size={18}
                  className={`text-shark-400 transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                />
              </button>

              {/* Region Cards */}
              {!isCollapsed && (
                <div className="space-y-2 ml-4">
                  {state.regions.length === 0 ? (
                    <p className="text-sm text-shark-400 px-1">No locations yet.</p>
                  ) : (
                    state.regions.map((region) => {
                      const isEmpty = region._count.assets === 0 && region._count.consumables === 0;
                      return (
                        <Card key={region.id} className="hover:shadow-md hover:border-action-200 transition-all">
                          <div className="px-4 py-3.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              {/* Left — clickable name */}
                              <Link href={`/inventory/${region.id}`} className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-shark-800 hover:text-action-500 transition-colors">{region.name}</h3>
                                {region.address && (
                                  <p className="text-xs text-shark-400 mt-0.5 flex items-center gap-1">
                                    <Icon name="map-pin" size={10} className="text-shark-300" />
                                    {region.address}
                                  </p>
                                )}
                              </Link>

                              {/* Center — counts + alerts */}
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="flex items-center gap-1 text-shark-500">
                                  <Icon name="package" size={12} className="text-action-400" />
                                  {region._count.assets}
                                </span>
                                <span className="flex items-center gap-1 text-shark-500">
                                  <Icon name="droplet" size={12} className="text-action-400" />
                                  {region._count.consumables}
                                </span>
                                <span className="flex items-center gap-1 text-shark-500">
                                  <Icon name="users" size={12} className="text-action-400" />
                                  {region._count.users}
                                </span>
                                {/* Alert badges — larger, clickable */}
                                {(() => {
                                  const alerts = regionAlerts[region.id];
                                  if (!alerts) return null;
                                  const hasAlerts = alerts.unresolvedDamage > 0 || alerts.lost > 0 || alerts.lowStock > 0;
                                  if (!hasAlerts) return null;
                                  return (
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      {alerts.unresolvedDamage > 0 && (
                                        <Link
                                          href={`/alerts/damage?region=${region.id}`}
                                          onClick={(e) => e.stopPropagation()}
                                          className="flex items-center gap-1 text-[#E8532E] bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-lg font-semibold text-xs transition-colors"
                                          title={`${alerts.unresolvedDamage} unresolved damage — click to view`}
                                        >
                                          <Icon name="alert-triangle" size={12} />
                                          {alerts.unresolvedDamage}
                                        </Link>
                                      )}
                                      {alerts.lost > 0 && (
                                        <Link
                                          href={`/alerts/lost?region=${region.id}`}
                                          onClick={(e) => e.stopPropagation()}
                                          className="flex items-center gap-1 text-shark-600 bg-shark-100 hover:bg-shark-200 px-2 py-0.5 rounded-lg font-semibold text-xs transition-colors"
                                          title={`${alerts.lost} lost items — click to view`}
                                        >
                                          <Icon name="shield" size={12} />
                                          {alerts.lost}
                                        </Link>
                                      )}
                                      {alerts.lowStock > 0 && (
                                        <Link
                                          href={`/alerts/low-stock?region=${region.id}`}
                                          onClick={(e) => e.stopPropagation()}
                                          className="flex items-center gap-1 text-[#E8532E] bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-lg font-semibold text-xs transition-colors"
                                          title={`${alerts.lowStock} low stock — click to view`}
                                        >
                                          <Icon name="alert-triangle" size={12} />
                                          {alerts.lowStock}
                                        </Link>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* Right — quick action icons */}
                              <div className="flex items-center gap-1">
                                <Link
                                  href={`/inventory/${region.id}?action=addAsset`}
                                  className="p-1.5 rounded-lg text-shark-300 hover:text-action-500 hover:bg-action-50 transition-colors"
                                  title="Add Asset"
                                >
                                  <Icon name="package" size={14} />
                                </Link>
                                <Link
                                  href={`/inventory/${region.id}?action=addConsumable`}
                                  className="p-1.5 rounded-lg text-shark-300 hover:text-action-500 hover:bg-action-50 transition-colors"
                                  title="Add Consumable"
                                >
                                  <Icon name="droplet" size={14} />
                                </Link>
                                {isSuperAdmin && (
                                  <button
                                    onClick={() => setEditLocationRegion(region)}
                                    className="p-1.5 rounded-lg text-shark-300 hover:text-action-500 hover:bg-action-50 transition-colors"
                                    title="Edit Location"
                                  >
                                    <Icon name="edit" size={14} />
                                  </button>
                                )}
                                <Link
                                  href={`/inventory/${region.id}`}
                                  className="p-1.5 rounded-lg text-shark-300 hover:text-action-500 transition-colors"
                                >
                                  <Icon name="arrow-right" size={14} />
                                </Link>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Add State Modal */}
      <Modal open={modal === "state"} onClose={() => setModal(null)} title="Add State">
        <form action={async (fd) => {
          try { await createState(fd); addToast("State added", "success"); setModal(null); router.refresh(); }
          catch (e) { addToast(e instanceof Error ? e.message : "Failed", "error"); }
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-shark-700 mb-1">State Name *</label>
            <Input name="name" required placeholder="e.g. Victoria" />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button type="submit">Add State</Button>
          </div>
        </form>
      </Modal>

      {/* Add Region Modal */}
      <Modal open={modal === "region"} onClose={() => setModal(null)} title="Add Location">
        <form action={async (fd) => {
          try { await createRegion(fd); addToast("Location added", "success"); setModal(null); router.refresh(); }
          catch (e) { addToast(e instanceof Error ? e.message : "Failed", "error"); }
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-shark-700 mb-1">State *</label>
            <Select name="stateId" required>
              <option value="">Select state</option>
              {locations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 mb-1">Location Name *</label>
            <Input name="name" required placeholder="e.g. Blackburn 3130" />
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 mb-1">Address</label>
            <Input name="address" placeholder="e.g. 123 Main St" />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button type="submit">Add Location</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Region Modal */}
      <Modal open={!!editLocationRegion} onClose={() => setEditLocationRegion(null)} title={`Edit: ${editLocationRegion?.name}`}>
        {editLocationRegion && (
          <form action={async (fd) => {
            try {
              fd.set("id", editLocationRegion.id);
              await updateRegion(fd);
              addToast("Location updated", "success");
              setEditLocationRegion(null);
              router.refresh();
            } catch (e) { addToast(e instanceof Error ? e.message : "Failed", "error"); }
          }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-shark-700 mb-1">Name *</label>
              <Input name="name" required defaultValue={editLocationRegion.name} />
            </div>
            <div>
              <label className="block text-sm font-medium text-shark-700 mb-1">Address</label>
              <Input name="address" defaultValue={editLocationRegion.address || ""} />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setEditLocationRegion(null)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
