"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { AssetsClient } from "@/app/(portal)/assets/assets-client";
import { ConsumablesClient } from "@/app/(portal)/consumables/consumables-client";
import { getItemTemplates, applyItemsToRegion } from "@/app/actions/locations";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";

interface Props {
  region: { id: string; name: string; state: { id: string; name: string } };
  assets: unknown[];
  consumables: unknown[];
  staff: { id: string; name: string | null; email: string; role: string; isActive: boolean }[];
  users: unknown[];
  assetCategories: unknown[];
  consumableCategories: unknown[];
  pendingRequests: unknown[];
  lowStockCount: number;
  permissions: { canAddAsset: boolean; canEditAsset: boolean; canDeleteAsset: boolean; canAddConsumable: boolean; canEditConsumable: boolean; canDeleteConsumable: boolean; canAdjustStock: boolean };
  isSuperAdmin: boolean;
  initialTab?: "assets" | "consumables" | "staff";
  initialAction?: string;
}

export function InventoryDetailClient({
  region, assets, consumables, staff, users, assetCategories, consumableCategories,
  pendingRequests, lowStockCount, permissions, isSuperAdmin, initialTab, initialAction,
}: Props) {
  const router = useRouter();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<"assets" | "consumables" | "staff">(initialTab || "assets");
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applying, setApplying] = useState(false);

  const isEmpty = (assets as unknown[]).length === 0 && (consumables as unknown[]).length === 0;

  const tabs = [
    { key: "assets" as const, label: "Assets", count: (assets as unknown[]).length, icon: "package" as const },
    { key: "consumables" as const, label: "Consumables", count: (consumables as unknown[]).length, icon: "droplet" as const },
    { key: "staff" as const, label: "Staff", count: staff.length, icon: "users" as const },
  ];

  const handleApplyStandard = async () => {
    setApplying(true);
    try {
      const templates = await getItemTemplates();
      const result = await applyItemsToRegion({
        regionId: region.id,
        assets: templates.assets,
        consumables: templates.consumables.map((c) => ({ ...c, initialStock: 0 })),
      });
      addToast(`Applied ${result.assetsCreated} assets and ${result.consumablesCreated} consumables`, "success");
      router.refresh();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed", "error");
    }
    setApplying(false);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-shark-400">
        <Link href="/inventory" className="hover:text-action-500 transition-colors">Inventory</Link>
        <Icon name="arrow-right" size={12} />
        <span>{region.state.name}</span>
        <Icon name="arrow-right" size={12} />
        <span className="text-shark-700 font-medium">{region.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-shark-900">{region.name}</h1>
          <p className="text-sm text-shark-400 mt-0.5">{region.state.name}</p>
        </div>
      </div>

      {/* Summary Stats — clickable */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Assets", value: (assets as unknown[]).length, icon: "package" as const, border: "border-action-500", tab: "assets" as const, href: undefined },
          { label: "Consumables", value: (consumables as unknown[]).length, icon: "droplet" as const, border: "border-action-500", tab: "consumables" as const, href: undefined },
          { label: "Staff", value: staff.length, icon: "users" as const, border: "border-action-500", tab: "staff" as const, href: undefined },
          { label: "Low Stock", value: lowStockCount, icon: "alert-triangle" as const, border: lowStockCount > 0 ? "border-[#E8532E]" : "border-action-500", tab: undefined, href: `/alerts/low-stock?region=${region.id}` },
        ].map((stat) => {
          const content = (
            <div className="px-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-shark-900">{stat.value}</p>
                  <p className="text-xs text-shark-400 mt-0.5">{stat.label}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${stat.border === "border-[#E8532E]" && stat.value > 0 ? "bg-[#E8532E]" : "bg-action-500"} flex items-center justify-center`}>
                  <Icon name={stat.icon} size={18} className="text-white" />
                </div>
              </div>
            </div>
          );

          if (stat.href) {
            return (
              <Link key={stat.label} href={stat.href}>
                <Card className={`border-t-[3px] ${stat.border} hover:shadow-md transition-all cursor-pointer`}>
                  {content}
                </Card>
              </Link>
            );
          }

          return (
            <Card
              key={stat.label}
              className={`border-t-[3px] ${stat.border} hover:shadow-md transition-all cursor-pointer`}
              onClick={() => stat.tab && setActiveTab(stat.tab)}
            >
              {content}
            </Card>
          );
        })}
      </div>

      {/* Apply Standard Items — when empty */}
      {isEmpty && isSuperAdmin && (
        <Card className="border-2 border-dashed border-action-200 bg-action-50/30">
          <div className="px-6 py-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-action-500 flex items-center justify-center mx-auto mb-4">
              <Icon name="plus" size={24} className="text-white" />
            </div>
            <h3 className="text-lg font-semibold text-shark-900">Set Up This Location</h3>
            <p className="text-sm text-shark-500 mt-1 max-w-md mx-auto">Apply standard items from your existing locations to get started quickly.</p>
            <Button className="mt-5" onClick={handleApplyStandard} loading={applying} disabled={applying}>
              <Icon name="package" size={16} className="mr-2" />
              Apply Standard Items
            </Button>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="border-b border-shark-100">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-action-500 text-action-600"
                  : "border-transparent text-shark-400 hover:text-shark-600"
              }`}
            >
              <Icon name={tab.icon} size={15} />
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key ? "bg-action-50 text-action-600" : "bg-shark-100 text-shark-400"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "assets" && (
        <AssetsClient
          assets={assets as never}
          regions={[{ id: region.id, name: region.name, state: region.state }] as never}
          users={users as never}
          categories={assetCategories as never}
          isSuperAdmin={isSuperAdmin}
          permissions={{ canAdd: permissions.canAddAsset, canEdit: permissions.canEditAsset, canDelete: permissions.canDeleteAsset }}
          initialStatus={undefined}
          initialRegion={region.id}
          initialCategory={undefined}
        />
      )}

      {activeTab === "consumables" && (
        <ConsumablesClient
          consumables={consumables as never}
          pendingRequests={pendingRequests as never}
          regions={[{ id: region.id, name: region.name, state: region.state }] as never}
          users={users as never}
          categories={consumableCategories as never}
          isSuperAdmin={isSuperAdmin}
          canAdjustStock={permissions.canAdjustStock}
          initialTab={undefined}
          initialStock={undefined}
          initialCategory={undefined}
        />
      )}

      {activeTab === "staff" && (
        <Card>
          <div className="overflow-x-auto">
            {staff.length === 0 ? (
              <div className="py-12 text-center">
                <Icon name="users" size={40} className="text-shark-200 mx-auto mb-3" />
                <p className="text-shark-400">No staff assigned to this location.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-shark-100">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-shark-400">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-shark-400">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-shark-400 hidden md:table-cell">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-shark-400 hidden md:table-cell">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((user) => (
                    <tr key={user.id} className="border-b border-shark-50 hover:bg-shark-50/50">
                      <td className="px-4 py-3 text-sm font-medium text-shark-800">{user.name || "—"}</td>
                      <td className="px-4 py-3 text-sm text-shark-500">{user.email}</td>
                      <td className="px-4 py-3 hidden md:table-cell"><Badge status={user.role} /></td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`inline-flex items-center gap-1 text-xs ${user.isActive ? "text-emerald-600" : "text-shark-400"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-shark-300"}`} />
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
