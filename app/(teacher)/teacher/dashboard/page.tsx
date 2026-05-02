import { redirect } from "next/navigation";
import Link from "next/link";
import { SimpleBarChart } from "@/components/charts/SimpleBarChart";
import { SimpleLineChart } from "@/components/charts/SimpleLineChart";
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

  const daily = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx));
    const key = d.toISOString().slice(0, 10);
    const rows = attemptsRows.filter((a) => String(a.attempted_at).startsWith(key));
    const avg = rows.length
      ? rows.reduce((s, a) => s + (a.total > 0 ? (a.score / a.total) * 100 : 0), 0) / rows.length
      : 0;
    return { label: key.slice(5), value: Math.round(avg) };
  });

  return (
    <div className="space-y-6">
      {/* Welcome Hero Card */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-600 to-primary-700 p-8 text-white shadow-2xl">
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-primary-100">
                Teacher Mode
              </p>
              <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
                School Dashboard
              </h1>
              <p className="mt-2 text-base text-primary-100">
                Welcome, {profile?.full_name?.trim() || user.email}. Here is a live overview of learner activity.
              </p>
            </div>
            {activeStudents > 0 && (
              <div className="rounded-2xl bg-white/10 px-4 py-3 text-center backdrop-blur-sm">
                <p className="text-3xl font-bold">{activeStudents}</p>
                <p className="text-xs text-primary-100">Active 7d</p>
              </div>
            )}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/teacher/exams/new"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-primary transition-all hover:bg-primary-50 hover:shadow-md"
            >
              Build Custom Exam
            </Link>
            <Link
              href="/teacher/analytics"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              Open Analytics
            </Link>
          </div>
        </div>
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
      </section>

      {/* Stats Grid */}
      <section>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="card group hover-lift bg-gradient-to-br from-white to-primary-50">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Students
            </p>
            <p className="mt-3 text-4xl font-bold text-slate-800">{students}</p>
            <div className="mt-2 h-1 w-12 rounded-full bg-primary" />
          </div>
          <div className="card group hover-lift bg-gradient-to-br from-white to-accent-50">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Quiz Attempts
            </p>
            <p className="mt-3 text-4xl font-bold text-slate-800">{attempts}</p>
            <div className="mt-2 h-1 w-12 rounded-full bg-accent" />
          </div>
          <div className="card group hover-lift bg-gradient-to-br from-white to-blue-50">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Study Uploads
            </p>
            <p className="mt-3 text-4xl font-bold text-slate-800">{uploads}</p>
            <div className="mt-2 h-1 w-12 rounded-full bg-blue-500" />
          </div>
          <div className="card group hover-lift bg-gradient-to-br from-white to-green-50">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Average Score
            </p>
            <p className="mt-3 text-4xl font-bold text-primary">{pct(avgScore)}</p>
            <div className="mt-2 h-1 w-12 rounded-full bg-green-500" />
          </div>
        </div>
      </section>

      {/* Charts Section */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card hover-lift">
          <SimpleBarChart
            title="Class Activity"
            points={[
              { label: "Students", value: students },
              { label: "Attempts", value: attempts },
              { label: "Uploads", value: uploads },
              { label: "Active 7d", value: activeStudents },
            ]}
          />
        </div>
        <div className="card hover-lift">
          <SimpleLineChart title="Average Score Trend (7 Days)" points={daily} />
        </div>
      </section>

      {/* Quick Actions */}
      <section className="card bg-gradient-to-br from-primary-50 to-accent-50">
        <h2 className="text-xl font-bold text-slate-800">Quick Actions</h2>
        <p className="mt-2 text-sm text-slate-600">
          Based on the latest {attemptsRows.length} attempts. Active students in last 7 days: {activeStudents}.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/teacher/exams/new" className="btn-primary">
            Build Custom Exam
          </Link>
          <Link href="/teacher/analytics" className="btn-secondary">
            Open Analytics
          </Link>
          <Link href="/teacher/premium" className="btn-secondary">
            Premium Tier
          </Link>
        </div>
      </section>
    </div>
  );
}
