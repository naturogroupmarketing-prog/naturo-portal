"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { updateWidgetVisibility, addCustomShortcut, removeCustomShortcut } from "@/app/actions/dashboard";
import { WIDGET_LABELS, SHORTCUT_ICON_OPTIONS, type DashboardPreferences, type WidgetId } from "@/lib/dashboard-types";
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
      } ${checked ? "bg-action-500" : "bg-shark-200"}`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white transition-transform duration-200 ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

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
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-shark-400 uppercase tracking-wider">Widget Visibility</h3>
        {(Object.entries(WIDGET_LABELS) as [WidgetId, string][]).map(([id, label]) => {
          const isVisible = !preferences.hiddenWidgets.includes(id);
          return (
            <div key={id} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-shark-700">{label}</span>
              <Toggle
                checked={isVisible}
                onChange={() => handleToggle(id, isVisible)}
                disabled={isPending}
              />
            </div>
          );
        })}
      </div>

      <hr className="my-5 border-shark-100" />

      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-shark-400 uppercase tracking-wider">Custom Shortcuts</h3>

        {preferences.customShortcuts.length === 0 && !showAddForm && (
          <p className="text-sm text-shark-400 py-2">No custom shortcuts yet.</p>
        )}

        {preferences.customShortcuts.map((s) => (
          <div key={s.id} className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-shark-50 flex items-center justify-center">
                <Icon name={s.icon} size={14} className="text-shark-500" />
              </div>
              <div>
                <span className="text-sm font-medium text-shark-700">{s.label}</span>
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
          <div className="space-y-3 p-3 bg-shark-50 rounded-xl">
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
              <Button size="sm" onClick={handleAddShortcut} disabled={isPending || !newLabel.trim() || !newHref.trim()}>
                {isPending ? "Saving..." : "Save"}
              </Button>
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
