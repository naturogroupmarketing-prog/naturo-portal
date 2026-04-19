"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { toggleCategoryInspection, updateCategoryInspectionPhotos, createInspectionSchedule, deleteInspectionSchedule, setStaffConditionSchedule, bulkSetConditionSchedule, removeStaffConditionSchedule } from "@/app/actions/condition-checks";
import type { ConditionCheckFrequency } from "@/generated/prisma/client";

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

interface StaffSchedule {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  regionName: string;
  frequency: ConditionCheckFrequency;
  nextDueDate: string;
  lastCompletedDate: string | null;
  periodStart: string;
}

interface UnscheduledStaffMember {
  id: string;
  name: string | null;
  email: string;
  regionName: string;
}

interface Props {
  checks: Check[];
  staffStatus: StaffStatus[];
  monthYear: string;
  regions: Region[];
  isSuperAdmin: boolean;
  inspectionConfig?: InspectionCategory[];
  schedules?: Schedule[];
  staffSchedules?: StaffSchedule[];
  unscheduledStaff?: UnscheduledStaffMember[];
}

const CONDITION_COLORS: Record<string, string> = {
  GOOD: "bg-action-100 text-action-700",
  FAIR: "bg-blue-100 text-blue-700",
  POOR: "bg-amber-100 text-[#E8532E]",
  DAMAGED: "bg-red-100 text-red-700",
};

