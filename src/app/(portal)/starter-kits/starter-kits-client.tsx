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
          <h1 className="text-2xl font-bold text-shark-900 dark:text-shark-100">Starter Kits</h1>
          <p className="text-sm text-shark-400 mt-1">
            Pre-defined sets of assets and consumables assigned to new staff automatically.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>+ New Starter Kit</Button>
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
                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => setShowApply(kit)} disabled={kit.items.length === 0}>
                      Apply to Staff
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowAddItem(kit.id)}>
                      <Icon name="plus" size={12} className="mr-1" />Add Item
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditKit(kit)}>
                      <Icon name="edit" size={12} className="mr-1" />Settings
                    </Button>
                    <button
                      onClick={async () => {
                        if (!confirm(`Delete "${kit.name}"? This cannot be undone.`)) return;
                        try { await deleteStarterKit(kit.id); addToast("Kit deleted", "success"); router.refresh(); }
                        catch { addToast("Failed to delete", "error"); }
                      }}
                      className="p-1.5 text-shark-400 hover:text-red-500 transition-colors"
                      title="Delete kit"
                    >
                      <Icon name="x" size={14} />
                    </button>
                  </div>
                </div>

                {expandedKit === kit.id && (
                  <div className="mt-4 border-t border-shark-100 dark:border-shark-800 pt-4">
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
            onDone={() => setShowAddItem(null)}
          />
        )}
      </Modal>

      {/* Apply to Staff Modal */}
      <Modal open={!!showApply} onClose={() => setShowApply(null)} title={`Apply "${showApply?.name}" to Staff`}>
        {showApply && (
          <ApplyToStaffForm
            kit={showApply}
            users={users}
            consumables={consumables}
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
  onDone,
}: {
  kit: StarterKit;
  categories: Category[];
  consumables: Consumable[];
  onDone: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [showAddItems, setShowAddItems] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState<Record<string, number>>(
    () => Object.fromEntries(kit.items.map((i) => [i.id, i.quantity]))
  );
  const [savingQtyId, setSavingQtyId] = useState<string | null>(null);

  const handleRemoveItem = async (itemId: string) => {
    setRemovingId(itemId);
    try {
      await removeStarterKitItem(itemId);
    } catch {}
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

        {/* Kit Items Section */}
        <div className="border-t border-shark-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-shark-400 uppercase tracking-wider">
              Kit Items ({kit.items.length})
            </p>
            <button
              type="button"
              onClick={() => setShowAddItems(!showAddItems)}
              className="text-xs font-medium text-action-500 hover:text-action-600 transition-colors flex items-center gap-1"
            >
              <Icon name="plus" size={12} />
              {showAddItems ? "Hide" : "Add Items"}
            </button>
          </div>

          {kit.items.length === 0 ? (
            <p className="text-sm text-shark-400 italic py-2">No items in this kit yet. Add items below.</p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {kit.items.map((item) => {
                const consumable = consumables.find((c) => c.id === item.consumableId);
                const currentQty = editQty[item.id] ?? item.quantity;
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-2.5 bg-shark-50 dark:bg-shark-800 rounded-lg px-3 py-2 transition-opacity ${
                      removingId === item.id ? "opacity-40" : ""
                    }`}
                  >
                    <Icon
                      name={item.itemType === "ASSET_CATEGORY" ? "package" : "droplet"}
                      size={14}
                      className={item.itemType === "ASSET_CATEGORY" ? "text-action-500" : "text-blue-500"}
                    />
                    <span className="text-sm text-shark-700 dark:text-shark-300 flex-1 truncate">
                      {item.itemType === "ASSET_CATEGORY"
                        ? `Asset from "${item.category}"`
                        : `${consumable?.name || "Unknown"} (${consumable?.unitType || ""})`
                      }
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs text-shark-400">Qty:</span>
                      <input
                        type="number"
                        min="1"
                        value={currentQty}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          setEditQty((prev) => ({ ...prev, [item.id]: Math.max(1, val) }));
                        }}
                        onBlur={() => handleQtyChange(item.id, currentQty)}
                        className={`w-14 text-center text-sm rounded-lg border py-0.5 ${
                          savingQtyId === item.id ? "border-action-400 bg-action-50" : "border-shark-200"
                        }`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={removingId === item.id}
                      className="text-shark-400 hover:text-red-500 p-1 rounded transition-colors disabled:opacity-50"
                      title="Remove item"
                    >
                      <Icon name="x" size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Inline Add Items */}
        {showAddItems && (
          <div className="border border-action-200 rounded-xl p-3 bg-action-50/30">
            <AddItemsChecklist
              starterKitId={kit.id}
              existingItems={kit.items}
              categories={categories}
              consumables={consumables}
              onDone={() => setShowAddItems(false)}
            />
          </div>
        )}

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
  onDone,
}: {
  starterKitId: string;
  existingItems: StarterKitItem[];
  categories: Category[];
  consumables: Consumable[];
  onDone: () => void;
}) {
  const existingCategories = new Set(existingItems.filter((i) => i.itemType === "ASSET_CATEGORY").map((i) => i.category));
  const existingConsumableIds = new Set(existingItems.filter((i) => i.itemType === "CONSUMABLE").map((i) => i.consumableId));

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

      {/* Consumables */}
      {consumables.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-shark-400 uppercase tracking-wider mb-2">
            <Icon name="droplet" size={12} className="inline mr-1 text-blue-500" />
            Consumables
          </p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {consumables.map((c) => {
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
                  <label
                    className={`text-sm text-shark-700 flex-1 ${alreadyAdded ? "cursor-not-allowed" : "cursor-pointer"}`}
                    onClick={() => !alreadyAdded && toggleConsumable(c.id)}
                  >
                    {c.name} <span className="text-shark-400 text-xs">({c.unitType}) · {c.quantityOnHand} in stock</span>
                  </label>
                  {alreadyAdded && <span className="text-xs text-shark-400">Added</span>}
                  {isSelected && !alreadyAdded && (
                    <div className="flex items-center gap-1">
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
      )}

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
  consumables,
  onDone,
}: {
  kit: StarterKit;
  users: User[];
  consumables: Consumable[];
  onDone: () => void;
}) {
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [excludedItems, setExcludedItems] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState(false);
  const [results, setResults] = useState<{ userName: string; applied: number; details: string[] }[] | null>(null);
  const [search, setSearch] = useState("");

  const toggleItemExclusion = (itemId: string) => {
    setExcludedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId); else next.add(itemId);
      return next;
    });
  };

  const includedCount = kit.items.length - excludedItems.size;

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || (u.name || "").toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const toggleUser = (id: string) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map((u) => u.id)));
    }
  };

  const handleApply = async () => {
    setApplying(true);
    const applyResults: { userName: string; applied: number; details: string[] }[] = [];
    try {
      for (const userId of selectedUsers) {
        const user = users.find((u) => u.id === userId);
        const result = await applyStarterKit(userId, kit.id, [...excludedItems]);
        applyResults.push({
          userName: user?.name || user?.email || "Unknown",
          applied: result.applied || 0,
          details: (result.results as string[]) || [],
        });
      }
      setResults(applyResults);
    } finally {
      setApplying(false);
    }
  };

  if (results) {
    return (
      <div className="space-y-4">
        <p className="text-sm font-medium text-shark-700">Results:</p>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {results.map((r, i) => (
            <div key={i} className="bg-shark-50 rounded-lg px-3 py-2">
              <p className="text-sm font-semibold text-shark-800">{r.userName}</p>
              <p className="text-xs text-shark-500">{r.applied} item{r.applied !== 1 ? "s" : ""} assigned</p>
              {r.details.map((d, j) => (
                <p key={j} className="text-xs text-shark-400 ml-2">• {d}</p>
              ))}
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-2">
          <Button onClick={onDone}>Done</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Kit Items — deselect to exclude */}
      <div>
        <p className="text-xs font-semibold text-shark-400 uppercase tracking-wider mb-2">Kit Items ({includedCount} of {kit.items.length} selected)</p>
        <div className="space-y-1 max-h-40 overflow-y-auto border border-shark-100 rounded-lg p-2">
          {kit.items.map((item) => {
            const consumable = consumables.find((c) => c.id === item.consumableId);
            const isIncluded = !excludedItems.has(item.id);
            return (
              <label
                key={item.id}
                className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  isIncluded ? "hover:bg-shark-50" : "opacity-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isIncluded}
                  onChange={() => toggleItemExclusion(item.id)}
                  className="rounded border-shark-300 text-action-500 focus:ring-action-400"
                />
                <Icon
                  name={item.itemType === "ASSET_CATEGORY" ? "package" : "droplet"}
                  size={14}
                  className={item.itemType === "ASSET_CATEGORY" ? "text-action-500" : "text-blue-500"}
                />
                <span className={`text-sm ${isIncluded ? "text-shark-700" : "text-shark-400 line-through"}`}>
                  {item.itemType === "ASSET_CATEGORY"
                    ? `1x Asset from "${item.category}"`
                    : `${item.quantity}x ${consumable?.name || "Unknown"}`
                  }
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Staff Selection */}
      <p className="text-xs font-semibold text-shark-400 uppercase tracking-wider">Select Staff</p>

      <Input
        placeholder="Search staff..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="border-b border-shark-100 pb-2">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-shark-600">
          <input
            type="checkbox"
            checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
            onChange={selectAll}
            className="rounded border-shark-300 text-action-500 focus:ring-action-400"
          />
          Select All ({filteredUsers.length})
        </label>
      </div>

      <div className="space-y-1 max-h-56 overflow-y-auto">
        {filteredUsers.length === 0 ? (
          <p className="text-sm text-shark-400 text-center py-4">No staff found.</p>
        ) : (
          filteredUsers.map((user) => (
            <label
              key={user.id}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                selectedUsers.has(user.id) ? "bg-action-50 border border-action-200" : "hover:bg-shark-50 border border-transparent"
              }`}
            >
              <input
                type="checkbox"
                checked={selectedUsers.has(user.id)}
                onChange={() => toggleUser(user.id)}
                className="rounded border-shark-300 text-action-500 focus:ring-action-400"
              />
              <div className="flex-1 min-w-0">
                <span className="text-sm text-shark-700">{user.name || user.email}</span>
                {user.name && <span className="text-xs text-shark-400 ml-1">({user.email})</span>}
              </div>
              {user.region && (
                <span className="text-xs text-shark-400 shrink-0">{user.region.name}</span>
              )}
            </label>
          ))
        )}
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-shark-100">
        <span className="text-sm text-shark-400">{selectedUsers.size} staff · {includedCount} items</span>
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onDone}>Cancel</Button>
          <Button onClick={handleApply} disabled={selectedUsers.size === 0 || includedCount === 0 || applying}>
            {applying ? "Applying..." : `Apply ${includedCount} Items to ${selectedUsers.size} Staff`}
          </Button>
        </div>
      </div>
    </div>
  );
}
