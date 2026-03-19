"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { updatePermission } from "@/app/actions/permissions";
import { MANAGER_DEFAULTS, PERMISSION_INFO, type PermissionKey } from "@/lib/permission-types";

interface Manager {
  id: string;
  name: string | null;
  email: string;
  region: { id: string; name: string; state: { name: string } } | null;
  permissions: Record<PermissionKey, boolean> | null;
}

const GROUPS = ["Staff", "Assets", "Consumables", "Features", "Regions", "AI"];

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

function ManagerCard({ manager }: { manager: Manager }) {
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);

  const getPermValue = (key: PermissionKey): boolean => {
    if (manager.permissions && key in manager.permissions) {
      return manager.permissions[key];
    }
    return MANAGER_DEFAULTS[key];
  };

  const handleToggle = (key: PermissionKey, newValue: boolean) => {
    startTransition(async () => {
      await updatePermission(manager.id, key, newValue);
    });
  };

  const allKeys = Object.keys(PERMISSION_INFO) as PermissionKey[];
  const enabledCount = allKeys.filter((k) => getPermValue(k)).length;

  return (
    <Card>
      <CardHeader>
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-action-50 flex items-center justify-center">
              <Icon name="user" size={18} className="text-action-500" />
            </div>
            <div>
              <CardTitle className="text-base">{manager.name || manager.email}</CardTitle>
              <p className="text-xs text-shark-400 mt-0.5">
                {manager.email}
                {manager.region && ` · ${manager.region.state.name} / ${manager.region.name}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-shark-400">{enabledCount}/{allKeys.length} enabled</span>
            <Badge status="BRANCH_MANAGER" />
            <Icon name={expanded ? "chevron-down" : "arrow-right"} size={16} className="text-shark-400" />
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent>
          <div className="space-y-6">
            {GROUPS.map((group) => {
              const groupKeys = allKeys.filter((k) => PERMISSION_INFO[k].group === group);
              if (groupKeys.length === 0) return null;
              return (
                <div key={group}>
                  <h4 className="text-xs font-semibold text-shark-400 uppercase tracking-wider mb-3">{group}</h4>
                  <div className="space-y-3">
                    {groupKeys.map((key) => {
                      const info = PERMISSION_INFO[key];
                      return (
                        <div key={key} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-shark-700">{info.label}</p>
                            <p className="text-xs text-shark-400">{info.description}</p>
                          </div>
                          <Toggle
                            checked={getPermValue(key)}
                            onChange={(val) => handleToggle(key, val)}
                            disabled={isPending}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export function PermissionsClient({ managers }: { managers: Manager[] }) {
  const [search, setSearch] = useState("");

  const filtered = managers.filter(
    (m) =>
      (m.name || "").toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-shark-900">Permission Management</h1>
        <p className="text-sm text-shark-400 mt-1">Manage granular permissions for Branch Managers. Click a manager to expand.</p>
      </div>

      <Input
        placeholder="Search managers..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs"
      />

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-shark-400">
              {managers.length === 0
                ? "No active Branch Managers found."
                : "No managers match your search."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((manager) => (
            <ManagerCard key={manager.id} manager={manager} />
          ))}
        </div>
      )}
    </div>
  );
}
