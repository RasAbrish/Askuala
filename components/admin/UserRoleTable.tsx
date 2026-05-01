"use client";

import { useMemo, useState } from "react";

type UserRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: "student" | "teacher" | "admin";
  grade: number | null;
};

export function UserRoleTable({ users }: { users: UserRow[] }) {
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        (u.full_name || "").toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q),
    );
  }, [users, query]);

  async function updateRole(userId: string, role: UserRow["role"]) {
    setBusyId(userId);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/users/role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to update role");
      setMessage("Role updated. Refresh page to see latest state.");
    } catch (error: any) {
      setMessage(error.message || "Role update failed.");
    } finally {
      setBusyId(null);
    }
  }

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
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-ink/60">
              <th className="py-2">Name</th>
              <th className="py-2">Email</th>
              <th className="py-2">Grade</th>
              <th className="py-2">Role</th>
              <th className="py-2">Change Role</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-t border-black/5">
                <td className="py-2">{u.full_name?.trim() || "-"}</td>
                <td className="py-2">{u.email}</td>
                <td className="py-2">{u.grade ?? "-"}</td>
                <td className="py-2 capitalize">{u.role}</td>
                <td className="py-2">
                  <div className="flex gap-1">
                    <button
                      className="rounded-md border border-black/10 px-2 py-1 text-xs hover:bg-black/5 disabled:opacity-50"
                      onClick={() => updateRole(u.id, "student")}
                      disabled={busyId === u.id || u.role === "student"}
                    >
                      Student
                    </button>
                    <button
                      className="rounded-md border border-black/10 px-2 py-1 text-xs hover:bg-black/5 disabled:opacity-50"
                      onClick={() => updateRole(u.id, "teacher")}
                      disabled={busyId === u.id || u.role === "teacher"}
                    >
                      Teacher
                    </button>
                    <button
                      className="rounded-md border border-black/10 px-2 py-1 text-xs hover:bg-black/5 disabled:opacity-50"
                      onClick={() => updateRole(u.id, "admin")}
                      disabled={busyId === u.id || u.role === "admin"}
                    >
                      Admin
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {message && <p className="mt-3 text-sm text-ink/70">{message}</p>}
    </section>
  );
}
