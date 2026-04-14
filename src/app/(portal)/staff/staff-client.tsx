"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { createUser, updateUser, deleteUser, resetPassword, toggleUserActive, restoreUser, permanentlyDeleteUser } from "@/app/actions/users";
import { applyStarterKit } from "@/app/actions/starter-kits";

const SECTION_COLORS = [
  { color: "text-blue-600", bg: "bg-blue-50" },
  { color: "text-action-600", bg: "bg-action-50" },
  { color: "text-[#E8532E]", bg: "bg-amber-50" },
  { color: "text-cyan-600", bg: "bg-cyan-50" },
  { color: "text-red-600", bg: "bg-red-50" },
  { color: "text-shark-600", bg: "bg-shark-50" },
  { color: "text-pink-600", bg: "bg-pink-50" },
  { color: "text-orange-600", bg: "bg-orange-50" },
  { color: "text-lime-600", bg: "bg-lime-50" },
  { color: "text-gray-600", bg: "bg-gray-100" },
];

interface StaffUser {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  region: { id: string; name: string } | null;
  assetAssignments: {
    asset: { name: string; assetCode: string; category: string; imageUrl: string | null };
  }[];
  consumableAssignments?: {
    quantity: number;
    consumable: { name: string; unitType: string; category: string; imageUrl: string | null };
  }[];
  consumableRequests?: {
    id: string;
    quantity: number;
    status: string;
    createdAt: string;
    consumable: { name: string; unitType: string; category: string };
  }[];
  damageReports?: {
    id: string;
    type: string;
    description: string;
    isResolved: boolean;
    createdAt: string;
    asset: { name: string; assetCode: string } | null;
  }[];
  conditionChecks?: {
    id: string;
    monthYear: string;
    condition: string;
  }[];
  consumableUsageHistory?: {
    month: string;
    label: string;
    totalUsed: number;
    items: { name: string; quantity: number; unitType: string }[];
  }[];
}

interface Region {
  id: string;
  name: string;
  state: { name: string };
}

interface DeletedUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  deletedAt: string;
  region: { name: string } | null;
}

interface StarterKit {
  id: string;
  name: string;
  isDefault: boolean;
}

interface StaffClientProps {
  users: StaffUser[];
  regions: Region[];
  allRegions: Region[];
  isSuperAdmin: boolean;
  canViewStaffDetails?: boolean;
  initialRegion?: string;
  deletedUsers?: DeletedUser[];
  starterKits?: StarterKit[];
}

