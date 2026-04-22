"use client";

import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Icon, type IconName } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { ViewToggle, type ViewMode } from "@/components/ui/view-toggle";
import { createConsumable, updateConsumable, addStock, deductStock, approveRequest, issueConsumable, assignConsumable, returnConsumable, bulkDeleteConsumables } from "@/app/actions/consumables";
import { createCategory, updateCategory, deleteCategory, reorderCategories, reorderItems } from "@/app/actions/categories";
import { formatDate } from "@/lib/utils";
import { exportToCSV } from "@/lib/csv";

// Color palette auto-assigned by category index
const SECTION_COLORS = [
  { color: "text-blue-600", bg: "bg-blue-50" },
  { color: "text-[#E8532E]", bg: "bg-amber-50" },
  { color: "text-cyan-600", bg: "bg-cyan-50" },
  { color: "text-red-600", bg: "bg-red-50" },
  { color: "text-action-600", bg: "bg-action-50" },
  { color: "text-shark-600 dark:text-shark-400", bg: "bg-shark-50 dark:bg-shark-800" },
  { color: "text-gray-600", bg: "bg-gray-100" },
  { color: "text-orange-600", bg: "bg-orange-50" },
  { color: "text-pink-600", bg: "bg-pink-50" },
  { color: "text-lime-600", bg: "bg-lime-50" },
  { color: "text-yellow-600", bg: "bg-yellow-50" },
  { color: "text-indigo-600", bg: "bg-indigo-50" },
  { color: "text-teal-600", bg: "bg-teal-50" },
  { color: "text-rose-600", bg: "bg-rose-50" },
  { color: "text-sky-600", bg: "bg-sky-50" },
];

interface CategoryDef {
  id: string;
  name: string;
  type: string;
  sortOrder: number;
}

interface ConsumableAssignment {
  id: string;
  quantity: number;
  assignedDate: string;
  isActive: boolean;
  user: { id: string; name: string | null; email: string };
}

interface Consumable {
  id: string;
  name: string;
  category: string;
  unitType: string;
  imageUrl: string | null;
  quantityOnHand: number;
  minimumThreshold: number;
  reorderLevel: number;
  supplier: string | null;
  shopUrl: string | null;
  unitCost: number | null;
  notes: string | null;
  avgDailyUsage: number | null;
  riskLevel: string | null;
  predictedDepletionDate: string | null;
  region: { id: string; name: string; state: { name: string } };
  assignments: ConsumableAssignment[];
}

interface Request {
  id: string;
  quantity: number;
  status: string;
  notes: string | null;
  consumable: { name: string; unitType: string; quantityOnHand: number };
  user: { id: string; name: string | null; email: string };
  createdAt: string;
}

const REGION_COLORS = [
  { color: "text-blue-600", bg: "bg-blue-50" },
  { color: "text-action-600", bg: "bg-action-50" },
  { color: "text-[#E8532E]", bg: "bg-amber-50" },
  { color: "text-cyan-600", bg: "bg-cyan-50" },
  { color: "text-red-600", bg: "bg-red-50" },
  { color: "text-shark-600 dark:text-shark-400", bg: "bg-shark-50 dark:bg-shark-800" },
  { color: "text-pink-600", bg: "bg-pink-50" },
  { color: "text-orange-600", bg: "bg-orange-50" },
  { color: "text-lime-600", bg: "bg-lime-50" },
  { color: "text-teal-600", bg: "bg-teal-50" },
];

interface ConsumablesClientProps {
  consumables: Consumable[];
  pendingRequests: Request[];
  regions: Array<{ id: string; name: string; state: { name: string } }>;
  users: Array<{ id: string; name: string | null; email: string; regionId: string | null }>;
  categories: CategoryDef[];
  isSuperAdmin: boolean;
  canAdd: boolean;
  canAdjustStock: boolean;
  initialTab?: string;
  initialStock?: string;
  initialCategory?: string;
  /** Consumable ID to scroll to and highlight on mount (from Low Stock deep-link) */
  highlightId?: string;
}

import { compressImage } from "@/lib/image-utils";


