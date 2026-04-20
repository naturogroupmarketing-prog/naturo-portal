"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Icon } from "@/components/ui/icon";
import { createMaintenanceSchedule, completeMaintenanceTask, deleteMaintenanceSchedule } from "@/app/actions/maintenance";

interface Schedule {
  id: string;
  assetId: string;
  title: string;
  description: string | null;
  frequency: string;
  nextDueDate: string;
  lastCompletedDate: string | null;
  isActive: boolean;
  asset: { id: string; name: string; assetCode: string; region: { name: string } };
  assignedTo: { id: string; name: string | null; email: string } | null;
  logs: { completedAt: string; notes: string | null; condition: string | null; cost: number | null }[];
}

interface Asset {
  id: string;
  name: string;
  assetCode: string;
}

interface User {
  id: string;
  name: string | null;
  email: string;
}

function getDueStatus(dueDate: string) {
  const due = new Date(dueDate);
  const now = new Date();
  const daysUntil = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntil < 0) return { label: "Overdue", color: "bg-red-100 text-red-700", urgent: true };
  if (daysUntil === 0) return { label: "Due Today", color: "bg-amber-100 text-[#E8532E]", urgent: true };
  if (daysUntil <= 7) return { label: `Due in ${daysUntil}d`, color: "bg-amber-50 text-[#E8532E]", urgent: false };
  return { label: `Due in ${daysUntil}d`, color: "bg-action-50 text-action-600", urgent: false };
}

const FREQ_LABELS: Record<string, string> = {
  ONCE: "One-time",
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  YEARLY: "Yearly",
};

export function MaintenanceClient({ schedules, assets, users }: { schedules: Schedule[]; assets: Asset[]; users: User[] }) {
  const [showCreate, setShowCreate] = useState(false);
  const [showComplete, setShowComplete] = useState<Schedule | null>(null);
  const [filter, setFilter] = useState<"all" | "overdue" | "upcoming">("all");

  const filtered = schedules.filter((s) => {
    if (!s.isActive) return false;
    if (filter === "all") return true;
    const daysUntil = Math.ceil((new Date(s.nextDueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (filter === "overdue") return daysUntil < 0;
    if (filter === "upcoming") return daysUntil >= 0 && daysUntil <= 7;
    return true;
  });

  const overdueCount = schedules.filter((s) => s.isActive && new Date(s.nextDueDate) < new Date()).length;

  return (
    <Card padding="none">
    <div className="p-4 sm:p-5 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-action-100 flex items-center justify-center shrink-0">
            <Icon name="wrench" size={14} className="text-action-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-shark-900">Maintenance</h3>
            <p className="text-xs text-shark-400">
              {schedules.filter((s) => s.isActive).length} scheduled tasks
              {overdueCount > 0 && <span className="text-red-500 font-medium"> · {overdueCount} overdue</span>}
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Icon name="plus" size={14} className="mr-1.5" />
          Schedule Maintenance
        </Button>
      </div>

      <div className="flex gap-1 bg-shark-50 dark:bg-shark-800/60 rounded-xl p-1">
        {(["all", "overdue", "upcoming"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filter === f
                ? "bg-action-500 text-white shadow-sm"
                : "text-shark-500 dark:text-shark-400 hover:bg-shark-100 dark:hover:bg-shark-800 hover:text-shark-700"
            }`}
          >
            {f === "all" ? "All" : f === "overdue" ? "Overdue" : "Due Soon"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <Icon name="settings" size={32} className="text-shark-300 mx-auto mb-3" />
            <p className="text-sm text-shark-400">No maintenance tasks found.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((schedule) => {
            const due = getDueStatus(schedule.nextDueDate);
            return (
              <Card key={schedule.id}>
                <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-shark-900">{schedule.title}</h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${due.color}`}>{due.label}</span>
                      <span className="text-xs text-shark-400 bg-shark-100 dark:bg-shark-800 px-2 py-0.5 rounded-full">{FREQ_LABELS[schedule.frequency]}</span>
                    </div>
                    <p className="text-sm text-shark-500 dark:text-shark-400 mt-1">
                      <span className="font-mono text-xs text-shark-400">{schedule.asset.assetCode}</span>{" "}
                      {schedule.asset.name} · {schedule.asset.region.name}
                    </p>
                    {schedule.assignedTo && (
                      <p className="text-xs text-shark-400 mt-0.5">
                        Assigned to: {schedule.assignedTo.name || schedule.assignedTo.email}
                      </p>
                    )}
                    {schedule.description && (
                      <p className="text-xs text-shark-400 mt-1">{schedule.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" onClick={() => setShowComplete(schedule)}>
                      <Icon name="check" size={14} className="mr-1" />
                      Complete
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        if (confirm("Delete this maintenance schedule?")) {
                          await deleteMaintenanceSchedule(schedule.id);
                        }
                      }}
                    >
                      <Icon name="x" size={14} className="text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Maintenance Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Schedule Maintenance">
        <form action={async (fd) => { await createMaintenanceSchedule(fd); setShowCreate(false); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Asset *</label>
            <Select name="assetId" required>
              <option value="">Select asset...</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>{a.assetCode} — {a.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Task Title *</label>
            <Input name="title" required placeholder="e.g. Oil change, Filter replacement" />
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Description</label>
            <textarea name="description" className="w-full rounded-xl border border-shark-200 dark:border-shark-700 bg-white dark:bg-shark-800 px-3.5 py-2 text-sm text-shark-900 dark:text-shark-100 focus:border-action-400 focus:outline-none focus:ring-2 focus:ring-action-400/20 transition-colors" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Frequency *</label>
              <Select name="frequency" required>
                <option value="ONCE">One-time</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="YEARLY">Yearly</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Next Due Date *</label>
              <Input name="nextDueDate" type="date" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Assign To</label>
            <Select name="assignedToId">
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name || u.email}</option>
              ))}
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit">Create Schedule</Button>
          </div>
        </form>
      </Modal>

      {/* Complete Maintenance Modal */}
      <Modal open={!!showComplete} onClose={() => setShowComplete(null)} title="Complete Maintenance">
        {showComplete && (
          <form action={async (fd) => { await completeMaintenanceTask(fd); setShowComplete(null); }} className="space-y-4">
            <input type="hidden" name="scheduleId" value={showComplete.id} />
            <p className="text-sm text-shark-600 dark:text-shark-400">
              Completing: <span className="font-semibold">{showComplete.title}</span> for{" "}
              <span className="font-semibold">{showComplete.asset.name}</span>
            </p>
            <div>
              <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Condition</label>
              <Select name="condition">
                <option value="">Not assessed</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="POOR">Poor</option>
                <option value="NEEDS_REPLACEMENT">Needs Replacement</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Cost</label>
              <Input name="cost" type="number" step="0.01" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Notes</label>
              <textarea name="notes" className="w-full rounded-xl border border-shark-200 dark:border-shark-700 bg-white dark:bg-shark-800 px-3.5 py-2 text-sm text-shark-900 dark:text-shark-100 focus:border-action-400 focus:outline-none focus:ring-2 focus:ring-action-400/20 transition-colors" rows={3} placeholder="What was done..." />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowComplete(null)}>Cancel</Button>
              <Button type="submit">Mark Complete</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
    </Card>
  );
}
