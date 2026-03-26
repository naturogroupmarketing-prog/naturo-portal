"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { toggleCategoryInspection, updateCategoryInspectionPhotos } from "@/app/actions/condition-checks";

interface Check {
  id: string;
  userId: string;
  itemType: string;
  condition: string;
  photoUrl: string;
  notes: string | null;
  monthYear: string;
  createdAt: string;
  user: { id: string; name: string | null; email: string; regionId: string | null };
  asset: { id: string; name: string; assetCode: string; category: string; imageUrl: string | null } | null;
  consumable: { id: string; name: string; category: string; imageUrl: string | null } | null;
}

interface StaffStatus {
  id: string;
  name: string | null;
  email: string;
  totalItems: number;
  checkedItems: number;
}

interface Region {
  id: string;
  name: string;
  state: { name: string };
}

interface InspectionCategory {
  id: string;
  name: string;
  type: string;
  requiresInspection: boolean;
  inspectionPhotos: string[];
}

interface Props {
  checks: Check[];
  staffStatus: StaffStatus[];
  monthYear: string;
  regions: Region[];
  isSuperAdmin: boolean;
  inspectionConfig?: InspectionCategory[];
}

const CONDITION_COLORS: Record<string, string> = {
  GOOD: "bg-emerald-100 text-emerald-700",
  FAIR: "bg-blue-100 text-blue-700",
  POOR: "bg-amber-100 text-amber-700",
  DAMAGED: "bg-red-100 text-red-700",
};