export function ConsumablesClient({ consumables, pendingRequests, regions, users, categories, isSuperAdmin, canAdd, canAdjustStock, initialTab, initialStock, initialCategory, highlightId }: ConsumablesClientProps) {
  const { addToast } = useToast();
  const [hoveredQtyId, setHoveredQtyId] = useState<string | null>(null);
  const [qtyTooltipPos, setQtyTooltipPos] = useState<{ top: number; right: number } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showCreate, setShowCreate] = useState(false);
  const [showAddStock, setShowAddStock] = useState<Consumable | null>(null);
  const [stockMode, setStockMode] = useState<"add" | "deduct">("add");
  const [showAssign, setShowAssign] = useState<Consumable | null>(null);
  const [showReturn, setShowReturn] = useState<{ assignment: ConsumableAssignment; consumable: Consumable } | null>(null);
  const [addingStock, setAddingStock] = useState(false);
  const stockSubmittingRef = useRef(false);
  const [assigning, setAssigning] = useState(false);
  const [returning, setReturning] = useState(false);
  const [issuingId, setIssuingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [showImage, setShowImage] = useState<Consumable | null>(null);
  const [editConsumable, setEditConsumable] = useState<Consumable | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImageRemoved, setEditImageRemoved] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [search, setSearch] = useState(initialCategory || "");
  const [tab, setTab] = useState<"stock" | "requests">(initialTab === "requests" ? "requests" : "stock");
  const [stockFilter, setStockFilter] = useState(initialStock || "ALL");
  const [staffModalUserId, setStaffModalUserId] = useState<string | null>(null);

  // Collapsed sections state
  const [collapsedRegions, setCollapsedRegions] = useState<Set<string>>(new Set());
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const toggleRegion = (id: string) => {
    setCollapsedRegions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleCategory = (key: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  // Checkbox delete state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Manage sections state
  const [showManageSections, setShowManageSections] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [addingSectionError, setAddingSectionError] = useState("");
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionName, setEditingSectionName] = useState("");

  // Image upload state for create modal
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [suggestingCategory, setSuggestingCategory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Column visibility state — persisted to localStorage
  const CONSUMABLE_COLS_KEY = "trackio-consumable-columns";
  type ConsumableCols = { photo: boolean; item: boolean; location: boolean; qty: boolean; assignedTo: boolean };
  const defaultConsumableCols: ConsumableCols = { photo: true, item: true, location: true, qty: true, assignedTo: true };
  const [visibleColumns, setVisibleColumns] = useState<ConsumableCols>(() => {
    if (typeof window === "undefined") return defaultConsumableCols;
    try {
      const saved = localStorage.getItem(CONSUMABLE_COLS_KEY);
      if (saved) return { ...defaultConsumableCols, ...JSON.parse(saved) };
    } catch {}
    return defaultConsumableCols;
  });
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const columnMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showColumnMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(e.target as Node)) {
        setShowColumnMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showColumnMenu]);

  const toggleColumn = (col: keyof typeof visibleColumns) => {
    setVisibleColumns((prev) => {
      const next = { ...prev, [col]: !prev[col] };
      try { localStorage.setItem(CONSUMABLE_COLS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  // ── Deep-link highlight: scroll to and flash the target consumable ──────
  useEffect(() => {
    if (!highlightId) return;
    // Small delay so the DOM has rendered and any collapsed sections have expanded
    const timer = setTimeout(() => {
      // querySelectorAll because the table view renders both a mobile div
      // and a desktop tr with the same attribute — pick the visible one.
      const all = document.querySelectorAll(`[data-consumable-id="${highlightId}"]`);
      const el = Array.from(all).find(
        (e) => (e as HTMLElement).offsetParent !== null
      ) as HTMLElement | null;
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("consumable-highlight");
      // Remove the highlight class after the animation finishes
      const cleanup = setTimeout(() => el.classList.remove("consumable-highlight"), 2800);
      return () => clearTimeout(cleanup);
    }, 300);
    return () => clearTimeout(timer);
  }, [highlightId]);

  // Drag and drop state for sections
  const [dragSectionIdx, setDragSectionIdx] = useState<number | null>(null);
  const [dragOverSectionIdx, setDragOverSectionIdx] = useState<number | null>(null);

  // Drag and drop state for items within a section
  const [dragItemId, setDragItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);

  const handleSectionDragStart = (idx: number) => { setDragSectionIdx(idx); };
  const handleSectionDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverSectionIdx(idx); };
  const handleSectionDragEnd = async () => {
    if (dragSectionIdx !== null && dragOverSectionIdx !== null && dragSectionIdx !== dragOverSectionIdx) {
      const reordered = [...categories];
      const [moved] = reordered.splice(dragSectionIdx, 1);
      reordered.splice(dragOverSectionIdx, 0, moved);
      try {
        await reorderCategories(reordered.map((c) => c.id));
      } catch (err) {
        console.error("Reorder failed:", err);
      }
    }
    setDragSectionIdx(null);
    setDragOverSectionIdx(null);
  };

  const handleItemDragStart = (id: string) => { setDragItemId(id); };
  const handleItemDragOver = (e: React.DragEvent, id: string) => { e.preventDefault(); setDragOverItemId(id); };
  const handleItemDragEnd = async (sectionItems: Consumable[]) => {
    if (dragItemId && dragOverItemId && dragItemId !== dragOverItemId) {
      const items = [...sectionItems];
      const fromIdx = items.findIndex((c) => c.id === dragItemId);
      const toIdx = items.findIndex((c) => c.id === dragOverItemId);
      if (fromIdx >= 0 && toIdx >= 0) {
        const [moved] = items.splice(fromIdx, 1);
        items.splice(toIdx, 0, moved);
        try {
          await reorderItems(items.map((c) => c.id), "CONSUMABLE");
        } catch (err) {
          console.error("Reorder failed:", err);
        }
      }
    }
    setDragItemId(null);
    setDragOverItemId(null);
  };

  // Clear selection when filters change so hidden items aren't selected
  const setSearchAndClear = (v: string) => { setSearch(v); setSelectedIds(new Set()); };

  const filtered = consumables.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.unitType.toLowerCase().includes(q) ||
      c.region.name.toLowerCase().includes(q) ||
      (c.supplier || "").toLowerCase().includes(q)
    );
  });

  // Group filtered consumables by category (using dynamic categories)
  const groupedConsumables = categories.map((cat, idx) => {
    const colors = SECTION_COLORS[idx % SECTION_COLORS.length];
    return {
      name: cat.name,
      ...colors,
      items: filtered.filter((c) => c.category === cat.name),
    };
  });

  // Only unassigned consumables can be deleted
  const deletableIds = new Set(
    consumables.filter((c) => (c.assignments || []).length === 0).map((c) => c.id)
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (sectionItems: Consumable[]) => {
    const deletable = sectionItems.filter((c) => deletableIds.has(c.id));
    const allSelected = deletable.every((c) => selectedIds.has(c.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        deletable.forEach((c) => next.delete(c.id));
      } else {
        deletable.forEach((c) => next.add(c.id));
      }
      return next;
    });
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      // Only delete items that are currently visible (matching filters)
      const filteredIds = new Set(filtered.map((c) => c.id));
      const idsToDelete = Array.from(selectedIds).filter((id) => filteredIds.has(id));
      const result = await bulkDeleteConsumables(idsToDelete);
      if (result.errors.length > 0) {
        addToast(`Deleted ${result.deleted} supply item(s). Some errors occurred.`, "warning");
      } else {
        addToast(`Deleted ${result.deleted} supply item(s) successfully`, "success");
      }
      setSelectedIds(new Set());
      setShowBulkDelete(false);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Delete failed", "error");
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleAddSection = async () => {
    if (!newSectionName.trim()) return;
    setAddingSectionError("");
    try {
      const fd = new FormData();
      fd.set("name", newSectionName.trim());
      fd.set("type", "CONSUMABLE");
      await createCategory(fd);
      setNewSectionName("");
    } catch (err) {
      setAddingSectionError(err instanceof Error ? err.message : "Failed to add section");
    }
  };

  const handleDeleteSection = async (catId: string) => {
    setAddingSectionError("");
    try {
      const fd = new FormData();
      fd.set("id", catId);
      await deleteCategory(fd);
    } catch (err) {
      setAddingSectionError(err instanceof Error ? err.message : "Failed to delete section");
    }
  };

  const handleEditSection = async (catId: string) => {
    if (!editingSectionName.trim()) return;
    setAddingSectionError("");
    try {
      const fd = new FormData();
      fd.set("id", catId);
      fd.set("name", editingSectionName.trim());
      await updateCategory(fd);
      setEditingSectionId(null);
      setEditingSectionName("");
    } catch (err) {
      setAddingSectionError(err instanceof Error ? err.message : "Failed to rename section");
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      addToast("File too large. Max 5MB.", "error");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSuggestCategory = async () => {
    const nameInput = document.querySelector<HTMLInputElement>('input[name="name"]');
    const name = nameInput?.value;
    if (!name) return;
    setSuggestingCategory(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Suggest the best category for a new CONSUMABLE named "${name}". Available categories: ${categories.map(c => c.name).join(", ")}. Reply with ONLY the category name, nothing else.`,
          }],
        }),
      });
      const data = await res.json();
      const suggested = data.response?.trim();
      const match = categories.find(c => c.name.toLowerCase() === suggested?.toLowerCase());
      if (match) {
        const select = document.querySelector<HTMLSelectElement>('select[name="category"]');
        if (select) {
          select.value = match.name;
          select.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
    } catch { /* silent fail */ }
    finally { setSuggestingCategory(false); }
  };

  const handleCreateSubmit = async (fd: FormData) => {
    setUploading(true);
    try {
      if (imageFile) {
        try {
          const compressed = await compressImage(imageFile);
          fd.set("imageUrl", compressed);
        } catch {
          addToast("Failed to process image", "error");
          setUploading(false);
          return;
        }
      }
      await createConsumable(fd);
      setShowCreate(false);
      setImagePreview(null);
      setImageFile(null);
    } finally {
      setUploading(false);
    }
  };

  const renderConsumableCard = (c: Consumable) => {
    const stockPercent = c.minimumThreshold > 0
      ? Math.min(100, (c.quantityOnHand / (c.minimumThreshold * 3)) * 100)
      : 100;
    const isLow = c.quantityOnHand <= c.minimumThreshold;
    const isCritical = c.quantityOnHand === 0;

    return (
      <div
        key={c.id}
        data-consumable-id={c.id}
        onClick={() => setEditConsumable(c)}
        className="bg-white dark:bg-shark-900 border border-shark-100 dark:border-shark-800 rounded-xl p-4 hover:shadow-md hover:border-shark-200 dark:hover:border-shark-700 transition-all duration-150 group cursor-pointer"
      >
        {/* Image or icon + status badge */}
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-lg bg-shark-50 dark:bg-shark-800 border border-shark-100 dark:border-shark-800 dark:bg-shark-800 dark:border-shark-700 flex items-center justify-center overflow-hidden shrink-0">
            {c.imageUrl ? (
              <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover rounded-lg" />
            ) : (
              <Icon name="droplet" size={18} className="text-shark-300" />
            )}
          </div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            isCritical ? "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400" :
            isLow ? "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
            "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400"
          }`}>
            {isCritical ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"}
          </span>
        </div>

        {/* Name + category */}
        <h3 className="font-semibold text-shark-900 dark:text-shark-100 dark:text-white text-sm mb-0.5 truncate">{c.name}</h3>
        <p className="text-xs text-shark-400 mb-3 truncate">{c.category} · {c.region.name}</p>

        {/* Stock bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-shark-500 dark:text-shark-400 mb-1">
            <span>{c.quantityOnHand} {c.unitType}</span>
            <span>Min: {c.minimumThreshold}</span>
          </div>
          <div className="h-1.5 bg-shark-100 dark:bg-shark-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isCritical ? "bg-red-500" : isLow ? "bg-amber-400" : "bg-green-500"}`}
              style={{ width: `${stockPercent}%` }}
            />
          </div>
        </div>

        {/* Quick actions - show on hover */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150" onClick={(e) => e.stopPropagation()}>
          <button
            className="flex-1 text-xs py-1.5 rounded-lg bg-action-50 text-action-600 hover:bg-action-100 font-medium transition-colors"
            onClick={() => {
              if (!canAdjustStock) { addToast("You don't have permission to adjust stock. To update stock, confirm receival in Purchase Orders.", "error"); return; }
              setStockMode("add"); setShowAddStock(c);
            }}
          >
            Add Stock
          </button>
          <button
            className="flex-1 text-xs py-1.5 rounded-lg bg-shark-50 text-shark-600 dark:text-shark-400 hover:bg-shark-100 dark:hover:bg-shark-800 font-medium transition-colors"
            onClick={() => setShowAssign(c)}
          >
            Assign
          </button>
        </div>
      </div>
    );
  };

  const renderCompactRow = (c: Consumable) => {
    const isLow = c.quantityOnHand <= c.minimumThreshold;
    const isCritical = c.quantityOnHand === 0;
    return (
      <div
        key={c.id}
        data-consumable-id={c.id}
        onClick={() => setEditConsumable(c)}
        className="flex items-center gap-3 px-3 border-b border-shark-50 dark:border-shark-800 hover:bg-shark-50 dark:bg-shark-800 dark:hover:bg-shark-800/60 cursor-pointer"
        style={{ height: 36, minHeight: 36 }}
      >
        <span className="flex-1 min-w-0 text-[12px] font-medium text-shark-800 dark:text-shark-200 truncate">{c.name}</span>
        <span className={`shrink-0 text-[11px] font-bold px-1.5 py-0.5 rounded ${
          isCritical ? "bg-red-50 text-red-600" : isLow ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"
        }`}>{c.quantityOnHand} {c.unitType}</span>
        <span className="shrink-0 text-[11px] text-shark-400 hidden md:block w-24 truncate">{c.category}</span>
        <span className="shrink-0 text-[11px] text-shark-400 hidden lg:block w-28 truncate">{c.region.name}</span>
      </div>
    );
  };

  const renderConsumableTable = (sectionItems: Consumable[]) => {
    const deletableInSection = sectionItems.filter((c) => deletableIds.has(c.id));
    const allSelected = deletableInSection.length > 0 && deletableInSection.every((c) => selectedIds.has(c.id));
    const someSelected = deletableInSection.some((c) => selectedIds.has(c.id));

    return (
      <>
        {/* Mobile: card layout */}
        <div className="sm:hidden space-y-2">
          {sectionItems.length === 0 ? (
            <p className="text-center text-shark-400 py-6 text-sm">No items in this section.</p>
          ) : (
            sectionItems.map((c) => {
              const activeAssignments = c.assignments || [];
              const isLow = c.quantityOnHand <= c.minimumThreshold;
              return (
                <div
                  key={c.id}
                  data-consumable-id={c.id}
                  onClick={() => setEditConsumable(c)}
                  className="border border-shark-100 dark:border-shark-800 rounded-xl p-4 bg-white dark:bg-shark-900 hover:shadow-sm transition-shadow cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    {c.imageUrl ? (
                      <div className="w-11 h-11 rounded-lg overflow-hidden border border-shark-100 dark:border-shark-800 shrink-0">
                        <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-lg bg-shark-50 dark:bg-shark-800 border border-shark-100 dark:border-shark-700 flex items-center justify-center shrink-0">
                        <Icon name="droplet" size={18} className="text-shark-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-shark-800 dark:text-shark-200 truncate">{c.name}</p>
                          <p className="text-xs text-shark-400">{c.unitType}</p>
                        </div>
                        <span className={`text-sm font-bold shrink-0 ${isLow ? "text-red-500" : "text-shark-800 dark:text-shark-200"}`}>
                          {c.quantityOnHand}
                        </span>
                      </div>
                      {activeAssignments.length > 0 && (
                        <p className="text-xs text-shark-500 dark:text-shark-400 mt-1">Assigned to {activeAssignments.length} staff</p>
                      )}
                      {c.avgDailyUsage && c.avgDailyUsage > 0 && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                            c.riskLevel === "critical" ? "bg-red-50 text-red-600" :
                            c.riskLevel === "warning" ? "bg-amber-50 text-amber-600" :
                            "bg-shark-50 dark:bg-shark-800 text-shark-500 dark:text-shark-400"
                          }`}>
                            {(() => {
                              const daysLeft = Math.round(c.quantityOnHand / c.avgDailyUsage);
                              return daysLeft <= 0 ? "Depleted" : `~${daysLeft}d left`;
                            })()}
                          </span>
                          <span className="text-[10px] text-shark-400">{c.avgDailyUsage.toFixed(1)}/day</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-shark-50 dark:border-shark-800" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="outline" onClick={() => {
                      if (!canAdjustStock) { addToast("You don't have permission to adjust stock. To update stock, confirm receival in Purchase Orders.", "error"); return; }
                      setStockMode("add"); setShowAddStock(c);
                    }}>Stock</Button>
                    <Button size="sm" variant="outline" onClick={() => setShowAssign(c)}>Assign</Button>
                    {activeAssignments.length > 0 && (
                      <Button size="sm" variant="outline" onClick={() => setShowReturn({ assignment: activeAssignments[0], consumable: c })}>Return</Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop: table layout */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <thead>
              <tr className="border-b border-shark-100 dark:border-shark-700">
                <th scope="col" className="px-1 py-3 w-6"></th>
                <th scope="col" className="px-3 py-3 w-8">
                  {deletableInSection.length > 0 && (
                    <input type="checkbox" checked={allSelected} ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }} onChange={() => toggleSelectAll(sectionItems)} className="rounded border-shark-300 text-action-500 focus:ring-action-400" />
                  )}
                </th>
                {visibleColumns.photo && <th scope="col" className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-shark-400 w-14">Photo</th>}
                {visibleColumns.item && <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-shark-400">Item</th>}
                {visibleColumns.location && <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-shark-400 w-44 hidden lg:table-cell">Location</th>}
                {visibleColumns.qty && <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-shark-400 w-28">Qty</th>}
                {visibleColumns.assignedTo && <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-shark-400 w-40 hidden md:table-cell">Assigned To</th>}
                <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-shark-400 w-44">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sectionItems.map((c) => {
                const activeAssignments = c.assignments || [];
                const canDelete = deletableIds.has(c.id);
                return (
                  <tr key={c.id} data-consumable-id={c.id} onClick={() => setEditConsumable(c)} draggable onDragStart={() => handleItemDragStart(c.id)} onDragOver={(e) => handleItemDragOver(e, c.id)} onDragEnd={() => handleItemDragEnd(sectionItems)} className={`border-b border-shark-50 dark:border-shark-800 hover:bg-shark-50 dark:bg-shark-800 dark:hover:bg-shark-800/50 cursor-pointer ${selectedIds.has(c.id) ? "bg-action-50/30" : ""} ${dragItemId === c.id ? "opacity-40" : ""} ${dragOverItemId === c.id ? "border-t-2 border-t-action-500" : ""}`}>
                    <td className="px-1 py-2 cursor-grab active:cursor-grabbing" onClick={(e) => e.stopPropagation()}>
                      <svg className="w-4 h-4 text-shark-300" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>
                    </td>
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      {canDelete ? <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggleSelect(c.id)} className="rounded border-shark-300 text-action-500 focus:ring-action-400" /> : <div className="w-4" />}
                    </td>
                    {visibleColumns.photo && (
                    <td className="px-3 py-2">
                      {c.imageUrl ? <div className="w-10 h-10 rounded-lg overflow-hidden border border-shark-100 dark:border-shark-800"><img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover" /></div>
                      : <div className="w-10 h-10 rounded-lg bg-shark-50 dark:bg-shark-800 border border-shark-100 dark:border-shark-700 flex items-center justify-center"><Icon name="droplet" size={18} className="text-shark-300" /></div>}
                    </td>
                    )}
                    {visibleColumns.item && <td className="px-4 py-3"><span className="font-medium text-shark-800 dark:text-shark-200">{c.name}</span><span className="text-shark-400 ml-1 text-xs">({c.unitType})</span></td>}
                    {visibleColumns.location && <td className="px-4 py-3 text-shark-500 dark:text-shark-400 hidden lg:table-cell">{c.region.state.name} / {c.region.name}</td>}
                    {visibleColumns.qty && <td className="px-4 py-3 text-right">
                      <div
                        className="inline-block"
                        onMouseEnter={(e) => {
                          if (!c.avgDailyUsage || c.avgDailyUsage <= 0 || c.quantityOnHand > c.reorderLevel) return;
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredQtyId(c.id);
                          setQtyTooltipPos({ top: rect.top, right: window.innerWidth - rect.right });
                        }}
                        onMouseLeave={() => { setHoveredQtyId(null); setQtyTooltipPos(null); }}
                      >
                        <span className={`font-bold cursor-default ${c.quantityOnHand <= c.minimumThreshold ? "text-red-500" : "text-shark-800 dark:text-shark-200"}`}>{c.quantityOnHand}</span>
                      </div>
                      {hoveredQtyId === c.id && qtyTooltipPos && c.avgDailyUsage && c.avgDailyUsage > 0 && (() => {
                        const daysLeft = Math.round(c.quantityOnHand / c.avgDailyUsage);
                        const isDepleted = daysLeft <= 0;
                        const accentColor = c.riskLevel === "critical" ? "#dc2626" : c.riskLevel === "warning" ? "#f59e0b" : "#16a34a";
                        const depletionDate = c.predictedDepletionDate
                          ? new Date(c.predictedDepletionDate).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })
                          : null;
                        return (
                          <div
                            className="pointer-events-none fixed z-[9999] w-56 bg-white dark:bg-shark-900 border border-shark-100 dark:border-shark-700 rounded-xl shadow-xl overflow-hidden"
                            style={{
                              top: qtyTooltipPos.top,
                              right: qtyTooltipPos.right,
                              transform: "translateY(calc(-100% - 8px))",
                              borderTop: `3px solid ${accentColor}`,
                            }}
                          >
                            <div className="px-3 pt-2.5 pb-1">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-shark-400 mb-1.5">Depletion Estimate</p>
                              <div className="flex items-baseline gap-1.5 mb-1">
                                <span className="text-2xl font-bold" style={{ color: accentColor }}>
                                  {isDepleted ? "0" : daysLeft}
                                </span>
                                <span className="text-sm font-medium text-shark-600 dark:text-shark-300">
                                  {isDepleted ? "days — depleted" : "days remaining"}
                                </span>
                              </div>
                            </div>
                            <div className="border-t border-shark-100 dark:border-shark-800 px-3 py-2 space-y-1">
                              <div className="flex justify-between text-[11px]">
                                <span className="text-shark-400">Avg daily usage</span>
                                <span className="font-medium text-shark-700 dark:text-shark-300">{c.avgDailyUsage.toFixed(1)} {c.unitType}/day</span>
                              </div>
                              <div className="flex justify-between text-[11px]">
                                <span className="text-shark-400">Current stock</span>
                                <span className="font-medium text-shark-700 dark:text-shark-300">{c.quantityOnHand} {c.unitType}</span>
                              </div>
                              <div className="flex justify-between text-[11px]">
                                <span className="text-shark-400">Min threshold</span>
                                <span className="font-medium text-shark-700 dark:text-shark-300">{c.minimumThreshold} {c.unitType}</span>
                              </div>
                              {depletionDate && (
                                <div className="flex justify-between text-[11px]">
                                  <span className="text-shark-400">Est. depletion</span>
                                  <span className="font-medium text-shark-700 dark:text-shark-300">{depletionDate}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </td>}
                    {visibleColumns.assignedTo && (
                    <td className="px-4 py-3 text-shark-500 dark:text-shark-400 hidden md:table-cell overflow-hidden" onClick={(e) => e.stopPropagation()}>
                      {activeAssignments.length > 0 ? (
                        <select
                          className="w-full text-xs bg-transparent border border-shark-200 dark:border-shark-700 rounded px-2 py-1 text-action-600 cursor-pointer hover:border-action-300 focus:outline-none focus:ring-1 focus:ring-action-300"
                          value=""
                          onChange={(e) => {
                            if (e.target.value) setStaffModalUserId(e.target.value);
                            e.target.value = "";
                          }}
                        >
                          <option value="">{activeAssignments.length} staff ({activeAssignments.reduce((s, a) => s + a.quantity, 0)})</option>
                          {activeAssignments.map((a) => (
                            <option key={a.id} value={a.user.id}>{a.user.name || a.user.email} (×{a.quantity})</option>
                          ))}
                        </select>
                      ) : <span className="text-shark-400">{"\u2014"}</span>}
                    </td>
                    )}
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="outline" onClick={() => {
                          if (!canAdjustStock) { addToast("You don't have permission to adjust stock. To update stock, confirm receival in Purchase Orders.", "error"); return; }
                          setStockMode("add"); setShowAddStock(c);
                        }}>Stock</Button>
                        <Button size="sm" variant="outline" onClick={() => setShowAssign(c)}>Assign</Button>
                        {activeAssignments.length > 0 && <Button size="sm" variant="outline" onClick={() => setShowReturn({ assignment: activeAssignments[0], consumable: c })}>Return</Button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {sectionItems.length === 0 && <tr><td colSpan={7} className="px-4 py-6 text-center text-shark-400 text-sm">No items in this section.</td></tr>}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  return (
    <>
      <Card padding="none">

      {/* Header: icon + title + count + actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-5 py-4 border-b border-shark-100 dark:border-shark-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-action-100 flex items-center justify-center shrink-0">
            <Icon name="droplet" size={14} className="text-action-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-shark-900 dark:text-shark-100">Supplies</h3>
            <p className="text-xs text-shark-400">{consumables.length} total items{pendingRequests.length > 0 ? ` · ${pendingRequests.length} pending` : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ViewToggle value={viewMode} onChange={setViewMode} />
          <Button variant="outline" size="sm" onClick={() => setShowManageSections(true)}>
            <Icon name="settings" size={14} className="mr-1.5" />
            Sections
          </Button>
          <Button size="sm" onClick={() => {
            if (!canAdd) {
              addToast("You don't have permission to add supplies. Please contact your admin.", "error");
              return;
            }
            setShowCreate(true);
          }}>
            <Icon name="plus" size={14} className="mr-1.5" />
            New Supply
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 sm:px-5 py-3 border-b border-shark-100 dark:border-shark-800">
        <div className="flex gap-1 bg-shark-50 dark:bg-shark-800/60 rounded-xl p-1">
          <button
            onClick={() => setTab("stock")}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              tab === "stock" ? "bg-white dark:bg-shark-700 text-shark-900 dark:text-shark-100 shadow-sm" : "text-shark-500 dark:text-shark-400 hover:text-shark-700 dark:text-shark-300 dark:hover:text-shark-200"
            }`}
          >
            Stock Levels
          </button>
          <button
            onClick={() => setTab("requests")}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              tab === "requests" ? "bg-white dark:bg-shark-700 text-shark-900 dark:text-shark-100 shadow-sm" : "text-shark-500 dark:text-shark-400 hover:text-shark-700 dark:text-shark-300 dark:hover:text-shark-200"
            }`}
          >
            Requests {pendingRequests.length > 0 && (
              <span className="ml-1.5 bg-action-400 text-white text-xs rounded-full px-2 py-0.5">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search + Export + Bulk Delete — border-b, stock tab only */}
      {tab === "stock" && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-5 py-3 border-b border-shark-100 dark:border-shark-800">
          <Input
            placeholder="Search supplies..."
            value={search}
            onChange={(e) => setSearchAndClear(e.target.value)}
            className="flex-1 sm:max-w-md"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const rows = filtered.map((c) => ({
                "Name": c.name,
                "Category": c.category,
                "Unit Type": c.unitType,
                "Quantity on Hand": c.quantityOnHand,
                "Minimum Threshold": c.minimumThreshold,
                "Reorder Level": c.reorderLevel,
                "Unit Cost": c.unitCost != null ? c.unitCost : "",
                "Region": c.region.name,
              }));
              exportToCSV(rows as Record<string, unknown>[], "consumables.csv");
            }}
          >
            <Icon name="download" size={14} className="mr-1" />
            Export
          </Button>
          {selectedIds.size > 0 && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowBulkDelete(true)}
            >
              Delete Selected ({selectedIds.size})
            </Button>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4 sm:p-5 space-y-6">
        {tab === "stock" && (
          <>
          {consumables.length === 0 ? (
            <EmptyState
              icon="droplet"
              title="No supplies yet"
              description="Add supply items to manage stock"
              action={{ label: "Add Supply", href: "/consumables?action=add" }}
            />
          ) : isSuperAdmin ? (
            // Super Admin: group by region first, then category within each region
            regions.map((region) => {
              const regionItems = filtered.filter((c) => c.region.id === region.id);
              if (regionItems.length === 0 && search) return null;
              return (
                <div key={region.id} className="space-y-10">
                      {categories.map((cat, idx) => {
                        const colors = SECTION_COLORS[idx % SECTION_COLORS.length];
                        const catItems = regionItems.filter((c) => c.category === cat.name);
                        if (catItems.length === 0) return null;
                        const catKey = `${region.id}-${cat.name}`;
                        const catCollapsed = collapsedCategories.has(catKey);
                        return (
                          <div key={cat.name} className="space-y-4 ml-4">
                            <button
                              onClick={() => toggleCategory(catKey)}
                              className="flex items-center gap-3 px-1 w-full text-left group"
                            >
                              <div className="flex items-center gap-2 flex-1">
                                <h3 className="text-base font-semibold text-shark-900 dark:text-shark-100">{cat.name}</h3>
                                <span className="text-xs font-medium text-shark-400 bg-shark-100 dark:bg-shark-800 px-2 py-0.5 rounded-full">
                                  {catItems.length}
                                </span>
                              </div>
                              <Icon
                                name="chevron-down"
                                size={16}
                                className={`text-shark-400 group-hover:text-shark-600 dark:text-shark-400 transition-transform ${catCollapsed ? "-rotate-90" : ""}`}
                              />
                            </button>
                            {!catCollapsed && (
                              viewMode === "card" ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 py-2">
                                  {catItems.map(renderConsumableCard)}
                                  {catItems.length === 0 && <p className="col-span-full text-center text-shark-400 py-6 text-sm">No items in this section.</p>}
                                </div>
                              ) : viewMode === "compact" ? (
                                <div className="rounded-xl border border-shark-100 dark:border-shark-800 overflow-hidden">
                                  <div className="flex items-center gap-3 px-3 border-b border-shark-100 dark:border-shark-700 bg-shark-50 dark:bg-shark-800/60" style={{ height: 30 }}>
                                    <span className="flex-1 text-[10px] font-semibold uppercase tracking-wider text-shark-400">Item</span>
                                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-shark-400 w-16">Qty</span>
                                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-shark-400 hidden md:block w-24">Category</span>
                                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-shark-400 hidden lg:block w-28">Location</span>
                                  </div>
                                  {catItems.map(renderCompactRow)}
                                  {catItems.length === 0 && <p className="text-center text-shark-400 py-4 text-sm">No items in this section.</p>}
                                </div>
                              ) : (
                                renderConsumableTable(catItems)
                              )
                            )}
                          </div>
                        );
                      })}

                      {regionItems.length === 0 && (
                        <p className="text-sm text-shark-400 ml-4 px-1">No supplies in this region.</p>
                      )}
                </div>
              );
            })
          ) : (
            // Branch Manager: group by category only
            groupedConsumables.map((section, sIdx) => {
              if (search && section.items.length === 0) return null;
              const catCollapsed = collapsedCategories.has(section.name);
              return (
                <div
                  key={section.name}
                  className={`space-y-4 ${dragSectionIdx === sIdx ? "opacity-40" : ""} ${dragOverSectionIdx === sIdx ? "border-t-2 border-t-action-500 pt-1" : ""}`}
                  draggable
                  onDragStart={() => handleSectionDragStart(sIdx)}
                  onDragOver={(e) => handleSectionDragOver(e, sIdx)}
                  onDragEnd={handleSectionDragEnd}
                >
                  <div className="flex items-center gap-1">
                    <div className="cursor-grab active:cursor-grabbing p-1">
                      <svg className="w-5 h-5 text-shark-300" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>
                    </div>
                    <button
                      onClick={() => toggleCategory(section.name)}
                      className="flex items-center gap-3 px-1 w-full text-left group"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <h2 className="text-lg font-semibold text-shark-900 dark:text-shark-100">{section.name}</h2>
                        <span className="text-xs font-medium text-shark-400 bg-shark-100 dark:bg-shark-800 px-2 py-0.5 rounded-full">
                          {section.items.length}
                        </span>
                      </div>
                      <Icon
                        name="chevron-down"
                        size={16}
                        className={`text-shark-400 group-hover:text-shark-600 dark:text-shark-400 transition-transform ${catCollapsed ? "-rotate-90" : ""}`}
                      />
                    </button>
                  </div>
                  {!catCollapsed && (
                    viewMode === "card" ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 py-2">
                        {section.items.map(renderConsumableCard)}
                        {section.items.length === 0 && <p className="col-span-full text-center text-shark-400 py-6 text-sm">No items in this section.</p>}
                      </div>
                    ) : viewMode === "compact" ? (
                      <div className="rounded-xl border border-shark-100 dark:border-shark-800 overflow-hidden">
                        <div className="flex items-center gap-3 px-3 border-b border-shark-100 dark:border-shark-700 bg-shark-50 dark:bg-shark-800/60" style={{ height: 30 }}>
                          <span className="flex-1 text-[10px] font-semibold uppercase tracking-wider text-shark-400">Item</span>
                          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-shark-400 w-16">Qty</span>
                          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-shark-400 hidden md:block w-24">Category</span>
                          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-shark-400 hidden lg:block w-28">Location</span>
                        </div>
                        {section.items.map(renderCompactRow)}
                        {section.items.length === 0 && <p className="text-center text-shark-400 py-4 text-sm">No items in this section.</p>}
                      </div>
                    ) : (
                      renderConsumableTable(section.items)
                    )
                  )}
                </div>
              );
            })
          )}
          </>
        )}

        {tab === "requests" && (
          <>
          {/* Mobile: card layout */}
          <div className="sm:hidden divide-y divide-shark-50 dark:divide-shark-800">
            {pendingRequests.length === 0 ? (
              <p className="text-center text-shark-400 py-8 text-sm">No pending requests.</p>
            ) : (
              pendingRequests.map((r) => (
                <div key={r.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-shark-800 dark:text-shark-100">{r.consumable.name}</p>
                      <p className="text-xs text-shark-400">{r.user.name || r.user.email} · {r.quantity} {r.consumable.unitType}</p>
                      <p className="text-xs text-shark-400 mt-0.5">{formatDate(r.createdAt)}</p>
                    </div>
                    <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${r.consumable.quantityOnHand >= r.quantity ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"}`}>
                      {r.consumable.quantityOnHand >= r.quantity ? "Pending" : "Low Stock"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-3">
                    {r.consumable.quantityOnHand < r.quantity ? (
                      <span className="text-xs text-red-500 font-medium">Out of stock ({r.consumable.quantityOnHand} available)</span>
                    ) : (
                      <form action={async (fd) => { setIssuingId(r.id); try { await issueConsumable(fd); addToast("Consumable assigned successfully", "success"); } catch (e) { addToast(e instanceof Error ? e.message : "Something went wrong — please try again", "error"); } finally { setIssuingId(null); } }}>
                        <input type="hidden" name="requestId" value={r.id} />
                        <Button size="sm" type="submit" disabled={issuingId === r.id} loading={issuingId === r.id}>Assign</Button>
                      </form>
                    )}
                    <form action={async (fd) => { setRejectingId(r.id); try { await approveRequest(fd); addToast("Rejected", "success"); } catch (e) { addToast(e instanceof Error ? e.message : "Something went wrong — please try again", "error"); } finally { setRejectingId(null); } }}>
                      <input type="hidden" name="requestId" value={r.id} />
                      <input type="hidden" name="action" value="reject" />
                      <Button size="sm" variant="danger" type="submit" disabled={rejectingId === r.id} loading={rejectingId === r.id}>Reject</Button>
                    </form>
                  </div>
                </div>
              ))
            )}
          </div>
          {/* Desktop: table layout */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-shark-100 dark:border-shark-700">
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-shark-400">Item</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-shark-400">Requested By</th>
                  <th scope="col" className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-shark-400">Qty</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-shark-400 hidden md:table-cell">Date</th>
                  <th scope="col" className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-shark-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map((r) => (
                  <tr key={r.id} className="border-b border-shark-50 dark:border-shark-800 hover:bg-shark-50 dark:bg-shark-800 dark:hover:bg-shark-800/50">
                    <td className="px-5 py-3.5 font-medium text-shark-800 dark:text-shark-200">{r.consumable.name}</td>
                    <td className="px-5 py-3.5 text-shark-500 dark:text-shark-400">{r.user.name || r.user.email}</td>
                    <td className="px-5 py-3.5 text-right font-medium text-shark-700 dark:text-shark-300">{r.quantity} {r.consumable.unitType}</td>
                    <td className="px-5 py-3.5 text-shark-400 hidden md:table-cell">{formatDate(r.createdAt)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {r.consumable.quantityOnHand < r.quantity ? (
                          <span className="text-xs text-red-500 font-medium">Out of stock ({r.consumable.quantityOnHand} available)</span>
                        ) : (
                          <form action={async (fd) => { setIssuingId(r.id); try { await issueConsumable(fd); addToast("Consumable assigned successfully", "success"); } catch (e) { addToast(e instanceof Error ? e.message : "Something went wrong — please try again", "error"); } finally { setIssuingId(null); } }}>
                            <input type="hidden" name="requestId" value={r.id} />
                            <Button size="sm" variant="primary" type="submit" disabled={issuingId === r.id} loading={issuingId === r.id}>Assign</Button>
                          </form>
                        )}
                        <form action={async (fd) => { setRejectingId(r.id); try { await approveRequest(fd); addToast("Rejected", "success"); } catch (e) { addToast(e instanceof Error ? e.message : "Something went wrong — please try again", "error"); } finally { setRejectingId(null); } }}>
                          <input type="hidden" name="requestId" value={r.id} />
                          <input type="hidden" name="action" value="reject" />
                          <Button size="sm" variant="danger" type="submit" disabled={rejectingId === r.id} loading={rejectingId === r.id}>Reject</Button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
                {pendingRequests.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No pending requests.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>
    </Card>

      {/* Bulk Delete Confirmation Modal */}
      <Modal open={showBulkDelete} onClose={() => setShowBulkDelete(false)} title="Delete Selected Supplies">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-800 font-medium">
              Are you sure you want to delete {selectedIds.size} supply item{selectedIds.size > 1 ? "s" : ""}?
            </p>
            <p className="text-sm text-red-600 mt-1">This action cannot be undone.</p>
          </div>
          <div className="bg-shark-50 dark:bg-shark-800 rounded-xl p-4 max-h-40 overflow-y-auto">
            {consumables.filter((c) => selectedIds.has(c.id)).map((c) => (
                <div key={c.id} className="flex items-center gap-2 py-1">
                  <span className="font-medium text-shark-800 dark:text-shark-200 text-sm">{c.name}</span>
                  <span className="text-xs text-shark-400">{c.category}</span>
                </div>
              ))}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowBulkDelete(false)}>Cancel</Button>
            <Button
              variant="danger"
              disabled={bulkDeleting}
              onClick={handleBulkDelete}
            >
              {bulkDeleting ? "Deleting..." : `Delete ${selectedIds.size} Supply Item${selectedIds.size > 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Manage Sections Modal */}
      <Modal open={showManageSections} onClose={() => { setShowManageSections(false); setAddingSectionError(""); setNewSectionName(""); setEditingSectionId(null); }} title="Manage Supply Sections">
        <div className="space-y-4">
          <p className="text-sm text-shark-500 dark:text-shark-400">Add, rename, or remove sections for organising supplies.</p>

          {/* Existing sections */}
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {categories.map((cat, idx) => {
              const colors = SECTION_COLORS[idx % SECTION_COLORS.length];
              const itemCount = consumables.filter((c) => c.category === cat.name).length;
              const isEditing = editingSectionId === cat.id;
              return (
                <div key={cat.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-shark-50 dark:bg-shark-800 dark:hover:bg-shark-800">
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      <div className={`w-6 h-6 rounded ${colors.bg} flex items-center justify-center shrink-0`}>
                        <Icon name="package" size={12} className={colors.color} />
                      </div>
                      <Input
                        value={editingSectionName}
                        onChange={(e) => setEditingSectionName(e.target.value)}
                        className="flex-1 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); handleEditSection(cat.id); }
                          if (e.key === "Escape") { setEditingSectionId(null); setEditingSectionName(""); }
                        }}
                      />
                      <Button size="sm" onClick={() => handleEditSection(cat.id)} disabled={!editingSectionName.trim()}>
                        Save
                      </Button>
                      <button
                        onClick={() => { setEditingSectionId(null); setEditingSectionName(""); }}
                        className="text-shark-400 hover:text-shark-600 dark:text-shark-400 p-1"
                      >
                        <Icon name="x" size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded ${colors.bg} flex items-center justify-center`}>
                          <Icon name="package" size={12} className={colors.color} />
                        </div>
                        <span className="text-sm font-medium text-shark-800 dark:text-shark-200">{cat.name}</span>
                        <span className="text-xs text-shark-400">{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setEditingSectionId(cat.id); setEditingSectionName(cat.name); setAddingSectionError(""); }}
                          className="text-shark-400 hover:text-action-500 transition-colors p-1"
                          title="Rename section"
                        >
                          <Icon name="edit" size={14} />
                        </button>
                        {itemCount === 0 && (
                          <button
                            onClick={() => handleDeleteSection(cat.id)}
                            className="text-shark-400 hover:text-red-500 transition-colors p-1"
                            title="Remove section"
                          >
                            <Icon name="x" size={14} />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add new section */}
          <div className="border-t border-shark-100 dark:border-shark-700 pt-4">
            <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Add New Section</label>
            <div className="flex gap-2">
              <Input
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                placeholder="Section name..."
                className="flex-1"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSection(); } }}
              />
              <Button size="sm" onClick={handleAddSection} disabled={!newSectionName.trim()}>
                Add
              </Button>
            </div>
            {addingSectionError && (
              <p className="text-xs text-red-500 mt-1">{addingSectionError}</p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="secondary" onClick={() => { setShowManageSections(false); setAddingSectionError(""); setNewSectionName(""); setEditingSectionId(null); }}>
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Consumable Modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setImagePreview(null); setImageFile(null); }} title="Add New Supply">
        <form action={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Photo</label>
            <div className="flex items-start gap-4">
              {imagePreview ? (
                <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-shark-200 dark:border-shark-700">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setImagePreview(null); setImageFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center text-white text-xs hover:bg-black/70"
                  >
                    x
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 rounded-xl border-2 border-dashed border-shark-200 hover:border-action-300 flex flex-col items-center justify-center text-shark-400 hover:text-action-500 transition-colors"
                >
                  <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                  <span className="text-xs">Add Photo</span>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic" onChange={handleImageSelect} className="hidden" />
              <p className="text-xs text-shark-400 mt-1">JPEG, PNG, WebP or HEIC. Max 5MB.</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Name *</label>
            <Input name="name" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Category *</label>
            <div className="flex gap-2">
              <Select name="category" required className="flex-1">
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </Select>
              <Button type="button" variant="ghost" size="sm" onClick={handleSuggestCategory} disabled={suggestingCategory} title="AI suggest category">
                {suggestingCategory ? "..." : "AI"}
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Unit Type *</label>
              <Input name="unitType" required placeholder="e.g. boxes, packs, rolls" />
            </div>
            <div>
              <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Initial Qty</label>
              <Input name="quantityOnHand" type="number" defaultValue="0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Min Threshold</label>
              <Input name="minimumThreshold" type="number" defaultValue="5" />
            </div>
            <div>
              <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Reorder Level</label>
              <Input name="reorderLevel" type="number" defaultValue="10" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Region *</label>
            <Select name="regionId" required>
              <option value="">Select</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>{r.state.name} / {r.name}</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Supplier</label>
              <Input name="supplier" />
            </div>
            <div>
              <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Unit Cost (AUD)</label>
              <Input name="unitCost" type="number" step="0.01" placeholder="0.00" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Shop / Order Link</label>
            <Input name="shopUrl" type="url" placeholder="https://shop.example.com/product/..." />
            <p className="text-[11px] text-shark-400 mt-1">Direct link to the product page for quick reordering</p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setShowCreate(false); setImagePreview(null); setImageFile(null); }}>Cancel</Button>
            <Button type="submit" disabled={uploading} loading={uploading}>Add Supply</Button>
          </div>
        </form>
      </Modal>

      {/* Stock Management Modal */}
      <Modal open={!!showAddStock} onClose={() => setShowAddStock(null)} title={`${stockMode === "add" ? "Add" : "Deduct"} Stock: ${showAddStock?.name}`}>
        {showAddStock && (
          <form action={async (fd) => {
            if (stockSubmittingRef.current) return;
            stockSubmittingRef.current = true;
            setAddingStock(true);
            try {
              if (stockMode === "deduct") {
                await deductStock(fd);
                addToast("Stock deducted successfully", "success");
              } else {
                await addStock(fd);
                addToast("Stock added successfully", "success");
              }
              setShowAddStock(null);
            } catch (e) {
              addToast(e instanceof Error ? e.message : "Failed to update stock", "error");
            } finally {
              setAddingStock(false);
              stockSubmittingRef.current = false;
            }
          }} className="space-y-4">
            <input type="hidden" name="consumableId" value={showAddStock.id} />

            {/* Add / Deduct toggle — users with stockAdjust permission */}
            {canAdjustStock && (
              <div className="flex rounded-lg bg-shark-50 dark:bg-shark-800 p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setStockMode("add")}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${stockMode === "add" ? "bg-white dark:bg-shark-700 text-action-700 dark:text-action-400 shadow-sm" : "text-shark-500 dark:text-shark-400 hover:text-shark-700 dark:text-shark-300 dark:hover:text-shark-200"}`}
                >
                  + Add Stock
                </button>
                <button
                  type="button"
                  onClick={() => setStockMode("deduct")}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${stockMode === "deduct" ? "bg-white dark:bg-shark-700 text-red-700 dark:text-red-400 shadow-sm" : "text-shark-500 dark:text-shark-400 hover:text-shark-700 dark:text-shark-300 dark:hover:text-shark-200"}`}
                >
                  − Deduct Stock
                </button>
              </div>
            )}

            <p className="text-sm text-shark-600 dark:text-shark-400">
              Current stock: <strong>{showAddStock.quantityOnHand} {showAddStock.unitType}</strong>
            </p>

            <div>
              <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">
                Quantity to {stockMode === "add" ? "Add" : "Deduct"} *
              </label>
              <Input
                name="quantity"
                type="number"
                min="1"
                max={stockMode === "deduct" ? showAddStock.quantityOnHand : undefined}
                required
              />
            </div>

            {stockMode === "deduct" && (
              <div>
                <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Reason *</label>
                <Input name="reason" placeholder="e.g. Stock correction, write-off, expired..." required />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowAddStock(null)}>Cancel</Button>
              <Button
                type="submit"
                disabled={addingStock}
                loading={addingStock}
                className={stockMode === "deduct" ? "bg-red-600 hover:bg-red-700" : ""}
              >
                {stockMode === "add" ? "Add Stock" : "Deduct Stock"
                }
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Assign Consumable Modal */}
      <Modal open={!!showAssign} onClose={() => setShowAssign(null)} title={`Assign: ${showAssign?.name}`}>
        {showAssign && (
          <form action={async (fd) => {
            setAssigning(true);
            try {
              await assignConsumable(fd);
              addToast("Supply assigned successfully", "success");
              setShowAssign(null);
            } catch (e) {
              addToast(e instanceof Error ? e.message : "Failed to assign supply", "error");
            } finally {
              setAssigning(false);
            }
          }} className="space-y-4">
            <input type="hidden" name="consumableId" value={showAssign.id} />
            <p className="text-sm text-gray-600">
              Available stock: <strong>{showAssign.quantityOnHand} {showAssign.unitType}</strong>
            </p>
            <div>
              <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Assign to *</label>
              <Select name="userId" required>
                <option value="">Select staff member</option>
                {users
                  .filter((u) => !showAssign?.region?.id || u.regionId === showAssign.region.id)
                  .map((u) => (
                    <option key={u.id} value={u.id}>{u.name || u.email}</option>
                  ))}
              </Select>
              {showAssign?.region?.id && users.filter((u) => u.regionId === showAssign.region.id).length === 0 && (
                <p className="text-xs text-[#E8532E]">No staff assigned to this region</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Quantity *</label>
              <Input name="quantity" type="number" min="1" max={showAssign.quantityOnHand} required />
              <p className="text-xs text-gray-400 mt-1">Max: {showAssign.quantityOnHand}</p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowAssign(null)}>Cancel</Button>
              <Button type="submit" disabled={assigning} loading={assigning}>Assign</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Return Consumable Modal */}
      <Modal open={!!showReturn} onClose={() => setShowReturn(null)} title={`Return: ${showReturn?.consumable.name}`}>
        {showReturn && (
          <form action={async (fd) => {
            setReturning(true);
            try {
              await returnConsumable(fd);
              addToast("Supply returned successfully", "success");
              setShowReturn(null);
            } catch (e) {
              addToast(e instanceof Error ? e.message : "Failed to return supply", "error");
            } finally {
              setReturning(false);
            }
          }} className="space-y-4">
            <input type="hidden" name="assignmentId" value={showReturn.assignment.id} />
            <p className="text-sm text-gray-600">
              Assigned to <strong>{showReturn.assignment.user.name || showReturn.assignment.user.email}</strong>
              {" \u2014 "}{showReturn.assignment.quantity} {showReturn.consumable.unitType}
            </p>
            <div>
              <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Quantity Returning *</label>
              <Input name="returnQuantity" type="number" min="1" max={showReturn.assignment.quantity} defaultValue={showReturn.assignment.quantity} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Return Condition *</label>
              <Select name="returnCondition" required>
                <option value="">Select condition</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
                <option value="Damaged">Damaged</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Notes</label>
              <textarea name="returnNotes" className="w-full rounded-xl border border-shark-200 dark:border-shark-700 bg-white dark:bg-shark-800 px-3.5 py-2 text-sm text-shark-900 dark:text-shark-100 focus:border-action-400 focus:outline-none focus:ring-2 focus:ring-action-400/20 transition-colors" rows={3} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowReturn(null)}>Cancel</Button>
              <Button type="submit" disabled={returning} loading={returning}>Confirm Return</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Image Preview Modal */}
      <Modal open={!!showImage} onClose={() => setShowImage(null)} title={showImage?.name || "Supply Photo"}>
        {showImage && showImage.imageUrl && (
          <div className="text-center space-y-4">
            <img src={showImage.imageUrl} alt={showImage.name} className="mx-auto max-w-full max-h-[60vh] rounded-xl object-contain" />
            <div>
              <p className="font-bold text-shark-900 dark:text-shark-100">{showImage.name}</p>
              <p className="text-sm text-shark-400">{showImage.category} &middot; {showImage.unitType}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Consumable Modal */}
      <Modal open={!!editConsumable} onClose={() => { setEditConsumable(null); setEditImagePreview(null); setEditImageFile(null); setEditImageRemoved(false); }} title={`Edit: ${editConsumable?.name}`}>
        {editConsumable && (
          <form
            id="edit-consumable-form"
            className="space-y-4"
          >
            <input type="hidden" name="consumableId" value={editConsumable.id} />

            {/* Photo */}
            <div>
              <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Photo</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-lg border border-shark-200 dark:border-shark-700 overflow-hidden bg-shark-50 dark:bg-shark-800 flex items-center justify-center">
                  {(editImagePreview || (!editImageRemoved && editConsumable.imageUrl)) ? (
                    <img src={editImagePreview || editConsumable.imageUrl!} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Icon name="package" className="w-8 h-8 text-shark-300" />
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="cursor-pointer text-sm text-action-600 hover:text-action-700 font-medium">
                    {(!editImageRemoved && editConsumable.imageUrl) || editImagePreview ? "Change Photo" : "Upload Photo"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            addToast("Image must be under 5MB", "error");
                            return;
                          }
                          setEditImageFile(file);
                          setEditImagePreview(URL.createObjectURL(file));
                          setEditImageRemoved(false);
                        }
                      }}
                    />
                  </label>
                  {((!editImageRemoved && editConsumable.imageUrl) || editImagePreview) && (
                    <button type="button" onClick={() => { setEditImagePreview(null); setEditImageFile(null); setEditImageRemoved(true); }} className="text-sm text-red-500 hover:text-red-600 text-left">
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Name *</label>
              <Input name="name" required defaultValue={editConsumable.name} />
            </div>
            <div>
              <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Category *</label>
              <Select name="category" required defaultValue={editConsumable.category}>
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Unit Type *</label>
              <Input name="unitType" required defaultValue={editConsumable.unitType} />
            </div>
            <div>
              <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Region *</label>
              <Select name="regionId" required defaultValue={editConsumable.region.id}>
                <option value="">Select region</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.state.name} / {r.name}
                  </option>
                ))}
              </Select>
            </div>
            {/* Current Stock — Super Admin or users with stock adjust permission */}
            {(isSuperAdmin || canAdjustStock) && (
              <div>
                <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Current Stock</label>
                <Input name="quantityOnHand" type="number" min="0" defaultValue={editConsumable.quantityOnHand} />
                <p className="text-xs text-shark-400 mt-1">Directly set the stock quantity</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Minimum Threshold</label>
                <Input name="minimumThreshold" type="number" defaultValue={editConsumable.minimumThreshold} />
              </div>
              <div>
                <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Reorder Level</label>
                <Input name="reorderLevel" type="number" defaultValue={editConsumable.reorderLevel} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Supplier</label>
                <Input name="supplier" defaultValue={editConsumable.supplier || ""} />
              </div>
              <div>
                <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Unit Cost (AUD)</label>
                <Input name="unitCost" type="number" step="0.01" defaultValue={editConsumable.unitCost ?? ""} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Shop / Order Link</label>
              <div className="flex gap-2 items-center">
                <Input name="shopUrl" type="url" placeholder="https://shop.example.com/product/..." defaultValue={editConsumable.shopUrl || ""} className="flex-1" />
                {editConsumable.shopUrl && (
                  <a href={editConsumable.shopUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 inline-flex items-center gap-1 text-xs text-action-600 hover:text-action-700 bg-action-50 hover:bg-action-100 px-2.5 py-1.5 rounded-lg transition-colors" onClick={(e) => e.stopPropagation()}>
                    <Icon name="arrow-right" size={12} />
                    Open
                  </a>
                )}
              </div>
              <p className="text-[11px] text-shark-400 mt-1">Direct link to the product page for quick reordering</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Notes</label>
              <textarea name="notes" defaultValue={editConsumable.notes || ""} className="w-full rounded-xl border border-shark-200 dark:border-shark-700 bg-white dark:bg-shark-800 px-3.5 py-2 text-sm text-shark-900 dark:text-shark-100 focus:border-action-400 focus:outline-none focus:ring-2 focus:ring-action-400/20 transition-colors" rows={2} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => { setEditConsumable(null); setEditImagePreview(null); setEditImageFile(null); setEditImageRemoved(false); }}>Cancel</Button>
              <Button type="button" disabled={editSaving} loading={editSaving} onClick={async () => {
                const form = document.getElementById("edit-consumable-form") as HTMLFormElement;
                if (!form) return;
                setEditSaving(true);
                try {
                  const fd = new FormData(form);
                  if (editImageFile) {
                    try {
                      const compressed = await compressImage(editImageFile);
                      fd.set("imageUrl", compressed);
                    } catch {
                      addToast("Failed to process image", "error");
                      setEditSaving(false);
                      return;
                    }
                  } else if (editImageRemoved) {
                    fd.set("imageUrl", "");
                  }
                  await updateConsumable(fd);
                  addToast("Supply updated successfully", "success");
                  setEditConsumable(null);
                  setEditImagePreview(null);
                  setEditImageFile(null);
                  setEditImageRemoved(false);
                } catch (e) {
                  addToast(e instanceof Error ? e.message : "Failed to update supply", "error");
                } finally {
                  setEditSaving(false);
                }
              }}>Save Changes</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Staff Items On Hand Modal */}
      <Modal open={!!staffModalUserId} onClose={() => setStaffModalUserId(null)} title={(() => {
        if (!staffModalUserId) return "Staff Items";
        const allAssignments = consumables.flatMap((c) => (c.assignments || []).map((a) => ({ ...a, consumable: c })));
        const staffUser = allAssignments.find((a) => a.user.id === staffModalUserId)?.user;
        return staffUser ? `${staffUser.name || staffUser.email} — Items On Hand` : "Staff Items";
      })()}>
        {staffModalUserId && (() => {
          const allAssignments = consumables.flatMap((c) => (c.assignments || []).map((a) => ({ ...a, consumable: c })));
          const staffAssignments = allAssignments.filter((a) => a.user.id === staffModalUserId);
          const totalItems = staffAssignments.reduce((s, a) => s + a.quantity, 0);

          return (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-action-50 text-action-600">
                  <Icon name="user" size={20} />
                </div>
                <div>
                  <p className="text-sm font-medium text-shark-800 dark:text-shark-200">{staffAssignments[0]?.user.name || staffAssignments[0]?.user.email}</p>
                  <p className="text-xs text-shark-400">{staffAssignments.length} item{staffAssignments.length !== 1 ? "s" : ""} · {totalItems} total qty</p>
                </div>
              </div>

              {/* Items list */}
              {staffAssignments.length > 0 ? (
                <div className="border border-shark-100 dark:border-shark-800 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-shark-50 dark:bg-shark-800/60 dark:bg-shark-800/40 border-b border-shark-100 dark:border-shark-700">
                        <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-shark-400 uppercase tracking-wider">Item</th>
                        <th scope="col" className="px-3 py-2 text-right text-xs font-semibold text-shark-400 uppercase tracking-wider">Qty</th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-shark-400 uppercase tracking-wider">Assigned</th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-shark-400 uppercase tracking-wider">Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffAssignments.map((a) => (
                        <tr key={a.id} className="border-b border-shark-50 dark:border-shark-800 last:border-0 hover:bg-shark-50 dark:bg-shark-800 dark:hover:bg-shark-800/50">
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              {a.consumable.imageUrl ? (
                                <div className="w-7 h-7 rounded overflow-hidden border border-shark-100 dark:border-shark-800 shrink-0">
                                  <img src={a.consumable.imageUrl} alt={a.consumable.name} className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <div className="w-7 h-7 rounded bg-shark-50 dark:bg-shark-800 border border-shark-100 dark:border-shark-700 flex items-center justify-center shrink-0">
                                  <Icon name="droplet" size={14} className="text-shark-300" />
                                </div>
                              )}
                              <div>
                                <span className="font-medium text-shark-800 dark:text-shark-200">{a.consumable.name}</span>
                                <span className="text-shark-400 text-xs ml-1">({a.consumable.unitType})</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-shark-800 dark:text-shark-200">{a.quantity}</td>
                          <td className="px-3 py-2 text-xs text-shark-500 dark:text-shark-400">{formatDate(a.assignedDate)}</td>
                          <td className="px-3 py-2 text-xs text-shark-500 dark:text-shark-400">{a.consumable.region.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-shark-400 text-center py-6">No items currently assigned.</p>
              )}
            </div>
          );
        })()}
      </Modal>
    </>
  );
}