export function StaffClient({ users, regions, allRegions, isSuperAdmin, canViewStaffDetails = true, initialRegion, deletedUsers = [], starterKits = [] }: StaffClientProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [showDeleted, setShowDeleted] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  // Assign Starter Kit modal
  const [showAssignKit, setShowAssignKit] = useState(false);
  const [assignKitUserId, setAssignKitUserId] = useState("");
  const [assignKitId, setAssignKitId] = useState("");
  const [assignKitSubmitting, setAssignKitSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  // If initialRegion is set, collapse all OTHER regions so the target region is visible
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(() => {
    if (!initialRegion) return new Set();
    const allIds = new Set<string>();
    // Collapse head-office and all regions except the target
    allIds.add("head-office");
    for (const r of regions) {
      if (r.id !== initialRegion) allIds.add(r.id);
    }
    return allIds;
  });
  const [detailUser, setDetailUser] = useState<StaffUser | null>(null);

  // Create user modal state
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  // Edit modal state
  const [editUser, setEditUser] = useState<StaffUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState("STAFF");
  const [editRegionId, setEditRegionId] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const [usageExpanded, setUsageExpanded] = useState(false);

  // Reset password state (inside edit modal)
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resetSaving, setResetSaving] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  // Delete confirmation state (inside edit modal)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Drag and drop state for users
  const [dragItemId, setDragItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);

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

  // Sort: Branch Managers first, then alphabetically by name
  const sortUsers = (list: StaffUser[]) =>
    [...list].sort((a, b) => {
      if (a.role === "BRANCH_MANAGER" && b.role !== "BRANCH_MANAGER") return -1;
      if (a.role !== "BRANCH_MANAGER" && b.role === "BRANCH_MANAGER") return 1;
      return (a.name || "").localeCompare(b.name || "");
    });

  const regionGroups = regions.map((region, idx) => {
    const colors = SECTION_COLORS[idx % SECTION_COLORS.length];
    return {
      id: region.id,
      name: region.name,
      stateName: region.state.name,
      ...colors,
      users: sortUsers(filtered.filter((u) => u.region?.id === region.id)),
    };
  });

  const headOfficeUsers = sortUsers(filtered.filter((u) => !u.region));
  const headOfficeColors = SECTION_COLORS[regions.length % SECTION_COLORS.length];
  const isHeadOfficeCollapsed = collapsedSections.has("head-office");

  const openEdit = (user: StaffUser) => {
    setEditUser(user);
    setEditName(user.name || "");
    setEditPhone(user.phone || "");
    setEditRole(user.role);
    setEditRegionId(user.region?.id || "");
    setEditError("");
    setShowResetPassword(false);
    setShowDeleteConfirm(false);
    setResetSuccess(false);
    setResetError("");
    setDeleteError("");
    setNewPassword("");
    setUsageExpanded(false);
  };

  const closeEdit = () => {
    setEditUser(null);
    setShowResetPassword(false);
    setShowDeleteConfirm(false);
    setUsageExpanded(false);
  };

  const handleEdit = async () => {
    if (!editUser) return;
    setEditSaving(true);
    setEditError("");
    try {
      const fd = new FormData();
      fd.append("userId", editUser.id);
      fd.append("name", editName);
      fd.append("phone", editPhone);
      fd.append("role", editRole);
      fd.append("regionId", editRegionId);
      await updateUser(fd);
      closeEdit();
    } catch (e: unknown) {
      setEditError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setEditSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!editUser) return;
    try {
      const fd = new FormData();
      fd.append("userId", editUser.id);
      await toggleUserActive(fd);
      closeEdit();
    } catch {
      // silently fail
    }
  };

  const handleDelete = async () => {
    if (!editUser) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const result = await deleteUser(editUser.id);
      if (result && !result.success) {
        setDeleteError(result.error || "Failed to delete");
      } else {
        addToast("User deleted", "success");
        closeEdit();
        router.refresh();
      }
    } catch (e: unknown) {
      setDeleteError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!editUser) return;
    setResetSaving(true);
    setResetError("");
    setResetSuccess(false);
    try {
      await resetPassword(editUser.id, newPassword);
      setResetSuccess(true);
      setNewPassword("");
    } catch (e: unknown) {
      setResetError(e instanceof Error ? e.message : "Failed to reset password");
    } finally {
      setResetSaving(false);
    }
  };

  const exportCSV = () => {
    const headers = ["Name", "Email", "Phone", "Role", "Region", "Status", "Assigned Assets"];
    const rows = filtered.map((u) => [
      u.name || "",
      u.email,
      u.phone || "",
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
    <>
      {/* Mobile: card layout */}
      <div className="sm:hidden space-y-2">
        {sectionUsers.length === 0 ? (
          <p className="text-center text-shark-400 py-8 text-sm">No staff in this section.</p>
        ) : (
          sectionUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => (isSuperAdmin || canViewStaffDetails) && openEdit(user)}
              className="border border-shark-100 rounded-xl p-4 bg-white hover:shadow-sm transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${user.isActive ? "bg-action-500" : "bg-shark-300"}`} />
                    <p className="text-sm font-semibold text-shark-800 truncate">{user.name || "—"}</p>
                  </div>
                </div>
                <Badge status={user.role} />
              </div>
              <div className="flex items-center justify-end mt-2.5 pt-2.5 border-t border-shark-50">
                <button
                  onClick={(e) => { e.stopPropagation(); setDetailUser(user); }}
                  className="text-xs text-action-500 font-medium px-2 py-1 rounded-lg hover:bg-action-50 transition-colors"
                >
                  View
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop: table layout */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-shark-100">
              <th scope="col" className="px-1 py-3 w-6"></th>
              <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-shark-400">Name</th>
              <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-shark-400">Role</th>
              <th scope="col" className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-shark-400">Status</th>
            </tr>
          </thead>
          <tbody>
            {sectionUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-sm text-shark-400">
                  No staff in this section.
                </td>
              </tr>
            ) : (
              sectionUsers.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => (isSuperAdmin || canViewStaffDetails) && openEdit(user)}
                  draggable={isSuperAdmin}
                  onDragStart={() => setDragItemId(user.id)}
                  onDragOver={(e) => { e.preventDefault(); setDragOverItemId(user.id); }}
                  onDragEnd={() => { setDragItemId(null); setDragOverItemId(null); }}
                  className={`border-b border-shark-50 hover:bg-shark-50/50 ${(isSuperAdmin || canViewStaffDetails) ? "cursor-pointer" : ""} ${dragItemId === user.id ? "opacity-40" : ""} ${dragOverItemId === user.id ? "border-t-2 border-t-action-500" : ""}`}
                >
                  <td className="px-1 py-2" onClick={(e) => e.stopPropagation()}>
                    {isSuperAdmin && (
                      <div className="cursor-grab active:cursor-grabbing p-0.5">
                        <svg className="w-4 h-4 text-shark-300" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 font-medium text-shark-800">{user.name || "—"}</td>
                  <td className="px-5 py-3.5"><Badge status={user.role} /></td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`inline-flex items-center gap-1.5`} aria-label={user.isActive ? "Active" : "Inactive"} title={user.isActive ? "Active" : "Inactive"}>
                      <span className={`inline-block w-2 h-2 rounded-full ${user.isActive ? "bg-action-500" : "bg-shark-300"}`} />
                      <span className="text-xs text-shark-400 hidden sm:inline">{user.isActive ? "Active" : "Inactive"}</span>
                    </span>
                  </td>
                  <td className="px-3 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setDetailUser(user)}
                      className="text-xs text-action-500 hover:text-action-600 font-medium px-2 py-1 rounded-lg hover:bg-action-50 transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-shark-900 tracking-tight">Staff Overview</h1>
          <p className="text-sm text-shark-400 mt-1">{filtered.length} staff members</p>
        </div>
        <div className="flex items-center gap-2">
          {starterKits.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => { setShowAssignKit(true); setAssignKitUserId(""); setAssignKitId(starterKits.find(k => k.isDefault)?.id || starterKits[0]?.id || ""); }}>
              <Icon name="box" size={14} className="mr-1.5" />
              Assign Starter Kit
            </Button>
          )}
          {isSuperAdmin && (
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Icon name="plus" size={14} className="mr-1.5" />
              New User
            </Button>
          )}
        </div>
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
      {users.length === 0 ? (
        <EmptyState
          icon="users"
          title="No staff members"
          description="Add team members to assign assets and supplies"
        />
      ) : regionGroups
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

      {/* Assign Starter Kit Modal */}
      <Modal open={showAssignKit} onClose={() => setShowAssignKit(false)} title="Assign Starter Kit">
        <form action={async () => {
          if (!assignKitUserId || !assignKitId) return;
          setAssignKitSubmitting(true);
          try {
            const result = await applyStarterKit(assignKitUserId, assignKitId);
            if (result && "error" in result) {
              addToast(result.error as string, "error");
            } else {
              const applied = result && "applied" in result ? (result.applied as number) : 0;
              addToast(`Starter kit assigned successfully (${applied} items)`, "success");
              setShowAssignKit(false);
              router.refresh();
            }
          } catch (err) {
            addToast(err instanceof Error ? err.message : "Failed to assign kit", "error");
          } finally {
            setAssignKitSubmitting(false);
          }
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-shark-700 mb-1">Staff Member</label>
            <Select value={assignKitUserId} onChange={(e) => setAssignKitUserId(e.target.value)}>
              <option value="">Select staff member...</option>
              {regions.map((region) => {
                const regionUsers = users.filter((u) => u.region?.id === region.id && u.isActive);
                if (regionUsers.length === 0) return null;
                return (
                  <optgroup key={region.id} label={region.name}>
                    {regionUsers.map((u) => (
                      <option key={u.id} value={u.id}>{u.name || u.email}</option>
                    ))}
                  </optgroup>
                );
              })}
            </Select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-shark-700">Starter Kit</label>
              <Link href="/starter-kits" className="text-xs text-action-500 hover:text-action-600 font-medium flex items-center gap-1">
                <Icon name="edit" size={12} />
                Edit Kits
              </Link>
            </div>
            <Select value={assignKitId} onChange={(e) => setAssignKitId(e.target.value)}>
              {starterKits.map((kit) => (
                <option key={kit.id} value={kit.id}>
                  {kit.name}{kit.isDefault ? " (Default)" : ""}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowAssignKit(false)}>Cancel</Button>
            <Button type="submit" disabled={!assignKitUserId || !assignKitId || assignKitSubmitting} loading={assignKitSubmitting}>
              Assign Kit
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create User Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create User">
        <form action={async (fd) => {
          setCreating(true);
          try {
            const result = await createUser(fd);
            if (result.error) {
              addToast(result.error, "error");
            } else {
              addToast("User created successfully", "success");
              setShowCreate(false);
              router.refresh();
            }
          } catch (e) {
            addToast(e instanceof Error ? e.message : "Failed to create user", "error");
          } finally {
            setCreating(false);
          }
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-shark-700 mb-1">Name *</label>
            <Input name="name" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 mb-1">Email *</label>
            <Input name="email" type="email" required placeholder="user@company.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 mb-1">Phone</label>
            <Input name="phone" type="tel" placeholder="e.g. 0412 345 678" />
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 mb-1">Password *</label>
            <Input name="password" type="password" required minLength={6} placeholder="Min 6 characters" />
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 mb-1">Role *</label>
            <Select name="role" required>
              <option value="STAFF">Staff</option>
              <option value="BRANCH_MANAGER">Branch Manager</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 mb-1">Region</label>
            <Select name="regionId">
              <option value="">No region (head office)</option>
              {allRegions.map((r) => (
                <option key={r.id} value={r.id}>{r.name} — {r.state.name}</option>
              ))}
            </Select>
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer py-1">
            <input type="checkbox" name="sendWelcomeEmail" value="true" defaultChecked className="w-4 h-4 rounded border-shark-300 text-action-500 focus:ring-action-400" />
            <span className="text-sm text-shark-700">Send welcome email with login details</span>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" disabled={creating} loading={creating}>Create User</Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal — includes reset password, toggle active, and delete */}
      <Modal open={!!editUser} onClose={closeEdit} title={isSuperAdmin ? `Edit: ${editUser?.name || editUser?.email || ""}` : `${editUser?.name || editUser?.email || ""}`}>
        {editUser && (
          <div className="space-y-4">
            {!showResetPassword && !showDeleteConfirm ? (
              isSuperAdmin ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-shark-700 mb-1">Email</label>
                  <p className="text-sm text-shark-500">{editUser.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-shark-700 mb-1">Name</label>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-shark-700 mb-1">Phone</label>
                  <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="e.g. 0412 345 678" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-shark-700 mb-1">Role</label>
                  <Select value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                    <option value="STAFF">Staff</option>
                    <option value="BRANCH_MANAGER">Branch Manager</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-shark-700 mb-1">Region</label>
                  <Select value={editRegionId} onChange={(e) => setEditRegionId(e.target.value)}>
                    <option value="">Head Office (No Region)</option>
                    {allRegions.map((r) => (
                      <option key={r.id} value={r.id}>{r.name} — {r.state.name}</option>
                    ))}
                  </Select>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-shark-50">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${editUser.isActive ? "bg-action-500" : "bg-shark-300"}`} />
                    <span className="text-sm text-shark-700">{editUser.isActive ? "Active" : "Disabled"}</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={handleToggleActive}>
                    {editUser.isActive ? "Disable User" : "Enable User"}
                  </Button>
                </div>

                {/* Inventory Summary */}
                {(editUser.assetAssignments.length > 0 || (editUser.consumableAssignments?.length ?? 0) > 0 || (editUser.consumableRequests?.length ?? 0) > 0) && (
                  <div className="border border-shark-100 rounded-lg p-3 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-shark-400">On Hand</p>
                    {editUser.assetAssignments.length > 0 && (() => {
                      const grouped = editUser.assetAssignments.reduce((acc, a) => {
                        (acc[a.asset.category] ??= []).push(a);
                        return acc;
                      }, {} as Record<string, typeof editUser.assetAssignments>);
                      return (
                        <div className="space-y-2">
                          <p className="text-xs text-shark-400">Assets ({editUser.assetAssignments.length})</p>
                          {Object.entries(grouped).map(([cat, items]) => (
                            <div key={cat}>
                              <p className="text-[11px] font-semibold text-shark-500 uppercase tracking-wider mb-1">{cat}</p>
                              <div className="space-y-0.5">
                                {items.map((a, idx) => (
                                  <div key={idx} className="flex items-center gap-2.5 text-sm text-shark-700 py-0.5">
                                    {a.asset.imageUrl ? (
                                      <img src={a.asset.imageUrl} alt={a.asset.name} className="w-7 h-7 rounded-lg object-cover shrink-0" />
                                    ) : (
                                      <div className="w-7 h-7 rounded-lg bg-action-50 flex items-center justify-center shrink-0">
                                        <Icon name="package" size={12} className="text-action-400" />
                                      </div>
                                    )}
                                    <span className="truncate">{a.asset.name}</span>
                                    <span className="text-[11px] text-shark-400 shrink-0 ml-1">(1)</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                    {(editUser.consumableAssignments?.length ?? 0) > 0 && (() => {
                      const grouped = editUser.consumableAssignments!.reduce((acc, c) => {
                        (acc[c.consumable.category] ??= []).push(c);
                        return acc;
                      }, {} as Record<string, typeof editUser.consumableAssignments>);
                      return (
                        <div className="space-y-2">
                          <p className="text-xs text-shark-400">Supplies ({editUser.consumableAssignments!.length})</p>
                          {Object.entries(grouped).map(([cat, items]) => (
                            <div key={cat}>
                              <p className="text-[11px] font-semibold text-shark-500 uppercase tracking-wider mb-1">{cat}</p>
                              <div className="space-y-0.5">
                                {items!.map((c, idx) => (
                                  <div key={idx} className="flex items-center gap-2.5 text-sm text-shark-700 py-0.5">
                                    {c.consumable.imageUrl ? (
                                      <img src={c.consumable.imageUrl} alt={c.consumable.name} className="w-7 h-7 rounded-lg object-cover shrink-0" />
                                    ) : (
                                      <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                        <Icon name="droplet" size={12} className="text-blue-400" />
                                      </div>
                                    )}
                                    <span className="truncate">{c.consumable.name}</span>
                                    <span className="text-[11px] text-shark-400 shrink-0 ml-1">({c.quantity})</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                    {(editUser.consumableRequests?.length ?? 0) > 0 && (
                      <div>
                        <p className="text-xs text-shark-400 mb-1">Pending Requests ({editUser.consumableRequests!.length})</p>
                        <div className="space-y-0.5">
                          {editUser.consumableRequests!.map((r) => (
                            <div key={r.id} className="flex items-center gap-2 text-sm text-shark-700">
                              <Icon name="clipboard" size={12} className="text-amber-400 shrink-0" />
                              <span>{r.quantity}x {r.consumable.name}</span>
                              <Badge status={r.status} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Consumable Usage History */}
                {editUser.consumableUsageHistory && editUser.consumableUsageHistory.some((m) => m.totalUsed > 0) && (
                  <div className="border border-shark-100 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setUsageExpanded(!usageExpanded)}
                      className="w-full flex items-center justify-between p-3 hover:bg-shark-25 transition-colors"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wider text-shark-400">Usage History (6 months)</p>
                      <Icon name="chevron-down" size={14} className={`text-shark-400 transition-transform ${usageExpanded ? "" : "-rotate-90"}`} />
                    </button>
                    {usageExpanded && (
                      <div className="px-3 pb-3 space-y-2">
                        {editUser.consumableUsageHistory.map((m) => (
                          <div key={m.month} className="flex items-start gap-3">
                            <div className="w-16 shrink-0 text-xs font-medium text-shark-500 pt-0.5">{m.label}</div>
                            <div className="flex-1">
                              {m.totalUsed === 0 ? (
                                <span className="text-xs text-shark-300">—</span>
                              ) : (
                                <div className="space-y-0.5">
                                  {m.items.map((item) => (
                                    <div key={item.name} className="flex items-center justify-between text-sm">
                                      <span className="text-shark-700">{item.name}</span>
                                      <span className="text-xs font-semibold text-shark-900">{item.quantity} {item.unitType}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="w-10 text-right text-sm font-bold text-shark-900 pt-0.5">{m.totalUsed || "—"}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {editError && <p className="text-sm text-red-500">{editError}</p>}

                {/* Action buttons row */}
                <div className="flex items-center justify-between border-t border-shark-100 pt-3">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setShowResetPassword(true); setResetSuccess(false); setResetError(""); setNewPassword(""); }}>
                      <Icon name="lock" size={14} className="mr-1" />
                      Reset Password
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => { setShowDeleteConfirm(true); setDeleteError(""); }}>
                      Delete User
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={closeEdit}>Cancel</Button>
                    <Button onClick={handleEdit} disabled={editSaving} loading={editSaving}>Save Changes</Button>
                  </div>
                </div>
              </>
              ) : (
              /* Read-only view for Branch Managers */
              <>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 pb-3 border-b border-shark-100">
                    <div className="w-12 h-12 rounded-full bg-action-50 flex items-center justify-center">
                      <Icon name="user" size={24} className="text-action-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-shark-900 text-lg">{editUser.name || "—"}</p>
                      <Badge status={editUser.role} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-shark-400 mb-0.5">Email</label>
                    <p className="text-sm text-shark-800">{editUser.email}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-shark-400 mb-0.5">Phone</label>
                    <p className="text-sm text-shark-800">{editUser.phone || "—"}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-shark-400 mb-0.5">Region</label>
                    <p className="text-sm text-shark-800">{editUser.region?.name || "Head Office"}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-shark-400 mb-0.5">Status</label>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${editUser.isActive ? "bg-action-500" : "bg-shark-300"}`} />
                      <span className="text-sm text-shark-800">{editUser.isActive ? "Active" : "Disabled"}</span>
                    </div>
                  </div>
                  {editUser.assetAssignments.length > 0 && (() => {
                    const grouped = editUser.assetAssignments.reduce((acc, a) => {
                      (acc[a.asset.category] ??= []).push(a);
                      return acc;
                    }, {} as Record<string, typeof editUser.assetAssignments>);
                    return (
                      <div className="space-y-3">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-shark-400">Assigned Assets ({editUser.assetAssignments.length})</label>
                        {Object.entries(grouped).map(([cat, items]) => (
                          <div key={cat}>
                            <p className="text-[11px] font-semibold text-shark-500 uppercase tracking-wider mb-1">{cat}</p>
                            <div className="space-y-1">
                              {items.map((a, idx) => (
                                <div key={idx} className="flex items-center gap-2.5 py-1">
                                  {a.asset.imageUrl ? (
                                    <img src={a.asset.imageUrl} alt={a.asset.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-lg bg-action-50 flex items-center justify-center shrink-0">
                                      <Icon name="package" size={14} className="text-action-400" />
                                    </div>
                                  )}
                                  <p className="text-sm text-shark-700 truncate">{a.asset.name}</p>
                                  <span className="text-[11px] text-shark-400 shrink-0 ml-1">(1)</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                  {(editUser.consumableAssignments?.length ?? 0) > 0 && (() => {
                    const grouped = editUser.consumableAssignments!.reduce((acc, c) => {
                      (acc[c.consumable.category] ??= []).push(c);
                      return acc;
                    }, {} as Record<string, typeof editUser.consumableAssignments>);
                    return (
                      <div className="space-y-3">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-shark-400">Assigned Supplies ({editUser.consumableAssignments!.length})</label>
                        {Object.entries(grouped).map(([cat, items]) => (
                          <div key={cat}>
                            <p className="text-[11px] font-semibold text-shark-500 uppercase tracking-wider mb-1">{cat}</p>
                            <div className="space-y-1">
                              {items!.map((c, idx) => (
                                <div key={idx} className="flex items-center gap-2.5 py-1">
                                  {c.consumable.imageUrl ? (
                                    <img src={c.consumable.imageUrl} alt={c.consumable.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                      <Icon name="droplet" size={14} className="text-blue-400" />
                                    </div>
                                  )}
                                  <p className="text-sm text-shark-700 truncate">{c.consumable.name}</p>
                                  <span className="text-[11px] text-shark-400 shrink-0 ml-1">({c.quantity})</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                  {(editUser.consumableRequests?.length ?? 0) > 0 && (
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-shark-400 mb-1">Pending Requests ({editUser.consumableRequests!.length})</label>
                      <div className="space-y-1">
                        {editUser.consumableRequests!.map((r) => (
                          <div key={r.id} className="flex items-center gap-2 py-1">
                            <Icon name="clipboard" size={14} className="text-amber-400 shrink-0" />
                            <p className="text-sm text-shark-700">
                              {r.quantity}x {r.consumable.name}
                            </p>
                            <Badge status={r.status} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Consumable Usage History (Branch Manager view) */}
                  {editUser.consumableUsageHistory && editUser.consumableUsageHistory.some((m) => m.totalUsed > 0) && (
                    <div className="border border-shark-100 rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setUsageExpanded(!usageExpanded)}
                        className="w-full flex items-center justify-between p-3 hover:bg-shark-25 transition-colors"
                      >
                        <p className="text-xs font-semibold uppercase tracking-wider text-shark-400">Usage History (6 months)</p>
                        <Icon name="chevron-down" size={14} className={`text-shark-400 transition-transform ${usageExpanded ? "" : "-rotate-90"}`} />
                      </button>
                      {usageExpanded && (
                        <div className="px-3 pb-3 space-y-2">
                          {editUser.consumableUsageHistory.map((m) => (
                            <div key={m.month} className="flex items-start gap-3">
                              <div className="w-16 shrink-0 text-xs font-medium text-shark-500 pt-0.5">{m.label}</div>
                              <div className="flex-1">
                                {m.totalUsed === 0 ? (
                                  <span className="text-xs text-shark-300">—</span>
                                ) : (
                                  <div className="space-y-0.5">
                                    {m.items.map((item) => (
                                      <div key={item.name} className="flex items-center justify-between text-sm">
                                        <span className="text-shark-700">{item.name}</span>
                                        <span className="text-xs font-semibold text-shark-900">{item.quantity} {item.unitType}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="w-10 text-right text-sm font-bold text-shark-900 pt-0.5">{m.totalUsed || "—"}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex justify-end pt-2">
                  <Button variant="outline" onClick={closeEdit}>Close</Button>
                </div>
              </>
              )
            ) : showResetPassword ? (
              <>
                <p className="text-sm text-shark-500">
                  Reset password for <span className="font-medium text-shark-800">{editUser.name || editUser.email}</span>
                </p>
                <div>
                  <label className="block text-sm font-medium text-shark-700 mb-1">New Password</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                  />
                </div>
                {resetError && <p className="text-sm text-red-500">{resetError}</p>}
                {resetSuccess && <p className="text-sm text-action-600">Password reset successfully!</p>}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowResetPassword(false)}>Back</Button>
                  <Button onClick={handleResetPassword} disabled={resetSaving || newPassword.length < 8}>
                    {resetSaving ? "Resetting..." : "Reset Password"}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-shark-600">
                  Are you sure you want to permanently delete <span className="font-bold text-shark-900">{editUser.name || editUser.email}</span>?
                </p>
                <p className="text-sm text-red-500">This action cannot be undone. All assignment history for this user will also be removed.</p>
                {editUser.assetAssignments.length > 0 && (
                  <p className="text-sm text-[#E8532E] font-medium">
                    This user has {editUser.assetAssignments.length} active asset assignment(s). Please return all assets before deleting.
                  </p>
                )}
                {deleteError && <p className="text-sm text-red-500">{deleteError}</p>}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Back</Button>
                  <Button variant="danger" onClick={handleDelete} disabled={deleting}>
                    {deleting ? "Deleting..." : "Delete Permanently"}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Staff Detail Modal */}
      <Modal open={!!detailUser} onClose={() => setDetailUser(null)} title={detailUser?.name || "Staff Details"} className="max-w-2xl">
        {detailUser && (
          <div className="space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Profile header */}
            <div className="flex items-center gap-3 pb-4 border-b border-shark-100">
              <div className="w-12 h-12 rounded-full bg-action-100 flex items-center justify-center text-lg font-bold text-action-500">
                {detailUser.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div>
                <p className="text-base font-semibold text-shark-900">{detailUser.name || "—"}</p>
                <p className="text-sm text-shark-400">{detailUser.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge status={detailUser.role} />
                  <span className={`inline-flex items-center gap-1 text-xs ${detailUser.isActive ? "text-action-600" : "text-shark-400"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${detailUser.isActive ? "bg-action-500" : "bg-shark-300"}`} />
                    {detailUser.isActive ? "Active" : "Inactive"}
                  </span>
                  {detailUser.region && <span className="text-xs text-shark-400">{detailUser.region.name}</span>}
                </div>
              </div>
            </div>

            {/* Assets assigned */}
            <div>
              <h3 className="text-sm font-semibold text-shark-700 mb-2 flex items-center gap-2">
                <Icon name="package" size={14} className="text-action-500" />
                Assets ({detailUser.assetAssignments.length})
              </h3>
              {detailUser.assetAssignments.length === 0 ? (
                <p className="text-xs text-shark-400 pl-5">No assets assigned</p>
              ) : (() => {
                const grouped = detailUser.assetAssignments.reduce((acc, a) => {
                  (acc[a.asset.category] ??= []).push(a);
                  return acc;
                }, {} as Record<string, typeof detailUser.assetAssignments>);
                return (
                  <div className="space-y-3 pl-5">
                    {Object.entries(grouped).map(([cat, items]) => (
                      <div key={cat}>
                        <p className="text-[11px] font-semibold text-shark-500 uppercase tracking-wider mb-1">{cat}</p>
                        <div className="space-y-1">
                          {items.map((a, i) => (
                            <div key={i} className="flex items-center gap-2.5 text-sm py-1">
                              {a.asset.imageUrl ? (
                                <img src={a.asset.imageUrl} alt={a.asset.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-action-50 flex items-center justify-center shrink-0">
                                  <Icon name="package" size={14} className="text-action-400" />
                                </div>
                              )}
                              <span className="font-medium text-shark-800 truncate">{a.asset.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Consumables assigned */}
            <div>
              <h3 className="text-sm font-semibold text-shark-700 mb-2 flex items-center gap-2">
                <Icon name="droplet" size={14} className="text-action-500" />
                Supplies ({detailUser.consumableAssignments?.length || 0})
              </h3>
              {!detailUser.consumableAssignments?.length ? (
                <p className="text-xs text-shark-400 pl-5">No supplies assigned</p>
              ) : (() => {
                const grouped = detailUser.consumableAssignments.reduce((acc, c) => {
                  (acc[c.consumable.category] ??= []).push(c);
                  return acc;
                }, {} as Record<string, typeof detailUser.consumableAssignments>);
                return (
                  <div className="space-y-3 pl-5">
                    {Object.entries(grouped).map(([cat, items]) => (
                      <div key={cat}>
                        <p className="text-[11px] font-semibold text-shark-500 uppercase tracking-wider mb-1">{cat}</p>
                        <div className="space-y-1">
                          {items!.map((c, i) => (
                            <div key={i} className="flex items-center gap-2.5 text-sm py-1">
                              {c.consumable.imageUrl ? (
                                <img src={c.consumable.imageUrl} alt={c.consumable.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                  <Icon name="droplet" size={14} className="text-blue-400" />
                                </div>
                              )}
                              <span className="font-medium text-shark-800 truncate">{c.consumable.name}</span>
                              <span className="text-xs text-shark-400 ml-auto shrink-0">{c.quantity} {c.consumable.unitType}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Consumable usage (requests history) */}
            <div>
              <h3 className="text-sm font-semibold text-shark-700 mb-2 flex items-center gap-2">
                <Icon name="clipboard" size={14} className="text-action-500" />
                Supply Usage ({detailUser.consumableRequests?.length || 0})
              </h3>
              {!detailUser.consumableRequests?.length ? (
                <p className="text-xs text-shark-400 pl-5">No supply requests</p>
              ) : (
                <div className="space-y-1 pl-5">
                  {detailUser.consumableRequests.map((r) => (
                    <div key={r.id} className="flex items-center justify-between text-sm py-1.5 border-b border-shark-50 last:border-0">
                      <div>
                        <span className="font-medium text-shark-800">{r.consumable.name}</span>
                        <span className="text-xs text-shark-400 ml-2">{r.quantity} {r.consumable.unitType}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge status={r.status} />
                        <span className="text-[10px] text-shark-300">{new Date(r.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Damage / Loss reports */}
            <div>
              <h3 className="text-sm font-semibold text-shark-700 mb-2 flex items-center gap-2">
                <Icon name="alert-triangle" size={14} className="text-[#E8532E]" />
                Damage & Loss ({detailUser.damageReports?.length || 0})
              </h3>
              {!detailUser.damageReports?.length ? (
                <p className="text-xs text-shark-400 pl-5">No damage or loss reports</p>
              ) : (
                <div className="space-y-1.5 pl-5">
                  {detailUser.damageReports.map((d) => (
                    <div key={d.id} className="text-sm py-2 border-b border-shark-50 last:border-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${d.type === "DAMAGE" ? "bg-amber-100 text-[#E8532E]" : "bg-red-100 text-red-700"}`}>
                            {d.type}
                          </span>
                          <span className="font-medium text-shark-800">{d.asset?.name || "Unknown"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${d.isResolved ? "bg-action-500" : "bg-red-500"}`} />
                          <span className="text-[10px] text-shark-300">{new Date(d.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</span>
                        </div>
                      </div>
                      <p className="text-xs text-shark-500 mt-1">{d.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Performance Summary */}
            <div className="border-t border-shark-100 pt-4">
              <h3 className="text-sm font-semibold text-shark-700 mb-3 flex items-center gap-2">
                <Icon name="bar-chart" size={14} className="text-action-500" />
                Performance Summary
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-shark-50 rounded-xl px-3 py-2.5 text-center">
                  <p className="text-lg font-bold text-shark-900">{detailUser.assetAssignments.length}</p>
                  <p className="text-[10px] text-shark-400">Assets Assigned</p>
                </div>
                <div className="bg-shark-50 rounded-xl px-3 py-2.5 text-center">
                  <p className="text-lg font-bold text-shark-900">{detailUser.consumableAssignments?.length || 0}</p>
                  <p className="text-[10px] text-shark-400">Supplies</p>
                </div>
                <div className="bg-shark-50 rounded-xl px-3 py-2.5 text-center">
                  <p className="text-lg font-bold text-shark-900">{detailUser.conditionChecks?.length || 0}</p>
                  <p className="text-[10px] text-shark-400">Inspections Done</p>
                </div>
                <div className="bg-shark-50 rounded-xl px-3 py-2.5 text-center">
                  <p className={`text-lg font-bold ${(detailUser.damageReports?.length || 0) > 0 ? "text-[#E8532E]" : "text-shark-900"}`}>{detailUser.damageReports?.length || 0}</p>
                  <p className="text-[10px] text-shark-400">Damage Reports</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Deleted Users */}
      {isSuperAdmin && deletedUsers.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setShowDeleted(!showDeleted)}
            className="flex items-center gap-2 text-sm text-shark-400 hover:text-shark-600 transition-colors"
          >
            <Icon name="clock" size={14} />
            <span>{deletedUsers.length} deleted user{deletedUsers.length !== 1 ? "s" : ""}</span>
            <Icon name="chevron-down" size={14} className={`transition-transform ${showDeleted ? "" : "-rotate-90"}`} />
          </button>
          {showDeleted && (
            <div className="mt-3 space-y-2">
              {deletedUsers.map((u) => (
                <Card key={u.id} className="border-dashed border-shark-200 bg-shark-50/50">
                  <div className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-shark-600">{u.name || u.email}</p>
                      <p className="text-xs text-shark-400">
                        {u.email} · {u.role.replace(/_/g, " ")} · {u.region?.name || "Head Office"}
                      </p>
                      <p className="text-xs text-shark-400 mt-0.5">
                        Deleted {new Date(u.deletedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        loading={restoringId === u.id}
                        disabled={!!restoringId}
                        onClick={async () => {
                          setRestoringId(u.id);
                          try {
                            const result = await restoreUser(u.id);
                            if (result.success) {
                              addToast(`${u.name || u.email} restored`, "success");
                              router.refresh();
                            } else {
                              addToast(result.error || "Failed", "error");
                            }
                          } catch (e) { addToast(e instanceof Error ? e.message : "Failed", "error"); }
                          setRestoringId(null);
                        }}
                      >
                        Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={!!restoringId}
                        onClick={async () => {
                          if (!confirm(`Permanently delete ${u.name || u.email}? This cannot be undone.`)) return;
                          setRestoringId(u.id);
                          try {
                            const result = await permanentlyDeleteUser(u.id);
                            if (result.success) {
                              addToast("Permanently deleted", "success");
                              router.refresh();
                            } else {
                              addToast(result.error || "Failed", "error");
                            }
                          } catch (e) { addToast(e instanceof Error ? e.message : "Failed", "error"); }
                          setRestoringId(null);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
