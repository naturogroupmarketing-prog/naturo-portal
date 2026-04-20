"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
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
}

const TABS = ["Assets", "Supplies", "Staff"] as const;
type Tab = typeof TABS[number];

export function InventoryDetailClient({
  region, assets, consumables, staff, users, assetCategories, consumableCategories,
  pendingRequests, lowStockCount, permissions, isSuperAdmin, allRegions = [], initialTab, initialAction,
}: Props) {
  const router = useRouter();
  const { addToast } = useToast();
  const [applying, setApplying] = useState(false);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setLocationDropdownOpen(false);
        setLocationSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const defaultTab: Tab = initialTab === "consumables" ? "Supplies" : initialTab === "staff" ? "Staff" : "Assets";
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

      {/* Back button */}
      <Link href="/inventory" className="inline-flex items-center gap-1.5 text-sm text-shark-400 hover:text-action-500 transition-colors">
        <Icon name="arrow-left" size={16} />
        <span>Back</span>
      </Link>

      {/* Unified card: header + tab pills + content */}
      <Card padding="none">
        {/* Region name header — click to switch location */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => { setLocationDropdownOpen((o) => !o); setLocationSearch(""); }}
            className="w-full flex items-center gap-3 px-4 sm:px-5 py-4 border-b border-shark-100 dark:border-shark-700 hover:bg-shark-50 dark:hover:bg-shark-800/50 dark:hover:bg-shark-800/50 transition-colors group text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-action-100 flex items-center justify-center shrink-0">
              <Icon name="map-pin" size={15} className="text-action-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-semibold text-shark-900 dark:text-shark-100">{region.name}</h1>
                <Icon
                  name="chevron-down"
                  size={14}
                  className={`text-shark-400 transition-transform shrink-0 ${locationDropdownOpen ? "rotate-180" : ""}`}
                />
              </div>
              <p className="text-xs text-shark-400">{region.state.name} · tap to switch location</p>
            </div>
            {lowStockCount > 0 && (
              <Link
                href={`/purchase-orders?region=${region.id}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 text-xs font-semibold text-red-500 bg-red-50 border border-red-100 px-2.5 py-1.5 rounded-lg hover:bg-red-100 transition-colors shrink-0"
              >
                <Icon name="alert-triangle" size={12} />
                {lowStockCount} low stock
              </Link>
            )}
          </button>

          {/* Location dropdown */}
          {locationDropdownOpen && allRegions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 bg-white dark:bg-shark-900 border border-shark-100 dark:border-shark-700 shadow-xl rounded-b-xl overflow-hidden">
              {/* Search */}
              <div className="px-3 py-2.5 border-b border-shark-100 dark:border-shark-700">
                <div className="flex items-center gap-2 bg-shark-50 dark:bg-shark-800 rounded-lg px-3 py-1.5">
                  <Icon name="search" size={13} className="text-shark-400 shrink-0" />
                  <input
                    autoFocus
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    placeholder="Search locations..."
                    className="flex-1 bg-transparent text-sm text-shark-800 dark:text-shark-100 placeholder-shark-400 outline-none"
                  />
                </div>
              </div>
              {/* Region list grouped by state */}
              <div className="max-h-72 overflow-y-auto">
                {(() => {
                  const q = locationSearch.toLowerCase();
                  const filtered = allRegions.filter(
                    (r) => r.name.toLowerCase().includes(q) || r.state.name.toLowerCase().includes(q)
                  );
                  if (filtered.length === 0) {
                    return <p className="text-sm text-shark-400 text-center py-6">No locations found</p>;
                  }
                  // Group by state
                  const byState = filtered.reduce<Record<string, typeof allRegions>>((acc, r) => {
                    const s = r.state.name;
                    if (!acc[s]) acc[s] = [];
                    acc[s].push(r);
                    return acc;
                  }, {});

                  return Object.entries(byState).map(([stateName, regions]) => (
                    <div key={stateName}>
                      <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-shark-400 bg-shark-50/80 dark:bg-shark-800/60 border-b border-shark-50 dark:border-shark-700">
                        {stateName}
                      </p>
                      {regions.map((r) => (
                        <Link
                          key={r.id}
                          href={`/inventory/${r.id}`}
                          onClick={() => { setLocationDropdownOpen(false); setLocationSearch(""); }}
                          className={`flex items-center gap-3 px-4 py-2.5 hover:bg-action-50 dark:hover:bg-action-500/10 transition-colors ${
                            r.id === region.id ? "bg-action-50 dark:bg-action-500/10" : ""
                          }`}
                        >
                          <Icon
                            name="map-pin"
                            size={13}
                            className={r.id === region.id ? "text-action-500" : "text-shark-300"}
                          />
                          <span className={`text-sm ${r.id === region.id ? "font-semibold text-action-600 dark:text-action-400" : "text-shark-700 dark:text-shark-200"}`}>
                            {r.name}
                          </span>
                          {r.id === region.id && (
                            <Icon name="check" size={12} className="text-action-500 ml-auto" />
                          )}
                        </Link>
                      ))}
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Tab bar — scrollable so it never squeezes at narrow widths */}
        <div className="px-3 sm:px-4 py-3 border-b border-shark-100 dark:border-shark-700 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <div className="flex gap-1 bg-shark-50 dark:bg-shark-800/60 rounded-xl p-1 min-w-max">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === tab
                    ? "bg-action-500 text-white shadow-sm"
                    : "text-shark-500 dark:text-shark-400 hover:bg-shark-100 hover:text-shark-700 dark:text-shark-300"
                }`}
              >
                {tab}
                <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[11px] font-bold rounded-full ${
                  activeTab === tab ? "bg-white/20 text-white" : "bg-shark-200 text-shark-500 dark:text-shark-400"
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
            <div className="w-12 h-12 rounded-2xl bg-action-500 flex items-center justify-center mx-auto mb-4">
              <Icon name="plus" size={22} className="text-white" />
            </div>
            <h3 className="text-base font-semibold text-shark-900 dark:text-shark-100">Set Up This Location</h3>
            <p className="text-sm text-shark-500 dark:text-shark-400 mt-1 max-w-md mx-auto">Apply standard items from your existing locations to get started quickly.</p>
            <Button className="mt-4" onClick={handleApplyStandard} loading={applying} disabled={applying}>
              <Icon name="package" size={16} className="mr-2" />
              Apply Standard Items
            </Button>
          </div>
        )}

        {/* Tab content */}
        <div className="p-4 sm:p-5">
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
            />
          )}
        </div>
      </Card>
    </div>
  );
}
