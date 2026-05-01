"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";

type Subject = { id: string; name: string; grade: number };
type ClassRow = { id: string; name: string; grade: number; subject_id: string | null };

export function ClassManager({ subjects }: { subjects: Subject[] }) {
  const [name, setName] = useState("");
  const [grade, setGrade] = useState(11);
  const [subjectId, setSubjectId] = useState("");

  const classes = useQuery({
    queryKey: ["teacher-classes"],
    queryFn: async () => {
      const res = await fetch("/api/teacher/classes");
      const data = (await res.json()) as { classes?: ClassRow[]; error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to load classes");
      return data.classes ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/teacher/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, grade, subject_id: subjectId || null }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to create class");
    },
    onSuccess: async () => {
      setName("");
      await classes.refetch();
    },
  });

  const subjectName = new Map(subjects.map((s) => [s.id, s.name]));

  return (
    <div className="space-y-6">
      <section className="card">
        <h2 className="text-lg font-semibold text-ink">Create Class</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <input className="input sm:col-span-2" placeholder="Grade 11-B Biology" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" type="number" min={9} max={12} value={grade} onChange={(e) => setGrade(Number(e.target.value))} />
        </div>
        <select className="input mt-3" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          <option value="">Optional subject</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>Grade {s.grade} - {s.name}</option>
          ))}
        </select>
        <button className="btn-primary mt-3" onClick={() => create.mutate()} disabled={create.isPending || !name.trim()}>
          {create.isPending ? "Creating..." : "Create Class"}
        </button>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold text-ink">Your Classes</h2>
        <ul className="mt-3 space-y-2">
          {(classes.data ?? []).map((c) => (
            <li key={c.id} className="rounded-lg border border-black/10 px-3 py-2 text-sm">
              <p className="font-medium text-ink">{c.name}</p>
              <p className="text-ink/60">Grade {c.grade}{c.subject_id ? ` • ${subjectName.get(c.subject_id) ?? "Subject"}` : ""}</p>
            </li>
          ))}
          {!classes.data?.length && <li className="text-sm text-ink/60">No classes yet.</li>}
        </ul>
      </section>
    </div>
  );
}
