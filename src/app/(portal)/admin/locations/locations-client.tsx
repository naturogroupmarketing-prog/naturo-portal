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
import {
  createState,
  createRegion,
  updateState,
  updateRegion,
  deleteState,
  deleteRegion,
} from "@/app/actions/locations";

const STATE_COLORS = [
  { bg: "bg-blue-50", color: "text-blue-600", ring: "ring-blue-200" },
  { bg: "bg-emerald-50", color: "text-emerald-600", ring: "ring-emerald-200" },
  { bg: "bg-amber-50", color: "text-amber-600", ring: "ring-amber-200" },
  { bg: "bg-cyan-50", color: "text-cyan-600", ring: "ring-cyan-200" },
  { bg: "bg-violet-50", color: "text-violet-600", ring: "ring-violet-200" },
  { bg: "bg-rose-50", color: "text-rose-600", ring: "ring-rose-200" },
  { bg: "bg-teal-50", color: "text-teal-600", ring: "ring-teal-200" },
  { bg: "bg-orange-50", color: "text-orange-600", ring: "ring-orange-200" },
];

interface Location {
  id: string;
  name: string;
  regions: Array<{
    id: string;
    name: string;
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
      addToast("State renamed", "success");
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
      addToast("Region renamed", "success");
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
      addToast("State deleted", "success");
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed to delete", "error");
    }
  }

  async function handleDeleteRegion(id: string) {
    try {
      const fd = new FormData();
      fd.set("id", id);
      await deleteRegion(fd);
      addToast("Region deleted", "success");
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed to delete", "error");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-shark-900">Locations</h1>
          <p className="text-sm text-shark-400 mt-1">{locations.length} states &middot; {totalRegions} regions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setModal("region")}>
            <Icon name="plus" size={14} className="mr-1.5" />
            Region
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
          { label: "Total Consumables", value: totalConsumables, icon: "droplet" as const, color: "text-white", bg: "bg-action-500", border: "border-action-500" },
          { label: "Total Staff", value: totalStaff, icon: "users" as const, color: "text-white", bg: "bg-action-500", border: "border-action-500" },
        ].map((stat) => (
          <Card key={stat.label} className={`border-l-4 ${stat.border}`}>
            <div className="px-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-shark-900">{stat.value}</p>
                  <p className="text-xs text-shark-400 mt-0.5">{stat.label}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
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
            <div key={state.id} className="space-y-3">
              {/* State Header — same pattern as region headers on assets page */}
              <button
                onClick={() => toggleState(state.id)}
                className="flex items-center gap-3 px-1 pt-2 w-full text-left group"
              >
                <div className={`w-9 h-9 rounded-xl ${sc.bg} flex items-center justify-center`}>
                  <Icon name="map-pin" size={18} className={sc.color} />
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
                      className="text-xl font-bold text-shark-900 bg-transparent border-b-2 border-action-400 outline-none px-0 py-0.5"
                      autoFocus
                    />
                  ) : (
                    <h2 className="text-xl font-bold text-shark-900">{state.name}</h2>
                  )}
                  <span className="text-xs font-medium text-shark-400 bg-shark-100 px-2 py-0.5 rounded-full">
                    {state.regions.length} region{state.regions.length !== 1 ? "s" : ""}
                  </span>
                  <span className="text-xs text-shark-400 hidden sm:inline">
                    {stateAssetTotal} assets &middot; {stateConsumableTotal} consumables &middot; {stateStaffTotal} staff
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

              {/* Region Cards */}
              {!isCollapsed && (
                <div className="space-y-2 ml-4">
                  {state.regions.length === 0 ? (
                    <p className="text-sm text-shark-400 px-1">No regions yet. Add a region to get started.</p>
                  ) : (
                    state.regions.map((region) => {
                      const total = region._count.assets + region._count.consumables + region._count.users;
                      return (
                        <Link
                          key={region.id}
                          href={`/admin/locations/${region.id}`}
                          className="block"
                        >
                          <Card className="hover:shadow-md hover:border-action-200 transition-all cursor-pointer">
                            <div className="px-4 py-3.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
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
                                    <h3 className="text-sm font-semibold text-shark-800">{region.name}</h3>
                                  )}
                                </div>

                                <div className="flex items-center gap-4">
                                  {/* Stats pills */}
                                  <div className="flex items-center gap-3 text-xs">
                                    <span className="flex items-center gap-1 text-shark-500">
                                      <Icon name="package" size={12} className="text-action-400" />
                                      {region._count.assets}
                                    </span>
                                    <span className="flex items-center gap-1 text-shark-500">
                                      <Icon name="droplet" size={12} className="text-blue-400" />
                                      {region._count.consumables}
                                    </span>
                                    <span className="flex items-center gap-1 text-shark-500">
                                      <Icon name="users" size={12} className="text-emerald-400" />
                                      {region._count.users}
                                    </span>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingRegion(region.id); setEditValue(region.name); }}
                                      className="text-shark-300 hover:text-action-500 transition-colors p-1"
                                      title="Rename region"
                                    >
                                      <Icon name="edit" size={13} />
                                    </button>
                                    {total === 0 && (
                                      <button
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteRegion(region.id); }}
                                        className="text-shark-300 hover:text-red-500 transition-colors p-1"
                                        title="Delete region"
                                      >
                                        <Icon name="x" size={13} />
                                      </button>
                                    )}
                                    <Icon name="arrow-right" size={16} className="text-shark-300 ml-1" />
                                  </div>
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

      {/* Add State Modal */}
      <Modal open={modal === "state"} onClose={() => setModal(null)} title="Add State">
        <form action={async (fd) => {
          try {
            await createState(fd);
            addToast("State added", "success");
            setModal(null);
          } catch (e) {
            addToast(e instanceof Error ? e.message : "Failed to add state", "error");
          }
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-shark-700 mb-1">State Name *</label>
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
            addToast("Region added", "success");
            setModal(null);
          } catch (e) {
            addToast(e instanceof Error ? e.message : "Failed to add region", "error");
          }
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-shark-700 mb-1">State *</label>
            <Select name="stateId" required>
              <option value="">Select state</option>
              {locations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 mb-1">Region Name *</label>
            <Input name="name" required placeholder="e.g. Sydney Metro" />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button type="submit">Add Region</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