export function ConditionChecksClient({ checks, staffStatus, monthYear, regions, isSuperAdmin, inspectionConfig = [] }: Props) {
  const router = useRouter();
  const { addToast } = useToast();
  const [search, setSearch] = useState("");
  const [expandedStaff, setExpandedStaff] = useState<Set<string>>(new Set());
  const [photoModal, setPhotoModal] = useState<Check | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "complete" | "incomplete">("all");
  const [showConfig, setShowConfig] = useState(false);
  const [newPhotoLabel, setNewPhotoLabel] = useState<Record<string, string>>({});
  const [savingConfig, setSavingConfig] = useState<Set<string>>(new Set());
  // Local optimistic state for toggles so UI updates instantly
  const [localToggles, setLocalToggles] = useState<Record<string, boolean>>({});

  const monthLabel = useMemo(() => {
    const [y, m] = monthYear.split("-");
    return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString("en-AU", { month: "long", year: "numeric" });
  }, [monthYear]);

  const toggleStaff = (id: string) => {
    setExpandedStaff((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Group checks by user
  const checksByUser = useMemo(() => {
    const map = new Map<string, Check[]>();
    for (const c of checks) {
      if (!map.has(c.userId)) map.set(c.userId, []);
      map.get(c.userId)!.push(c);
    }
    return map;
  }, [checks]);

  // Filter staff
  const filteredStaff = useMemo(() => {
    let result = staffStatus;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((s) =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        s.email.toLowerCase().includes(q)
      );
    }
    if (statusFilter === "complete") {
      result = result.filter((s) => s.checkedItems >= s.totalItems);
    } else if (statusFilter === "incomplete") {
      result = result.filter((s) => s.checkedItems < s.totalItems);
    }
    return result;
  }, [staffStatus, search, statusFilter]);

  const totalChecked = staffStatus.filter((s) => s.checkedItems >= s.totalItems).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-shark-900">Condition Checks</h1>
          <p className="text-sm text-shark-400 mt-1">{monthLabel} &middot; {totalChecked}/{staffStatus.length} staff completed</p>
        </div>
        {isSuperAdmin && (
          <Button variant="outline" size="sm" onClick={() => setShowConfig(!showConfig)}>
            <Icon name="settings" size={14} className="mr-1.5" />
            Configure
          </Button>
        )}
      </div>

      {/* Configuration Panel — Super Admin Only */}
      {isSuperAdmin && showConfig && (
        <Card>
          <div className="px-5 py-4 border-b border-shark-100">
            <h3 className="text-sm font-semibold text-shark-900">Inspection Configuration</h3>
            <p className="text-xs text-shark-400 mt-0.5">Choose which categories require monthly photos and define what photos staff need to submit.</p>
          </div>
          <div className="divide-y divide-shark-50">
            {inspectionConfig.map((cat) => {
              const isSaving = savingConfig.has(cat.id);
              return (
                <div key={cat.id} className="px-5 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={localToggles[cat.id] ?? cat.requiresInspection}
                          onChange={async () => {
                            const newVal = !(localToggles[cat.id] ?? cat.requiresInspection);
                            setLocalToggles((prev) => ({ ...prev, [cat.id]: newVal }));
                            setSavingConfig((prev) => new Set(prev).add(cat.id));
                            try {
                              await toggleCategoryInspection(cat.id, newVal);
                              router.refresh();
                              addToast(`${cat.name} inspection ${newVal ? "enabled" : "disabled"}`, "success");
                            } catch {
                              setLocalToggles((prev) => ({ ...prev, [cat.id]: !newVal }));
                              addToast("Failed to update", "error");
                            }
                            setSavingConfig((prev) => { const n = new Set(prev); n.delete(cat.id); return n; });
                          }}
                          disabled={isSaving}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-shark-200 peer-focus:ring-2 peer-focus:ring-action-400/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-action-500" />
                      </label>
                      <div>
                        <span className="text-sm font-medium text-shark-800">{cat.name}</span>
                        <span className="text-xs text-shark-400 ml-2">({cat.type === "ASSET" ? "Assets" : "Consumables"})</span>
                        {isSaving && <span className="text-xs text-action-500 ml-2 animate-pulse">Saving...</span>}
                      </div>
                    </div>
                    {(localToggles[cat.id] ?? cat.requiresInspection) && (
                      <span className="text-xs text-shark-400">
                        {cat.inspectionPhotos.length > 0 ? `${cat.inspectionPhotos.length} photo types` : "1 photo (default)"}
                      </span>
                    )}
                  </div>

                  {/* Photo labels for this category */}
                  {(localToggles[cat.id] ?? cat.requiresInspection) && (
                    <div className="mt-2.5 ml-12 space-y-1.5">
                      {cat.inspectionPhotos.map((label, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-xs text-shark-600 bg-shark-50 px-2.5 py-1 rounded-lg flex-1">{label}</span>
                          <button
                            onClick={async () => {
                              const updated = cat.inspectionPhotos.filter((_, i) => i !== idx);
                              setSavingConfig((prev) => new Set(prev).add(cat.id));
                              try {
                                await updateCategoryInspectionPhotos(cat.id, updated);
                                router.refresh();
                              } catch { addToast("Failed to update", "error"); }
                              setSavingConfig((prev) => { const n = new Set(prev); n.delete(cat.id); return n; });
                            }}
                            className="text-shark-300 hover:text-red-500 p-0.5"
                          >
                            <Icon name="x" size={12} />
                          </button>
                        </div>
                      ))}
                      <div className="flex items-center gap-2">
                        <Input
                          value={newPhotoLabel[cat.id] || ""}
                          onChange={(e) => setNewPhotoLabel((prev) => ({ ...prev, [cat.id]: e.target.value }))}
                          placeholder="e.g. Front View, Interior..."
                          className="text-xs flex-1"
                          onKeyDown={async (e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const label = newPhotoLabel[cat.id]?.trim();
                              if (!label) return;
                              setSavingConfig((prev) => new Set(prev).add(cat.id));
                              try {
                                await updateCategoryInspectionPhotos(cat.id, [...cat.inspectionPhotos, label]);
                                setNewPhotoLabel((prev) => ({ ...prev, [cat.id]: "" }));
                                router.refresh();
                              } catch { addToast("Failed to add", "error"); }
                              setSavingConfig((prev) => { const n = new Set(prev); n.delete(cat.id); return n; });
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!newPhotoLabel[cat.id]?.trim() || isSaving}
                          onClick={async () => {
                            const label = newPhotoLabel[cat.id]?.trim();
                            if (!label) return;
                            setSavingConfig((prev) => new Set(prev).add(cat.id));
                            try {
                              await updateCategoryInspectionPhotos(cat.id, [...cat.inspectionPhotos, label]);
                              setNewPhotoLabel((prev) => ({ ...prev, [cat.id]: "" }));
                              router.refresh();
                              addToast(`Added "${label}" photo type`, "success");
                            } catch { addToast("Failed to add", "error"); }
                            setSavingConfig((prev) => { const n = new Set(prev); n.delete(cat.id); return n; });
                          }}
                          className="text-xs"
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Staff with Items", value: staffStatus.length, icon: "users" as const, color: "text-action-500", bg: "bg-action-50", border: "border-action-400" },
          { label: "Completed", value: totalChecked, icon: "check" as const, color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-400" },
          { label: "Incomplete", value: staffStatus.length - totalChecked, icon: "clock" as const, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-400" },
          { label: "Photos Submitted", value: checks.length, icon: "search" as const, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-400" },
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Input
          placeholder="Search staff..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="sm:max-w-[180px]">
          <option value="all">All staff</option>
          <option value="complete">Completed</option>
          <option value="incomplete">Incomplete</option>
        </Select>
      </div>

      {/* Staff List */}
      {filteredStaff.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <Icon name="users" size={40} className="text-shark-200 mx-auto mb-3" />
            <p className="text-shark-400">No staff match your filters.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredStaff.map((staff) => {
            const isExpanded = expandedStaff.has(staff.id);
            const isComplete = staff.checkedItems >= staff.totalItems;
            const userChecks = checksByUser.get(staff.id) || [];
            const pct = staff.totalItems > 0 ? Math.round((staff.checkedItems / staff.totalItems) * 100) : 0;

            return (
              <Card key={staff.id}>
                {/* Staff Header */}
                <button
                  onClick={() => toggleStaff(staff.id)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                      isComplete ? "bg-emerald-100 text-emerald-600" : "bg-shark-100 text-shark-500"
                    }`}>
                      {isComplete ? <Icon name="check" size={16} /> : `${pct}%`}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-shark-800">{staff.name || staff.email}</p>
                      {staff.name && <p className="text-xs text-shark-400">{staff.email}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      isComplete ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {staff.checkedItems}/{staff.totalItems} items
                    </span>
                    {/* Progress bar */}
                    <div className="w-20 h-1.5 bg-shark-100 rounded-full hidden sm:block overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isComplete ? "bg-emerald-400" : "bg-amber-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <Icon
                      name="chevron-down"
                      size={16}
                      className={`text-shark-400 group-hover:text-shark-600 transition-transform ${isExpanded ? "" : "-rotate-90"}`}
                    />
                  </div>
                </button>

                {/* Expanded checks */}
                {isExpanded && userChecks.length > 0 && (
                  <div className="border-t border-shark-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
                      {userChecks.map((check) => {
                        const itemName = check.asset?.name || check.consumable?.name || "Unknown";
                        const itemCode = check.asset?.assetCode || null;

                        return (
                          <div
                            key={check.id}
                            className="border border-shark-100 rounded-xl overflow-hidden hover:shadow-sm transition-shadow cursor-pointer"
                            onClick={() => setPhotoModal(check)}
                          >
                            {/* Photo */}
                            <div className="aspect-[4/3] bg-shark-50 relative">
                              <img
                                src={check.photoUrl}
                                alt={itemName}
                                className="w-full h-full object-cover"
                              />
                              <span className={`absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded-full ${CONDITION_COLORS[check.condition] || "bg-shark-100 text-shark-600"}`}>
                                {check.condition}
                              </span>
                            </div>
                            {/* Info */}
                            <div className="px-3 py-2.5">
                              <p className="text-sm font-medium text-shark-800 truncate">{itemName}</p>
                              {itemCode && <p className="text-xs font-mono text-shark-400">{itemCode}</p>}
                              {check.notes && <p className="text-xs text-shark-400 mt-1 truncate">{check.notes}</p>}
                              <p className="text-xs text-shark-300 mt-1">
                                {new Date(check.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {isExpanded && userChecks.length === 0 && (
                  <div className="border-t border-shark-100 px-5 py-4">
                    <p className="text-sm text-shark-400">No condition checks submitted yet this month.</p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Photo Lightbox Modal */}
      <Modal open={!!photoModal} onClose={() => setPhotoModal(null)} title={photoModal?.asset?.name || photoModal?.consumable?.name || "Condition Check"}>
        {photoModal && (
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden bg-shark-50">
              <img
                src={photoModal.photoUrl}
                alt="Condition check"
                className="w-full max-h-[60vh] object-contain mx-auto"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-shark-800">
                  {photoModal.asset?.name || photoModal.consumable?.name}
                </p>
                {photoModal.asset?.assetCode && (
                  <p className="text-xs font-mono text-shark-400">{photoModal.asset.assetCode}</p>
                )}
              </div>
              <span className={`text-xs font-medium px-3 py-1 rounded-full ${CONDITION_COLORS[photoModal.condition] || "bg-shark-100 text-shark-600"}`}>
                {photoModal.condition}
              </span>
            </div>
            {photoModal.notes && (
              <p className="text-sm text-shark-600 bg-shark-50 px-3 py-2 rounded-lg">{photoModal.notes}</p>
            )}
            <div className="flex items-center gap-2 text-xs text-shark-400">
              <Icon name="user" size={12} />
              <span>{photoModal.user.name || photoModal.user.email}</span>
              <span>&middot;</span>
              <span>{new Date(photoModal.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
