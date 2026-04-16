"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import {
  createState,
  createRegion,
  updateState,
  updateRegion,
  deleteState,
  deleteRegion,
  archiveRegion,
  restoreRegion,
} from "@/app/actions/locations";

const STATE_COLORS = [
  { bg: "bg-blue-50", color: "text-blue-600" },
  { bg: "bg-action-50", color: "text-action-600" },
  { bg: "bg-amber-50", color: "text-[#E8532E]" },
  { bg: "bg-cyan-50", color: "text-cyan-600" },
  { bg: "bg-shark-50", color: "text-shark-600" },
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

interface ArchivedRegion {
  id: string;
  name: string;
  archivedAt: string;
  state: { name: string };
  _count: { assets: number; consumables: number; users: number };
}

export function InventoryListClient({ locations, regionAlerts = {}, isSuperAdmin, archivedRegions = [] }: { locations: Location[]; regionAlerts?: Record<string, RegionAlerts>; isSuperAdmin: boolean; archivedRegions?: ArchivedRegion[] }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [collapsedStates, setCollapsedStates] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [editLocationRegion, setEditLocationRegion] = useState<Location["regions"][0] | null>(null);
  const [archiveConfirm, setArchiveConfirm] = useState<{ id: string; name: string; assets: number; consumables: number; users: number } | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [manageTab, setManageTab] = useState<"locations" | "add-state" | "add-location">("locations");
  const [editingStateName, setEditingStateName] = useState<{ id: string; name: string } | null>(null);
  const [manageSearch, setManageSearch] = useState("");

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
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-shark-900 tracking-tight">Inventory</h1>
          <p className="text-sm text-shark-400 mt-1">{totalRegions} locations &middot; {totalAssets} assets &middot; {totalConsumables} supplies</p>
        </div>
        {isSuperAdmin && (
          <Button size="sm" onClick={() => { setShowManageModal(true); setManageTab("locations"); }}>
            <Icon name="settings" size={14} className="mr-1.5" />
            Manage Locations
          </Button>
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
                      const alerts = regionAlerts[region.id];
                      return (
                        <Link key={region.id} href={`/inventory/${region.id}`} className="block group">
                        <Card className={`hover:shadow-md transition-all cursor-pointer border-action-100 hover:border-action-300`}>
                          <div className="px-4 py-3.5">
                            <div className="flex items-center justify-between gap-3">
                              {/* Left — name + counts */}
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className={`w-8 h-8 rounded-lg ${sc.bg} flex items-center justify-center shrink-0`}>
                                  <Icon name="map-pin" size={14} className={sc.color} />
                                </div>
                                <div className="min-w-0">
                                  <h3 className="text-sm font-semibold text-shark-800">{region.name}</h3>
                                  <p className="text-xs text-shark-400 mt-0.5">
                                    {region._count.assets} assets · {region._count.consumables} supplies · {region._count.users} staff
                                  </p>
                                  {region.address && (
                                    <p className="hidden lg:flex text-xs text-shark-400 mt-0.5 items-center gap-1">
                                      <Icon name="map-pin" size={10} className="text-shark-300" />
                                      {region.address}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Right — alert badges + edit icon */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                {alerts && (() => {
                                  const damageLost = alerts.unresolvedDamage + alerts.lost;
                                  return (
                                    <>
                                      {damageLost > 0 && (
                                        <span
                                          onClick={(e) => { e.preventDefault(); window.location.href = `/alerts/damage?region=${region.id}`; }}
                                          className="flex items-center gap-1 text-[#E8532E] bg-red-50 border border-red-100 hover:bg-red-100 px-2 py-0.5 rounded-full font-semibold text-xs transition-colors"
                                          title={`${damageLost} damaged/lost`}
                                        >
                                          <Icon name="alert-triangle" size={11} />
                                          {damageLost}
                                        </span>
                                      )}
                                      {alerts.lowStock > 0 && (
                                        <span
                                          onClick={(e) => { e.preventDefault(); window.location.href = `/alerts/low-stock?region=${region.id}`; }}
                                          className="flex items-center gap-1 text-amber-600 bg-amber-50 border border-amber-100 hover:bg-amber-100 px-2 py-0.5 rounded-full font-semibold text-xs transition-colors"
                                          title={`${alerts.lowStock} low stock`}
                                        >
                                          <Icon name="alert-triangle" size={11} />
                                          {alerts.lowStock}
                                        </span>
                                      )}
                                    </>
                                  );
                                })()}
                                {isSuperAdmin && (
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault(); e.stopPropagation();
                                      setArchiveConfirm({ id: region.id, name: region.name, assets: region._count.assets, consumables: region._count.consumables, users: region._count.users });
                                    }}
                                    className="p-1.5 rounded-lg text-shark-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                    title="Archive Location"
                                  >
                                    <Icon name="download" size={14} />
                                  </button>
                                )}
                                <Icon name="arrow-right" size={14} className="text-shark-400 group-hover:text-action-500 transition-colors" />
                              </div>
                            </div>
                          </div>
                        </Card>
                        </Link>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })
      )}

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

      {/* Archive Confirmation Modal */}
      <Modal open={!!archiveConfirm} onClose={() => setArchiveConfirm(null)} title="Archive Location">
        {archiveConfirm && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm font-medium text-amber-800">
                Archive &quot;{archiveConfirm.name}&quot;?
              </p>
              <p className="text-sm text-amber-700 mt-1">
                All assets, supplies, and staff will be preserved but hidden from active views. You can restore this location anytime.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-shark-50 rounded-lg px-3 py-2 text-center">
                <p className="text-lg font-bold text-shark-900">{archiveConfirm.assets}</p>
                <p className="text-xs text-shark-400">Assets</p>
              </div>
              <div className="bg-shark-50 rounded-lg px-3 py-2 text-center">
                <p className="text-lg font-bold text-shark-900">{archiveConfirm.consumables}</p>
                <p className="text-xs text-shark-400">Supplies</p>
              </div>
              <div className="bg-shark-50 rounded-lg px-3 py-2 text-center">
                <p className="text-lg font-bold text-shark-900">{archiveConfirm.users}</p>
                <p className="text-xs text-shark-400">Staff</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setArchiveConfirm(null)}>Cancel</Button>
              <Button
                variant="danger"
                loading={archiving}
                disabled={archiving}
                onClick={async () => {
                  setArchiving(true);
                  try {
                    await archiveRegion(archiveConfirm.id);
                    addToast(`"${archiveConfirm.name}" archived`, "success");
                    setArchiveConfirm(null);
                    router.refresh();
                  } catch (e) { addToast(e instanceof Error ? e.message : "Failed to archive", "error"); }
                  setArchiving(false);
                }}
              >
                Archive Location
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Archived Locations */}
      {isSuperAdmin && archivedRegions.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-2 text-sm text-shark-400 hover:text-shark-600 transition-colors"
          >
            <Icon name="clock" size={14} />
            <span>{archivedRegions.length} archived location{archivedRegions.length !== 1 ? "s" : ""}</span>
            <Icon name="chevron-down" size={14} className={`transition-transform ${showArchived ? "" : "-rotate-90"}`} />
          </button>
          {showArchived && (
            <div className="mt-3 space-y-2">
              {archivedRegions.map((region) => (
                <Card key={region.id} className="border-dashed border-shark-200 bg-shark-50/50">
                  <div className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-shark-600">{region.name}</p>
                      <p className="text-xs text-shark-400">
                        {region.state.name} · Archived {new Date(region.archivedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      <p className="text-xs text-shark-400 mt-0.5">
                        {region._count.assets} assets · {region._count.consumables} supplies · {region._count.users} staff
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        loading={restoring === region.id}
                        disabled={restoring === region.id}
                        onClick={async () => {
                          setRestoring(region.id);
                          try {
                            await restoreRegion(region.id);
                            addToast(`"${region.name}" restored`, "success");
                            router.refresh();
                          } catch (e) { addToast(e instanceof Error ? e.message : "Failed", "error"); }
                          setRestoring(null);
                        }}
                      >
                        Restore
                      </Button>
                      {region._count.assets === 0 && region._count.consumables === 0 && region._count.users === 0 && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={async () => {
                            if (!confirm(`Permanently delete "${region.name}"? This cannot be undone.`)) return;
                            try {
                              const fd = new FormData();
                              fd.set("id", region.id);
                              await deleteRegion(fd);
                              addToast("Location permanently deleted", "success");
                              router.refresh();
                            } catch (e) { addToast(e instanceof Error ? e.message : "Failed", "error"); }
                          }}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Manage Locations Modal */}
      <Modal open={showManageModal} onClose={() => { setShowManageModal(false); setManageSearch(""); setEditingStateName(null); }} title="Manage Locations">
        <div className="space-y-4">
          {/* Tab Navigation */}
          <div className="flex gap-1 bg-shark-50 rounded-xl p-1">
            {[
              { key: "locations" as const, label: "All Locations", icon: "map-pin" as const },
              { key: "add-state" as const, label: "Add State", icon: "plus" as const },
              { key: "add-location" as const, label: "Add Location", icon: "plus" as const },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setManageTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex-1 justify-center ${
                  manageTab === tab.key
                    ? "bg-action-500 text-white shadow-sm"
                    : "text-shark-500 hover:bg-shark-100 hover:text-shark-700"
                }`}
              >
                <Icon name={tab.icon} size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content: All Locations */}
          {manageTab === "locations" && (
            <div className="space-y-3">
              <Input
                placeholder="Search..."
                value={manageSearch}
                onChange={(e) => setManageSearch(e.target.value)}
                className="text-sm"
              />
              <div className="max-h-[400px] overflow-y-auto space-y-3 pr-1">
                {locations
                  .filter((s) =>
                    !manageSearch ||
                    s.name.toLowerCase().includes(manageSearch.toLowerCase()) ||
                    s.regions.some((r) => r.name.toLowerCase().includes(manageSearch.toLowerCase()))
                  )
                  .map((state, sIdx) => {
                    const sc = STATE_COLORS[sIdx % STATE_COLORS.length];
                    const filteredRegions = manageSearch
                      ? state.regions.filter((r) =>
                          r.name.toLowerCase().includes(manageSearch.toLowerCase()) ||
                          state.name.toLowerCase().includes(manageSearch.toLowerCase())
                        )
                      : state.regions;

                    return (
                      <div key={state.id} className="space-y-1.5">
                        {/* State row */}
                        <div className="flex items-center gap-2 group">
                          <div className={`w-7 h-7 rounded-lg ${sc.bg} flex items-center justify-center shrink-0`}>
                            <Icon name="map-pin" size={14} className={sc.color} />
                          </div>
                          {editingStateName?.id === state.id ? (
                            <form
                              className="flex-1 flex items-center gap-2"
                              onSubmit={async (e) => {
                                e.preventDefault();
                                if (!editingStateName.name.trim()) { setEditingStateName(null); return; }
                                try {
                                  const fd = new FormData();
                                  fd.set("id", state.id);
                                  fd.set("name", editingStateName.name);
                                  await updateState(fd);
                                  addToast("State renamed", "success");
                                  router.refresh();
                                } catch (err) { addToast(err instanceof Error ? err.message : "Failed", "error"); }
                                setEditingStateName(null);
                              }}
                            >
                              <Input
                                value={editingStateName.name}
                                onChange={(e) => setEditingStateName({ ...editingStateName, name: e.target.value })}
                                className="text-sm h-8"
                                autoFocus
                              />
                              <Button type="submit" size="sm" className="px-2">
                                <Icon name="check" size={14} />
                              </Button>
                              <Button type="button" size="sm" variant="secondary" className="px-2" onClick={() => setEditingStateName(null)}>
                                <Icon name="x" size={14} />
                              </Button>
                            </form>
                          ) : (
                            <>
                              <span className="text-sm font-semibold text-shark-800 flex-1">{state.name}</span>
                              <span className="text-xs text-shark-400">{state.regions.length} location{state.regions.length !== 1 ? "s" : ""}</span>
                              <button
                                onClick={() => setEditingStateName({ id: state.id, name: state.name })}
                                className="p-1 text-shark-300 hover:text-action-500 opacity-0 group-hover:opacity-100 transition-all"
                                title="Rename state"
                              >
                                <Icon name="edit" size={13} />
                              </button>
                              {state.regions.length === 0 && (
                                <button
                                  onClick={async () => {
                                    const fd = new FormData(); fd.set("id", state.id);
                                    try { await deleteState(fd); addToast("State deleted", "success"); router.refresh(); } catch { addToast("Cannot delete state with locations", "error"); }
                                  }}
                                  className="p-1 text-shark-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                  title="Delete state"
                                >
                                  <Icon name="x" size={13} />
                                </button>
                              )}
                            </>
                          )}
                        </div>

                        {/* Region rows */}
                        {filteredRegions.map((region) => {
                          const total = region._count.assets + region._count.consumables + region._count.users;
                          return (
                            <div key={region.id} className="flex items-center gap-2 ml-9 group py-1 px-2 rounded-lg hover:bg-shark-50 transition-colors">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-shark-700">{region.name}</p>
                                {region.address && (
                                  <p className="text-xs text-shark-400 truncate">{region.address}</p>
                                )}
                              </div>
                              <span className="text-xs text-shark-400 shrink-0">
                                {region._count.assets}A · {region._count.consumables}C · {region._count.users}S
                              </span>
                              <button
                                onClick={() => { setShowManageModal(false); setEditLocationRegion(region); }}
                                className="p-1 text-shark-300 hover:text-action-500 opacity-0 group-hover:opacity-100 transition-all"
                                title="Edit location"
                              >
                                <Icon name="edit" size={13} />
                              </button>
                              {total === 0 && (
                                <button
                                  onClick={async () => {
                                    if (!confirm(`Delete "${region.name}"? This cannot be undone.`)) return;
                                    const fd = new FormData(); fd.set("id", region.id);
                                    try { await deleteRegion(fd); addToast("Location deleted", "success"); router.refresh(); } catch (e) { addToast(e instanceof Error ? e.message : "Failed", "error"); }
                                  }}
                                  className="p-1 text-shark-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                  title="Delete location"
                                >
                                  <Icon name="x" size={13} />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                {locations.length === 0 && (
                  <p className="text-sm text-shark-400 text-center py-6">No locations yet. Add a state first.</p>
                )}
              </div>
            </div>
          )}

          {/* Tab Content: Add State */}
          {manageTab === "add-state" && (
            <form action={async (fd) => {
              try {
                await createState(fd);
                addToast("State added", "success");
                setManageTab("locations");
                router.refresh();
              } catch (e) { addToast(e instanceof Error ? e.message : "Failed", "error"); }
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-shark-700 mb-1">State Name *</label>
                <Input name="name" required placeholder="e.g. New South Wales" />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setManageTab("locations")}>Cancel</Button>
                <Button type="submit">Add State</Button>
              </div>
            </form>
          )}

          {/* Tab Content: Add Location */}
          {manageTab === "add-location" && (
            <form action={async (fd) => {
              try {
                await createRegion(fd);
                addToast("Location added", "success");
                setManageTab("locations");
                router.refresh();
              } catch (e) { addToast(e instanceof Error ? e.message : "Failed", "error"); }
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
                <Input name="name" required placeholder="e.g. Sydney Metro" />
              </div>
              <div>
                <label className="block text-sm font-medium text-shark-700 mb-1">Storage Address</label>
                <Input name="address" placeholder="e.g. 123 Main St, Sydney NSW 2000" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-shark-700 mb-1">Latitude</label>
                  <Input name="latitude" type="number" step="any" placeholder="-33.8688" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-shark-700 mb-1">Longitude</label>
                  <Input name="longitude" type="number" step="any" placeholder="151.2093" />
                </div>
              </div>
              <p className="text-xs text-shark-400">Tip: Search your address on Google Maps, right-click and select coordinates.</p>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setManageTab("locations")}>Cancel</Button>
                <Button type="submit">Add Location</Button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
}
