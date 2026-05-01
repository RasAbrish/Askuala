"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";

type Subject = { id: string; name: string; grade: number };
type Textbook = { id: string; subject_id: string; title: string; pdf_url: string | null; total_pages: number | null };

export function TextbookManager() {
  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [totalPages, setTotalPages] = useState<number>(120);

  const subjects = useQuery({
    queryKey: ["admin-subjects"],
    queryFn: async () => {
      const res = await fetch("/api/admin/subjects");
      const data = (await res.json()) as { subjects?: Subject[]; error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to load subjects");
      return data.subjects ?? [];
    },
  });

  const textbooks = useQuery({
    queryKey: ["admin-textbooks"],
    queryFn: async () => {
      const res = await fetch("/api/admin/textbooks");
      const data = (await res.json()) as { textbooks?: Textbook[]; error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to load textbooks");
      return data.textbooks ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/textbooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject_id: subjectId,
          title,
          pdf_url: pdfUrl.trim() || null,
          total_pages: Number.isFinite(totalPages) ? totalPages : null,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to create textbook");
    },
    onSuccess: async () => {
      setTitle("");
      setPdfUrl("");
      await textbooks.refetch();
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/textbooks/${id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to delete textbook");
    },
    onSuccess: async () => {
      await textbooks.refetch();
    },
  });

  const subjectName = new Map((subjects.data ?? []).map((s) => [s.id, `Grade ${s.grade} - ${s.name}`]));

  return (
    <div className="space-y-6">
      <section className="card">
        <h2 className="text-lg font-semibold text-ink">Add Textbook</h2>
        <div className="mt-3 grid gap-3">
          <select className="input" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">Select subject</option>
            {(subjects.data ?? []).map((s) => (
              <option key={s.id} value={s.id}>Grade {s.grade} - {s.name}</option>
            ))}
          </select>
          <input className="input" placeholder="Grade 11 Biology Student Textbook" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className="input" placeholder="https://...pdf (optional)" value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} />
          <input className="input" type="number" min={1} max={10000} value={totalPages} onChange={(e) => setTotalPages(Number(e.target.value))} />
        </div>
        <button className="btn-primary mt-3" onClick={() => create.mutate()} disabled={create.isPending || !subjectId || !title.trim()}>
          {create.isPending ? "Creating..." : "Create Textbook"}
        </button>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold text-ink">Textbooks</h2>
        <ul className="mt-3 space-y-2">
          {(textbooks.data ?? []).map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-4 rounded-lg border border-black/10 px-3 py-2 text-sm">
              <div>
                <p className="font-medium text-ink">{b.title}</p>
                <p className="text-ink/60">{subjectName.get(b.subject_id) ?? "Unknown subject"} • Pages: {b.total_pages ?? "-"}</p>
              </div>
              <button className="rounded-md border border-red-200 px-2 py-1 text-red-700 hover:bg-red-50" onClick={() => remove.mutate(b.id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
