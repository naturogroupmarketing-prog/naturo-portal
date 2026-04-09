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
import { getItemTemplates, applyItemsToRegion } from "@/app/actions/locations";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";

interface Props {
  region: { id: string; name: string; state: { id: string; name: string } };
  assets: unknown[];
  consumables: unknown[];
  staff: {
    id: string; name: string | null; email: string; phone?: string | null; role: string; isActive: boolean;
    region?: { id: string; name: string } | null;
    assetAssignments: { asset: { name: string; assetCode: string; category: string } }[];
    consumableAssignments?: { quantity: number; consumable: { name: string; unitType: string } }[];
  }[];
  users: unknown[];
  assetCategories: unknown[];
  consumableCategories: unknown[];
  pendingRequests: unknown[];
  lowStockCount: number;
  permissions: { canAddAsset: boolean; canEditAsset: boolean; canDeleteAsset: boolean; canAssignAsset: boolean; canAddConsumable: boolean; canEditConsumable: boolean; canDeleteConsumable: boolean; canAdjustStock: boolean };
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
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applying, setApplying] = useState(false);
  const [viewStaff, setViewStaff] = useState<Props["staff"][number] | null>(null);
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
      addToast(`Applied ${result.assetsCreated} assets and ${result.consumablesCreated} consumables`, "success");
      router.refresh();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed", "error");
    }
    setApplying(false);
  };

  return (
    <div className="space-y-8">
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
          <h1 className="text-3xl font-bold text-shark-900 tracking-tight">{region.name}</h1>
          <p className="text-sm text-shark-400 mt-0.5">{region.state.name}</p>
        </div>
      </div>

      {/* Summary Stats */}
      <p className="text-[11px] font-semibold text-shark-400 uppercase tracking-widest">Overview</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Assets", value: (assets as unknown[]).length, icon: "package" as const, border: "border-action-500", scrollTo: "section-assets" },
          { label: "Consumables", value: (consumables as unknown[]).length, icon: "droplet" as const, border: "border-action-500", scrollTo: "section-consumables" },
          { label: "Staff", value: staff.length, icon: "users" as const, border: "border-action-500", scrollTo: "section-staff" },
          { label: "Low Stock", value: lowStockCount, icon: "alert-triangle" as const, border: lowStockCount > 0 ? "border-[#E8532E]" : "border-action-500", href: `/purchase-orders?region=${region.id}` },
        ].map((stat) => {
          const cardContent = (
            <Card className="hover:shadow-md transition-all cursor-pointer">
              <div className="px-4 sm:px-5 py-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${stat.border === "border-[#E8532E]" && stat.value > 0 ? "bg-[#E8532E]" : "bg-action-500"} flex items-center justify-center shrink-0`}>
                    <Icon name={stat.icon} size={22} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-shark-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-shark-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            </Card>
          );

          if ("scrollTo" in stat && stat.scrollTo) {
            return (
              <div key={stat.label} onClick={() => document.getElementById(stat.scrollTo!)?.scrollIntoView({ behavior: "smooth", block: "start" })}>
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
        canAdjustStock={permissions.canAdjustStock}
        initialTab={undefined}
        initialStock={undefined}
        initialCategory={undefined}
      />

      {/* Staff */}
      <div id="section-staff" className="scroll-mt-20" />
      {staff.length > 0 && (
        <>
        <p className="text-[11px] font-semibold text-shark-400 uppercase tracking-widest">Staff</p>
        <div className="space-y-2">
          {/* Mobile: card layout */}
          <div className="sm:hidden space-y-2">
            {staff.map((user) => (
              <Card key={user.id} className="cursor-pointer hover:shadow-md transition-all" onClick={() => setViewStaff(user)}>
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-action-500 flex items-center justify-center shrink-0">
                        <span className="text-white text-sm font-semibold">{(user.name || user.email)[0].toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-shark-800 truncate">{user.name || "—"}</p>
                        <p className="text-xs text-shark-400 truncate">{user.email}</p>
                      </div>
                    </div>
                    <Badge status={user.role} />
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-shark-400">
                    <span>{user.assetAssignments.length} assets</span>
                    <span>{user.consumableAssignments?.length || 0} consumables</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          {/* Desktop: table layout */}
          <Card>
            <div className="hidden sm:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-shark-100">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-shark-400">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-shark-400">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-shark-400 hidden md:table-cell">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-shark-400 hidden lg:table-cell">Assets</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-shark-400 hidden lg:table-cell">Consumables</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-shark-400 hidden md:table-cell">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((user) => (
                    <tr key={user.id} className="border-b border-shark-50 hover:bg-shark-50/50 cursor-pointer transition-colors" onClick={() => setViewStaff(user)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-action-500 flex items-center justify-center shrink-0">
                            <span className="text-white text-xs font-semibold">{(user.name || user.email)[0].toUpperCase()}</span>
                          </div>
                          <span className="text-sm font-medium text-shark-800">{user.name || "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-shark-500">{user.email}</td>
                      <td className="px-4 py-3 hidden md:table-cell"><Badge status={user.role} /></td>
                      <td className="px-4 py-3 hidden lg:table-cell text-sm text-shark-500">{user.assetAssignments.length}</td>
                      <td className="px-4 py-3 hidden lg:table-cell text-sm text-shark-500">{user.consumableAssignments?.length || 0}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`inline-flex items-center gap-1 text-xs ${user.isActive ? "text-action-600" : "text-shark-400"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-action-500" : "bg-shark-300"}`} />
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
        </>
      )}

      {/* Staff Detail Modal */}
      {viewStaff && (
        <Modal open onClose={() => setViewStaff(null)} title={viewStaff.name || viewStaff.email}>
          <div className="space-y-5">
            {/* Basic info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-shark-400 mb-0.5">Email</p>
                <p className="text-shark-800">{viewStaff.email}</p>
              </div>
              {viewStaff.phone && (
                <div>
                  <p className="text-xs text-shark-400 mb-0.5">Phone</p>
                  <p className="text-shark-800">{viewStaff.phone}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-shark-400 mb-0.5">Role</p>
                <Badge status={viewStaff.role} />
              </div>
              <div>
                <p className="text-xs text-shark-400 mb-0.5">Status</p>
                <span className={`inline-flex items-center gap-1 text-xs ${viewStaff.isActive ? "text-action-600" : "text-shark-400"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${viewStaff.isActive ? "bg-action-500" : "bg-shark-300"}`} />
                  {viewStaff.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            {/* Assigned Assets */}
            {viewStaff.assetAssignments.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-shark-400 uppercase tracking-wider mb-2">Assigned Assets ({viewStaff.assetAssignments.length})</p>
                <div className="space-y-1">
                  {viewStaff.assetAssignments.map((a, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-shark-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-shark-800">{a.asset.name}</p>
                        <p className="text-xs text-shark-400 font-mono">{a.asset.assetCode}</p>
                      </div>
                      <span className="text-xs text-shark-400">{a.asset.category}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assigned Consumables */}
            {viewStaff.consumableAssignments && viewStaff.consumableAssignments.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-shark-400 uppercase tracking-wider mb-2">Assigned Consumables ({viewStaff.consumableAssignments.length})</p>
                <div className="space-y-1">
                  {viewStaff.consumableAssignments.map((c, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-shark-50 rounded-lg">
                      <p className="text-sm font-medium text-shark-800">{c.consumable.name}</p>
                      <span className="text-xs text-shark-500">{c.quantity} {c.consumable.unitType}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {viewStaff.assetAssignments.length === 0 && (!viewStaff.consumableAssignments || viewStaff.consumableAssignments.length === 0) && (
              <p className="text-sm text-shark-400 text-center py-4">No items currently assigned.</p>
            )}
          </div>
        </Modal>
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
