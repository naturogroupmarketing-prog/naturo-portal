"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { AssetsClient } from "@/app/(portal)/assets/assets-client";
import { ConsumablesClient } from "@/app/(portal)/consumables/consumables-client";
import { StaffClient } from "@/app/(portal)/staff/staff-client";
import { getItemTemplates, applyItemsToRegion } from "@/app/actions/locations";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";

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

export function InventoryDetailClient({
  region, assets, consumables, staff, users, assetCategories, consumableCategories,
  pendingRequests, lowStockCount, permissions, isSuperAdmin, allRegions = [], initialTab, initialAction,
}: Props) {
  const router = useRouter();
  const { addToast } = useToast();
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applying, setApplying] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    const handleScroll = () => setShowBackToTop(main.scrollTop > 400);
    main.addEventListener("scroll", handleScroll);
    return () => main.removeEventListener("scroll", handleScroll);
  }, []);

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

  return (
    <div className="space-y-10">
      {/* Back button */}
      <Link href="/inventory" className="inline-flex items-center gap-1.5 text-sm text-shark-400 hover:text-action-500 transition-colors">
        <Icon name="arrow-left" size={16} />
        <span>Back</span>
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-shark-900 tracking-tight">{region.name}</h1>
          <p className="text-sm text-shark-400 mt-0.5">{region.state.name}</p>
        </div>
      </div>

      {/* Summary Stats */}
      <p className="text-[11px] font-semibold text-shark-400 uppercase tracking-widest">Overview</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Assets", value: (assets as unknown[]).length, icon: "package" as const, iconBg: "bg-action-100", iconColor: "text-action-600", scrollTo: "section-assets" },
          { label: "Supplies", value: (consumables as unknown[]).length, icon: "droplet" as const, iconBg: "bg-action-100", iconColor: "text-action-600", scrollTo: "section-consumables" },
          { label: "Staff", value: staff.length, icon: "users" as const, iconBg: "bg-action-100", iconColor: "text-action-600", scrollTo: "section-staff" },
          { label: "Low Stock", value: lowStockCount, icon: "alert-triangle" as const, iconBg: lowStockCount > 0 ? "bg-red-50" : "bg-action-100", iconColor: lowStockCount > 0 ? "text-red-500" : "text-action-600", href: `/purchase-orders?region=${region.id}` },
        ].map((stat) => {
          const cardContent = (
            <Card className={`hover:shadow-md transition-all cursor-pointer`}>
              <div className="px-3 py-3 sm:px-5 sm:py-5">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl ${stat.iconBg} flex items-center justify-center shrink-0`}>
                    <Icon name={stat.icon} size={16} className={`${stat.iconColor} sm:hidden`} />
                    <Icon name={stat.icon} size={20} className={`${stat.iconColor} hidden sm:block`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-shark-500">{stat.label}</p>
                    <p className="text-xl sm:text-2xl font-bold text-shark-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            </Card>
          );

          if ("scrollTo" in stat && stat.scrollTo) {
            return (
              <div key={stat.label} className="cursor-pointer" onClick={() => document.getElementById(stat.scrollTo!)?.scrollIntoView({ behavior: "smooth", block: "start" })}>
                {cardContent}
              </div>
            );
          }

          return (
            <Link key={stat.label} href={stat.href!}>
              {cardContent}
            </Link>
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

      {/* Assets */}
      <div id="section-assets" className="scroll-mt-20" />
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

      {/* Consumables */}
      <div id="section-consumables" className="scroll-mt-20" />
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

      {/* Staff — uses the same StaffClient as the Staff Overview page */}
      <div id="section-staff" className="scroll-mt-20" />
      {staff.length > 0 && (
        <StaffClient
          users={staff}
          regions={[{ id: region.id, name: region.name, state: region.state }]}
          allRegions={allRegions}
          isSuperAdmin={isSuperAdmin}
          canViewStaffDetails={true}
          initialRegion={region.id}
        />
      )}

      {/* Back to top button */}
      {showBackToTop && (
        <button
          onClick={() => document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-16 sm:bottom-6 right-16 sm:right-20 z-30 w-10 h-10 rounded-full bg-white border border-shark-200 shadow-lg flex items-center justify-center text-shark-500 hover:text-action-500 hover:border-action-300 transition-all"
          title="Back to top"
        >
          <Icon name="chevron-up" size={18} />
        </button>
      )}
    </div>
  );
}
