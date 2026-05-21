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
import { cn } from "@/lib/utils";
import {
  createState,
  createRegion,
  updateState,
  updateRegion,
  deleteState,
  deleteRegion,
} from "@/app/actions/locations";

const STATE_COLORS = [
  { iconBg: "bg-[#0057FF]/10",   iconColor: "text-[#0057FF]"   },
  { iconBg: "bg-violet-100",     iconColor: "text-violet-600"  },
  { iconBg: "bg-teal-100",       iconColor: "text-teal-600"    },
  { iconBg: "bg-rose-100",       iconColor: "text-rose-600"    },
  { iconBg: "bg-amber-100",      iconColor: "text-amber-600"   },
  { iconBg: "bg-emerald-100",    iconColor: "text-emerald-600" },
  { iconBg: "bg-pink-100",       iconColor: "text-pink-600"    },
  { iconBg: "bg-cyan-100",       iconColor: "text-cyan-600"    },
];

interface Location {
  id: string;
  name: string;
  regions: Array<{
    id: string;
    name: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    _count: { assets: number; consumables: number; users: number };
  }>;
}

export function LocationsClient({ locations }: { locations: Location[] }) {
  const [modal, setModal] = useState<"state" | "region" | null>(null);
  const [editingState, setEditingState] = useState<string | null>(null);
  const [editingRegion, setEditingRegion] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [collapsedStates, setCollapsedStates] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [editLocationRegion, setEditLocationRegion] = useState<Location["regions"][0] | null>(null);
  const { addToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleState = (id: string) => {
    setCollapsedStates((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Totals
  const totalRegions = locations.reduce((sum, s) => sum + s.regions.length, 0);
  const totalAssets = locations.reduce((sum, s) => sum + s.regions.reduce((r, reg) => r + reg._count.assets, 0), 0);
  const totalConsumables = locations.reduce((sum, s) => sum + s.regions.reduce((r, reg) => r + reg._count.consumables, 0), 0);
  const totalStaff = locations.reduce((sum, s) => sum + s.regions.reduce((r, reg) => r + reg._count.users, 0), 0);

  // Filter
  const filteredLocations = search
    ? locations.map((s) => ({
        ...s,
        regions: s.regions.filter((r) =>
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          s.name.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter((s) => s.regions.length > 0 || s.name.toLowerCase().includes(search.toLowerCase()))
    : locations;

  async function handleSaveState(id: string) {
    if (!editValue.trim()) { setEditingState(null); return; }
    try {
      const fd = new FormData();
      fd.set("id", id);
      fd.set("name", editValue);
      await updateState(fd);
      addToast("State name updated", "success");
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed to save", "error");
    }
    setEditingState(null);
  }

  async function handleSaveRegion(id: string) {
    if (!editValue.trim()) { setEditingRegion(null); return; }
    try {
      const fd = new FormData();
      fd.set("id", id);
      fd.set("name", editValue);
      await updateRegion(fd);
      addToast("Region name updated", "success");
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed to save", "error");
    }
    setEditingRegion(null);
  }

  async function handleDeleteState(id: string) {
    try {
      const fd = new FormData();
      fd.set("id", id);
      await deleteState(fd);
      addToast("State removed successfully", "success");
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed to delete", "error");
    }
  }

  async function handleDeleteRegion(id: string) {
    try {
      const fd = new FormData();
      fd.set("id", id);
      await deleteRegion(fd);
      addToast("Region removed successfully", "success");
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed to delete", "error");
    }
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-shark-900 dark:text-shark-100 tracking-tight">Locations</h1>
          <p className="text-sm text-shark-400 mt-1">{locations.length} states &middot; {totalRegions} regions</p>
        </div>
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
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "States", value: locations.length, icon: "map-pin" as const, color: "text-white", bg: "bg-action-500", border: "border-action-500" },
          { label: "Total Assets", value: totalAssets, icon: "package" as const, color: "text-white", bg: "bg-action-500", border: "border-action-500" },
          { label: "Total Supplies", value: totalConsumables, icon: "droplet" as const, color: "text-white", bg: "bg-action-500", border: "border-action-500" },
          { label: "Total Staff", value: totalStaff, icon: "users" as const, color: "text-white", bg: "bg-action-500", border: "border-action-500" },
        ].map((stat) => (
          <Card key={stat.label} className="">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-shark-900 dark:text-shark-100">{stat.value}</p>
                  <p className="text-xs text-shark-400 mt-0.5">{stat.label}</p>
                </div>
                <div className={`w-10 h-10 rounded-[20px] ${stat.bg} flex items-center justify-center`}>
                  <Icon name={stat.icon} size={18} className={stat.color} />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Input
          placeholder="Search locations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
      </div>

      {/* Locations */}
      {filteredLocations.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <Icon name="map-pin" size={40} className="text-shark-200 mx-auto mb-3" />
            <p className="text-shark-400">
              {search ? "No locations match your search." : "No locations configured yet. Start by adding a state."}
            </p>
          </div>
        </Card>
      ) : (
        filteredLocations.map((state, sIdx) => {
          const sc = STATE_COLORS[sIdx % STATE_COLORS.length];
          const isCollapsed = collapsedStates.has(state.id);
          const stateAssetTotal = state.regions.reduce((sum, r) => sum + r._count.assets, 0);
          const stateConsumableTotal = state.regions.reduce((sum, r) => sum + r._count.consumables, 0);
          const stateStaffTotal = state.regions.reduce((sum, r) => sum + r._count.users, 0);

          return (
            <div key={state.id} className="backdrop-blur-[20px] bg-white/70 border border-white/90 rounded-[20px] shadow-[0_2px_20px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.90)] overflow-hidden">
              {/* State Header */}
              <button
                onClick={() => toggleState(state.id)}
                className="flex items-center gap-3 px-5 py-4 w-full text-left group"
              >
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", sc.iconBg)}>
                  <Icon name="map-pin" size={17} className={sc.iconColor} />
                </div>
                <div className="flex items-center gap-2 flex-1 flex-wrap">
                  {editingState === state.id ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onBlur={() => handleSaveState(state.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveState(state.id);
                        if (e.key === "Escape") setEditingState(null);
                      }}
                      className="text-base font-bold text-shark-900 dark:text-shark-100 bg-transparent border-b-2 border-action-400 outline-none px-0 py-0.5"
                      autoFocus
                    />
                  ) : (
                    <h2 className="text-base font-bold text-shark-900 dark:text-shark-100">{state.name}</h2>
                  )}
                  <span className="text-xs font-medium text-shark-400 bg-black/[0.05] px-2.5 py-0.5 rounded-full">
                    {state.regions.length} region{state.regions.length !== 1 ? "s" : ""}
                  </span>
                  <span className="text-xs text-shark-400 hidden sm:inline">
                    {stateAssetTotal} assets &middot; {stateConsumableTotal} supplies &middot; {stateStaffTotal} staff
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {editingState !== state.id && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingState(state.id); setEditValue(state.name); }}
                      className="text-shark-300 hover:text-action-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                      title="Rename state"
                    >
                      <Icon name="edit" size={14} />
                    </button>
                  )}
                  {state.regions.length === 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteState(state.id); }}
                      className="text-shark-300 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                      title="Delete state"
                    >
                      <Icon name="x" size={14} />
                    </button>
                  )}
                  <Icon
                    name="chevron-down"
                    size={18}
                    className={`text-shark-400 group-hover:text-shark-600 transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                  />
                </div>
              </button>

              {/* Region rows */}
              {!isCollapsed && (
                <div className="px-3 pb-3 space-y-1.5">
                  {state.regions.length === 0 ? (
                    <p className="text-sm text-shark-400 px-3 pb-2">No regions yet. Add a region to get started.</p>
                  ) : (
                    state.regions.map((region) => {
                      const total = region._count.assets + region._count.consumables + region._count.users;
                      return (
                        <Link
                          key={region.id}
                          href={`/admin/locations/${region.id}`}
                          className="flex items-center gap-3 px-4 py-3 bg-shark-50/80 rounded-[20px] border border-shark-100/70 hover:bg-shark-100/70 hover:shadow-sm transition-all cursor-pointer group/row"
                        >
                          {/* Left icon */}
                          <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0", sc.iconBg)}>
                            <Icon name="map-pin" size={15} className={sc.iconColor} />
                          </div>

                          {/* Name + address */}
                          <div className="flex-1 min-w-0">
                            {editingRegion === region.id ? (
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                onBlur={() => handleSaveRegion(region.id)}
                                onKeyDown={(e) => {
                                  e.stopPropagation();
                                  if (e.key === "Enter") handleSaveRegion(region.id);
                                  if (e.key === "Escape") setEditingRegion(null);
                                }}
                                className="text-sm font-semibold text-shark-800 bg-transparent border-b-2 border-action-400 outline-none px-0 py-0.5"
                                autoFocus
                              />
                            ) : (
                              <>
                                <p className="text-sm font-semibold text-shark-800 dark:text-shark-200 truncate">{region.name}</p>
                                {region.address && (
                                  <p className="text-xs text-shark-400 truncate">{region.address}</p>
                                )}
                              </>
                            )}
                          </div>

                          {/* Stats */}
                          <div className="flex items-center gap-3 text-xs text-shark-400 shrink-0">
                            <span className="flex items-center gap-1">
                              <Icon name="package" size={11} />
                              {region._count.assets}
                            </span>
                            <span className="flex items-center gap-1">
                              <Icon name="droplet" size={11} />
                              {region._count.consumables}
                            </span>
                            <span className="flex items-center gap-1">
                              <Icon name="users" size={11} />
                              {region._count.users}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditLocationRegion(region); }}
                              className="text-shark-300 hover:text-action-500 transition-colors p-1.5 opacity-0 group-hover/row:opacity-100"
                              title="Edit location"
                            >
                              <Icon name="edit" size={13} />
                            </button>
                            {total === 0 && (
                              <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteRegion(region.id); }}
                                className="text-shark-300 hover:text-red-500 transition-colors p-1.5 opacity-0 group-hover/row:opacity-100"
                                title="Delete region"
                              >
                                <Icon name="x" size={13} />
                              </button>
                            )}
                            <Icon name="arrow-right" size={15} className="text-shark-300 ml-1" />
                          </div>
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

      {/* Add State Modal */}
      <Modal open={modal === "state"} onClose={() => setModal(null)} title="Add State">
        <form action={async (fd) => {
          try {
            await createState(fd);
            addToast("State added successfully", "success");
            setModal(null);
          } catch (e) {
            addToast(e instanceof Error ? e.message : "Failed to add state", "error");
          }
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">State Name *</label>
            <Input name="name" required placeholder="e.g. New South Wales" />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button type="submit">Add State</Button>
          </div>
        </form>
      </Modal>

      {/* Add Region Modal */}
      <Modal open={modal === "region"} onClose={() => setModal(null)} title="Add Region">
        <form action={async (fd) => {
          try {
            await createRegion(fd);
            addToast("Region added successfully", "success");
            setModal(null);
          } catch (e) {
            addToast(e instanceof Error ? e.message : "Failed to add region", "error");
          }
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">State *</label>
            <Select name="stateId" required>
              <option value="">Select state</option>
              {locations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Region Name *</label>
            <Input name="name" required placeholder="e.g. Sydney Metro" />
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Storage Address</label>
            <Input name="address" placeholder="e.g. 123 Main St, Sydney NSW 2000" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Latitude</label>
              <Input name="latitude" type="number" step="any" placeholder="-33.8688" />
            </div>
            <div>
              <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Longitude</label>
              <Input name="longitude" type="number" step="any" placeholder="151.2093" />
            </div>
          </div>
          <p className="text-xs text-shark-400">Tip: Search your address on Google Maps, right-click and select coordinates.</p>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button type="submit">Add Region</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Region Location Modal */}
      <Modal open={!!editLocationRegion} onClose={() => setEditLocationRegion(null)} title={`Edit: ${editLocationRegion?.name}`}>
        {editLocationRegion && (
          <form action={async (fd) => {
            try {
              fd.set("id", editLocationRegion.id);
              await updateRegion(fd);
              addToast("Location details updated", "success");
              setEditLocationRegion(null);
            } catch (e) {
              addToast(e instanceof Error ? e.message : "Failed to update", "error");
            }
          }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Region Name *</label>
              <Input name="name" required defaultValue={editLocationRegion.name} />
            </div>
            <div>
              <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Storage Address</label>
              <Input name="address" defaultValue={editLocationRegion.address || ""} placeholder="e.g. 123 Main St, Sydney NSW 2000" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Latitude</label>
                <Input name="latitude" type="number" step="any" defaultValue={editLocationRegion.latitude ?? ""} placeholder="-33.8688" />
              </div>
              <div>
                <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Longitude</label>
                <Input name="longitude" type="number" step="any" defaultValue={editLocationRegion.longitude ?? ""} placeholder="151.2093" />
              </div>
            </div>
            <p className="text-xs text-shark-400">Tip: Search your address on Google Maps, right-click and select coordinates.</p>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setEditLocationRegion(null)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
