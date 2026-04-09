"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import dynamic from "next/dynamic";
import { createAsset, bulkCreateAssets, updateAsset, assignAsset, returnAsset, bulkDeleteAssets, changeAssetStatus } from "@/app/actions/assets";
import { createCategory, updateCategory, deleteCategory, addEquipmentItem, removeEquipmentItem, reorderCategories, reorderItems } from "@/app/actions/categories";
import { useRouter } from "next/navigation";

// Lazy-load QR scanner (~100KB html5-qrcode) — only needed when modal opens
const QRScanner = dynamic(
  () => import("@/components/ui/qr-scanner").then((m) => m.QRScanner),
  { ssr: false, loading: () => <div className="flex items-center justify-center py-12"><div className="animate-pulse text-sm text-shark-400">Loading scanner...</div></div> }
);

// Color palette auto-assigned by category index
const SECTION_COLORS = [
  { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  { color: "text-action-600", bg: "bg-action-50", border: "border-action-200" },
  { color: "text-[#E8532E]", bg: "bg-amber-50", border: "border-amber-200" },
  { color: "text-cyan-600", bg: "bg-cyan-50", border: "border-cyan-200" },
  { color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
  { color: "text-shark-600", bg: "bg-shark-50", border: "border-shark-200" },
  { color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-200" },
  { color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
  { color: "text-lime-600", bg: "bg-lime-50", border: "border-lime-200" },
  { color: "text-gray-600", bg: "bg-gray-100", border: "border-gray-200" },
  { color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200" },
  { color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200" },
  { color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-200" },
  { color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" },
  { color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-200" },
];

interface CategoryDef {
  id: string;
  name: string;
  type: string;
  sortOrder: number;
  equipment: string[];
}

interface Asset {
  id: string;
  assetCode: string;
  name: string;
  category: string;
  description: string | null;
  serialNumber: string | null;
  imageUrl: string | null;
  qrCodeData: string | null;
  status: string;
  isHighValue: boolean;
  purchaseDate: string | null;
  purchaseCost: number | null;
  warrantyExpiry: string | null;
  supplier: string | null;
  notes: string | null;
  region: { id: string; name: string; state: { name: string } };
  assignments: Array<{
    id: string;
    assignmentType: string;
    checkoutDate: string;
    expectedReturnDate: string | null;
    isActive: boolean;
    user: { id: string; name: string | null; email: string };
  }>;
  createdAt: string;
}

const REGION_COLORS = [
  { color: "text-blue-600", bg: "bg-blue-50" },
  { color: "text-action-600", bg: "bg-action-50" },
  { color: "text-[#E8532E]", bg: "bg-amber-50" },
  { color: "text-cyan-600", bg: "bg-cyan-50" },
  { color: "text-red-600", bg: "bg-red-50" },
  { color: "text-shark-600", bg: "bg-shark-50" },
  { color: "text-pink-600", bg: "bg-pink-50" },
  { color: "text-orange-600", bg: "bg-orange-50" },
  { color: "text-lime-600", bg: "bg-lime-50" },
  { color: "text-teal-600", bg: "bg-teal-50" },
];

// Badge colors for each status
const STATUS_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  AVAILABLE: { label: "Available", bg: "bg-green-100", text: "text-green-700" },
  ASSIGNED: { label: "Assigned", bg: "bg-blue-100", text: "text-blue-700" },
  CHECKED_OUT: { label: "Pending", bg: "bg-amber-100", text: "text-amber-700" },
  PENDING_RETURN: { label: "Pending Return", bg: "bg-amber-100", text: "text-amber-700" },
  DAMAGED: { label: "Damaged", bg: "bg-red-100", text: "text-red-700" },
  LOST: { label: "Lost", bg: "bg-shark-100", text: "text-shark-700" },
  UNAVAILABLE: { label: "Unavailable", bg: "bg-shark-100", text: "text-shark-500" },
};

// Status transitions available per status
const STATUS_ACTIONS: Record<string, { value: string; label: string }[]> = {
  AVAILABLE: [
    { value: "_assign", label: "Assign" },
    { value: "UNAVAILABLE", label: "Mark Unavailable" },
    { value: "DAMAGED", label: "Mark Damaged" },
    { value: "LOST", label: "Mark Lost" },
  ],
  ASSIGNED: [
    { value: "_return", label: "Return" },
    { value: "DAMAGED", label: "Mark Damaged" },
    { value: "LOST", label: "Mark Lost" },
  ],
  CHECKED_OUT: [
    { value: "_return", label: "Return" },
    { value: "DAMAGED", label: "Mark Damaged" },
    { value: "LOST", label: "Mark Lost" },
  ],
  PENDING_RETURN: [
    { value: "AVAILABLE", label: "Confirm Return" },
    { value: "DAMAGED", label: "Mark Damaged" },
    { value: "LOST", label: "Mark Lost" },
  ],
  DAMAGED: [
    { value: "AVAILABLE", label: "Restore Available" },
    { value: "UNAVAILABLE", label: "Mark Unavailable" },
  ],
  LOST: [
    { value: "AVAILABLE", label: "Found — Restore" },
  ],
  UNAVAILABLE: [
    { value: "AVAILABLE", label: "Make Available" },
    { value: "DAMAGED", label: "Mark Damaged" },
    { value: "LOST", label: "Mark Lost" },
  ],
};

// Universal status dropdown — renders menu via portal so it's never clipped by overflow
function StatusDropdown({ asset, canAssign, canEdit, activeAssignment, onStatusChange, onAssign, onReturn }: {
  asset: { id: string; status: string };
  canAssign: boolean;
  canEdit: boolean;
  activeAssignment: { id: string } | null;
  onStatusChange: (assetId: string, newStatus: string) => void;
  onAssign: () => void;
  onReturn: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const hasActions = canAssign || canEdit;

  const updatePos = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: Math.max(8, rect.right - 160) });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePos();
    const handleClick = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return;
      if (menuRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const handleScroll = () => setOpen(false);
    document.addEventListener("mousedown", handleClick);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open, updatePos]);

  const badge = STATUS_BADGE[asset.status] || { label: asset.status, bg: "bg-shark-100", text: "text-shark-600" };
  const actions = STATUS_ACTIONS[asset.status] || [];

  const menuContent = open && typeof document !== "undefined" ? createPortal(
    <div
      ref={menuRef}
      style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 9999 }}
      className="bg-white rounded-xl shadow-lg border border-shark-100 py-1 min-w-[160px]"
      onClick={(e) => e.stopPropagation()}
    >
      {actions.map((action) => {
        if (action.value === "_assign") {
          if (!canAssign || asset.status !== "AVAILABLE") return null;
          return (
            <button key={action.value} onClick={() => { onAssign(); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-2">
              <Icon name="user" size={12} /> {action.label}
            </button>
          );
        }
        if (action.value === "_return") {
          if (!canAssign || !activeAssignment) return null;
          return (
            <button key={action.value} onClick={() => { onReturn(); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs font-medium text-action-600 hover:bg-action-50 transition-colors flex items-center gap-2">
              <Icon name="arrow-left" size={12} /> {action.label}
            </button>
          );
        }
        if (!canAssign && !canEdit) return null;
        const isDestructive = action.value === "DAMAGED" || action.value === "LOST";
        return (
          <button key={action.value} onClick={() => { onStatusChange(asset.id, action.value); setOpen(false); }}
            className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors flex items-center gap-2 ${isDestructive ? "text-red-600 hover:bg-red-50" : "text-green-600 hover:bg-green-50"}`}>
            <Icon name={isDestructive ? "alert-triangle" : "check"} size={12} /> {action.label}
          </button>
        );
      })}
    </div>,
    document.body
  ) : null;

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <button
        ref={btnRef}
        onClick={() => hasActions && setOpen(!open)}
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text} ${hasActions ? "hover:opacity-80 cursor-pointer" : ""} transition-colors`}
      >
        {badge.label}
        {hasActions && <Icon name="chevron-down" size={10} className={`transition-transform ${open ? "rotate-180" : ""}`} />}
      </button>
      {menuContent}
    </div>
  );
}

interface AssetsClientProps {
  assets: Asset[];
  regions: Array<{ id: string; name: string; state: { name: string } }>;
  users: Array<{ id: string; name: string | null; email: string; regionId: string | null }>;
  categories: CategoryDef[];
  isSuperAdmin: boolean;
  permissions: { canAdd: boolean; canEdit: boolean; canDelete: boolean; canAssign: boolean };
  initialStatus?: string;
  initialRegion?: string;
  initialCategory?: string;
}

export function AssetsClient({ assets, regions, users, categories, isSuperAdmin, permissions, initialStatus, initialRegion, initialCategory }: AssetsClientProps) {
  const { addToast } = useToast();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus || "ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [showAssign, setShowAssign] = useState<Asset | null>(null);
  const [showReturn, setShowReturn] = useState<{ assignmentId: string; asset: Asset } | null>(null);
  const [assigningAsset, setAssigningAsset] = useState(false);
  const [returningAsset, setReturningAsset] = useState(false);
  const [showQR, setShowQR] = useState<Asset | null>(null);
  const [showImage, setShowImage] = useState<Asset | null>(null);
  const [editAsset, setEditAsset] = useState<Asset | null>(null);

  // Quick status change for PENDING_RETURN assets
  const handleQuickStatusChange = async (assetId: string, newStatus: string) => {
    try {
      await changeAssetStatus(assetId, newStatus);
      addToast(`Asset status changed to ${newStatus.replace(/_/g, " ").toLowerCase()}`, "success");
      router.refresh();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to update status", "error");
    }
  };

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
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);
  const [newEquipmentName, setNewEquipmentName] = useState("");
  const [equipmentError, setEquipmentError] = useState("");

  // Image upload state for create modal
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [suggestingCategory, setSuggestingCategory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image upload state for edit modal
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImageRemoved, setEditImageRemoved] = useState(false);
  const [editUploading, setEditUploading] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const [regionFilter, setRegionFilter] = useState(initialRegion || "ALL");
  const [categoryFilter, setCategoryFilter] = useState(initialCategory || "ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // Column visibility state — persisted to localStorage
  const ASSET_COLS_KEY = "trackio-asset-columns";
  type AssetCols = { photo: boolean; code: boolean; name: boolean; location: boolean; status: boolean; assignedTo: boolean };
  const defaultAssetCols: AssetCols = { photo: true, code: true, name: true, location: true, status: true, assignedTo: true };
  const [visibleColumns, setVisibleColumns] = useState<AssetCols>(() => {
    if (typeof window === "undefined") return defaultAssetCols;
    try {
      const saved = localStorage.getItem(ASSET_COLS_KEY);
      if (saved) return { ...defaultAssetCols, ...JSON.parse(saved) };
    } catch {}
    return defaultAssetCols;
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
      try { localStorage.setItem(ASSET_COLS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

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
  const handleItemDragEnd = async (sectionAssets: Asset[]) => {
    if (dragItemId && dragOverItemId && dragItemId !== dragOverItemId) {
      const items = [...sectionAssets];
      const fromIdx = items.findIndex((a) => a.id === dragItemId);
      const toIdx = items.findIndex((a) => a.id === dragOverItemId);
      if (fromIdx >= 0 && toIdx >= 0) {
        const [moved] = items.splice(fromIdx, 1);
        items.splice(toIdx, 0, moved);
        try {
          await reorderItems(items.map((a) => a.id), "ASSET");
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
  const setStatusFilterAndClear = (v: string) => { setStatusFilter(v); setSelectedIds(new Set()); };
  const setRegionFilterAndClear = (v: string) => { setRegionFilter(v); setSelectedIds(new Set()); };

  // Filter assets
  const filtered = assets.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      a.assetCode.toLowerCase().includes(q) ||
      (a.serialNumber || "").toLowerCase().includes(q) ||
      a.status.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      a.region.name.toLowerCase().includes(q)
    );
  });

  // Group filtered assets by category (using dynamic categories)
  const groupedAssets = categories.map((cat, idx) => {
    const colors = SECTION_COLORS[idx % SECTION_COLORS.length];
    return {
      name: cat.name,
      ...colors,
      assets: filtered.filter((a) => a.category === cat.name),
    };
  });

  // Only AVAILABLE (unassigned) assets can be deleted
  const deletableIds = new Set(
    assets.filter((a) => a.status === "AVAILABLE" && a.assignments.length === 0).map((a) => a.id)
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (sectionAssets: Asset[]) => {
    const deletable = sectionAssets.filter((a) => deletableIds.has(a.id));
    const allSelected = deletable.every((a) => selectedIds.has(a.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        deletable.forEach((a) => next.delete(a.id));
      } else {
        deletable.forEach((a) => next.add(a.id));
      }
      return next;
    });
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      // Only delete items that are currently visible (matching filters)
      const filteredIds = new Set(filtered.map((a) => a.id));
      const idsToDelete = Array.from(selectedIds).filter((id) => filteredIds.has(id));
      const result = await bulkDeleteAssets(idsToDelete);
      if (result.errors.length > 0) {
        addToast(`Deleted ${result.deleted} asset(s). Some errors occurred.`, "warning");
      } else {
        addToast(`Deleted ${result.deleted} asset(s) successfully`, "success");
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
      fd.set("type", "ASSET");
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

  const handleAddEquipment = async (catId: string) => {
    if (!newEquipmentName.trim()) return;
    setEquipmentError("");
    try {
      const fd = new FormData();
      fd.set("categoryId", catId);
      fd.set("name", newEquipmentName.trim());
      await addEquipmentItem(fd);
      setNewEquipmentName("");
    } catch (err) {
      setEquipmentError(err instanceof Error ? err.message : "Failed to add equipment");
    }
  };

  const handleRemoveEquipment = async (catId: string, name: string) => {
    setEquipmentError("");
    try {
      const fd = new FormData();
      fd.set("categoryId", catId);
      fd.set("name", name);
      await removeEquipmentItem(fd);
    } catch (err) {
      setEquipmentError(err instanceof Error ? err.message : "Failed to remove equipment");
    }
  };

  // Resize & compress image client-side to keep base64 under Vercel's body limit
  const compressImage = (file: File, maxDim = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) { height = Math.round(height * maxDim / width); width = maxDim; }
            else { width = Math.round(width * maxDim / height); height = maxDim; }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleEditImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      addToast("File too large. Max 10MB.", "error");
      return;
    }
    try {
      const compressed = await compressImage(file);
      setEditImageFile(file);
      setEditImageRemoved(false);
      setEditImagePreview(compressed);
    } catch {
      addToast("Failed to process image. Try a different file.", "error");
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      addToast("File too large. Max 10MB.", "error");
      return;
    }
    try {
      const compressed = await compressImage(file);
      setImageFile(file);
      setImagePreview(compressed);
    } catch {
      addToast("Failed to process image. Try a different file.", "error");
    }
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
            content: `Suggest the best category for a new ASSET named "${name}". Available categories: ${categories.map(c => c.name).join(", ")}. Reply with ONLY the category name, nothing else.`,
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
      // Use the already-compressed base64 preview directly (no separate upload needed)
      if (imagePreview) {
        fd.set("imageUrl", imagePreview);
      }
      const quantity = parseInt(fd.get("quantity") as string) || 1;
      if (quantity > 1) {
        await bulkCreateAssets(fd);
      } else {
        await createAsset(fd);
      }
      setShowCreate(false);
      setImagePreview(null);
      setImageFile(null);
    } finally {
      setUploading(false);
    }
  };

  const renderAssetTable = (sectionAssets: Asset[], sectionName: string) => {
    const deletableInSection = sectionAssets.filter((a) => deletableIds.has(a.id));
    const allSelected = deletableInSection.length > 0 && deletableInSection.every((a) => selectedIds.has(a.id));
    const someSelected = deletableInSection.some((a) => selectedIds.has(a.id));

    return (
      <>
        {/* Mobile: card layout */}
        <div className="sm:hidden space-y-2">
          {sectionAssets.length === 0 ? (
            <p className="text-center text-shark-400 py-6 text-sm">No assets in this section.</p>
          ) : (
            sectionAssets.map((asset) => {
              const activeAssignment = asset.assignments[0];
              return (
                <div
                  key={asset.id}
                  onClick={() => permissions.canEdit && setEditAsset(asset)}
                  className="border border-shark-100 rounded-xl p-4 bg-white hover:shadow-sm transition-shadow cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    {asset.imageUrl ? (
                      <div className="w-11 h-11 rounded-lg overflow-hidden border border-shark-100 shrink-0">
                        <img src={asset.imageUrl} alt={asset.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-lg bg-shark-50 border border-shark-100 flex items-center justify-center shrink-0">
                        <Icon name="package" size={18} className="text-shark-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-shark-800 truncate">{asset.name}</p>
                          <button onClick={(e) => { e.stopPropagation(); setShowQR(asset); }} className="text-xs text-action-500 hover:text-action-600 transition-colors flex items-center gap-1">
                            <Icon name="qr-code" size={12} /> QR
                          </button>
                        </div>
                        <StatusDropdown
                          asset={asset}
                          canAssign={permissions.canAssign}
                          canEdit={permissions.canEdit}
                          activeAssignment={activeAssignment}
                          onStatusChange={handleQuickStatusChange}
                          onAssign={() => setShowAssign(asset)}
                          onReturn={() => activeAssignment && setShowReturn({ assignmentId: activeAssignment.id, asset })}
                        />
                      </div>
                      {activeAssignment && (
                        <p className="text-xs text-shark-500 mt-1">Assigned: {activeAssignment.user.name || activeAssignment.user.email}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop: table layout */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-shark-100">
                {permissions.canEdit && <th className="px-1 py-3 w-6"></th>}
                <th className="px-3 py-3 text-left w-10">
                  {deletableInSection.length > 0 && (
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                      onChange={() => toggleSelectAll(sectionAssets)}
                      className="rounded border-shark-300 text-action-500 focus:ring-action-400"
                    />
                  )}
                </th>
                {visibleColumns.photo && <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-shark-400 w-12">Photo</th>}
                {visibleColumns.code && <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-shark-400">QR</th>}
                {visibleColumns.name && <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-shark-400">Name</th>}
                {visibleColumns.location && <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-shark-400 hidden lg:table-cell">Location</th>}
                {visibleColumns.status && <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-shark-400">Status</th>}
                {visibleColumns.assignedTo && <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-shark-400 hidden md:table-cell">Assigned To</th>}
              </tr>
            </thead>
            <tbody>
              {sectionAssets.map((asset) => {
                const activeAssignment = asset.assignments[0];
                const canDelete = deletableIds.has(asset.id);
                return (
                  <tr
                    key={asset.id}
                    onClick={() => permissions.canEdit && setEditAsset(asset)}
                    draggable={permissions.canEdit}
                    onDragStart={() => handleItemDragStart(asset.id)}
                    onDragOver={(e) => handleItemDragOver(e, asset.id)}
                    onDragEnd={() => handleItemDragEnd(sectionAssets)}
                    className={`border-b border-shark-50 hover:bg-shark-50/50 ${permissions.canEdit ? "cursor-pointer" : ""} ${selectedIds.has(asset.id) ? "bg-action-50/30" : ""} ${dragItemId === asset.id ? "opacity-40" : ""} ${dragOverItemId === asset.id ? "border-t-2 border-t-action-500" : ""}`}
                  >
                    {permissions.canEdit && (
                      <td className="px-1 py-2 cursor-grab active:cursor-grabbing" onClick={(e) => e.stopPropagation()}>
                        <svg className="w-4 h-4 text-shark-300" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>
                      </td>
                    )}
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      {canDelete ? (
                        <input type="checkbox" checked={selectedIds.has(asset.id)} onChange={() => toggleSelect(asset.id)} className="rounded border-shark-300 text-action-500 focus:ring-action-400" />
                      ) : ( <div className="w-4" /> )}
                    </td>
                    {visibleColumns.photo && (
                    <td className="px-3 py-2">
                      {asset.imageUrl ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-shark-100"><img src={asset.imageUrl} alt={asset.name} className="w-full h-full object-cover" /></div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-shark-50 border border-shark-100 flex items-center justify-center"><Icon name="package" size={18} className="text-shark-300" /></div>
                      )}
                    </td>
                    )}
                    {visibleColumns.code && <td className="px-4 py-3">
                      <button onClick={(e) => { e.stopPropagation(); setShowQR(asset); }} className="text-xs text-action-500 hover:text-action-600 transition-colors flex items-center gap-1" title={asset.assetCode}>
                        <Icon name="qr-code" size={14} /> QR
                      </button>
                    </td>}
                    {visibleColumns.name && (
                    <td className="px-4 py-3 max-w-[200px]">
                      <div className="truncate">
                        <span className="font-medium text-shark-800">{asset.name}</span>
                        {asset.isHighValue && <span className="ml-1 text-gold-500 text-xs" title="High value">&#9733;</span>}
                      </div>
                    </td>
                    )}
                    {visibleColumns.location && <td className="px-4 py-3 text-shark-500 hidden lg:table-cell">{asset.region.name}</td>}
                    {visibleColumns.status && <td className="px-4 py-3">
                      <StatusDropdown
                        asset={asset}
                        canAssign={permissions.canAssign}
                        canEdit={permissions.canEdit}
                        activeAssignment={activeAssignment}
                        onStatusChange={handleQuickStatusChange}
                        onAssign={() => setShowAssign(asset)}
                        onReturn={() => activeAssignment && setShowReturn({ assignmentId: activeAssignment.id, asset })}
                      />
                    </td>}
                    {visibleColumns.assignedTo && (
                    <td className="px-4 py-3 text-shark-500 hidden md:table-cell">{activeAssignment ? activeAssignment.user.name || activeAssignment.user.email : "\u2014"}</td>
                    )}
                  </tr>
                );
              })}
              {sectionAssets.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-6 text-center text-shark-400 text-sm">No assets in this section.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-shark-900 tracking-tight">Assets</h1>
          <p className="text-sm text-shark-400 mt-1">{assets.length} total assets</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowScanner(true)}>
            <Icon name="search" size={14} className="mr-1.5" />
            Scan QR
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowManageSections(true)}>
            <Icon name="settings" size={14} className="mr-1.5" />
            Sections
          </Button>
          {permissions.canAdd && <Button onClick={() => setShowCreate(true)}>+ New Asset</Button>}
        </div>
      </div>

      {/* Filters + Delete Selected */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Input
          placeholder="Search assets..."
          value={search}
          onChange={(e) => setSearchAndClear(e.target.value)}
          className="flex-1 sm:max-w-md"
        />
        {isSuperAdmin && regions.length > 1 && (
          <Select
            value={regionFilter}
            onChange={(e) => setRegionFilterAndClear(e.target.value)}
            className="sm:max-w-[200px]"
          >
            <option value="ALL">All regions</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </Select>
        )}
        <Button size="sm" variant="outline" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}>
          <Icon name="search" size={14} className="mr-1" />
          Filters
          {(categoryFilter !== "ALL" || dateFrom || dateTo) && <span className="ml-1 w-2 h-2 bg-action-500 rounded-full" />}
        </Button>
        <div className="relative" ref={columnMenuRef}>
          <Button size="sm" variant="outline" onClick={() => setShowColumnMenu(!showColumnMenu)}>
            Columns
          </Button>
          {showColumnMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-shark-200 rounded-lg shadow-lg z-50 py-2 min-w-[160px]">
              {([
                ["photo", "Photo"],
                ["code", "Code"],
                ["name", "Name"],
                ["location", "Location"],
                ["status", "Status"],
                ["assignedTo", "Assigned To"],
              ] as [keyof typeof visibleColumns, string][]).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 px-3 py-1.5 hover:bg-shark-50 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={visibleColumns[key]}
                    onChange={() => toggleColumn(key)}
                    className="rounded border-shark-300 text-action-500 focus:ring-action-400"
                  />
                  {label}
                </label>
              ))}
            </div>
          )}
        </div>
        {permissions.canDelete && selectedIds.size > 0 && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowBulkDelete(true)}
          >
            Delete Selected ({selectedIds.size})
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="bg-white rounded-xl border border-shark-100 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-shark-500 mb-1">Category</label>
              <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="text-sm">
                <option value="ALL">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-shark-500 mb-1">Date From</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="text-sm" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-shark-500 mb-1">Date To</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="text-sm" />
            </div>
            <div className="flex items-end">
              <Button size="sm" variant="outline" onClick={() => { setCategoryFilter("ALL"); setDateFrom(""); setDateTo(""); }}>
                Clear
              </Button>
            </div>
          </div>
          <p className="text-xs text-shark-400 mt-2">{filtered.length} assets matching filters</p>
        </div>
      )}

      {/* Grouped Sections */}
      {isSuperAdmin ? (
        // Super Admin: group by region first, then category within each region
        regions.map((region, rIdx) => {
          const regionAssets = filtered.filter((a) => a.region.id === region.id);
          if (regionAssets.length === 0 && search) return null;
          const rc = REGION_COLORS[rIdx % REGION_COLORS.length];
          const regionCollapsed = collapsedRegions.has(region.id);
          return (
            <div key={region.id} className="space-y-4">
              {/* Region Header */}
              <button
                onClick={() => toggleRegion(region.id)}
                className="flex items-center gap-3 px-1 pt-2 w-full text-left group"
              >
                <div className={`w-9 h-9 rounded-xl ${rc.bg} flex items-center justify-center`}>
                  <Icon name="map-pin" size={18} className={rc.color} />
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <h2 className="text-xl font-bold text-shark-900">{region.name}</h2>
                  <span className="text-sm text-shark-400">{region.state.name}</span>
                  <span className="text-xs font-medium text-shark-400 bg-shark-100 px-2 py-0.5 rounded-full">
                    {regionAssets.length}
                  </span>
                </div>
                <Icon
                  name="chevron-down"
                  size={18}
                  className={`text-shark-400 group-hover:text-shark-600 transition-transform ${regionCollapsed ? "-rotate-90" : ""}`}
                />
              </button>

              {!regionCollapsed && (
                <>
                  {/* Category sections within this region */}
                  {categories.map((cat, idx) => {
                    const colors = SECTION_COLORS[idx % SECTION_COLORS.length];
                    const catAssets = regionAssets.filter((a) => a.category === cat.name);
                    if (catAssets.length === 0) return null;
                    const catKey = `${region.id}-${cat.name}`;
                    const catCollapsed = collapsedCategories.has(catKey);
                    return (
                      <div key={cat.name} className="space-y-2 ml-4">
                        <button
                          onClick={() => toggleCategory(catKey)}
                          className="flex items-center gap-3 px-1 w-full text-left group"
                        >
                          <div className={`w-7 h-7 rounded-lg ${colors.bg} flex items-center justify-center`}>
                            <Icon name="package" size={14} className={colors.color} />
                          </div>
                          <div className="flex items-center gap-2 flex-1">
                            <h3 className="text-base font-semibold text-shark-900">{cat.name}</h3>
                            <span className="text-xs font-medium text-shark-400 bg-shark-100 px-2 py-0.5 rounded-full">
                              {catAssets.length}
                            </span>
                          </div>
                          <Icon
                            name="chevron-down"
                            size={16}
                            className={`text-shark-400 group-hover:text-shark-600 transition-transform ${catCollapsed ? "-rotate-90" : ""}`}
                          />
                        </button>
                        {!catCollapsed && (
                          <Card>
                            {renderAssetTable(catAssets, cat.name)}
                          </Card>
                        )}
                      </div>
                    );
                  })}

                  {regionAssets.length === 0 && (
                    <p className="text-sm text-shark-400 ml-4 px-1">No assets in this region.</p>
                  )}
                </>
              )}
            </div>
          );
        })
      ) : (
        // Branch Manager: group by category only (single region)
        groupedAssets.map((section, sIdx) => {
          const catCollapsed = collapsedCategories.has(section.name);
          return (
            <div
              key={section.name}
              className={`space-y-2 ${dragSectionIdx === sIdx ? "opacity-40" : ""} ${dragOverSectionIdx === sIdx ? "border-t-2 border-t-action-500 pt-1" : ""}`}
              draggable={permissions.canEdit}
              onDragStart={() => handleSectionDragStart(sIdx)}
              onDragOver={(e) => handleSectionDragOver(e, sIdx)}
              onDragEnd={handleSectionDragEnd}
            >
              <div className="flex items-center gap-1">
                {permissions.canEdit && (
                  <div className="cursor-grab active:cursor-grabbing p-1">
                    <svg className="w-5 h-5 text-shark-300" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>
                  </div>
                )}
                <button
                  onClick={() => toggleCategory(section.name)}
                  className="flex items-center gap-3 px-1 w-full text-left group"
                >
                  <div className={`w-8 h-8 rounded-lg ${section.bg} flex items-center justify-center`}>
                    <Icon name="package" size={16} className={section.color} />
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <h2 className="text-lg font-semibold text-shark-900">{section.name}</h2>
                    <span className="text-xs font-medium text-shark-400 bg-shark-100 px-2 py-0.5 rounded-full">
                      {section.assets.length}
                    </span>
                  </div>
                  <Icon
                    name="chevron-down"
                    size={16}
                    className={`text-shark-400 group-hover:text-shark-600 transition-transform ${catCollapsed ? "-rotate-90" : ""}`}
                  />
                </button>
              </div>
              {!catCollapsed && (
                <Card>
                  {renderAssetTable(section.assets, section.name)}
                </Card>
              )}
            </div>
          );
        })
      )}

      {/* Bulk Delete Confirmation Modal */}
      <Modal open={showBulkDelete} onClose={() => setShowBulkDelete(false)} title="Delete Selected Assets">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-800 font-medium">
              Are you sure you want to delete {selectedIds.size} asset{selectedIds.size > 1 ? "s" : ""}?
            </p>
            <p className="text-sm text-red-600 mt-1">This action cannot be undone.</p>
          </div>
          <div className="bg-shark-50 rounded-xl p-4 max-h-40 overflow-y-auto">
            {assets.filter((a) => selectedIds.has(a.id)).map((a) => (
                <div key={a.id} className="flex items-center gap-2 py-1">
                  <span className="font-medium text-shark-800 text-sm">{a.name}</span>
                  <span className="text-xs text-shark-400 font-mono">{a.assetCode}</span>
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
              {bulkDeleting ? "Deleting..." : `Delete ${selectedIds.size} Asset${selectedIds.size > 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Manage Sections Modal */}
      <Modal open={showManageSections} onClose={() => { setShowManageSections(false); setAddingSectionError(""); setNewSectionName(""); setEditingSectionId(null); }} title="Manage Asset Sections">
        <div className="space-y-4">
          <p className="text-sm text-shark-500">Add, rename, or remove sections for organising assets.</p>

          {/* Existing sections — draggable to reorder */}
          <div className="space-y-1">
            {categories.map((cat, idx) => {
              const colors = SECTION_COLORS[idx % SECTION_COLORS.length];
              const assetCount = assets.filter((a) => a.category === cat.name).length;
              const isEditing = editingSectionId === cat.id;
              return (
                <div
                  key={cat.id}
                  draggable={!isEditing}
                  onDragStart={() => handleSectionDragStart(idx)}
                  onDragOver={(e) => handleSectionDragOver(e, idx)}
                  onDragEnd={handleSectionDragEnd}
                  className={`${dragSectionIdx === idx ? "opacity-40" : ""} ${dragOverSectionIdx === idx ? "border-t-2 border-t-action-500" : ""}`}
                >
                  <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-shark-50">
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
                          className="text-shark-400 hover:text-shark-600 p-1"
                        >
                          <Icon name="x" size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 flex-1">
                          <div className="cursor-grab active:cursor-grabbing p-0.5">
                            <svg className="w-4 h-4 text-shark-300" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>
                          </div>
                          <div className={`w-6 h-6 rounded ${colors.bg} flex items-center justify-center`}>
                            <Icon name="package" size={12} className={colors.color} />
                          </div>
                          <span className="text-sm font-medium text-shark-800">{cat.name}</span>
                          <span className="text-xs text-shark-400">{assetCount} item{assetCount !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setEditingSectionId(cat.id); setEditingSectionName(cat.name); setAddingSectionError(""); }}
                            className="text-shark-400 hover:text-action-500 transition-colors p-1"
                            title="Rename section"
                          >
                            <Icon name="edit" size={14} />
                          </button>
                          {assetCount === 0 && (
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
                </div>
              );
            })}
          </div>

          {/* Add new section */}
          <div className="border-t border-shark-100 pt-4">
            <label className="block text-sm font-medium text-shark-700 mb-1">Add New Section</label>
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

      {/* Create Asset Modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setImagePreview(null); setImageFile(null); }} title="Create New Asset">
        <form action={handleCreateSubmit} className="space-y-4">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-shark-700 mb-1">Photo</label>
            <div className="flex items-start gap-4">
              {imagePreview ? (
                <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-shark-200">
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
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic"
                onChange={handleImageSelect}
                className="hidden"
              />
              <p className="text-xs text-shark-400 mt-1">JPEG, PNG, WebP or HEIC. Max 5MB.</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 mb-1">Name *</label>
            <Input name="name" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 mb-1">System *</label>
            <div className="flex gap-2">
              <Select name="category" required className="flex-1">
                <option value="">Select system</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </Select>
              <Button type="button" variant="ghost" size="sm" onClick={handleSuggestCategory} disabled={suggestingCategory} title="AI suggest category">
                {suggestingCategory ? "..." : "AI"}
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 mb-1">Region *</label>
            <Select name="regionId" required>
              <option value="">Select region</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.state.name} / {r.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 mb-1">Serial Number</label>
            <Input name="serialNumber" />
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 mb-1">Description</label>
            <textarea name="description" className="w-full rounded-xl border border-shark-200 px-3.5 py-2 text-sm text-shark-900 focus:border-action-400 focus:outline-none focus:ring-2 focus:ring-action-400/20 transition-colors" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-shark-700 mb-1">Purchase Date</label>
              <Input name="purchaseDate" type="date" />
            </div>
            <div>
              <label className="block text-sm font-medium text-shark-700 mb-1">Cost (AUD)</label>
              <Input name="purchaseCost" type="number" step="0.01" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 mb-1">Supplier</label>
            <Input name="supplier" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="isHighValue" value="true" id="isHighValue" className="rounded" />
            <label htmlFor="isHighValue" className="text-sm text-gray-700">High-value asset</label>
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 mb-1">Quantity</label>
            <div className="flex items-center gap-2">
              <Input name="quantity" type="number" min={1} max={50} defaultValue={1} className="w-24" />
              <span className="text-xs text-shark-400">Add multiple identical assets (max 50). Names will be numbered automatically.</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 mb-1">Notes</label>
            <textarea name="notes" className="w-full rounded-xl border border-shark-200 px-3.5 py-2 text-sm text-shark-900 focus:border-action-400 focus:outline-none focus:ring-2 focus:ring-action-400/20 transition-colors" rows={2} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setShowCreate(false); setImagePreview(null); setImageFile(null); }}>Cancel</Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? "Creating..." : "Create Asset"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Assign Asset Modal */}
      <Modal open={!!showAssign} onClose={() => setShowAssign(null)} title={`Assign: ${showAssign?.name}`}>
        {showAssign && (
          <form
            action={async (fd) => {
              setAssigningAsset(true);
              try {
                await assignAsset(fd);
                addToast("Asset assigned successfully", "success");
                setShowAssign(null);
              } catch (e) {
                addToast(e instanceof Error ? e.message : "Failed to assign asset", "error");
              } finally {
                setAssigningAsset(false);
              }
            }}
            className="space-y-4"
          >
            <input type="hidden" name="assetId" value={showAssign.id} />
            <div>
              <label className="block text-sm font-medium text-shark-700 mb-1">Assign to *</label>
              <Select name="userId" required>
                <option value="">Select staff member</option>
                {users
                  .filter((u) => !showAssign?.region?.id || u.regionId === showAssign.region.id)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.email}
                    </option>
                  ))}
              </Select>
              {showAssign?.region?.id && users.filter((u) => u.regionId === showAssign.region.id).length === 0 && (
                <p className="text-xs text-[#E8532E]">No staff assigned to this region</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-shark-700 mb-1">Assignment Type *</label>
              <Select name="assignmentType" required>
                <option value="TEMPORARY">Temporary (Check-out)</option>
                <option value="PERMANENT">Permanent</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-shark-700 mb-1">Expected Return Date</label>
              <Input name="expectedReturnDate" type="date" />
              <p className="text-xs text-gray-400 mt-1">Leave blank for permanent assignments</p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowAssign(null)}>Cancel</Button>
              <Button type="submit" disabled={assigningAsset} loading={assigningAsset}>Assign Asset</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Return Asset Modal */}
      <Modal open={!!showReturn} onClose={() => setShowReturn(null)} title={`Return: ${showReturn?.asset.name}`}>
        {showReturn && (
          <form
            action={async (fd) => {
              setReturningAsset(true);
              try {
                await returnAsset(fd);
                addToast("Asset returned successfully", "success");
                setShowReturn(null);
              } catch (e) {
                addToast(e instanceof Error ? e.message : "Failed to return asset", "error");
              } finally {
                setReturningAsset(false);
              }
            }}
            className="space-y-4"
          >
            <input type="hidden" name="assignmentId" value={showReturn.assignmentId} />
            <div>
              <label className="block text-sm font-medium text-shark-700 mb-1">Return Condition *</label>
              <Select name="returnCondition" required>
                <option value="">Select condition</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
                <option value="Damaged">Damaged</option>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" name="isDamaged" value="true" id="isDamaged" className="rounded" />
              <label htmlFor="isDamaged" className="text-sm text-gray-700">Mark as damaged (makes asset unavailable)</label>
            </div>
            <div>
              <label className="block text-sm font-medium text-shark-700 mb-1">Notes</label>
              <textarea name="returnNotes" className="w-full rounded-xl border border-shark-200 px-3.5 py-2 text-sm text-shark-900 focus:border-action-400 focus:outline-none focus:ring-2 focus:ring-action-400/20 transition-colors" rows={3} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowReturn(null)}>Cancel</Button>
              <Button type="submit" disabled={returningAsset} loading={returningAsset}>Confirm Return</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* QR Code Modal */}
      <Modal open={!!showQR} onClose={() => setShowQR(null)} title={`QR: ${showQR?.assetCode}`}>
        {showQR && showQR.qrCodeData && (
          <div className="text-center space-y-4">
            <img src={showQR.qrCodeData} alt={`QR code for ${showQR.assetCode}`} className="mx-auto w-48 h-48" />
            <div>
              <p className="font-bold text-shark-900">{showQR.name}</p>
              <p className="text-sm text-shark-400 font-mono">{showQR.assetCode}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                const link = document.createElement("a");
                link.download = `qr-${showQR.assetCode}.png`;
                link.href = showQR.qrCodeData!;
                link.click();
              }}
            >
              Download QR Label
            </Button>
          </div>
        )}
      </Modal>

      {/* Image Preview Modal */}
      <Modal open={!!showImage} onClose={() => setShowImage(null)} title={showImage?.name || "Asset Photo"}>
        {showImage && showImage.imageUrl && (
          <div className="text-center space-y-4">
            <img
              src={showImage.imageUrl}
              alt={showImage.name}
              className="mx-auto max-w-full max-h-[60vh] rounded-xl object-contain"
            />
            <div>
              <p className="font-bold text-shark-900">{showImage.name}</p>
              <p className="text-sm text-shark-400 font-mono">{showImage.assetCode}</p>
              <p className="text-xs text-shark-400 mt-1">{showImage.category}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Asset Modal */}
      <Modal open={!!editAsset} onClose={() => { setEditAsset(null); setEditImagePreview(null); setEditImageFile(null); setEditImageRemoved(false); }} title={`Edit: ${editAsset?.name}`}>
        {editAsset && (
          <form
            action={async (fd) => {
              setEditUploading(true);
              try {
                // Use the already-compressed base64 preview directly
                if (editImagePreview) {
                  fd.set("imageUrl", editImagePreview);
                } else if (editImageRemoved) {
                  fd.set("imageUrl", "");
                }
                await updateAsset(fd);
                setEditAsset(null);
                setEditImagePreview(null);
                setEditImageFile(null);
                setEditImageRemoved(false);
              } finally {
                setEditUploading(false);
              }
            }}
            className="space-y-4"
          >
            <input type="hidden" name="assetId" value={editAsset.id} />

            {/* Image Upload/Edit */}
            <div>
              <label className="block text-sm font-medium text-shark-700 mb-1">Photo</label>
              <div className="flex items-start gap-4">
                {(editImagePreview || (!editImageRemoved && editAsset.imageUrl)) ? (
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-shark-200">
                    <img src={editImagePreview || editAsset.imageUrl!} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setEditImagePreview(null); setEditImageFile(null); setEditImageRemoved(true); if (editFileInputRef.current) editFileInputRef.current.value = ""; }}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center text-white text-xs hover:bg-black/70"
                    >
                      x
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    className="w-24 h-24 rounded-xl border-2 border-dashed border-shark-200 hover:border-action-300 flex flex-col items-center justify-center text-shark-400 hover:text-action-500 transition-colors"
                  >
                    <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                    </svg>
                    <span className="text-xs">Add Photo</span>
                  </button>
                )}
                <div>
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic"
                    onChange={handleEditImageSelect}
                    className="hidden"
                  />
                  {(editImagePreview || (!editImageRemoved && editAsset.imageUrl)) && (
                    <button
                      type="button"
                      onClick={() => editFileInputRef.current?.click()}
                      className="text-xs text-action-500 hover:text-action-600 font-medium"
                    >
                      Change photo
                    </button>
                  )}
                  <p className="text-xs text-shark-400 mt-1">JPEG, PNG, WebP or HEIC. Max 5MB.</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-shark-700 mb-1">Name *</label>
              <Input name="name" required defaultValue={editAsset.name} />
            </div>
            <div>
              <label className="block text-sm font-medium text-shark-700 mb-1">System *</label>
              <Select name="category" required defaultValue={editAsset.category}>
                <option value="">Select system</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-shark-700 mb-1">Region *</label>
              <Select name="regionId" required defaultValue={editAsset.region.id}>
                <option value="">Select region</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.state.name} / {r.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-shark-700 mb-1">Status *</label>
              <Select name="status" required defaultValue={editAsset.status}>
                <option value="AVAILABLE">Available</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="CHECKED_OUT">Checked Out</option>
                <option value="PENDING_RETURN">Pending Return</option>
                <option value="DAMAGED">Damaged</option>
                <option value="LOST">Lost</option>
                <option value="UNAVAILABLE">Unavailable</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-shark-700 mb-1">Serial Number</label>
              <Input name="serialNumber" defaultValue={editAsset.serialNumber || ""} />
            </div>
            <div>
              <label className="block text-sm font-medium text-shark-700 mb-1">Description</label>
              <textarea name="description" defaultValue={editAsset.description || ""} className="w-full rounded-xl border border-shark-200 px-3.5 py-2 text-sm text-shark-900 focus:border-action-400 focus:outline-none focus:ring-2 focus:ring-action-400/20 transition-colors" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-shark-700 mb-1">Purchase Date</label>
                <Input name="purchaseDate" type="date" defaultValue={editAsset.purchaseDate ? editAsset.purchaseDate.substring(0, 10) : ""} />
              </div>
              <div>
                <label className="block text-sm font-medium text-shark-700 mb-1">Cost (AUD)</label>
                <Input name="purchaseCost" type="number" step="0.01" defaultValue={editAsset.purchaseCost ?? ""} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-shark-700 mb-1">Warranty Expiry</label>
              <Input name="warrantyExpiry" type="date" defaultValue={editAsset.warrantyExpiry ? editAsset.warrantyExpiry.substring(0, 10) : ""} />
            </div>
            <div>
              <label className="block text-sm font-medium text-shark-700 mb-1">Supplier</label>
              <Input name="supplier" defaultValue={editAsset.supplier || ""} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" name="isHighValue" value="true" id="editIsHighValue" className="rounded" defaultChecked={editAsset.isHighValue} />
              <label htmlFor="editIsHighValue" className="text-sm text-gray-700">High-value asset</label>
            </div>
            <div>
              <label className="block text-sm font-medium text-shark-700 mb-1">Notes</label>
              <textarea name="notes" defaultValue={editAsset.notes || ""} className="w-full rounded-xl border border-shark-200 px-3.5 py-2 text-sm text-shark-900 focus:border-action-400 focus:outline-none focus:ring-2 focus:ring-action-400/20 transition-colors" rows={2} />
            </div>

            {/* Equipment Checklist for this category */}
            {(() => {
              const cat = categories.find((c) => c.name === editAsset.category);
              const equipmentList = cat?.equipment || [];
              if (!cat) return null;
              return (
                <div className="border-t border-shark-100 pt-3">
                  <p className="text-sm font-medium text-shark-700 mb-2">Equipment Checklist</p>
                  {equipmentList.length === 0 ? (
                    <p className="text-xs text-shark-400">No equipment defined for this section.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {equipmentList.map((item) => (
                        <span key={item} className="inline-flex items-center gap-1 text-xs font-medium text-shark-700 bg-shark-50 border border-shark-200 rounded-full px-2.5 py-1">
                          {item}
                          {isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => handleRemoveEquipment(cat.id, item)}
                              className="text-shark-400 hover:text-red-500 transition-colors"
                              title="Remove equipment"
                            >
                              <Icon name="x" size={10} />
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                  {isSuperAdmin && (
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={newEquipmentName}
                        onChange={(e) => setNewEquipmentName(e.target.value)}
                        placeholder="Add equipment..."
                        className="flex-1 text-xs"
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddEquipment(cat.id); } }}
                      />
                      <Button type="button" size="sm" onClick={() => handleAddEquipment(cat.id)} disabled={!newEquipmentName.trim()}>
                        Add
                      </Button>
                    </div>
                  )}
                  {equipmentError && (
                    <p className="text-xs text-red-500 mt-1">{equipmentError}</p>
                  )}
                </div>
              );
            })()}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => { setEditAsset(null); setEditImagePreview(null); setEditImageFile(null); setEditImageRemoved(false); }}>Cancel</Button>
              <Button type="submit" disabled={editUploading} loading={editUploading}>Save Changes</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* QR Scanner Modal */}
      <QRScanner
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={(result) => {
          // Extract asset code from URL or use raw text
          const match = result.match(/\/assets\/([A-Z0-9-]+)/i);
          const code = match ? match[1] : result;
          // Find asset by code
          const found = assets.find((a) => a.assetCode.toLowerCase() === code.toLowerCase());
          if (found) {
            setEditAsset(found);
          } else {
            setSearchAndClear(code);
          }
          setShowScanner(false);
        }}
      />
    </div>
  );
}
