"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { updatePermission } from "@/app/actions/permissions";
import { MANAGER_DEFAULTS, type PermissionKey } from "@/lib/permission-types";

interface Manager {
  id: string;
  name: string | null;
  email: string;
  region: { id: string; name: string; state: { name: string } } | null;
  permissions: Record<PermissionKey, boolean> | null;
}

const PERMISSION_GROUPS = [
  { label: "Staff", addKey: "staffAdd" as PermissionKey, editKey: null as PermissionKey | null, deleteKey: "staffDelete" as PermissionKey },
  { label: "Assets", addKey: "assetAdd" as PermissionKey, editKey: "assetEdit" as PermissionKey | null, deleteKey: "assetDelete" as PermissionKey },
  { label: "Consumables", addKey: "consumableAdd" as PermissionKey, editKey: "consumableEdit" as PermissionKey | null, deleteKey: "consumableDelete" as PermissionKey },
  { label: "Regions", addKey: "regionAdd" as PermissionKey, editKey: null as PermissionKey | null, deleteKey: "regionDelete" as PermissionKey },
];

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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
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
          <Badge status="BRANCH_MANAGER" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-shark-100">
                <th className="py-2 text-left text-xs font-semibold uppercase tracking-wider text-shark-400 w-1/4">Resource</th>
                <th className="py-2 text-center text-xs font-semibold uppercase tracking-wider text-shark-400">Add</th>
                <th className="py-2 text-center text-xs font-semibold uppercase tracking-wider text-shark-400">Edit</th>
                <th className="py-2 text-center text-xs font-semibold uppercase tracking-wider text-shark-400">Delete</th>
              </tr>
            </thead>
            <tbody>
              {PERMISSION_GROUPS.map((group) => (
                <tr key={group.label} className="border-b border-shark-50 last:border-0">
                  <td className="py-3 font-medium text-shark-700">{group.label}</td>
                  <td className="py-3 text-center">
                    <Toggle
                      checked={getPermValue(group.addKey)}
                      onChange={(val) => handleToggle(group.addKey, val)}
                      disabled={isPending}
                    />
                  </td>
                  <td className="py-3 text-center">
                    {group.editKey ? (
                      <Toggle
                        checked={getPermValue(group.editKey)}
                        onChange={(val) => handleToggle(group.editKey!, val)}
                        disabled={isPending}
                      />
                    ) : (
                      <span className="text-xs text-shark-300">—</span>
                    )}
                  </td>
                  <td className="py-3 text-center">
                    <Toggle
                      checked={getPermValue(group.deleteKey)}
                      onChange={(val) => handleToggle(group.deleteKey, val)}
                      disabled={isPending}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Standalone permission toggles */}
        <div className="mt-4 pt-4 border-t border-shark-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm text-shark-700">Purchase Orders</p>
              <p className="text-xs text-shark-400 mt-0.5">Approve, reject, and update purchase order status</p>
            </div>
            <Toggle
              checked={getPermValue("purchaseOrderManage")}
              onChange={(val) => handleToggle("purchaseOrderManage", val)}
              disabled={isPending}
            />
          </div>
        </div>
      </CardContent>
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
        <p className="text-sm text-shark-400 mt-1">Manage granular permissions for Branch Managers</p>
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