const FREQUENCY_OPTIONS: { value: ConditionCheckFrequency; label: string }[] = [
  { value: "FORTNIGHTLY", label: "Fortnightly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "3 Months" },
  { value: "BIANNUAL", label: "6 Months" },
];

export function ConditionChecksClient({ checks, staffStatus, monthYear, regions, isSuperAdmin, inspectionConfig = [], schedules = [], staffSchedules = [], unscheduledStaff = [] }: Props) {
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

  // Staff schedule state
  const [showStaffSchedules, setShowStaffSchedules] = useState(false);
  const [editingScheduleUser, setEditingScheduleUser] = useState<{ userId: string; name: string | null; email: string } | null>(null);
  const [editFrequency, setEditFrequency] = useState<ConditionCheckFrequency>("MONTHLY");
  const [editDueDate, setEditDueDate] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [bulkFrequency, setBulkFrequency] = useState<ConditionCheckFrequency>("MONTHLY");
  const [bulkDueDate, setBulkDueDate] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);

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
    <Card padding="none">
    <div className="p-4 sm:p-5 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-action-100 flex items-center justify-center shrink-0">
            <Icon name="clipboard" size={14} className="text-action-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-shark-900 dark:text-shark-100">Condition Checks</h3>
            <p className="text-xs text-shark-400">{monthLabel} · {totalChecked}/{staffStatus.length} staff completed</p>
          </div>
        </div>
        {isSuperAdmin && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" onClick={() => setShowScheduleModal(true)}>
              <Icon name="plus" size={14} className="mr-1.5" />
              Schedule Inspection
            </Button>
            <Button variant={showStaffSchedules ? "primary" : "outline"} size="sm" onClick={() => setShowStaffSchedules(!showStaffSchedules)}>
              <Icon name="clock" size={14} className="mr-1.5" />
              Staff Schedules
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
          <h3 className="text-sm font-semibold text-shark-700 dark:text-shark-300">Scheduled Inspections</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {schedules.map((s) => {
              const due = new Date(s.dueDate);
              const now = new Date();
              const isOverdue = due < now;
              const daysUntil = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              return (
                <Card key={s.id} className={isOverdue ? "" : ""}>
                  <div className="px-4 py-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-shark-800 dark:text-shark-200">{s.title}</p>
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
          <div className="px-5 py-4 border-b border-shark-100 dark:border-shark-700">
            <h3 className="text-sm font-semibold text-shark-900 dark:text-shark-100">Inspection Configuration</h3>
            <p className="text-xs text-shark-400 mt-0.5">Choose which categories require monthly photos and define what photos staff need to submit.</p>
          </div>
          <div className="divide-y divide-shark-50 dark:divide-shark-800">
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
                        <span className="text-sm font-medium text-shark-800 dark:text-shark-200">{cat.name}</span>
                        <span className="text-xs text-shark-400 ml-2">({cat.type === "ASSET" ? "Assets" : "Supplies"})</span>
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

      {/* Staff Schedules Panel — Super Admin Only */}
      {isSuperAdmin && showStaffSchedules && (
        <Card>
          <div className="px-5 py-4 border-b border-shark-100 dark:border-shark-700 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-shark-900 dark:text-shark-100">Staff Condition Check Schedules</h3>
              <p className="text-xs text-shark-400 mt-0.5">Set how often each staff member must submit condition checks.</p>
            </div>
            {!bulkMode ? (
              <Button size="sm" variant="outline" onClick={() => setBulkMode(true)}>
                <Icon name="users" size={14} className="mr-1.5" />Bulk Set
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Select value={bulkFrequency} onChange={(e) => setBulkFrequency(e.target.value as ConditionCheckFrequency)} className="text-xs w-32">
                  {FREQUENCY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Select>
                <Input type="date" value={bulkDueDate} onChange={(e) => setBulkDueDate(e.target.value)} min={new Date().toISOString().split("T")[0]} className="text-xs w-36" />
                <Button
                  size="sm"
                  disabled={bulkSelected.size === 0 || !bulkDueDate || bulkSaving}
                  loading={bulkSaving}
                  onClick={async () => {
                    setBulkSaving(true);
                    try {
                      const res = await bulkSetConditionSchedule({ userIds: [...bulkSelected], frequency: bulkFrequency, nextDueDate: bulkDueDate });
                      addToast(`Schedule set for ${res.updated} staff`, "success");
                      setBulkMode(false); setBulkSelected(new Set()); setBulkDueDate("");
                      router.refresh();
                    } catch (e) { addToast(e instanceof Error ? e.message : "Failed", "error"); }
                    setBulkSaving(false);
                  }}
                  className="text-xs"
                >
                  Apply ({bulkSelected.size})
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setBulkMode(false); setBulkSelected(new Set()); }} className="text-xs">Cancel</Button>
              </div>
            )}
          </div>

          <div className="divide-y divide-shark-50 dark:divide-shark-800 max-h-[500px] overflow-y-auto">
            {/* Staff with existing schedules */}
            {staffSchedules.map((s) => {
              const due = new Date(s.nextDueDate);
              const now = new Date();
              const daysUntil = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              const isOverdue = daysUntil < 0;
              const freqLabel = FREQUENCY_OPTIONS.find((o) => o.value === s.frequency)?.label || s.frequency;

              return (
                <div key={s.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {bulkMode && (
                      <input
                        type="checkbox"
                        checked={bulkSelected.has(s.userId)}
                        onChange={(e) => {
                          setBulkSelected((prev) => { const n = new Set(prev); e.target.checked ? n.add(s.userId) : n.delete(s.userId); return n; });
                        }}
                        className="w-4 h-4 rounded border-shark-300 text-action-500 focus:ring-action-400/20"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-shark-800 dark:text-shark-200 truncate">{s.userName || s.userEmail}</p>
                      <p className="text-xs text-shark-400">{s.regionName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-medium text-action-600 bg-action-50 px-2 py-0.5 rounded-full">{freqLabel}</span>
                    <span className={`text-xs ${isOverdue ? "text-red-600 font-medium" : daysUntil <= 7 ? "text-[#E8532E]" : "text-shark-500"}`}>
                      Due: {due.toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                      {isOverdue && " (overdue)"}
                    </span>
                    {s.lastCompletedDate && (
                      <span className="text-xs text-shark-400 hidden sm:inline">
                        Last: {new Date(s.lastCompletedDate).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                      </span>
                    )}
                    {!bulkMode && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setEditingScheduleUser({ userId: s.userId, name: s.userName, email: s.userEmail }); setEditFrequency(s.frequency); setEditDueDate(s.nextDueDate.split("T")[0]); }}
                          className="text-shark-400 hover:text-action-600 p-1"
                        >
                          <Icon name="edit" size={14} />
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await removeStaffConditionSchedule(s.userId);
                              addToast("Reverted to default monthly", "success");
                              router.refresh();
                            } catch { addToast("Failed to remove", "error"); }
                          }}
                          className="text-shark-300 hover:text-red-500 p-1"
                        >
                          <Icon name="x" size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Staff without schedules (default monthly) */}
            {unscheduledStaff.map((u) => (
              <div key={u.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {bulkMode && (
                    <input
                      type="checkbox"
                      checked={bulkSelected.has(u.id)}
                      onChange={(e) => {
                        setBulkSelected((prev) => { const n = new Set(prev); e.target.checked ? n.add(u.id) : n.delete(u.id); return n; });
                      }}
                      className="w-4 h-4 rounded border-shark-300 text-action-500 focus:ring-action-400/20"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-shark-800 dark:text-shark-200 truncate">{u.name || u.email}</p>
                    <p className="text-xs text-shark-400">{u.regionName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-shark-400 bg-shark-50 px-2 py-0.5 rounded-full">Default (Monthly)</span>
                  {!bulkMode && (
                    <button
                      onClick={() => { setEditingScheduleUser({ userId: u.id, name: u.name, email: u.email }); setEditFrequency("MONTHLY"); setEditDueDate(""); }}
                      className="text-shark-400 hover:text-action-600 p-1"
                    >
                      <Icon name="edit" size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {staffSchedules.length === 0 && unscheduledStaff.length === 0 && (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-shark-400">No staff with assigned items found.</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Edit Staff Schedule Modal */}
      <Modal open={!!editingScheduleUser} onClose={() => setEditingScheduleUser(null)} title={`Set Schedule — ${editingScheduleUser?.name || editingScheduleUser?.email || ""}`}>
        {editingScheduleUser && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Frequency</label>
              <Select value={editFrequency} onChange={(e) => setEditFrequency(e.target.value as ConditionCheckFrequency)}>
                {FREQUENCY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Next Due Date</label>
              <Input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
            </div>
            <p className="text-xs text-shark-400">After the staff member completes all checks, the next due date will automatically advance based on the frequency.</p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setEditingScheduleUser(null)}>Cancel</Button>
              <Button
                onClick={async () => {
                  if (!editDueDate) { addToast("Due date is required", "error"); return; }
                  setEditSaving(true);
                  try {
                    await setStaffConditionSchedule({ userId: editingScheduleUser.userId, frequency: editFrequency, nextDueDate: editDueDate });
                    addToast(`Schedule set for ${editingScheduleUser.name || editingScheduleUser.email}`, "success");
                    setEditingScheduleUser(null);
                    router.refresh();
                  } catch (e) { addToast(e instanceof Error ? e.message : "Failed", "error"); }
                  setEditSaving(false);
                }}
                disabled={editSaving || !editDueDate}
                loading={editSaving}
              >
                Save Schedule
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Summary Stats */}
      <p className="text-[11px] font-semibold text-shark-400 uppercase tracking-widest">Overview</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        {[
          { label: "Staff with Items", value: staffStatus.length, icon: "users" as const, iconBg: "bg-action-500", iconColor: "text-white" },
          { label: "Completed", value: totalChecked, icon: "check" as const, iconBg: "bg-action-500", iconColor: "text-white" },
          { label: "Incomplete", value: staffStatus.length - totalChecked, icon: "clock" as const, iconBg: "bg-[#E8532E]", iconColor: "text-white" },
          { label: "Photos Submitted", value: checks.length, icon: "search" as const, iconBg: "bg-action-500", iconColor: "text-white" },
        ].map((stat) => (
          <Card key={stat.label} className="hover:shadow-md transition-all duration-200">
            <CardContent className="px-3 py-3">
              <div className="flex items-center gap-2">
                <div className={`w-9 h-9 rounded-lg ${stat.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <Icon name={stat.icon} size={16} className={stat.iconColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-shark-500 truncate">{stat.label}</p>
                  <p className="text-xl font-bold text-shark-900 dark:text-shark-100">{stat.value}</p>
                </div>
                <Icon name="arrow-right" size={14} className="text-shark-400 flex-shrink-0" />
              </div>
            </CardContent>
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
                      <p className="text-sm font-semibold text-shark-800 dark:text-shark-200">{staff.name || staff.email}</p>
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
                        className={`h-full rounded-full transition-all ${isComplete ? "bg-action-400" : "bg-[#E8532E]"}`}
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
                  <div className="border-t border-shark-100 dark:border-shark-700">
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
                              <p className="text-sm font-medium text-shark-800 dark:text-shark-200 truncate">{itemName}</p>
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
                  <div className="border-t border-shark-100 dark:border-shark-700 px-5 py-4">
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
                <p className="text-sm font-medium text-shark-800 dark:text-shark-200">
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
            <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Title *</label>
            <Input value={scheduleTitle} onChange={(e) => setScheduleTitle(e.target.value)} placeholder="e.g. April Equipment Inspection" />
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Due Date *</label>
            <Input type="date" value={scheduleDueDate} onChange={(e) => setScheduleDueDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Notes / Instructions</label>
            <textarea
              value={scheduleNotes}
              onChange={(e) => setScheduleNotes(e.target.value)}
              placeholder="Instructions for staff (optional)"
              className="w-full rounded-xl border border-shark-200 dark:border-shark-700 bg-white dark:bg-shark-800 px-3.5 py-2 text-sm text-shark-900 dark:text-shark-100 focus:border-action-400 focus:outline-none focus:ring-2 focus:ring-action-400/20 transition-colors"
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
    </Card>
  );
}
