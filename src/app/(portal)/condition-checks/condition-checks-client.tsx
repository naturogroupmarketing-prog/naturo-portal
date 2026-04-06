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
import { toggleCategoryInspection, updateCategoryInspectionPhotos, createInspectionSchedule, deleteInspectionSchedule } from "@/app/actions/condition-checks";

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

interface Schedule {
  id: string;
  title: string;
  dueDate: string;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  createdBy: { name: string | null; email: string };
}

interface Props {
  checks: Check[];
  staffStatus: StaffStatus[];
  monthYear: string;
  regions: Region[];
  isSuperAdmin: boolean;
  inspectionConfig?: InspectionCategory[];
  schedules?: Schedule[];
}

const CONDITION_COLORS: Record<string, string> = {
  GOOD: "bg-action-100 text-action-700",
  FAIR: "bg-blue-100 text-blue-700",
  POOR: "bg-amber-100 text-[#E8532E]",
  DAMAGED: "bg-red-100 text-red-700",
};

export function ConditionChecksClient({ checks, staffStatus, monthYear, regions, isSuperAdmin, inspectionConfig = [], schedules = [] }: Props) {
  const router = useRouter();
  const { addToast } = useToast();
  const [search, setSearch] = useState("");
  const [expandedStaff, setExpandedStaff] = useState<Set<string>>(new Set());
  const [photoModal, setPhotoModal] = useState<Check | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "complete" | "incomplete">("all");
  const [showConfig, setShowConfig] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleDueDate, setScheduleDueDate] = useState("");
  const [scheduleNotes, setScheduleNotes] = useState("");
  const [scheduleSaving, setScheduleSaving] = useState(false);

  const handleCreateSchedule = async () => {
    if (!scheduleTitle.trim() || !scheduleDueDate) { addToast("Title and due date are required", "error"); return; }
    setScheduleSaving(true);
    try {
      await createInspectionSchedule({ title: scheduleTitle.trim(), dueDate: scheduleDueDate, notes: scheduleNotes.trim() || undefined });
      addToast("Inspection scheduled — staff have been notified", "success");
      setShowScheduleModal(false);
      setScheduleTitle(""); setScheduleDueDate(""); setScheduleNotes("");
      router.refresh();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to create schedule", "error");
    }
    setScheduleSaving(false);
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      await deleteInspectionSchedule(id);
      addToast("Schedule removed", "success");
      router.refresh();
    } catch { addToast("Failed to remove", "error"); }
  };
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
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setShowScheduleModal(true)}>
              <Icon name="plus" size={14} className="mr-1.5" />
              Schedule Inspection
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowConfig(!showConfig)}>
              <Icon name="settings" size={14} className="mr-1.5" />
              Configure
            </Button>
          </div>
        )}
      </div>

      {/* Scheduled Inspections — Super Admin Only */}
      {isSuperAdmin && schedules.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-shark-700">Scheduled Inspections</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {schedules.map((s) => {
              const due = new Date(s.dueDate);
              const now = new Date();
              const isOverdue = due < now;
              const daysUntil = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              return (
                <Card key={s.id} className={isOverdue ? "border-l-4 border-l-red-500" : "border-l-4 border-l-action-500"}>
                  <div className="px-4 py-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-shark-800">{s.title}</p>
                        <p className="text-xs text-shark-400 mt-0.5">
                          Due: {due.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                          {isOverdue ? (
                            <span className="text-red-500 font-medium ml-1.5">Overdue</span>
                          ) : daysUntil <= 7 ? (
                            <span className="text-[#E8532E] font-medium ml-1.5">{daysUntil} day{daysUntil !== 1 ? "s" : ""} left</span>
                          ) : null}
                        </p>
                        {s.notes && <p className="text-xs text-shark-400 mt-1">{s.notes}</p>}
                      </div>
                      <button onClick={() => handleDeleteSchedule(s.id)} className="text-shark-300 hover:text-red-500 p-1">
                        <Icon name="x" size={14} />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

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
          { label: "Staff with Items", value: staffStatus.length, icon: "users" as const, color: "text-white", bg: "bg-action-500", border: "border-action-500" },
          { label: "Completed", value: totalChecked, icon: "check" as const, color: "text-white", bg: "bg-action-500", border: "border-action-500" },
          { label: "Incomplete", value: staffStatus.length - totalChecked, icon: "clock" as const, color: "text-white", bg: "bg-[#E8532E]", border: "border-[#E8532E]" },
          { label: "Photos Submitted", value: checks.length, icon: "search" as const, color: "text-white", bg: "bg-action-500", border: "border-action-500" },
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
                      isComplete ? "bg-action-100 text-action-600" : "bg-shark-100 text-shark-500"
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
                      isComplete ? "bg-action-100 text-action-700" : "bg-amber-100 text-[#E8532E]"
                    }`}>
                      {staff.checkedItems}/{staff.totalItems} items
                    </span>
                    {/* Progress bar */}
                    <div className="w-20 h-1.5 bg-shark-100 rounded-full hidden sm:block overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isComplete ? "bg-emerald-400" : "bg-[#E8532E]"}`}
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

      {/* Schedule Inspection Modal */}
      <Modal open={showScheduleModal} onClose={() => setShowScheduleModal(false)} title="Schedule Inspection">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-shark-700 mb-1">Title *</label>
            <Input value={scheduleTitle} onChange={(e) => setScheduleTitle(e.target.value)} placeholder="e.g. April Equipment Inspection" />
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 mb-1">Due Date *</label>
            <Input type="date" value={scheduleDueDate} onChange={(e) => setScheduleDueDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 mb-1">Notes / Instructions</label>
            <textarea
              value={scheduleNotes}
              onChange={(e) => setScheduleNotes(e.target.value)}
              placeholder="Instructions for staff (optional)"
              className="w-full rounded-xl border border-shark-200 px-3.5 py-2 text-sm text-shark-900 focus:border-action-400 focus:outline-none focus:ring-2 focus:ring-action-400/20 transition-colors"
              rows={3}
            />
          </div>
          <p className="text-xs text-shark-400">All staff with inspection-eligible items will be notified when you create this schedule.</p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowScheduleModal(false)}>Cancel</Button>
            <Button onClick={handleCreateSchedule} disabled={scheduleSaving} loading={scheduleSaving}>
              Schedule & Notify Staff
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
