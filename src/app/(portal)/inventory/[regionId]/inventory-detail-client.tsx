"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { AssetsClient } from "@/app/(portal)/assets/assets-client";
import { ConsumablesClient } from "@/app/(portal)/consumables/consumables-client";
import { StaffClient } from "@/app/(portal)/staff/staff-client";
import { getItemTemplates, applyItemsToRegion } from "@/app/actions/locations";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { BreadcrumbSetter } from "@/components/ui/breadcrumb-context";

interface Props {
  region: { id: string; name: string; state: { id: string; name: string } };
  assets: unknown[];
  consumables: unknown[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  staff: any[];
  users: unknown[];
  assetCategories: unknown[];
  consumableCategories: unknown[];
  pendingRequests: unknown[];
  lowStockCount: number;
  permissions: { canAddAsset: boolean; canEditAsset: boolean; canDeleteAsset: boolean; canAssignAsset: boolean; canAddConsumable: boolean; canEditConsumable: boolean; canDeleteConsumable: boolean; canAdjustStock: boolean };
  isSuperAdmin: boolean;
  allRegions?: { id: string; name: string; state: { name: string } }[];
  initialTab?: "assets" | "consumables" | "staff";
  initialAction?: string;
  /** Consumable ID to scroll to and highlight (from Low Stock deep-link) */
  highlightId?: string;
}

const TABS = ["Assets", "Supplies", "Staff"] as const;
type Tab = typeof TABS[number];

export function InventoryDetailClient({
  region, assets, consumables, staff, users, assetCategories, consumableCategories,
  pendingRequests, permissions, isSuperAdmin, allRegions = [], initialTab, initialAction, highlightId,
}: Props) {
  const router = useRouter();
  const { addToast } = useToast();
  const [applying, setApplying] = useState(false);

  const defaultTab: Tab = highlightId ? "Supplies" : initialTab === "consumables" ? "Supplies" : initialTab === "staff" ? "Staff" : "Assets";
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);

  const isEmpty = (assets as unknown[]).length === 0 && (consumables as unknown[]).length === 0;

  const handleApplyStandard = async () => {
    setApplying(true);
    try {
      const templates = await getItemTemplates();
      const result = await applyItemsToRegion({
        regionId: region.id,
        assets: templates.assets,
        consumables: templates.consumables.map((c) => ({ ...c, initialStock: 0 })),
      });
      addToast(`Applied ${result.assetsCreated} assets and ${result.consumablesCreated} supplies`, "success");
      router.refresh();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed", "error");
    }
    setApplying(false);
  };

  const tabCounts: Record<Tab, number> = {
    Assets: (assets as unknown[]).length,
    Supplies: (consumables as unknown[]).length,
    Staff: staff.length,
  };

  return (
    <div className="space-y-6">
      <BreadcrumbSetter segment={region.id} label={region.name} />

      {/* Page title — rendered here so it's always available from server data, never a raw ID */}
      <h1 className="text-[28px] sm:text-[32px] font-bold text-shark-900 dark:text-white leading-tight tracking-tight -mb-2">
        {region.name}
      </h1>

      {/* Unified card: header + tab pills + content */}
      <Card padding="none">
        {/* Tab bar — scrollable so it never squeezes at narrow widths */}
        <div className="px-4 sm:px-5 py-3 border-b border-shark-100 dark:border-shark-700 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <div className="flex gap-1 bg-shark-50 dark:bg-shark-800/60 rounded-[20px] p-1 min-w-max">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
                  activeTab === tab
                    ? "bg-action-500 text-white shadow-sm"
                    : "text-shark-500 dark:text-shark-400 hover:bg-shark-100 dark:hover:bg-shark-800 hover:text-shark-700 dark:text-shark-300"
                }`}
              >
                {tab}
                <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[11px] font-bold rounded-full ${
                  activeTab === tab ? "bg-white/20 text-white" : "bg-shark-200 dark:bg-shark-700 text-shark-500 dark:text-shark-400"
                }`}>
                  {tabCounts[tab]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Apply Standard Items — when empty */}
        {isEmpty && isSuperAdmin && (
          <div className="px-6 py-10 text-center border-b border-shark-100 dark:border-shark-700">
            <div className="w-12 h-12 rounded-[20px] bg-action-500 flex items-center justify-center mx-auto mb-4">
              <Icon name="plus" size={22} className="text-white" />
            </div>
            <h3 className="text-lg font-bold text-shark-900 dark:text-shark-100">Set Up This Location</h3>
            <p className="text-sm text-shark-500 dark:text-shark-400 mt-1 max-w-md mx-auto">Apply standard items from your existing locations to get started quickly.</p>
            <Button className="mt-4" onClick={handleApplyStandard} loading={applying} disabled={applying}>
              <Icon name="package" size={16} className="mr-2" />
              Apply Standard Items
            </Button>
          </div>
        )}

        {/* Tab content */}
        <div>
          {activeTab === "Assets" && (
            <AssetsClient
              assets={assets as never}
              regions={[{ id: region.id, name: region.name, state: region.state }] as never}
              users={users as never}
              categories={assetCategories as never}
              isSuperAdmin={isSuperAdmin}
              permissions={{ canAdd: permissions.canAddAsset, canEdit: permissions.canEditAsset, canDelete: permissions.canDeleteAsset, canAssign: permissions.canAssignAsset }}
              initialStatus={undefined}
              initialRegion={region.id}
              initialCategory={undefined}
            />
          )}

          {activeTab === "Supplies" && (
            <ConsumablesClient
              consumables={consumables as never}
              pendingRequests={pendingRequests as never}
              regions={[{ id: region.id, name: region.name, state: region.state }] as never}
              users={users as never}
              categories={consumableCategories as never}
              isSuperAdmin={isSuperAdmin}
              canAdd={permissions.canAddConsumable}
              canAdjustStock={permissions.canAdjustStock}
              initialTab={undefined}
              initialStock={undefined}
              initialCategory={undefined}
              highlightId={highlightId}
              noCard
            />
          )}

          {activeTab === "Staff" && (
            <StaffClient
              users={staff}
              regions={[{ id: region.id, name: region.name, state: region.state }]}
              allRegions={allRegions}
              isSuperAdmin={isSuperAdmin}
              canViewStaffDetails={true}
              initialRegion={region.id}
              noCard
            />
          )}
        </div>
      </Card>
    </div>
  );
}
