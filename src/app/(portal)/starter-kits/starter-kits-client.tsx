"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import {
  createStarterKit,
  updateStarterKit,
  deleteStarterKit,
  addStarterKitItem,
  removeStarterKitItem,
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
}

export function StarterKitsClient({
  kits,
  categories,
  consumables,
}: {
  kits: StarterKit[];
  categories: Category[];
  consumables: Consumable[];
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [editKit, setEditKit] = useState<StarterKit | null>(null);
  const [expandedKit, setExpandedKit] = useState<string | null>(null);
  const [showAddItem, setShowAddItem] = useState<string | null>(null);

  return (
    <div className="space-y-6">
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => setExpandedKit(expandedKit === kit.id ? null : kit.id)}>
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
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditKit(kit)}>Edit</Button>
                  </div>
                </div>

                {expandedKit === kit.id && (
                  <div className="mt-4 border-t border-shark-100 dark:border-shark-800 pt-4">
                    {kit.items.length === 0 ? (
                      <p className="text-sm text-shark-400 italic">No items in this kit yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {kit.items.map((item) => {
                          const consumable = consumables.find((c) => c.id === item.consumableId);
                          return (
                            <div key={item.id} className="flex items-center justify-between bg-shark-50 dark:bg-shark-800 rounded-lg px-3 py-2">
                              <div className="flex items-center gap-2">
                                <Icon
                                  name={item.itemType === "ASSET_CATEGORY" ? "package" : "droplet"}
                                  size={14}
                                  className={item.itemType === "ASSET_CATEGORY" ? "text-action-500" : "text-blue-500"}
                                />
                                <span className="text-sm text-shark-700 dark:text-shark-300">
                                  {item.itemType === "ASSET_CATEGORY"
                                    ? `1x Asset from "${item.category}"`
                                    : `${item.quantity}x ${consumable?.name || "Unknown"} (${consumable?.unitType || ""})`
                                  }
                                </span>
                              </div>
                              <button
                                onClick={async () => await removeStarterKitItem(item.id)}
                                className="text-shark-400 hover:text-red-500"
                              >
                                <Icon name="x" size={14} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
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
          <form action={async (fd) => { await updateStarterKit(fd); setEditKit(null); }} className="space-y-4">
            <input type="hidden" name="id" value={editKit.id} />
            <div>
              <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Name *</label>
              <Input name="name" required defaultValue={editKit.name} />
            </div>
            <div>
              <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Description</label>
              <Input name="description" defaultValue={editKit.description || ""} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" name="isDefault" value="true" id="editIsDefault" className="rounded" defaultChecked={editKit.isDefault} />
              <label htmlFor="editIsDefault" className="text-sm text-shark-700 dark:text-shark-300">
                Auto-apply to new staff (default kit)
              </label>
            </div>
            <div className="flex justify-between pt-4 border-t border-shark-100">
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={async () => {
                  if (confirm(`Delete starter kit "${editKit.name}"? This cannot be undone.`)) {
                    await deleteStarterKit(editKit.id);
                    setEditKit(null);
                  }
                }}
              >
                Delete Kit
              </Button>
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={() => setEditKit(null)}>Cancel</Button>
                <Button type="submit">Save</Button>
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* Add Item to Kit Modal */}
      <Modal open={!!showAddItem} onClose={() => setShowAddItem(null)} title="Add Item to Kit">
        {showAddItem && (
          <AddItemForm
            starterKitId={showAddItem}
            categories={categories}
            consumables={consumables}
            onDone={() => setShowAddItem(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function AddItemForm({
  starterKitId,
  categories,
  consumables,
  onDone,
}: {
  starterKitId: string;
  categories: Category[];
  consumables: Consumable[];
  onDone: () => void;
}) {
  const [itemType, setItemType] = useState("ASSET_CATEGORY");

  return (
    <form action={async (fd) => { await addStarterKitItem(fd); onDone(); }} className="space-y-4">
      <input type="hidden" name="starterKitId" value={starterKitId} />
      <div>
        <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Type</label>
        <Select name="itemType" value={itemType} onChange={(e) => setItemType(e.target.value)}>
          <option value="ASSET_CATEGORY">Asset (by category)</option>
          <option value="CONSUMABLE">Consumable</option>
        </Select>
      </div>

      {itemType === "ASSET_CATEGORY" ? (
        <div>
          <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Asset Category *</label>
          <Select name="category" required>
            <option value="">Select category...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </Select>
          <p className="text-xs text-shark-400 mt-1">One available asset from this category will be assigned.</p>
        </div>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Consumable *</label>
            <Select name="consumableId" required>
              <option value="">Select consumable...</option>
              {consumables.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.unitType}) — {c.quantityOnHand} in stock</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Quantity</label>
            <Input name="quantity" type="number" min="1" defaultValue="1" />
          </div>
        </>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onDone}>Cancel</Button>
        <Button type="submit">Add Item</Button>
      </div>
    </form>
  );
}
