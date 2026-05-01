import { redirect } from "next/navigation";
import Link from "next/link";
import { createAdminClient, createClient } from "@/lib/supabase/server";

type AttemptRow = {
  score: number;
  total: number;
  attempted_at: string;
  student_id: string;
};

function pct(value: number): string {
  return `${Math.round(value * 10) / 10}%`;
}

export default async function TeacherDashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  const isTeacher = profile?.role === "teacher" || profile?.role === "admin";
  if (!isTeacher) redirect("/dashboard");

  const admin = createAdminClient();

  const [{ count: students = 0 }, { count: attempts = 0 }, { count: uploads = 0 }] = await Promise.all([
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "student"),
    admin.from("quiz_attempts").select("id", { count: "exact", head: true }),
    admin.from("student_uploads").select("id", { count: "exact", head: true }),
  ]);

  const { data: recentAttempts } = await admin
    .from("quiz_attempts")
    .select("score,total,attempted_at,student_id")
    .order("attempted_at", { ascending: false })
    .limit(200);
  const attemptsRows = (recentAttempts ?? []) as AttemptRow[];

  const avgScore = attemptsRows.length
    ? attemptsRows.reduce((sum: number, a: AttemptRow) => sum + (a.total > 0 ? (a.score / a.total) * 100 : 0), 0) /
      attemptsRows.length
    : 0;

  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const activeStudents = new Set(
    attemptsRows
      .filter((a: AttemptRow) => new Date(a.attempted_at).getTime() >= weekAgo)
      .map((a: AttemptRow) => a.student_id),
  ).size;

  return (
    <div className="space-y-8">
      <section className="card bg-gradient-to-br from-primary to-primary-700 text-white">
        <p className="text-sm uppercase tracking-wide opacity-80">Teacher mode</p>
        <h1 className="mt-1 text-2xl font-bold">School Dashboard</h1>
        <p className="mt-1 text-sm opacity-90">
          Welcome, {profile?.full_name?.trim() || user.email}. Here is a live overview of learner activity.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-ink/40">Students</p>
          <p className="mt-1 text-2xl font-bold text-ink">{students}</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-ink/40">Quiz attempts</p>
          <p className="mt-1 text-2xl font-bold text-ink">{attempts}</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-ink/40">Study uploads</p>
          <p className="mt-1 text-2xl font-bold text-ink">{uploads}</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-ink/40">Average score</p>
          <p className="mt-1 text-2xl font-bold text-primary">{pct(avgScore)}</p>
        </div>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold text-ink">Recent Performance Snapshot</h2>
        <p className="mt-1 text-sm text-ink/60">
          Based on the latest {attemptsRows.length} attempts. Active students in last 7 days: {activeStudents}.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/teacher/exams/new" className="btn-primary inline-flex">
            Build Custom Exam
          </Link>
          <Link href="/teacher/analytics" className="btn-ghost inline-flex">
            Open Analytics
          </Link>
          <Link href="/teacher/premium" className="btn-ghost inline-flex">
            Premium Tier
          </Link>
        </div>
      </section>
    </div>
  );
}
