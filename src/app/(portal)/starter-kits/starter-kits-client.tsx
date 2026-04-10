"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {
  createStarterKit,
  updateStarterKit,
  deleteStarterKit,
  addStarterKitItem,
  removeStarterKitItem,
  updateStarterKitItemQuantity,
  applyStarterKit,
} from "@/app/actions/starter-kits";

interface StarterKitItem {
  id: string;
  itemType: string;
  category: string | null;
  consumableId: string | null;
  quantity: number;
}

interface StarterKit {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  items: StarterKitItem[];
}

interface Category {
  id: string;
  name: string;
}

interface Consumable {
  id: string;
  name: string;
  unitType: string;
  quantityOnHand: number;
  category: string;
  imageUrl: string | null;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  region: { name: string } | null;
}

export function StarterKitsClient({
  kits,
  categories,
  consumables,
  users,
  assetPhotos = {},
}: {
  kits: StarterKit[];
  categories: Category[];
  consumables: Consumable[];
  users: User[];
  assetPhotos?: Record<string, string | null>;
}) {
  const router = useRouter();
  const { addToast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [editKit, setEditKit] = useState<StarterKit | null>(null);
  const [expandedKit, setExpandedKit] = useState<string | null>(null);
  const [showAddItem, setShowAddItem] = useState<string | null>(null);
  const [showApply, setShowApply] = useState<StarterKit | null>(null);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-shark-900 tracking-tight">Starter Kits</h1>
          <p className="text-sm text-shark-400 mt-1">
            Pre-defined sets of assets and consumables assigned to new staff automatically.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Icon name="plus" size={14} className="mr-1.5" />
          New Starter Kit
        </Button>
      </div>

      {kits.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <Icon name="box" size={32} className="text-shark-300 mx-auto mb-3" />
            <p className="text-sm text-shark-400">No starter kits yet. Create one to auto-assign items to new staff.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {kits.map((kit) => (
            <Card key={kit.id}>
              <div className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3 cursor-pointer flex-1 min-w-0" onClick={() => setExpandedKit(expandedKit === kit.id ? null : kit.id)}>
                    <Icon name={expandedKit === kit.id ? "chevron-down" : "arrow-right"} size={16} className="text-shark-400" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-shark-900 dark:text-shark-100">{kit.name}</h3>
                        {kit.isDefault && (
                          <span className="text-xs font-medium bg-action-50 dark:bg-action-900/30 text-action-600 dark:text-action-400 px-2 py-0.5 rounded-full">Default</span>
                        )}
                      </div>
                      {kit.description && <p className="text-xs text-shark-400 mt-0.5">{kit.description}</p>}
                      <p className="text-xs text-shark-400 mt-0.5">{kit.items.length} items</p>
                    </div>
                  </div>
                </div>

                {expandedKit === kit.id && (
                  <div className="mt-4 border-t border-shark-100 dark:border-shark-800 pt-4">
                    {/* Action buttons inside expanded view */}
                    <div className="flex flex-wrap items-center justify-end gap-2 mb-4">
                      <Button size="sm" variant="outline" onClick={() => setShowApply(kit)} disabled={kit.items.length === 0}>
                        Assign to Staff
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowAddItem(kit.id)}>
                        <Icon name="plus" size={12} className="mr-1" />Add Item
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditKit(kit)}>
                        <Icon name="edit" size={12} className="mr-1" />Settings
                      </Button>
                    </div>
                    {kit.items.length === 0 ? (
                      <p className="text-sm text-shark-400 italic">No items in this kit yet.</p>
                    ) : (() => {
                      const assetItems = kit.items.filter((i) => i.itemType === "ASSET_CATEGORY");
                      const consumableItems = kit.items.filter((i) => i.itemType === "CONSUMABLE");
                      // Group assets by category
                      const assetsByCategory = new Map<string, typeof assetItems>();
                      assetItems.forEach((item) => {
                        const cat = item.category || "Uncategorized";
                        if (!assetsByCategory.has(cat)) assetsByCategory.set(cat, []);
                        assetsByCategory.get(cat)!.push(item);
                      });
                      // Group consumables by category
                      const consumablesByCategory = new Map<string, typeof consumableItems>();
                      consumableItems.forEach((item) => {
                        const c = consumables.find((con) => con.id === item.consumableId);
                        const cat = c?.category || "Uncategorized";
                        if (!consumablesByCategory.has(cat)) consumablesByCategory.set(cat, []);
                        consumablesByCategory.get(cat)!.push(item);
                      });

                      return (
                        <div className="space-y-5">
                          {/* Assets Section */}
                          {assetItems.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-lg bg-action-500 flex items-center justify-center">
                                  <Icon name="package" size={12} className="text-white" />
                                </div>
                                <h4 className="text-sm font-semibold text-shark-700">Assets ({assetItems.reduce((s, i) => s + i.quantity, 0)})</h4>
                              </div>
                              {[...assetsByCategory.entries()].map(([catName, items]) => (
                                <div key={catName} className="mb-3">
                                  <p className="text-xs font-semibold text-shark-400 uppercase tracking-wider mb-1.5 ml-8">{catName}</p>
                                  <div className="space-y-1">
                                    {items.map((item) => {
                                      const photo = assetPhotos[item.category || ""];
                                      return (
                                        <div key={item.id} className="flex items-center justify-between bg-shark-50 rounded-lg px-3 py-2">
                                          <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg overflow-hidden bg-shark-100 flex items-center justify-center shrink-0">
                                              {photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> : <Icon name="package" size={14} className="text-shark-400" />}
                                            </div>
                                            <span className="text-sm text-shark-700">{item.category}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1">
                                              <button onClick={async () => { if (item.quantity > 1) { try { await updateStarterKitItemQuantity(item.id, item.quantity - 1); router.refresh(); } catch {} } }} className="w-6 h-6 rounded border border-shark-200 flex items-center justify-center text-shark-500 hover:bg-shark-100 text-xs font-bold">−</button>
                                              <span className="w-6 text-center text-sm font-semibold text-shark-800">{item.quantity}</span>
                                              <button onClick={async () => { try { await updateStarterKitItemQuantity(item.id, item.quantity + 1); router.refresh(); } catch {} }} className="w-6 h-6 rounded border border-shark-200 flex items-center justify-center text-shark-500 hover:bg-shark-100 text-xs font-bold">+</button>
                                            </div>
                                            <button onClick={async () => { try { await removeStarterKitItem(item.id); addToast("Removed", "success"); router.refresh(); } catch { addToast("Failed", "error"); } }} className="text-shark-400 hover:text-red-500 p-1" title="Remove"><Icon name="x" size={14} /></button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Consumables Section */}
                          {consumableItems.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-lg bg-action-500 flex items-center justify-center">
                                  <Icon name="droplet" size={12} className="text-white" />
                                </div>
                                <h4 className="text-sm font-semibold text-shark-700">Consumables ({consumableItems.reduce((s, i) => s + i.quantity, 0)})</h4>
                              </div>
                              {[...consumablesByCategory.entries()].map(([catName, items]) => (
                                <div key={catName} className="mb-3">
                                  <p className="text-xs font-semibold text-shark-400 uppercase tracking-wider mb-1.5 ml-8">{catName}</p>
                                  <div className="space-y-1">
                                    {items.map((item) => {
                                      const c = consumables.find((con) => con.id === item.consumableId);
                                      return (
                                        <div key={item.id} className="flex items-center justify-between bg-shark-50 rounded-lg px-3 py-2">
                                          <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg overflow-hidden bg-shark-100 flex items-center justify-center shrink-0">
                                              {c?.imageUrl ? <img src={c.imageUrl} alt="" className="w-full h-full object-cover" /> : <Icon name="droplet" size={14} className="text-shark-400" />}
                                            </div>
                                            <div>
                                              <span className="text-sm text-shark-700">{c?.name || "Unknown"}</span>
                                              <span className="text-xs text-shark-400 ml-1">({c?.unitType || ""})</span>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1">
                                              <button onClick={async () => { if (item.quantity > 1) { try { await updateStarterKitItemQuantity(item.id, item.quantity - 1); router.refresh(); } catch {} } }} className="w-6 h-6 rounded border border-shark-200 flex items-center justify-center text-shark-500 hover:bg-shark-100 text-xs font-bold">−</button>
                                              <span className="w-6 text-center text-sm font-semibold text-shark-800">{item.quantity}</span>
                                              <button onClick={async () => { try { await updateStarterKitItemQuantity(item.id, item.quantity + 1); router.refresh(); } catch {} }} className="w-6 h-6 rounded border border-shark-200 flex items-center justify-center text-shark-500 hover:bg-shark-100 text-xs font-bold">+</button>
                                            </div>
                                            <button onClick={async () => { try { await removeStarterKitItem(item.id); addToast("Removed", "success"); router.refresh(); } catch { addToast("Failed", "error"); } }} className="text-shark-400 hover:text-red-500 p-1" title="Remove"><Icon name="x" size={14} /></button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowAddItem(kit.id)}>
                      + Add Item
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Starter Kit Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Starter Kit">
        <form action={async (fd) => { await createStarterKit(fd); setShowCreate(false); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Name *</label>
            <Input name="name" required placeholder="e.g. Standard Staff Kit" />
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Description</label>
            <Input name="description" placeholder="What this kit includes" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="isDefault" value="true" id="isDefault" className="rounded" />
            <label htmlFor="isDefault" className="text-sm text-shark-700 dark:text-shark-300">
              Auto-apply to new staff (default kit)
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit">Create Kit</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Starter Kit Modal */}
      <Modal open={!!editKit} onClose={() => setEditKit(null)} title="Edit Starter Kit">
        {editKit && (
          <EditStarterKitForm
            kit={editKit}
            categories={categories}
            consumables={consumables}
            assetPhotos={assetPhotos}
            onDone={() => setEditKit(null)}
          />
        )}
      </Modal>

      {/* Add Items to Kit Modal — Checklist */}
      <Modal open={!!showAddItem} onClose={() => setShowAddItem(null)} title="Add Items to Kit">
        {showAddItem && (
          <AddItemsChecklist
            starterKitId={showAddItem}
            existingItems={kits.find((k) => k.id === showAddItem)?.items || []}
            categories={categories}
            consumables={consumables}
            assetPhotos={assetPhotos}
            onDone={() => setShowAddItem(null)}
          />
        )}
      </Modal>

      {/* Apply to Staff Modal */}
      <Modal open={!!showApply} onClose={() => setShowApply(null)} title={`Assign "${showApply?.name}"`}>
        {showApply && (
          <ApplyToStaffForm
            kit={showApply}
            users={users}
            onDone={() => setShowApply(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function EditStarterKitForm({
  kit,
  categories,
  consumables,
  assetPhotos = {},
  onDone,
}: {
  kit: StarterKit;
  categories: Category[];
  consumables: Consumable[];
  assetPhotos?: Record<string, string | null>;
  onDone: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [showAddItems, setShowAddItems] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState<Record<string, number>>(
    () => Object.fromEntries(kit.items.map((i) => [i.id, i.quantity]))
  );
  const [savingQtyId, setSavingQtyId] = useState<string | null>(null);

  const router = useRouter();
  const { addToast } = useToast();

  const handleRemoveItem = async (itemId: string) => {
    setRemovingId(itemId);
    try {
      await removeStarterKitItem(itemId);
      addToast("Item removed", "success");
      router.refresh();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to remove item", "error");
    }
    setRemovingId(null);
  };

  const handleQtyChange = async (itemId: string, newQty: number) => {
    const qty = Math.max(1, newQty);
    setEditQty((prev) => ({ ...prev, [itemId]: qty }));
    const original = kit.items.find((i) => i.id === itemId);
    if (original && original.quantity !== qty) {
      setSavingQtyId(itemId);
      await updateStarterKitItemQuantity(itemId, qty);
      setSavingQtyId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Kit Details */}
      <form action={async (fd) => { setSaving(true); await updateStarterKit(fd); setSaving(false); onDone(); }} className="space-y-4">
        <input type="hidden" name="id" value={kit.id} />
        <div>
          <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Name *</label>
          <Input name="name" required defaultValue={kit.name} />
        </div>
        <div>
          <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Description</label>
          <Input name="description" defaultValue={kit.description || ""} />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" name="isDefault" value="true" id="editIsDefault" className="rounded" defaultChecked={kit.isDefault} />
          <label htmlFor="editIsDefault" className="text-sm text-shark-700 dark:text-shark-300">
            Auto-apply to new staff (default kit)
          </label>
        </div>

        {/* Footer */}
        <div className="flex justify-between pt-4 border-t border-shark-100">
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={async () => {
              if (confirm(`Delete starter kit "${kit.name}"? This cannot be undone.`)) {
                await deleteStarterKit(kit.id);
                onDone();
              }
            }}
          >
            Delete Kit
          </Button>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={onDone}>Cancel</Button>
            <Button type="submit" disabled={saving} loading={saving}>Save</Button>
          </div>
        </div>
      </form>
    </div>
  );
}

function AddItemsChecklist({
  starterKitId,
  existingItems,
  categories,
  consumables,
  assetPhotos = {},
  onDone,
}: {
  starterKitId: string;
  existingItems: StarterKitItem[];
  categories: Category[];
  consumables: Consumable[];
  assetPhotos?: Record<string, string | null>;
  onDone: () => void;
}) {
  const existingCategories = new Set(existingItems.filter((i) => i.itemType === "ASSET_CATEGORY").map((i) => i.category));
  const existingConsumableIds = new Set(existingItems.filter((i) => i.itemType === "CONSUMABLE").map((i) => i.consumableId));

  // Deduplicate consumables by name — kits are org-wide, same item exists per region
  const uniqueConsumables = Array.from(
    consumables.reduce((map, c) => {
      if (!map.has(c.name)) map.set(c.name, c);
      return map;
    }, new Map<string, Consumable>()).values()
  );

  const [selectedCategories, setSelectedCategories] = useState<Map<string, number>>(new Map());
  const [selectedConsumables, setSelectedConsumables] = useState<Map<string, number>>(new Map());
  const [saving, setSaving] = useState(false);

  const toggleCategory = (name: string) => {
    setSelectedCategories((prev) => {
      const next = new Map(prev);
      if (next.has(name)) next.delete(name); else next.set(name, 1);
      return next;
    });
  };

  const setCategoryQty = (name: string, qty: number) => {
    setSelectedCategories((prev) => {
      const next = new Map(prev);
      next.set(name, Math.max(1, qty));
      return next;
    });
  };

  const toggleConsumable = (id: string) => {
    setSelectedConsumables((prev) => {
      const next = new Map(prev);
      if (next.has(id)) next.delete(id); else next.set(id, 1);
      return next;
    });
  };

  const setConsumableQty = (id: string, qty: number) => {
    setSelectedConsumables((prev) => {
      const next = new Map(prev);
      next.set(id, Math.max(1, qty));
      return next;
    });
  };

  const totalSelected = selectedCategories.size + selectedConsumables.size;

  const handleSave = async () => {
    setSaving(true);
    try {
      // Add all selected categories with their quantities
      for (const [catName, qty] of selectedCategories) {
        const fd = new FormData();
        fd.set("starterKitId", starterKitId);
        fd.set("itemType", "ASSET_CATEGORY");
        fd.set("category", catName);
        fd.set("quantity", qty.toString());
        await addStarterKitItem(fd);
      }
      // Add all selected consumables
      for (const [consumableId, qty] of selectedConsumables) {
        const fd = new FormData();
        fd.set("starterKitId", starterKitId);
        fd.set("itemType", "CONSUMABLE");
        fd.set("consumableId", consumableId);
        fd.set("quantity", qty.toString());
        await addStarterKitItem(fd);
      }
      onDone();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Asset Categories */}
      {categories.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-shark-400 uppercase tracking-wider mb-2">
            <Icon name="package" size={12} className="inline mr-1 text-action-500" />
            Asset Categories
          </p>
          <p className="text-xs text-shark-400 mb-2">Available assets from each selected category will be assigned.</p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {categories.map((cat) => {
              const alreadyAdded = existingCategories.has(cat.name);
              const isSelected = selectedCategories.has(cat.name);
              return (
                <div
                  key={cat.id}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
                    alreadyAdded ? "bg-shark-100 opacity-50" : isSelected ? "bg-action-50 border border-action-200" : "hover:bg-shark-50 border border-transparent"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected || alreadyAdded}
                    disabled={alreadyAdded}
                    onChange={() => !alreadyAdded && toggleCategory(cat.name)}
                    className="rounded border-shark-300 text-action-500 focus:ring-action-400 cursor-pointer"
                  />
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-white border border-shark-100 flex items-center justify-center shrink-0">
                    {assetPhotos[cat.name] ? (
                      <img src={assetPhotos[cat.name]!} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Icon name="package" size={12} className="text-action-500" />
                    )}
                  </div>
                  <label
                    className={`text-sm text-shark-700 flex-1 ${alreadyAdded ? "cursor-not-allowed" : "cursor-pointer"}`}
                    onClick={() => !alreadyAdded && toggleCategory(cat.name)}
                  >
                    {cat.name}
                  </label>
                  {alreadyAdded && <span className="text-xs text-shark-400">Already added</span>}
                  {isSelected && !alreadyAdded && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-shark-500">Qty:</span>
                      <input
                        type="number"
                        min="1"
                        value={selectedCategories.get(cat.name) || 1}
                        onChange={(e) => setCategoryQty(cat.name, parseInt(e.target.value) || 1)}
                        className="w-14 text-center text-sm rounded-lg border border-shark-200 py-0.5"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Consumables — grouped by category */}
      {uniqueConsumables.length > 0 && (() => {
        const grouped = new Map<string, Consumable[]>();
        for (const c of uniqueConsumables) {
          const cat = c.category || "Other";
          if (!grouped.has(cat)) grouped.set(cat, []);
          grouped.get(cat)!.push(c);
        }
        return Array.from(grouped.entries()).map(([cat, items]) => (
          <div key={cat}>
            <p className="text-xs font-semibold text-shark-400 uppercase tracking-wider mb-2">{cat}</p>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {items.map((c) => {
                const alreadyAdded = existingConsumableIds.has(c.id);
                const isSelected = selectedConsumables.has(c.id);
                return (
                  <div
                    key={c.id}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
                      alreadyAdded ? "bg-shark-100 opacity-50" : isSelected ? "bg-blue-50 border border-blue-200" : "hover:bg-shark-50 border border-transparent"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected || alreadyAdded}
                      disabled={alreadyAdded}
                      onChange={() => !alreadyAdded && toggleConsumable(c.id)}
                      className="rounded border-shark-300 text-action-500 focus:ring-action-400"
                    />
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-white border border-shark-100 flex items-center justify-center shrink-0">
                      {c.imageUrl ? (
                        <img src={c.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Icon name="droplet" size={12} className="text-blue-500" />
                      )}
                    </div>
                    <label
                      className={`text-sm text-shark-700 flex-1 truncate ${alreadyAdded ? "cursor-not-allowed" : "cursor-pointer"}`}
                      onClick={() => !alreadyAdded && toggleConsumable(c.id)}
                    >
                      {c.name} <span className="text-shark-400 text-xs">({c.unitType})</span>
                    </label>
                    {alreadyAdded && <span className="text-xs text-shark-400 shrink-0">Added</span>}
                    {isSelected && !alreadyAdded && (
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs text-shark-500">Qty:</span>
                        <input
                          type="number"
                          min="1"
                          value={selectedConsumables.get(c.id) || 1}
                          onChange={(e) => setConsumableQty(c.id, parseInt(e.target.value) || 1)}
                          className="w-14 text-center text-sm rounded-lg border border-shark-200 py-0.5"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ));
      })()}

      <div className="flex justify-between items-center pt-3 border-t border-shark-100">
        <span className="text-sm text-shark-400">{totalSelected} item{totalSelected !== 1 ? "s" : ""} selected</span>
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onDone}>Cancel</Button>
          <Button onClick={handleSave} disabled={totalSelected === 0 || saving} loading={saving}>
            {`Add ${totalSelected} Item${totalSelected !== 1 ? "s" : ""}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ApplyToStaffForm({
  kit,
  users,
  onDone,
}: {
  kit: StarterKit;
  users: User[];
  onDone: () => void;
}) {
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<{ applied: number; details: string[] } | null>(null);
  const { addToast } = useToast();
  const router = useRouter();

  const handleAssign = async () => {
    if (!selectedUserId) return;
    setApplying(true);
    try {
      const res = await applyStarterKit(selectedUserId, kit.id, []);
      setResult({ applied: res.applied || 0, details: (res.results as string[]) || [] });
      addToast(`Kit assigned — ${res.applied || 0} items`, "success");
      router.refresh();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to assign kit", "error");
    } finally {
      setApplying(false);
    }
  };

  if (result) {
    const user = users.find((u) => u.id === selectedUserId);
    return (
      <div className="space-y-4">
        <div className="bg-action-50 rounded-xl p-4 text-center">
          <div className="w-12 h-12 rounded-full bg-action-500 flex items-center justify-center mx-auto mb-3">
            <Icon name="check" size={24} className="text-white" />
          </div>
          <p className="text-sm font-semibold text-shark-900">Kit assigned to {user?.name || user?.email}</p>
          <p className="text-xs text-shark-500 mt-1">{result.applied} item{result.applied !== 1 ? "s" : ""} assigned</p>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => { setResult(null); setSelectedUserId(""); }}>Assign Another</Button>
          <Button onClick={onDone}>Done</Button>
        </div>
      </div>
    );
  }

  // Build unique regions from users
  const regions = Array.from(
    new Map(users.filter((u) => u.region).map((u) => [u.region!.name, u.region!.name])).values()
  ).sort();

  const filteredUsers = selectedRegion
    ? users.filter((u) => u.region?.name === selectedRegion)
    : users;

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-shark-700 mb-1.5">Region</label>
        <Select
          value={selectedRegion}
          onChange={(e) => { setSelectedRegion(e.target.value); setSelectedUserId(""); }}
        >
          <option value="">All regions</option>
          {regions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium text-shark-700 mb-1.5">Assign to</label>
        <Select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
        >
          <option value="">Select staff member</option>
          {filteredUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name || user.email}{!selectedRegion && user.region ? ` — ${user.region.name}` : ""}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onDone}>Cancel</Button>
        <Button onClick={handleAssign} disabled={!selectedUserId || applying} loading={applying}>
          Assign Kit
        </Button>
      </div>
    </div>
  );
}
