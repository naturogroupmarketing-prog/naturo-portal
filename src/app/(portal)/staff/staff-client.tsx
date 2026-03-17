"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const SECTION_COLORS = [
  { color: "text-blue-600", bg: "bg-blue-50" },
  { color: "text-emerald-600", bg: "bg-emerald-50" },
  { color: "text-amber-600", bg: "bg-amber-50" },
  { color: "text-cyan-600", bg: "bg-cyan-50" },
  { color: "text-red-600", bg: "bg-red-50" },
  { color: "text-violet-600", bg: "bg-violet-50" },
  { color: "text-pink-600", bg: "bg-pink-50" },
  { color: "text-orange-600", bg: "bg-orange-50" },
  { color: "text-lime-600", bg: "bg-lime-50" },
  { color: "text-gray-600", bg: "bg-gray-100" },
];

interface StaffUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  region: { id: string; name: string } | null;
  assetAssignments: {
    asset: { name: string; assetCode: string };
  }[];
}

interface Region {
  id: string;
  name: string;
  state: { name: string };
}

export function StaffClient({ users, regions }: { users: StaffUser[]; regions: Region[] }) {
  const [search, setSearch] = useState("");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const filtered = users.filter(
    (u) =>
      (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const regionGroups = regions.map((region, idx) => {
    const colors = SECTION_COLORS[idx % SECTION_COLORS.length];
    return {
      id: region.id,
      name: region.name,
      stateName: region.state.name,
      ...colors,
      users: filtered.filter((u) => u.region?.id === region.id),
    };
  });

  const headOfficeUsers = filtered.filter((u) => !u.region);
  const headOfficeColors = SECTION_COLORS[regions.length % SECTION_COLORS.length];
  const isHeadOfficeCollapsed = collapsedSections.has("head-office");

  const exportCSV = () => {
    const headers = ["Name", "Email", "Role", "Region", "Status", "Assigned Assets"];
    const rows = filtered.map((u) => [
      u.name || "",
      u.email,
      u.role,
      u.region?.name || "Head Office",
      u.isActive ? "Active" : "Inactive",
      u.assetAssignments.map((a) => a.asset.name).join("; "),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "staff-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderTable = (sectionUsers: StaffUser[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-shark-100">
            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-shark-400">Name</th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-shark-400 hidden md:table-cell">Email</th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-shark-400">Role</th>
            <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-shark-400">Assigned Assets</th>
            <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-shark-400">Status</th>
          </tr>
        </thead>
        <tbody>
          {sectionUsers.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-5 py-8 text-center text-sm text-shark-400">
                No staff in this section.
              </td>
            </tr>
          ) : (
            sectionUsers.map((user) => (
              <tr key={user.id} className="border-b border-shark-50 hover:bg-shark-50/50">
                <td className="px-5 py-3.5 font-medium text-shark-800">{user.name || "—"}</td>
                <td className="px-5 py-3.5 text-shark-500 hidden md:table-cell">{user.email}</td>
                <td className="px-5 py-3.5"><Badge status={user.role} /></td>
                <td className="px-5 py-3.5 text-right">
                  {user.assetAssignments.length > 0 ? (
                    <div>
                      <span className="font-medium text-shark-700">{user.assetAssignments.length}</span>
                      <div className="text-xs text-shark-400 mt-0.5">
                        {user.assetAssignments.slice(0, 2).map((a) => a.asset.name).join(", ")}
                        {user.assetAssignments.length > 2 && ` +${user.assetAssignments.length - 2} more`}
                      </div>
                    </div>
                  ) : (
                    <span className="text-shark-300">0</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-center">
                  <span className={`inline-block w-2 h-2 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-shark-300"}`} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-shark-900">Staff Overview</h1>
        <p className="text-sm text-shark-400 mt-1">{filtered.length} staff members</p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Search staff..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Icon name="download" size={14} className="mr-1.5" />
          Export CSV
        </Button>
      </div>

      {/* Region Sections */}
      {regionGroups
        .filter((g) => g.users.length > 0)
        .map((section) => {
          const isCollapsed = collapsedSections.has(section.id);
          return (
            <div key={section.id} className="space-y-2">
              <button
                onClick={() => toggleSection(section.id)}
                className="flex items-center gap-3 px-1 w-full text-left group"
              >
                <div className={`w-8 h-8 rounded-lg ${section.bg} flex items-center justify-center`}>
                  <Icon name="map-pin" size={16} className={section.color} />
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <h2 className="text-lg font-semibold text-shark-900">{section.name}</h2>
                  <span className="text-xs text-shark-400">{section.stateName}</span>
                  <span className="text-xs font-medium text-shark-400 bg-shark-100 px-2 py-0.5 rounded-full">
                    {section.users.length}
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
                  {renderTable(section.users)}
                </Card>
              )}
            </div>
          );
        })}

      {/* Head Office (no region) */}
      {headOfficeUsers.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => toggleSection("head-office")}
            className="flex items-center gap-3 px-1 w-full text-left group"
          >
            <div className={`w-8 h-8 rounded-lg ${headOfficeColors.bg} flex items-center justify-center`}>
              <Icon name="dashboard" size={16} className={headOfficeColors.color} />
            </div>
            <div className="flex items-center gap-2 flex-1">
              <h2 className="text-lg font-semibold text-shark-900">Head Office</h2>
              <span className="text-xs text-shark-400">No region assigned</span>
              <span className="text-xs font-medium text-shark-400 bg-shark-100 px-2 py-0.5 rounded-full">
                {headOfficeUsers.length}
              </span>
            </div>
            <Icon
              name="chevron-down"
              size={16}
              className={`text-shark-400 group-hover:text-shark-600 transition-transform ${isHeadOfficeCollapsed ? "-rotate-90" : ""}`}
            />
          </button>
          {!isHeadOfficeCollapsed && (
            <Card>
              {renderTable(headOfficeUsers)}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
