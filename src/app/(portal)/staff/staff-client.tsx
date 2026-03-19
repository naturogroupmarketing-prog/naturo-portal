"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { createUser, updateUser, deleteUser, resetPassword, toggleUserActive } from "@/app/actions/users";

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
  phone: string | null;
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

interface StaffClientProps {
  users: StaffUser[];
  regions: Region[];
  allRegions: Region[];
  isSuperAdmin: boolean;
  canViewStaffDetails?: boolean;
}

export function StaffClient({ users, regions, allRegions, isSuperAdmin, canViewStaffDetails = true }: StaffClientProps) {
  const [search, setSearch] = useState("");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // Create user modal state
  const [showCreate, setShowCreate] = useState(false);

  // Edit modal state
  const [editUser, setEditUser] = useState<StaffUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState("STAFF");
  const [editRegionId, setEditRegionId] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

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
  };

  const closeEdit = () => {
    setEditUser(null);
    setShowResetPassword(false);
    setShowDeleteConfirm(false);
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
      await deleteUser(editUser.id);
      closeEdit();
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
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-shark-100">
            <th className="px-1 py-3 w-6"></th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-shark-400">Name</th>
            {canViewStaffDetails && <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-shark-400 hidden md:table-cell">Email</th>}
            {canViewStaffDetails && <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-shark-400 hidden lg:table-cell">Phone</th>}
            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-shark-400">Role</th>
            <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-shark-400">Assigned Assets</th>
            <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-shark-400">Status</th>
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
                {canViewStaffDetails && <td className="px-5 py-3.5 text-shark-500 hidden md:table-cell">{user.email}</td>}
                {canViewStaffDetails && <td className="px-5 py-3.5 text-shark-500 hidden lg:table-cell">{user.phone || "—"}</td>}
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-shark-900">Staff Overview</h1>
          <p className="text-sm text-shark-400 mt-1">{filtered.length} staff members</p>
        </div>
        {isSuperAdmin && <Button onClick={() => setShowCreate(true)}>+ New User</Button>}
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

      {/* Create User Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create User">
        <form action={async (fd) => { await createUser(fd); setShowCreate(false); }} className="space-y-4">
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
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit">Create User</Button>
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
                    <span className={`w-2 h-2 rounded-full ${editUser.isActive ? "bg-emerald-500" : "bg-shark-300"}`} />
                    <span className="text-sm text-shark-700">{editUser.isActive ? "Active" : "Disabled"}</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={handleToggleActive}>
                    {editUser.isActive ? "Disable User" : "Enable User"}
                  </Button>
                </div>

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
                    <Button onClick={handleEdit} disabled={editSaving}>
                      {editSaving ? "Saving..." : "Save Changes"}
                    </Button>
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
                      <span className={`w-2 h-2 rounded-full ${editUser.isActive ? "bg-emerald-500" : "bg-shark-300"}`} />
                      <span className="text-sm text-shark-800">{editUser.isActive ? "Active" : "Disabled"}</span>
                    </div>
                  </div>
                  {editUser.assetAssignments.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-shark-400 mb-1">Assigned Assets ({editUser.assetAssignments.length})</label>
                      <div className="space-y-1">
                        {editUser.assetAssignments.map((a) => (
                          <p key={a.asset.assetCode} className="text-sm text-shark-700">
                            <span className="font-mono text-xs text-shark-400 mr-1">{a.asset.assetCode}</span>
                            {a.asset.name}
                          </p>
                        ))}
                      </div>
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
                {resetSuccess && <p className="text-sm text-emerald-600">Password reset successfully!</p>}
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
                  <p className="text-sm text-amber-600 font-medium">
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
    </div>
  );
}
