"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Icon } from "@/components/ui/icon";
import {
  createState,
  createRegion,
  updateState,
  updateRegion,
  deleteState,
  deleteRegion,
} from "@/app/actions/locations";

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
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSaveState(id: string) {
    if (!editValue.trim()) {
      setEditingState(null);
      return;
    }
    const fd = new FormData();
    fd.set("id", id);
    fd.set("name", editValue);
    try {
      await updateState(fd);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to save");
    }
    setEditingState(null);
  }

  async function handleSaveRegion(id: string) {
    if (!editValue.trim()) {
      setEditingRegion(null);
      return;
    }
    const fd = new FormData();
    fd.set("id", id);
    fd.set("name", editValue);
    try {
      await updateRegion(fd);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to save");
    }
    setEditingRegion(null);
  }

  async function handleDeleteState(id: string) {
    if (!confirm("Are you sure you want to delete this state? This cannot be undone.")) return;
    const fd = new FormData();
    fd.set("id", id);
    try {
      await deleteState(fd);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete state");
    }
  }

  async function handleDeleteRegion(id: string) {
    if (!confirm("Are you sure you want to delete this region? This cannot be undone.")) return;
    const fd = new FormData();
    fd.set("id", id);
    try {
      await deleteRegion(fd);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete region");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-shark-900">Location Management</h1>
          <p className="text-sm text-shark-400 mt-1">Manage states and regions</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setModal("state")}>
            <Icon name="plus" size={14} className="mr-1.5" />
            State
          </Button>
          <Button size="sm" variant="outline" onClick={() => setModal("region")}>
            <Icon name="plus" size={14} className="mr-1.5" />
            Region
          </Button>
        </div>
      </div>

      {locations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-shark-400">No locations configured yet. Start by adding a state.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {locations.map((state) => (
            <Card key={state.id}>
              <CardContent className="py-5">
                <div className="flex items-center justify-between mb-4">
                  {editingState === state.id ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleSaveState(state.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveState(state.id);
                        if (e.key === "Escape") setEditingState(null);
                      }}
                      className="text-lg font-bold text-shark-900 bg-transparent border-b-2 border-action-400 outline-none px-0 py-0.5"
                      autoFocus
                    />
                  ) : (
                    <h3
                      className="text-lg font-bold text-shark-900 cursor-pointer hover:text-action-500 transition-colors"
                      onClick={() => {
                        setEditingState(state.id);
                        setEditValue(state.name);
                      }}
                      title="Click to rename"
                    >
                      <Icon name="map-pin" size={16} className="inline mr-2 text-shark-400" />
                      {state.name}
                    </h3>
                  )}
                  {state.regions.length === 0 && (
                    <button
                      onClick={() => handleDeleteState(state.id)}
                      className="text-shark-300 hover:text-red-500 transition-colors p-1"
                      title="Delete state"
                    >
                      <Icon name="x" size={16} />
                    </button>
                  )}
                </div>

                {state.regions.length === 0 ? (
                  <p className="text-sm text-shark-400 ml-6">No regions yet. Add a region to get started.</p>
                ) : (
                  <div className="space-y-2 ml-6">
                    {state.regions.map((region) => {
                      const total = region._count.assets + region._count.consumables + region._count.users;
                      return (
                        <div
                          key={region.id}
                          className="flex items-center justify-between bg-shark-50 rounded-xl p-3 group"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {editingRegion === region.id ? (
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => handleSaveRegion(region.id)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveRegion(region.id);
                                  if (e.key === "Escape") setEditingRegion(null);
                                }}
                                className="text-sm font-medium text-shark-800 bg-transparent border-b-2 border-action-400 outline-none px-0 py-0.5"
                                autoFocus
                              />
                            ) : (
                              <span
                                className="text-sm font-medium text-shark-800 cursor-pointer hover:text-action-500 transition-colors"
                                onClick={() => {
                                  setEditingRegion(region.id);
                                  setEditValue(region.name);
                                }}
                                title="Click to rename"
                              >
                                {region.name}
                              </span>
                            )}
                            <div className="flex items-center gap-2 text-xs text-shark-400">
                              <span>{region._count.assets} assets</span>
                              <span>&middot;</span>
                              <span>{region._count.consumables} consumables</span>
                              <span>&middot;</span>
                              <span>{region._count.users} staff</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Link
                              href={`/admin/locations/${region.id}`}
                              className="text-action-500 hover:text-action-600 text-xs font-medium flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-action-50 transition-colors"
                            >
                              View
                              <Icon name="arrow-right" size={12} />
                            </Link>
                            {total === 0 && (
                              <button
                                onClick={() => handleDeleteRegion(region.id)}
                                className="text-shark-300 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                                title="Delete region"
                              >
                                <Icon name="x" size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add State */}
      <Modal open={modal === "state"} onClose={() => setModal(null)} title="Add State">
        <form action={async (fd) => { await createState(fd); setModal(null); }} className="space-y-4">
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

      {/* Add Region */}
      <Modal open={modal === "region"} onClose={() => setModal(null)} title="Add Region">
        <form action={async (fd) => { await createRegion(fd); setModal(null); }} className="space-y-4">
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
