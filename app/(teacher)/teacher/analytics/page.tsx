import Link from "next/link";
import { redirect } from "next/navigation";
import { SimpleBarChart } from "@/components/charts/SimpleBarChart";
import { SimpleLineChart } from "@/components/charts/SimpleLineChart";
import { createAdminClient, createClient } from "@/lib/supabase/server";

type AttemptRow = {
  score: number;
  total: number;
  attempted_at: string;
  student_id: string;
  quiz_id: string;
};
type QuizRow = { id: string; chapter_id: string | null; upload_id: string | null };
type ChapterRow = { id: string; textbook_id: string; title: string };
type TextbookRow = { id: string; subject_id: string };
type SubjectRow = { id: string; name: string; grade: number };
type ProfileGradeRow = { id: string; grade: number | null };

function pct(n: number) {
  return `${Math.round(n * 10) / 10}%`;
}

export default async function TeacherAnalyticsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!(profile?.role === "teacher" || profile?.role === "admin")) redirect("/dashboard");

  const admin = createAdminClient();

  const { data: attempts } = await admin
    .from("quiz_attempts")
    .select("score,total,attempted_at,student_id,quiz_id")
    .order("attempted_at", { ascending: false })
    .limit(3000);
  const attemptRows = (attempts ?? []) as AttemptRow[];

  const { data: quizzes } = await admin.from("quizzes").select("id, chapter_id, upload_id");
  const quizRows = (quizzes ?? []) as QuizRow[];
  const { data: profiles } = await admin.from("profiles").select("id, grade");
  const profileRows = (profiles ?? []) as ProfileGradeRow[];
  const chapterIds = Array.from(new Set(quizRows.map((q: QuizRow) => q.chapter_id).filter(Boolean))) as string[];
  const { data: chapters } = chapterIds.length
    ? await admin.from("chapters").select("id, textbook_id, title").in("id", chapterIds)
    : { data: [] as { id: string; textbook_id: string; title: string }[] };
  const chapterRows = (chapters ?? []) as ChapterRow[];
  const textbookIds = Array.from(new Set(chapterRows.map((c: ChapterRow) => c.textbook_id)));
  const { data: textbooks } = textbookIds.length
    ? await admin.from("textbooks").select("id, subject_id").in("id", textbookIds)
    : { data: [] as { id: string; subject_id: string }[] };
  const textbookRows = (textbooks ?? []) as TextbookRow[];
  const subjectIds = Array.from(new Set(textbookRows.map((t: TextbookRow) => t.subject_id)));
  const { data: subjects } = subjectIds.length
    ? await admin.from("subjects").select("id, name, grade").in("id", subjectIds)
    : { data: [] as { id: string; name: string; grade: number }[] };
  const subjectRowsRaw = (subjects ?? []) as SubjectRow[];

  const quizToChapter = new Map(quizRows.map((q: QuizRow) => [q.id, q.chapter_id]));
  const quizToUpload = new Map(quizRows.map((q: QuizRow) => [q.id, q.upload_id]));
  const chapterToTextbook = new Map(chapterRows.map((c: ChapterRow) => [c.id, c.textbook_id]));
  const textbookToSubject = new Map(textbookRows.map((t: TextbookRow) => [t.id, t.subject_id]));
  const subjectById = new Map(subjectRowsRaw.map((s: SubjectRow) => [s.id, s]));
  const gradeByStudentId = new Map(profileRows.map((p: ProfileGradeRow) => [p.id, p.grade]));

  const byGrade = new Map<number, { scoreSum: number; count: number }>();
  const bySubject = new Map<string, { scoreSum: number; count: number }>();

  for (const a of attemptRows) {
    const percent = a.total > 0 ? (a.score / a.total) * 100 : 0;
    const chapterId = quizToChapter.get(a.quiz_id) ?? null;
    const uploadId = quizToUpload.get(a.quiz_id) ?? null;
    const textbookId = chapterId ? chapterToTextbook.get(chapterId) ?? null : null;
    const subjectId = textbookId ? textbookToSubject.get(textbookId) ?? null : null;
    const subject = subjectId ? subjectById.get(subjectId) : null;
    const gradeFromSubject = subject?.grade ?? null;
    const gradeFromProfile = gradeByStudentId.get(a.student_id) ?? null;
    const grade = gradeFromSubject ?? gradeFromProfile;
    if (grade === null) continue;

    const g = byGrade.get(grade) ?? { scoreSum: 0, count: 0 };
    g.scoreSum += percent;
    g.count += 1;
    byGrade.set(grade, g);

    const subjectLabel = subject?.name ?? (uploadId ? "Drop Mode" : "Unknown");
    const s = bySubject.get(subjectLabel) ?? { scoreSum: 0, count: 0 };
    s.scoreSum += percent;
    s.count += 1;
    bySubject.set(subjectLabel, s);
  }

  const gradeRows = Array.from(byGrade.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([grade, v]) => ({ grade, avg: v.count ? v.scoreSum / v.count : 0, attempts: v.count }));

  const subjectRows = Array.from(bySubject.entries())
    .map(([subject, v]) => ({ subject, avg: v.count ? v.scoreSum / v.count : 0, attempts: v.count }))
    .sort((a, b) => b.attempts - a.attempts)
    .slice(0, 12);

  return (
    <div className="space-y-6">
      <section className="card">
        <h1 className="text-2xl font-bold text-ink">Analytics for Schools, NGOs, and Ministries</h1>
        <p className="mt-1 text-sm text-ink/60">
          Aggregated performance analytics across grades and subjects.
        </p>
        <div className="mt-4 flex gap-2">
          <Link href="/api/teacher/analytics/export" className="btn-primary">Export CSV</Link>
          <Link href="/teacher/dashboard" className="btn-ghost">Back to Dashboard</Link>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <SimpleBarChart
          title="Attempts by Grade"
          points={gradeRows.map((r) => ({ label: `G${r.grade}`, value: r.attempts }))}
        />
        <SimpleLineChart
          title="Average Score by Grade"
          points={gradeRows.map((r) => ({ label: `G${r.grade}`, value: Math.round(r.avg) }))}
        />
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold text-ink">By Grade</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-ink/60">
                <th className="py-2">Grade</th><th className="py-2">Attempts</th><th className="py-2">Avg Score</th>
              </tr>
            </thead>
            <tbody>
              {gradeRows.map((r) => (
                <tr key={r.grade} className="border-t border-black/5">
                  <td className="py-2">{r.grade}</td>
                  <td className="py-2">{r.attempts}</td>
                  <td className="py-2 font-medium text-primary">{pct(r.avg)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold text-ink">Top Subjects by Activity</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-ink/60">
                <th className="py-2">Subject</th><th className="py-2">Attempts</th><th className="py-2">Avg Score</th>
              </tr>
            </thead>
            <tbody>
              {subjectRows.map((r) => (
                <tr key={r.subject} className="border-t border-black/5">
                  <td className="py-2">{r.subject}</td>
                  <td className="py-2">{r.attempts}</td>
                  <td className="py-2 font-medium text-primary">{pct(r.avg)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <SimpleBarChart
          title="Top Subject Activity"
          points={subjectRows.slice(0, 8).map((r) => ({ label: r.subject, value: r.attempts }))}
        />
      </section>
    </div>
  );
}
