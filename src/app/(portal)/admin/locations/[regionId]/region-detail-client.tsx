"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const SECTION_COLORS = [
  { bg: "bg-blue-500", color: "text-white" },
  { bg: "bg-emerald-500", color: "text-white" },
  { bg: "bg-amber-500", color: "text-white" },
  { bg: "bg-cyan-500", color: "text-white" },
  { bg: "bg-red-500", color: "text-white" },
  { bg: "bg-violet-500", color: "text-white" },
  { bg: "bg-pink-500", color: "text-white" },
  { bg: "bg-orange-500", color: "text-white" },
  { bg: "bg-teal-500", color: "text-white" },
  { bg: "bg-indigo-500", color: "text-white" },
];

interface Asset {
  id: string;
  name: string;
  assetCode: string;
  category: string;
  status: string;
  serialNumber: string | null;
  isHighValue: boolean;
  imageUrl: string | null;
  assignments: Array<{
    user: { name: string | null; email: string };
  }>;
}

interface Consumable {
  id: string;
  name: string;
  category: string;
  unitType: string;
  quantityOnHand: number;
  minimumThreshold: number;
  reorderLevel: number;
  supplier: string | null;
  imageUrl: string | null;
}

interface Staff {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
}

interface Region {
  id: string;
  name: string;
  state: { id: string; name: string };
}

interface Props {
  region: Region;
  assets: Asset[];
  consumables: Consumable[];
  staff: Staff[];
  lowStockCount: number;
}

