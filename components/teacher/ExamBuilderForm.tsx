"use client";

import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";

type ChapterOption = {
  id: string;
  subjectName: string;
  chapterNumber: number;
  chapterTitle: string;
};

type StudentOption = {
  id: string;
  fullName: string;
  email: string;
};

export function ExamBuilderForm({
  chapters,
  students,
  language = "en",
}: {
  chapters: ChapterOption[];
  students: StudentOption[];
  language?: "en" | "am" | "om" | "ti";
}) {
  const am = language === "am";
  const [chapterId, setChapterId] = useState(chapters[0]?.id ?? "");
  const [title, setTitle] = useState("Grade 11 Custom Exam");
  const [count, setCount] = useState(10);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(30);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [assignAll, setAssignAll] = useState(true);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const selected = useMemo(
    () => chapters.find((c) => c.id === chapterId),
    [chapters, chapterId],
  );
  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q),
    );
  }, [students, search]);

  const generate = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/teacher/exams/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterId,
          title,
          count,
          timeLimitSeconds: timeLimitMinutes * 60,
        }),
      });
      const data = (await res.json()) as { quizId?: string; error?: string };
      if (!res.ok || !data.quizId) {
        throw new Error(data.error || "Failed to generate exam.");
      }
      return data.quizId;
    },
    onSuccess: (quizId) => {
      setQuizId(quizId);
    },
  });

  const assign = useMutation({
    mutationFn: async () => {
      if (!quizId) throw new Error("Generate exam first.");
      const res = await fetch("/api/teacher/exams/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId,
          all: assignAll,
          studentIds: assignAll ? [] : selectedStudentIds,
        }),
      });
      const data = (await res.json()) as { error?: string; assigned?: number };
      if (!res.ok) throw new Error(data.error || "Failed to assign exam.");
      return data.assigned ?? 0;
    },
  });

  function toggleStudent(studentId: string) {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId],
    );
  }

  return (
    <div className="space-y-6">
      <section className="card">
        <h1 className="text-2xl font-bold text-ink">{am ? "ብጁ ፈተና አዘጋጅ" : "Custom Exam Builder"}</h1>
        <p className="mt-1 text-sm text-ink/60">
          {am
            ? "ከማንኛውም ምዕራፍ ጊዜ ያለው ፈተና ይፍጠሩ። ስርዓቱ አዲስ MCQ ይፈጥራል።"
            : "Build a timed exam from any chapter. The system will generate new MCQs and open the exam player."}
        </p>
      </section>

      <section className="card space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">{am ? "ምዕራፍ" : "Chapter"}</label>
          <select
            className="input"
            value={chapterId}
            onChange={(e) => setChapterId(e.target.value)}
          >
            {chapters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.subjectName} - Chapter {c.chapterNumber}: {c.chapterTitle}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink">{am ? "የፈተና ርዕስ" : "Exam Title"}</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Grade 11 Biology Midterm"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">{am ? "የጥያቄ ብዛት" : "Question Count"}</label>
            <input
              type="number"
              min={3}
              max={40}
              className="input"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">{am ? "የጊዜ ገደብ (ደቂቃ)" : "Time Limit (minutes)"}</label>
            <input
              type="number"
              min={2}
              max={120}
              className="input"
              value={timeLimitMinutes}
              onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
            />
          </div>
        </div>

        {selected && (
          <p className="rounded-lg bg-primary-50 px-3 py-2 text-xs text-primary-700">
            {am ? "ምንጭ" : "Source"}: {selected.subjectName} / {am ? "ምዕራፍ" : "Chapter"} {selected.chapterNumber}
          </p>
        )}

        <button
          type="button"
          onClick={() => generate.mutate()}
          disabled={generate.isPending || !chapterId || !title.trim()}
          className="btn-primary w-full"
        >
          {generate.isPending ? (am ? "ፈተና በመፍጠር ላይ..." : "Generating exam...") : (am ? "ፈተና ፍጠር" : "Generate Exam")}
        </button>

        {generate.error && (
          <p className="text-sm text-red-600">{generate.error.message}</p>
        )}
        {quizId && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
            {am ? "ፈተናው ተፈጥሯል።" : "Exam generated successfully."}
            {" "}
            <a href={`/quiz/${quizId}`} className="font-semibold underline">{am ? "ፈተና ክፈት" : "Open exam"}</a>
          </div>
        )}
      </section>

      {quizId && (
        <section className="card space-y-4">
          <h2 className="text-lg font-semibold text-ink">{am ? "ፈተናውን ለተማሪዎች መድብ" : "Assign Exam to Students"}</h2>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={assignAll}
              onChange={(e) => setAssignAll(e.target.checked)}
            />
            {am ? "ለሁሉም ተማሪዎች መድብ" : "Assign to all students"}
          </label>

          {!assignAll && (
            <>
              <input
                className="input"
                placeholder={am ? "ተማሪ በስም ወይም ኢሜይል ፈልግ" : "Search students by name or email"}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-black/10 p-2">
                {filteredStudents.map((student) => (
                  <label key={student.id} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-paper">
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.includes(student.id)}
                      onChange={() => toggleStudent(student.id)}
                    />
                    <span className="text-sm text-ink">
                      {student.fullName}{" "}
                      <span className="text-ink/50">({student.email})</span>
                    </span>
                  </label>
                ))}
                {!filteredStudents.length && (
                  <p className="px-2 py-1 text-sm text-ink/50">{am ? "ተዛማጅ ተማሪ አልተገኘም።" : "No students match your search."}</p>
                )}
              </div>
            </>
          )}

          <button
            type="button"
            onClick={() => assign.mutate()}
            disabled={assign.isPending || (!assignAll && selectedStudentIds.length === 0)}
            className="btn-primary w-full"
          >
            {assign.isPending ? (am ? "በመመደብ ላይ..." : "Assigning...") : (am ? "ፈተና መድብ" : "Assign Exam")}
          </button>
          {assign.isSuccess && (
            <p className="text-sm text-green-700">
              {am
                ? `ለ ${assign.data} ተማሪ(ዎች) ተመድቧል። ማሳወቂያ ተልኳል።`
                : `Assigned successfully to ${assign.data} student(s). Notifications sent.`}
            </p>
          )}
          {assign.error && (
            <p className="text-sm text-red-600">{assign.error.message}</p>
          )}
        </section>
      )}
    </div>
  );
}
