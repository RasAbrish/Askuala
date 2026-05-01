"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";

type Subject = { id: string; name: string; grade: number };

export function SubjectManager() {
  const [name, setName] = useState("");
  const [grade, setGrade] = useState(11);
  const [message, setMessage] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["admin-subjects"],
    queryFn: async () => {
      const res = await fetch("/api/admin/subjects");
      const data = (await res.json()) as { subjects?: Subject[]; error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to load subjects");
      return data.subjects ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, grade }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to create subject");
    },
    onSuccess: async () => {
      setName("");
      setMessage("Subject created.");
      await query.refetch();
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/subjects/${id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to delete subject");
    },
    onSuccess: async () => {
      setMessage("Subject deleted.");
      await query.refetch();
    },
  });

  return (
    <div className="space-y-6">
      <section className="card">
        <h2 className="text-lg font-semibold text-ink">Add Subject</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <input className="input sm:col-span-2" placeholder="Biology" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" type="number" min={9} max={12} value={grade} onChange={(e) => setGrade(Number(e.target.value))} />
        </div>
        <button className="btn-primary mt-3" onClick={() => create.mutate()} disabled={create.isPending || !name.trim()}>
          {create.isPending ? "Creating..." : "Create Subject"}
        </button>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold text-ink">Subjects</h2>
        <ul className="mt-3 space-y-2">
          {(query.data ?? []).map((s) => (
            <li key={s.id} className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2 text-sm">
              <span>Grade {s.grade} - {s.name}</span>
              <button className="rounded-md border border-red-200 px-2 py-1 text-red-700 hover:bg-red-50" onClick={() => remove.mutate(s.id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
        {message && <p className="mt-3 text-sm text-ink/70">{message}</p>}
      </section>
    </div>
  );
}
