"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { tUi } from "@/lib/i18n/ui";
import type { Language } from "@/lib/supabase/types";

interface Subject {
  id: string;
  name: string;
  grade: number;
}

interface Props {
  subjects: Subject[];
  language: Language;
}

const GRADES = [9, 10, 11, 12];

export function SubjectFilter({ subjects, language }: Props) {
  const [query, setQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState<number | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return subjects.filter((s) => {
      const matchesQuery =
        !q || s.name.toLowerCase().includes(q) || s.grade.toString().includes(q);
      const matchesGrade = gradeFilter === "all" || s.grade === gradeFilter;
      return matchesQuery && matchesGrade;
    });
  }, [subjects, query, gradeFilter]);

  return (
    <div className="space-y-4">
      {/* Search + Filter row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <input
            type="text"
            className="input w-full pl-9"
            placeholder={`${tUi(language, "dashboard.subjects")}…`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-ink/40" />
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setGradeFilter("all")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                gradeFilter === "all"
                  ? "bg-primary text-white"
                  : "bg-paper text-ink/70 hover:bg-primary-50"
              }`}
            >
              All
            </button>
            {GRADES.map((g) => (
              <button
                key={g}
                onClick={() => setGradeFilter(g)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  gradeFilter === g
                    ? "bg-primary text-white"
                    : "bg-paper text-ink/70 hover:bg-primary-50"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-ink/50">
        {filtered.length} / {subjects.length} {tUi(language, "dashboard.subjects")?.toLowerCase()}
      </p>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="card text-center text-ink/60">
          <p>{tUi(language, "dashboard.noTextbooks")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3">
          {filtered.map((s) => (
            <Link
              key={s.id}
              href={`/subjects/${s.id}`}
              className="card p-3 transition hover:border-primary hover:shadow-md sm:p-4"
            >
              <p className="text-xs uppercase tracking-wide text-ink/40">
                Grade {s.grade}
              </p>
              <p className="mt-1 line-clamp-2 text-sm font-semibold text-ink sm:text-base">{s.name}</p>
              <p className="mt-2 text-xs text-primary">Open chapters →</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
