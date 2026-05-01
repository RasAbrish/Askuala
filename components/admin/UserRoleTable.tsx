"use client";

import { useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";

type UserRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: "student" | "teacher" | "admin";
  grade: number | null;
};

type Role = UserRow["role"];
const col = createColumnHelper<UserRow>();

export function UserRoleTable({ users: initialUsers }: { users: UserRow[] }) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: "",
    fullName: "",
    role: "student" as Role,
    grade: "",
    password: "",
  });

  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState({ fullName: "", grade: "" });
  const [passwordUser, setPasswordUser] = useState<UserRow | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [deleteUserTarget, setDeleteUserTarget] = useState<UserRow | null>(null);

  function clearFlash() {
    setMessage(null);
    setError(null);
  }

  async function createUser() {
    clearFlash();
    setCreating(true);
    try {
      const payload = {
        email: createForm.email,
        fullName: createForm.fullName,
        role: createForm.role,
        grade: createForm.grade ? Number(createForm.grade) : null,
        password: createForm.password,
      };
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { error?: string; userId?: string };
      if (!res.ok) throw new Error(data.error || "Failed to create user");

      setUsers((prev) => [
        {
          id: data.userId || crypto.randomUUID(),
          email: createForm.email,
          full_name: createForm.fullName,
          role: createForm.role,
          grade: createForm.grade ? Number(createForm.grade) : null,
        },
        ...prev,
      ]);

      setCreateForm({ email: "", fullName: "", role: "student", grade: "", password: "" });
      setMessage("User created successfully.");
    } catch (e: any) {
      setError(e.message || "Create user failed.");
    } finally {
      setCreating(false);
    }
  }

  async function updateUser(userId: string, patch: Partial<{ role: Role; fullName: string; grade: number | null; newPassword: string }>) {
    setBusyId(userId);
    clearFlash();
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          role: patch.role,
          fullName: patch.fullName,
          grade: patch.grade,
          newPassword: patch.newPassword,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Update failed");

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                role: patch.role ?? u.role,
                full_name: patch.fullName ?? u.full_name,
                grade: patch.grade !== undefined ? patch.grade : u.grade,
              }
            : u,
        ),
      );
      setMessage("User updated.");
    } catch (e: any) {
      setError(e.message || "Update failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteUser(userId: string) {
    setBusyId(userId);
    clearFlash();
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Delete failed");

      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setMessage("User deleted.");
    } catch (e: any) {
      setError(e.message || "Delete failed.");
    } finally {
      setBusyId(null);
    }
  }

  const columns = [
      col.accessor("full_name", {
        header: "Name",
        cell: (info) => info.getValue()?.trim() || "-",
      }),
      col.accessor("email", {
        header: "Email",
      }),
      col.accessor("grade", {
        header: "Grade",
        cell: (info) => info.getValue() ?? "-",
      }),
      col.accessor("role", {
        header: "Role",
        cell: (info) => <span className="capitalize">{info.getValue()}</span>,
      }),
      col.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const u = row.original;
          return (
            <div className="flex flex-wrap gap-1 py-1">
              <button className="rounded-md border border-black/10 px-2 py-1 text-xs hover:bg-black/5 disabled:opacity-50" onClick={() => updateUser(u.id, { role: "student" })} disabled={busyId === u.id || u.role === "student"}>Student</button>
              <button className="rounded-md border border-black/10 px-2 py-1 text-xs hover:bg-black/5 disabled:opacity-50" onClick={() => updateUser(u.id, { role: "teacher" })} disabled={busyId === u.id || u.role === "teacher"}>Teacher</button>
              <button className="rounded-md border border-black/10 px-2 py-1 text-xs hover:bg-black/5 disabled:opacity-50" onClick={() => updateUser(u.id, { role: "admin" })} disabled={busyId === u.id || u.role === "admin"}>Admin</button>
              <button className="rounded-md border border-black/10 px-2 py-1 text-xs hover:bg-black/5 disabled:opacity-50" onClick={() => {
                setEditUser(u);
                setEditForm({ fullName: u.full_name ?? "", grade: u.grade?.toString() ?? "" });
              }} disabled={busyId === u.id}>Edit</button>
              <button className="rounded-md border border-black/10 px-2 py-1 text-xs hover:bg-black/5 disabled:opacity-50" onClick={() => {
                setPasswordUser(u);
                setNewPassword("");
              }} disabled={busyId === u.id}>Password</button>
              <button className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50" onClick={() => setDeleteUserTarget(u)} disabled={busyId === u.id}>Delete</button>
            </div>
          );
        },
      }),
    ];

  const table = useReactTable({
    data: users,
    columns,
    state: { globalFilter: query },
    onGlobalFilterChange: setQuery,
    globalFilterFn: "includesString",
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <section className="card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">Users and Roles</h2>
        <input
          className="input max-w-xs"
          placeholder="Search user by email/name/role"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="mt-4 rounded-xl border border-black/10 p-3">
        <h3 className="text-sm font-semibold text-ink">Add User</h3>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
          <input className="input" placeholder="Full name" value={createForm.fullName} onChange={(e) => setCreateForm((f) => ({ ...f, fullName: e.target.value }))} />
          <input className="input" placeholder="Email" type="email" value={createForm.email} onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))} />
          <input className="input" placeholder="Password" type="password" value={createForm.password} onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))} />
          <select className="input" value={createForm.role} onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value as Role }))}>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>
          <input className="input" placeholder="Grade (9-12, optional)" value={createForm.grade} onChange={(e) => setCreateForm((f) => ({ ...f, grade: e.target.value }))} />
          <button className="btn-primary" type="button" disabled={creating} onClick={createUser}>{creating ? "Creating..." : "Add"}</button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="text-left text-ink/60">
                {hg.headers.map((h) => (
                  <th key={h.id} className="py-2 pr-2">
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t border-black/5">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="py-2 pr-2 align-top">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {message && <p className="mt-3 text-sm text-green-700">{message}</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {editUser && (
        <Modal title="Edit User" onClose={() => setEditUser(null)}>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Full name</label>
              <input className="input" value={editForm.fullName} onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Grade (optional)</label>
              <input className="input" value={editForm.grade} onChange={(e) => setEditForm((f) => ({ ...f, grade: e.target.value }))} placeholder="9-12" />
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setEditUser(null)}>Cancel</button>
              <button
                className="btn-primary"
                onClick={async () => {
                  await updateUser(editUser.id, {
                    fullName: editForm.fullName.trim(),
                    grade: editForm.grade.trim() ? Number(editForm.grade) : null,
                  });
                  setEditUser(null);
                }}
              >
                Save
              </button>
            </div>
          </div>
        </Modal>
      )}

      {passwordUser && (
        <Modal title="Reset Password" onClose={() => setPasswordUser(null)}>
          <div className="space-y-3">
            <p className="text-sm text-ink/60">Set a new password for {passwordUser.email}</p>
            <input
              type="password"
              className="input"
              placeholder="At least 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setPasswordUser(null)}>Cancel</button>
              <button
                className="btn-primary"
                onClick={async () => {
                  if (newPassword.length < 6) {
                    setError("Password must be at least 6 characters.");
                    return;
                  }
                  await updateUser(passwordUser.id, { newPassword });
                  setPasswordUser(null);
                }}
              >
                Update Password
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteUserTarget && (
        <Modal title="Delete User" onClose={() => setDeleteUserTarget(null)}>
          <div className="space-y-3">
            <p className="text-sm text-ink/70">
              Are you sure you want to delete <span className="font-semibold">{deleteUserTarget.email}</span>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setDeleteUserTarget(null)}>Cancel</button>
              <button
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                onClick={async () => {
                  await deleteUser(deleteUserTarget.id);
                  setDeleteUserTarget(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-ink">{title}</h3>
          <button className="rounded px-2 py-1 text-sm text-ink/60 hover:bg-black/5" onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}