export function RegionDetailClient({ region, assets, consumables, staff, lowStockCount }: Props) {
  const [activeTab, setActiveTab] = useState<"assets" | "consumables" | "staff">("assets");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [stockFilter, setStockFilter] = useState("ALL");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Filter assets
  const filteredAssets = useMemo(() => {
    let result = assets;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((a) =>
        a.name.toLowerCase().includes(q) ||
        a.assetCode.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        (a.serialNumber && a.serialNumber.toLowerCase().includes(q))
      );
    }
    if (statusFilter !== "ALL") {
      result = result.filter((a) => a.status === statusFilter);
    }
    return result;
  }, [assets, search, statusFilter]);

  // Filter consumables
  const filteredConsumables = useMemo(() => {
    let result = consumables;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      );
    }
    if (stockFilter === "LOW") {
      result = result.filter((c) => c.quantityOnHand <= c.minimumThreshold && c.quantityOnHand > 0);
    } else if (stockFilter === "OUT") {
      result = result.filter((c) => c.quantityOnHand === 0);
    } else if (stockFilter === "ADEQUATE") {
      result = result.filter((c) => c.quantityOnHand > c.minimumThreshold);
    }
    return result;
  }, [consumables, search, stockFilter]);

  // Filter staff
  const filteredStaff = useMemo(() => {
    if (!search) return staff;
    const q = search.toLowerCase();
    return staff.filter((s) =>
      (s.name && s.name.toLowerCase().includes(q)) ||
      s.email.toLowerCase().includes(q)
    );
  }, [staff, search]);

  // Group by category
  const assetCategories = useMemo(() => {
    const cats: Record<string, Asset[]> = {};
    for (const a of filteredAssets) {
      if (!cats[a.category]) cats[a.category] = [];
      cats[a.category].push(a);
    }
    return Object.entries(cats).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredAssets]);

  const consumableCategories = useMemo(() => {
    const cats: Record<string, Consumable[]> = {};
    for (const c of filteredConsumables) {
      if (!cats[c.category]) cats[c.category] = [];
      cats[c.category].push(c);
    }
    return Object.entries(cats).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredConsumables]);

  // Unique category names for color assignment
  const allCategoryNames = useMemo(() => {
    const names = new Set<string>();
    assets.forEach((a) => names.add(a.category));
    consumables.forEach((c) => names.add(c.category));
    return Array.from(names).sort();
  }, [assets, consumables]);

  const getCategoryColor = (name: string) => {
    const idx = allCategoryNames.indexOf(name);
    return SECTION_COLORS[(idx >= 0 ? idx : 0) % SECTION_COLORS.length];
  };

  const stats = [
    { label: "Total Assets", value: assets.length, icon: "package" as const, color: "text-white", bg: "bg-blue-500", border: "border-t-blue-500" },
    { label: "Consumables", value: consumables.length, icon: "droplet" as const, color: "text-white", bg: "bg-orange-500", border: "border-t-orange-500" },
    { label: "Staff", value: staff.length, icon: "users" as const, color: "text-white", bg: "bg-emerald-500", border: "border-t-emerald-500" },
    { label: "Low Stock", value: lowStockCount, icon: "alert-triangle" as const, color: "text-white", bg: "bg-red-500", border: "border-t-red-500" },
  ];

  const tabs = [
    { key: "assets" as const, label: "Assets", count: assets.length, icon: "package" as const },
    { key: "consumables" as const, label: "Consumables", count: consumables.length, icon: "droplet" as const },
    { key: "staff" as const, label: "Staff", count: staff.length, icon: "users" as const },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-shark-400">
        <Link href="/admin/locations" className="hover:text-action-500 transition-colors">
          Locations
        </Link>
        <Icon name="arrow-right" size={12} />
        <span>{region.state.name}</span>
        <Icon name="arrow-right" size={12} />
        <span className="text-shark-700 font-medium">{region.name}</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-shark-900">{region.name}</h1>
        <p className="text-sm text-shark-400 mt-1">{region.state.name}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className={`border-t-[3px] ${stat.border}`}>
            <div className="px-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-shark-900">{stat.value}</p>
                  <p className="text-xs text-shark-400 mt-0.5">{stat.label}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <Icon name={stat.icon} size={18} className={stat.color} />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-shark-100">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSearch(""); setStatusFilter("ALL"); setStockFilter("ALL"); }}
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Input
          placeholder={`Search ${activeTab}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        {activeTab === "assets" && (
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:max-w-[180px]">
            <option value="ALL">All statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="CHECKED_OUT">Checked Out</option>
            <option value="PENDING_RETURN">Pending Return</option>
            <option value="DAMAGED">Damaged</option>
            <option value="LOST">Lost</option>
            <option value="UNAVAILABLE">Unavailable</option>
          </Select>
        )}
        {activeTab === "consumables" && (
          <Select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} className="sm:max-w-[180px]">
            <option value="ALL">All stock levels</option>
            <option value="ADEQUATE">Adequate</option>
            <option value="LOW">Low Stock</option>
            <option value="OUT">Out of Stock</option>
          </Select>
        )}
      </div>

      {/* Assets Tab */}
      {activeTab === "assets" && (
        <>
          {assetCategories.length === 0 ? (
            <Card>
              <div className="py-12 text-center">
                <Icon name="package" size={40} className="text-shark-200 mx-auto mb-3" />
                <p className="text-shark-400">{search || statusFilter !== "ALL" ? "No assets match your filters." : "No assets in this region."}</p>
              </div>
            </Card>
          ) : (
            assetCategories.map(([catName, catAssets], idx) => {
              const colors = getCategoryColor(catName);
              const isCollapsed = collapsedSections.has(`asset-${catName}`);
              return (
                <div key={catName} className="space-y-2">
                  <button
                    onClick={() => toggleSection(`asset-${catName}`)}
                    className="flex items-center gap-3 px-1 w-full text-left group"
                  >
                    <div className={`w-7 h-7 rounded-lg ${colors.bg} flex items-center justify-center`}>
                      <Icon name="package" size={14} className={colors.color} />
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <h3 className="text-base font-semibold text-shark-900">{catName}</h3>
                      <span className="text-xs font-medium text-shark-400 bg-shark-100 px-2 py-0.5 rounded-full">
                        {catAssets.length}
                      </span>
                    </div>
                    <Icon
                      name="chevron-down"
                      size={16}
                      className={`text-shark-400 group-hover:text-shark-600 transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                    />
                  </button>
                  {!isCollapsed && (
                    <Card>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-shark-100">
                              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-shark-400">Photo</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-shark-400">Code</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-shark-400">Name</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-shark-400 hidden md:table-cell">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-shark-400 hidden lg:table-cell">Assigned To</th>
                            </tr>
                          </thead>
                          <tbody>
                            {catAssets.map((asset) => (
                              <tr key={asset.id} className="border-b border-shark-50 hover:bg-shark-50/50">
                                <td className="px-4 py-2.5">
                                  <div className="w-9 h-9 rounded-lg bg-shark-50 overflow-hidden flex items-center justify-center">
                                    {asset.imageUrl ? (
                                      <img src={asset.imageUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <Icon name="package" size={14} className="text-shark-300" />
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-2.5 text-xs font-mono text-shark-500">{asset.assetCode}</td>
                                <td className="px-4 py-2.5 text-sm font-medium text-shark-800">
                                  {asset.name}
                                  {asset.isHighValue && <span className="text-amber-500 ml-1">★</span>}
                                </td>
                                <td className="px-4 py-2.5 hidden md:table-cell"><Badge status={asset.status} /></td>
                                <td className="px-4 py-2.5 text-sm text-shark-500 hidden lg:table-cell">
                                  {asset.assignments[0]?.user?.name || asset.assignments[0]?.user?.email || "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  )}
                </div>
              );
            })
          )}
        </>
      )}

      {/* Consumables Tab */}
      {activeTab === "consumables" && (
        <>
          {consumableCategories.length === 0 ? (
            <Card>
              <div className="py-12 text-center">
                <Icon name="droplet" size={40} className="text-shark-200 mx-auto mb-3" />
                <p className="text-shark-400">{search || stockFilter !== "ALL" ? "No consumables match your filters." : "No consumables in this region."}</p>
              </div>
            </Card>
          ) : (
            consumableCategories.map(([catName, catItems]) => {
              const colors = getCategoryColor(catName);
              const isCollapsed = collapsedSections.has(`consumable-${catName}`);
              return (
                <div key={catName} className="space-y-2">
                  <button
                    onClick={() => toggleSection(`consumable-${catName}`)}
                    className="flex items-center gap-3 px-1 w-full text-left group"
                  >
                    <div className={`w-7 h-7 rounded-lg ${colors.bg} flex items-center justify-center`}>
                      <Icon name="droplet" size={14} className={colors.color} />
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <h3 className="text-base font-semibold text-shark-900">{catName}</h3>
                      <span className="text-xs font-medium text-shark-400 bg-shark-100 px-2 py-0.5 rounded-full">
                        {catItems.length}
                      </span>
                    </div>
                    <Icon
                      name="chevron-down"
                      size={16}
                      className={`text-shark-400 group-hover:text-shark-600 transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                    />
                  </button>
                  {!isCollapsed && (
                    <Card>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-shark-100">
                              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-shark-400">Photo</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-shark-400">Item</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-shark-400">Qty</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-shark-400 hidden md:table-cell">Min</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-shark-400 hidden lg:table-cell">Supplier</th>
                            </tr>
                          </thead>
                          <tbody>
                            {catItems.map((item) => {
                              const isLow = item.quantityOnHand <= item.minimumThreshold;
                              const isOut = item.quantityOnHand === 0;
                              return (
                                <tr key={item.id} className="border-b border-shark-50 hover:bg-shark-50/50">
                                  <td className="px-4 py-2.5">
                                    <div className="w-9 h-9 rounded-lg bg-shark-50 overflow-hidden flex items-center justify-center">
                                      {item.imageUrl ? (
                                        <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                                      ) : (
                                        <Icon name="droplet" size={14} className="text-shark-300" />
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <p className="text-sm font-medium text-shark-800">{item.name}</p>
                                    <p className="text-xs text-shark-400">{item.unitType}</p>
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <span className={`text-sm font-semibold ${isOut ? "text-red-600" : isLow ? "text-amber-600" : "text-shark-700"}`}>
                                      {item.quantityOnHand}
                                    </span>
                                    {isOut && <span className="ml-1.5 text-xs text-red-500 font-medium">OUT</span>}
                                    {isLow && !isOut && <span className="ml-1.5 text-xs text-amber-500 font-medium">LOW</span>}
                                  </td>
                                  <td className="px-4 py-2.5 text-sm text-shark-400 hidden md:table-cell">{item.minimumThreshold}</td>
                                  <td className="px-4 py-2.5 text-sm text-shark-400 hidden lg:table-cell">{item.supplier || "—"}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  )}
                </div>
              );
            })
          )}
        </>
      )}

      {/* Staff Tab */}
      {activeTab === "staff" && (
        <>
          {filteredStaff.length === 0 ? (
            <Card>
              <div className="py-12 text-center">
                <Icon name="users" size={40} className="text-shark-200 mx-auto mb-3" />
                <p className="text-shark-400">{search ? "No staff match your search." : "No staff assigned to this region."}</p>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
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
                    {filteredStaff.map((user) => (
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
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
