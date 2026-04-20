"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Icon } from "@/components/ui/icon";
import { createUser, updateUser, deleteUser, batchDisableUsers, resetPassword } from "@/app/actions/users";
import { useToast } from "@/components/ui/toast";

const SECTION_COLORS = [
  { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  { color: "text-action-600", bg: "bg-action-50", border: "border-action-200" },
  { color: "text-[#E8532E]", bg: "bg-amber-50", border: "border-amber-200" },
  { color: "text-cyan-600", bg: "bg-cyan-50", border: "border-cyan-200" },
  { color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
  { color: "text-shark-600 dark:text-shark-400", bg: "bg-shark-50", border: "border-shark-200" },
  { color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-200" },
  { color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
  { color: "text-lime-600", bg: "bg-lime-50", border: "border-lime-200" },
  { color: "text-gray-600", bg: "bg-gray-100", border: "border-gray-200" },
  { color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200" },
  { color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200" },
  { color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-200" },
  { color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" },
  { color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-200" },
];

interface User {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  region: { id: string; name: string; state: { name: string } } | null;
  createdAt: string;
}

interface Region {
  id: string;
  name: string;
  state: { name: string };
}

export function UsersClient({ users, regions }: { users: User[]; regions: Region[] }) {
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [disabling, setDisabling] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const { addToast } = useToast();

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

  const activeFiltered = filtered.filter((u) => u.isActive);

  // Group filtered users by region
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

  // Head Office group for users without a region
  const headOfficeUsers = filtered.filter((u) => !u.region);
  const headOfficeColors = SECTION_COLORS[regions.length % SECTION_COLORS.length];
  const isHeadOfficeCollapsed = collapsedSections.has("head-office");

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === activeFiltered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(activeFiltered.map((u) => u.id)));
    }
  };

  const handleDisableSelected = async () => {
    if (selected.size === 0) return;
    setDisabling(true);
    try {
      await batchDisableUsers(Array.from(selected));
      setSelected(new Set());
    } finally {
      setDisabling(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteUser(deleteTarget.id);
      setDeleteTarget(null);
      setEditUser(null);
    } catch (e: unknown) {
      setDeleteError(e instanceof Error ? e.message : "Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  const renderUserTable = (sectionUsers: User[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-shark-100 dark:border-shark-700">
            <th scope="col" className="px-3 py-3.5 text-center w-10">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-shark-300 text-action-500 focus:ring-action-500 cursor-pointer"
                checked={activeFiltered.length > 0 && selected.size === activeFiltered.length}
                onChange={toggleAll}
              />
            </th>
            <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-shark-400">Name</th>
            <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-shark-400">Email</th>
            <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-shark-400">Role</th>
            <th scope="col" className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-shark-400">Active</th>
            <th scope="col" className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-shark-400">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sectionUsers.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-5 py-8 text-center text-sm text-shark-400">
                No users in this section.
              </td>
            </tr>
          ) : (
            sectionUsers.map((user) => (
              <tr key={user.id} className={`border-b border-shark-50 dark:border-shark-800 hover:bg-shark-50 dark:hover:bg-shark-800/50 dark:hover:bg-shark-800/50 ${selected.has(user.id) ? "bg-action-50/40" : ""}`}>
                <td className="px-3 py-3.5 text-center">
                  {user.isActive ? (
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-shark-300 text-action-500 focus:ring-action-500 cursor-pointer"
                      checked={selected.has(user.id)}
                      onChange={() => toggleSelect(user.id)}
                    />
                  ) : (
                    <span className="text-xs text-shark-300">—</span>
                  )}
                </td>
                <td className="px-5 py-3.5 font-medium text-shark-800 dark:text-shark-200">{user.name || "—"}</td>
                <td className="px-5 py-3.5 text-shark-500 dark:text-shark-400">{user.email}</td>
                <td className="px-5 py-3.5"><Badge status={user.role} /></td>
                <td className="px-5 py-3.5 text-center">
                  <span className={`inline-block w-2.5 h-2.5 rounded-full ${user.isActive ? "bg-action-500" : "bg-red-400"}`} />
                </td>
                <td className="px-5 py-3.5 text-right">
                  <Button size="sm" variant="secondary" onClick={() => setEditUser(user)}>
                    Edit
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-shark-900 dark:text-shark-100 tracking-tight">User Management</h1>
          <p className="text-sm text-shark-400 mt-1">{filtered.length} total users</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Icon name="plus" size={14} className="mr-1.5" />
          New User
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        {selected.size > 0 && (
          <Button
            variant="danger"
            size="sm"
            onClick={handleDisableSelected}
            disabled={disabling}
          >
            {disabling ? "Disabling..." : `Disable Selected (${selected.size})`}
          </Button>
        )}
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
                  <h2 className="text-lg font-semibold text-shark-900 dark:text-shark-100">{section.name}</h2>
                  <span className="text-xs text-shark-400">{section.stateName}</span>
                  <span className="text-xs font-medium text-shark-400 bg-shark-100 dark:bg-shark-700 px-2 py-0.5 rounded-full">
                    {section.users.length}
                  </span>
                </div>
                <Icon
                  name="chevron-down"
                  size={16}
                  className={`text-shark-400 group-hover:text-shark-600 dark:text-shark-400 transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                />
              </button>
              {!isCollapsed && (
                <Card>
                  {renderUserTable(section.users)}
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
              <h2 className="text-lg font-semibold text-shark-900 dark:text-shark-100">Head Office</h2>
              <span className="text-xs text-shark-400">No region assigned</span>
              <span className="text-xs font-medium text-shark-400 bg-shark-100 dark:bg-shark-700 px-2 py-0.5 rounded-full">
                {headOfficeUsers.length}
              </span>
            </div>
            <Icon
              name="chevron-down"
              size={16}
              className={`text-shark-400 group-hover:text-shark-600 dark:text-shark-400 transition-transform ${isHeadOfficeCollapsed ? "-rotate-90" : ""}`}
            />
          </button>
          {!isHeadOfficeCollapsed && (
            <Card>
              {renderUserTable(headOfficeUsers)}
            </Card>
          )}
        </div>
      )}

      {/* Create User Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create User">
        <form action={async (fd) => {
          const result = await createUser(fd);
          if (result.error) {
            addToast(result.error, "error");
          } else {
            addToast("User created successfully", "success");
            setShowCreate(false);
          }
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 dark:text-shark-300 mb-1">Name *</label>
            <Input name="name" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 dark:text-shark-300 mb-1">Email *</label>
            <Input name="email" type="email" required placeholder="user@company.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 dark:text-shark-300 mb-1">Phone</label>
            <Input name="phone" type="tel" placeholder="e.g. 0412 345 678" />
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 dark:text-shark-300 mb-1">Password *</label>
            <Input name="password" type="password" required minLength={8} placeholder="Min 8 characters" />
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 dark:text-shark-300 mb-1">Role *</label>
            <Select name="role" required>
              <option value="STAFF">Staff</option>
              <option value="BRANCH_MANAGER">Regional Manager</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 dark:text-shark-300 mb-1">Region</label>
            <Select name="regionId">
              <option value="">No region (head office)</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.state.name} / {r.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit">Create User</Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Edit User">
        {editUser && (
          <div className="space-y-5">
            <form action={async (fd) => {
              const result = await updateUser(fd);
              if (result && "error" in result) {
                addToast(result.error as string, "error");
              } else {
                addToast("User updated successfully", "success");
                setEditUser(null);
              }
            }} className="space-y-4">
              <input type="hidden" name="userId" value={editUser.id} />
              <div>
                <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 dark:text-shark-300 mb-1">Email</label>
                <Input name="email" type="email" required defaultValue={editUser.email} />
              </div>
              <div>
                <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 dark:text-shark-300 mb-1">Name *</label>
                <Input name="name" required defaultValue={editUser.name || ""} />
              </div>
              <div>
                <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 dark:text-shark-300 mb-1">Phone</label>
                <Input name="phone" type="tel" defaultValue={editUser.phone || ""} placeholder="e.g. 0412 345 678" />
              </div>
              <div>
                <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 dark:text-shark-300 mb-1">Role *</label>
                <Select name="role" required defaultValue={editUser.role}>
                  <option value="STAFF">Staff</option>
                  <option value="BRANCH_MANAGER">Regional Manager</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 dark:text-shark-300 mb-1">Region</label>
                <Select name="regionId" defaultValue={editUser.region?.id || ""}>
                  <option value="">No region (head office)</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.state.name} / {r.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setEditUser(null)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
            <hr className="border-shark-100 dark:border-shark-700" />
            <form action={async (fd) => { await resetPassword(editUser.id, fd.get("newPassword") as string); setEditUser(null); }} className="space-y-3">
              <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 dark:text-shark-300">Reset Password</label>
              <Input name="newPassword" type="password" required minLength={6} placeholder="New password (min 6 characters)" />
              <Button type="submit" size="sm" variant="secondary">Reset Password</Button>
            </form>
            <hr className="border-shark-100 dark:border-shark-700" />
            <div className="space-y-3">
              <label className="block text-sm font-medium text-red-600">Danger Zone</label>
              <p className="text-xs text-shark-400">Permanently delete this user. Their assignment history will be archived in the audit log.</p>
              {deleteError && <p className="text-sm text-red-500">{deleteError}</p>}
              {deleteTarget?.id === editUser.id ? (
                <div className="flex items-center gap-2">
                  <p className="text-sm text-red-500 flex-1">Are you sure? This cannot be undone.</p>
                  <Button size="sm" variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                  <Button size="sm" variant="danger" onClick={handleDelete} disabled={deleting}>
                    {deleting ? "Deleting..." : "Confirm Delete"}
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="danger" onClick={() => { setDeleteTarget(editUser); setDeleteError(""); }}>
                  Delete User
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
