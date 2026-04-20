"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { updateWidgetVisibility, addCustomShortcut, removeCustomShortcut, reorderSections } from "@/app/actions/dashboard";
import { WIDGET_LABELS, SHORTCUT_ICON_OPTIONS, DASHBOARD_SECTIONS, type DashboardPreferences, type WidgetId } from "@/lib/dashboard-types";
import type { IconName } from "@/components/ui/icon";

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-action-500 focus:ring-offset-2 ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${checked ? "bg-action-500" : "bg-shark-200 dark:bg-shark-700"}`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white transition-transform duration-200 ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

const SECTION_LABELS: Record<string, string> = Object.fromEntries(
  DASHBOARD_SECTIONS.map((s) => [s.id, s.label])
);

interface Props {
  open: boolean;
  onClose: () => void;
  preferences: DashboardPreferences;
}

export function DashboardSettingsModal({ open, onClose, preferences }: Props) {
  const [isPending, startTransition] = useTransition();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newHref, setNewHref] = useState("");
  const [newIcon, setNewIcon] = useState<IconName>("star");

  // Section reorder state
  const [sectionOrder, setSectionOrder] = useState<string[]>(preferences.sectionOrder);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Keep sectionOrder in sync when preferences change (modal reopen)
  const prevOrderRef = useRef(preferences.sectionOrder);
  if (prevOrderRef.current !== preferences.sectionOrder) {
    prevOrderRef.current = preferences.sectionOrder;
    setSectionOrder(preferences.sectionOrder);
  }

  const handleDragStart = useCallback((idx: number) => {
    dragItem.current = idx;
    setDragIndex(idx);
  }, []);

  const handleDragEnter = useCallback((idx: number) => {
    dragOverItem.current = idx;
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragItem.current === null || dragOverItem.current === null) {
      setDragIndex(null);
      return;
    }
    const from = dragItem.current;
    const to = dragOverItem.current;
    if (from !== to) {
      const newOrder = [...sectionOrder];
      const [removed] = newOrder.splice(from, 1);
      newOrder.splice(to, 0, removed);
      setSectionOrder(newOrder);
      startTransition(async () => {
        await reorderSections(newOrder);
      });
    }
    dragItem.current = null;
    dragOverItem.current = null;
    setDragIndex(null);
  }, [sectionOrder, startTransition]);

  const moveSection = useCallback((idx: number, direction: "up" | "down") => {
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= sectionOrder.length) return;
    const newOrder = [...sectionOrder];
    [newOrder[idx], newOrder[newIdx]] = [newOrder[newIdx], newOrder[idx]];
    setSectionOrder(newOrder);
    startTransition(async () => {
      await reorderSections(newOrder);
    });
  }, [sectionOrder, startTransition]);

  const handleToggle = (widgetId: WidgetId, currentlyVisible: boolean) => {
    startTransition(async () => {
      await updateWidgetVisibility(widgetId, !currentlyVisible);
    });
  };

  const handleAddShortcut = () => {
    if (!newLabel.trim() || !newHref.trim()) return;
    startTransition(async () => {
      await addCustomShortcut(newLabel.trim(), newHref.trim(), newIcon);
      setNewLabel("");
      setNewHref("");
      setNewIcon("star");
      setShowAddForm(false);
    });
  };

  const handleRemoveShortcut = (id: string) => {
    startTransition(async () => {
      await removeCustomShortcut(id);
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Dashboard Settings">
      {/* Section Order */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-shark-400 uppercase tracking-wider">Section Order</h3>
        <p className="text-xs text-shark-400">Drag to reorder or use arrows</p>
        <div className="space-y-1">
          {sectionOrder.map((sectionId, idx) => (
            <div
              key={sectionId}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragEnter={() => handleDragEnter(idx)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={`flex items-center gap-2 py-2 px-3 rounded-lg border transition-all cursor-grab active:cursor-grabbing ${
                dragIndex === idx
                  ? "border-action-400 bg-action-50 opacity-60"
                  : "border-shark-100 dark:border-shark-700 bg-white dark:bg-shark-800 hover:border-shark-200 dark:hover:border-shark-600 hover:bg-shark-25 dark:hover:bg-shark-700"
              }`}
            >
              <Icon name="menu" size={14} className="text-shark-300 shrink-0" />
              <span className="text-sm text-shark-700 dark:text-shark-300 flex-1">{SECTION_LABELS[sectionId] || sectionId}</span>
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={() => moveSection(idx, "up")}
                  disabled={idx === 0 || isPending}
                  className="p-1 rounded text-shark-400 hover:text-shark-700 dark:text-shark-300 hover:bg-shark-100 dark:hover:bg-shark-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  title="Move up"
                >
                  <Icon name="chevron-up" size={14} />
                </button>
                <button
                  onClick={() => moveSection(idx, "down")}
                  disabled={idx === sectionOrder.length - 1 || isPending}
                  className="p-1 rounded text-shark-400 hover:text-shark-700 dark:text-shark-300 hover:bg-shark-100 dark:hover:bg-shark-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  title="Move down"
                >
                  <Icon name="chevron-down" size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <hr className="my-5 border-shark-100 dark:border-shark-800" />

      {/* Widget Visibility */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-shark-400 uppercase tracking-wider">Widget Visibility</h3>

        {/* Stat Cards */}
        <div>
          <p className="text-xs font-medium text-shark-500 dark:text-shark-400 mb-2">Stat Cards</p>
          <div className="space-y-1">
            {(["stat-total-assets", "stat-checked-out", "stat-overdue", "stat-damaged", "stat-pending-requests", "stat-pending-pos"] as WidgetId[]).map((id) => {
              const isVisible = !preferences.hiddenWidgets.includes(id);
              return (
                <div key={id} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-shark-700 dark:text-shark-300">{WIDGET_LABELS[id]}</span>
                  <Toggle checked={isVisible} onChange={() => handleToggle(id, isVisible)} disabled={isPending} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Sections */}
        <div>
          <p className="text-xs font-medium text-shark-500 dark:text-shark-400 mb-2">Sections</p>
          <div className="space-y-1">
            {(["operations-overview", "portfolio-valuation", "maintenance-due", "asset-charts", "consumable-charts", "low-stock-alerts", "predicted-shortages", "ai-forecast", "recent-activity", "regional-breakdown", "location-map", "quick-links"] as WidgetId[]).map((id) => {
              const isVisible = !preferences.hiddenWidgets.includes(id);
              return (
                <div key={id} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-shark-700 dark:text-shark-300">{WIDGET_LABELS[id]}</span>
                  <Toggle checked={isVisible} onChange={() => handleToggle(id, isVisible)} disabled={isPending} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <hr className="my-5 border-shark-100 dark:border-shark-800" />

      {/* Custom Shortcuts */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-shark-400 uppercase tracking-wider">Custom Shortcuts</h3>

        {preferences.customShortcuts.length === 0 && !showAddForm && (
          <p className="text-sm text-shark-400 py-2">No custom shortcuts yet.</p>
        )}

        {preferences.customShortcuts.map((s) => (
          <div key={s.id} className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-shark-50 dark:bg-shark-800 flex items-center justify-center">
                <Icon name={s.icon} size={14} className="text-shark-500 dark:text-shark-400" />
              </div>
              <div>
                <span className="text-sm font-medium text-shark-700 dark:text-shark-300">{s.label}</span>
                <span className="ml-2 text-xs text-shark-400">{s.href}</span>
              </div>
            </div>
            <button
              onClick={() => handleRemoveShortcut(s.id)}
              disabled={isPending}
              className="text-shark-300 hover:text-red-500 p-1 rounded transition-colors disabled:opacity-50"
            >
              <Icon name="x" size={14} />
            </button>
          </div>
        ))}

        {showAddForm ? (
          <div className="space-y-3 p-3 bg-shark-50 dark:bg-shark-800 rounded-xl">
            <Input
              placeholder="Label (e.g. Import Data)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
            />
            <Input
              placeholder="Path (e.g. /import-data)"
              value={newHref}
              onChange={(e) => setNewHref(e.target.value)}
            />
            <Select value={newIcon} onChange={(e) => setNewIcon(e.target.value as IconName)}>
              {SHORTCUT_ICON_OPTIONS.map((icon) => (
                <option key={icon} value={icon}>{icon}</option>
              ))}
            </Select>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddShortcut} disabled={isPending || !newLabel.trim() || !newHref.trim()} loading={isPending}>Save</Button>
              <Button size="sm" variant="secondary" onClick={() => { setShowAddForm(false); setNewLabel(""); setNewHref(""); }}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button size="sm" variant="secondary" onClick={() => setShowAddForm(true)}>
            <Icon name="plus" size={14} className="mr-1.5" />
            Add Shortcut
          </Button>
        )}
      </div>
    </Modal>
  );
}
