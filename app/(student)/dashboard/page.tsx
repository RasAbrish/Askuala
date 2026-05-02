import Link from "next/link";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { ArrowRight, Clock3, Upload } from "lucide-react";
import { SubjectFilter } from "@/components/dashboard/SubjectFilter";
import { tUi } from "@/lib/i18n/ui";
import type { Language } from "@/lib/supabase/types";

function toDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function calculateStreak(attemptDates: string[]): number {
  if (!attemptDates.length) return 0;
  const dayKeys = Array.from(
    new Set(attemptDates.map((d) => toDayKey(new Date(d)))),
  ).sort((a, b) => (a < b ? 1 : -1));

  const today = new Date();
  const todayKey = toDayKey(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = toDayKey(yesterday);

  if (dayKeys[0] !== todayKey && dayKeys[0] !== yesterdayKey) return 0;

  let streak = 1;
  let cursor = new Date(dayKeys[0]);
  for (let i = 1; i < dayKeys.length; i += 1) {
    cursor.setDate(cursor.getDate() - 1);
    if (toDayKey(cursor) === dayKeys[i]) streak += 1;
    else break;
  }
  return streak;
}

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("language_pref")
    .eq("id", user?.id ?? "")
    .single();
  const language = (profile?.language_pref ?? "en") as Language;

  const admin = createAdminClient();
  const { data: subjects } = await admin
    .from("subjects")
    .select("id, name, grade")
    .order("grade", { ascending: true })
    .order("name", { ascending: true });

  const { data: attempts } = user
    ? await supabase
        .from("quiz_attempts")
        .select("score,total,attempted_at")
        .eq("student_id", user.id)
        .order("attempted_at", { ascending: false })
        .limit(100)
    : { data: [] as { score: number; total: number; attempted_at: string }[] };
  const { data: assignments } = user
    ? await supabase
        .from("exam_assignments")
        .select("quiz_id, assigned_at")
        .eq("student_id", user.id)
        .order("assigned_at", { ascending: false })
        .limit(10)
    : { data: [] as { quiz_id: string; assigned_at: string }[] };

  const assignedQuizIds = Array.from(new Set((assignments ?? []).map((a) => a.quiz_id)));
  const { data: assignedQuizzes } = assignedQuizIds.length
    ? await supabase
        .from("quizzes")
        .select("id,title,time_limit_seconds")
        .in("id", assignedQuizIds)
    : { data: [] as { id: string; title: string; time_limit_seconds: number | null }[] };

  const totalAttempts = attempts?.length ?? 0;
  const avgPercent = totalAttempts
    ? Math.round(
        (attempts!.reduce(
          (sum, a) => sum + (a.total > 0 ? (a.score / a.total) * 100 : 0),
          0,
        ) /
          totalAttempts) *
          10,
      ) / 10
    : 0;
  const streakDays = calculateStreak((attempts ?? []).map((a) => a.attempted_at));
  const readiness = Math.min(100, Math.round(avgPercent * 0.85 + streakDays * 2));
  const recentAttempts = (attempts ?? []).slice(0, 5);
  const strongAttempts = (attempts ?? []).filter(
    (a) => a.total > 0 && (a.score / a.total) * 100 >= 70,
  ).length;

  return (
    <div className="space-y-6">
      {/* Welcome Hero Card */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary via-primary-600 to-primary-700 p-6 sm:p-8 text-white shadow-2xl">
        <div className="relative z-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium uppercase tracking-wider text-primary-100">
                {tUi(language, "dashboard.today")}
              </p>
              <h1 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold">
                {tUi(language, "dashboard.letsStudy")}
              </h1>
              <p className="mt-2 text-sm sm:text-base text-primary-100">
                {tUi(language, "dashboard.pickSubject")}
              </p>
            </div>
            {streakDays > 0 && (
              <div className="rounded-2xl bg-white/10 px-4 py-3 text-center backdrop-blur-sm self-start">
                <p className="text-2xl sm:text-3xl font-bold">{streakDays}</p>
                <p className="text-xs text-primary-100">
                  {tUi(language, streakDays === 1 ? "dashboard.day" : "dashboard.days")} streak
                </p>
              </div>
            )}
          </div>
          <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3">
            <Link
              href="/tutor"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-primary transition-all hover:bg-primary-50 hover:shadow-md"
            >
              <ArrowRight className="h-5 w-5" />
              {tUi(language, "dashboard.openTutor")}
            </Link>
            <Link
              href="/upload"
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              <Upload className="h-5 w-5" />
              Drop Material
            </Link>
          </div>
        </div>
        <div className="absolute right-0 top-0 h-48 w-48 sm:h-64 sm:w-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-32 w-32 sm:h-48 sm:w-48 rounded-full bg-white/5 blur-3xl" />
      </section>

      {/* Stats Grid */}
      <section>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <div className="card group hover-lift bg-gradient-to-br from-white to-primary-50 p-4 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {tUi(language, "dashboard.quizAttempts")}
            </p>
            <p className="mt-2 sm:mt-3 text-3xl sm:text-4xl font-bold text-slate-800">{totalAttempts}</p>
            <div className="mt-2 h-1 w-10 sm:w-12 rounded-full bg-primary" />
          </div>
          <div className="card group hover-lift bg-gradient-to-br from-white to-accent-50 p-4 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {tUi(language, "dashboard.avgScore")}
            </p>
            <p className="mt-2 sm:mt-3 text-3xl sm:text-4xl font-bold text-slate-800">{avgPercent}%</p>
            <div className="mt-2 h-1 w-10 sm:w-12 rounded-full bg-accent" />
          </div>
          <div className="card group hover-lift bg-gradient-to-br from-white to-orange-50 p-4 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {tUi(language, "dashboard.streak")}
            </p>
            <p className="mt-2 sm:mt-3 text-3xl sm:text-4xl font-bold text-slate-800">
              {streakDays}
            </p>
            <div className="mt-2 h-1 w-10 sm:w-12 rounded-full bg-orange-500" />
          </div>
          <div className="card group hover-lift bg-gradient-to-br from-white to-green-50 p-4 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {tUi(language, "dashboard.readiness")}
            </p>
            <p className="mt-2 sm:mt-3 text-3xl sm:text-4xl font-bold text-primary">{readiness}%</p>
            <div className="mt-2 h-1 w-10 sm:w-12 rounded-full bg-green-500" />
          </div>
        </div>
      </section>

      {/* Action Cards */}
      <section>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary">
                <Clock3 className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-foreground">Recommended next step</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {totalAttempts === 0
                    ? "Start with a small quiz after uploading one material to unlock readiness tracking."
                    : `You have ${strongAttempts} strong attempts. Focus one weak topic today and retake a quiz.`}
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-col sm:flex-row flex-wrap gap-3">
              <Link href="/upload" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md">
                <Upload className="h-4 w-4" />
                Drop material
              </Link>
              <Link href="/tutor" className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground transition-all hover:bg-secondary/80">
                Ask Tutor
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-gradient-to-br from-primary-50 to-accent-50 p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-sm">
                <ArrowRight className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-foreground">Study cadence</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Keep your streak by answering at least one quiz daily. Current readiness blends average score and consistency.
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Target: 75%+ readiness</span>
                <span className="font-bold text-primary">{readiness}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary-600 transition-all"
                  style={{ width: `${Math.min(100, readiness)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Drop Zone Card */}
        <Link
          href="/upload"
          className="group relative mt-4 block overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary-50/50 to-accent-50/30 p-6 sm:p-8 transition-all hover:border-primary hover:shadow-2xl"
        >
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-md transition-transform group-hover:scale-110">
              <Upload className="h-7 w-7 sm:h-8 sm:w-8" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-slate-800">
                {tUi(language, "dashboard.dropAnything")}
              </h3>
              <p className="mt-1 text-sm sm:text-base text-slate-600">
                {tUi(language, "dashboard.uploadDesc")}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-white px-3 py-1 font-medium text-slate-700">PDF</span>
                <span className="rounded-full bg-white px-3 py-1 font-medium text-slate-700">Photo</span>
                <span className="rounded-full bg-white px-3 py-1 font-medium text-slate-700">Text</span>
                <span className="rounded-full bg-white px-3 py-1 font-medium text-slate-700">Voice</span>
              </div>
            </div>
            <ArrowRight className="hidden sm:block h-6 w-6 flex-shrink-0 text-primary transition-transform group-hover:translate-x-1" />
          </div>
          <div className="absolute right-0 top-0 h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-primary/5 blur-2xl" />
        </Link>
      </section>

      {/* Subjects Section */}
      <section>
        <h2 className="mb-4 text-xl sm:text-2xl font-bold text-slate-800">{tUi(language, "dashboard.subjects")}</h2>
        
        {!!assignedQuizzes?.length && (
          <div className="card mb-6 bg-gradient-to-br from-accent-50 to-white p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-accent text-white">
                <Clock3 className="h-5 w-5" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800">Assigned Exams</h3>
            </div>
            <ul className="mt-4 space-y-2">
              {assignedQuizzes.map((q) => (
                <li key={q.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 transition-all hover:shadow-sm">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{q.title}</p>
                    <p className="text-xs text-slate-500">
                      {q.time_limit_seconds ? `${Math.floor(q.time_limit_seconds / 60)} min` : "No timer"}
                    </p>
                  </div>
                  <Link href={`/quiz/${q.id}`} className="btn-primary text-sm w-full sm:w-auto text-center">
                    Start
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="card mb-6 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary">
              <ArrowRight className="h-5 w-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800">Recent attempts</h3>
          </div>
          {!recentAttempts.length ? (
            <p className="mt-4 text-center text-sm text-slate-500">
              No attempts yet. Take your first quiz to build insights.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {recentAttempts.map((a, idx) => {
                const percent = a.total > 0 ? Math.round((a.score / a.total) * 100) : 0;
                const isGood = percent >= 70;
                return (
                  <li key={`${a.attempted_at}-${idx}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 sm:px-4 py-3">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${isGood ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                        {isGood ? '✓' : '○'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          Attempt {idx + 1}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(a.attempted_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`text-base sm:text-lg font-bold flex-shrink-0 ${isGood ? 'text-green-600' : 'text-orange-600'}`}>
                      {percent}%
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {!subjects?.length ? (
          <div className="card bg-gradient-to-br from-slate-50 to-white text-center p-6 sm:p-8">
            <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Upload className="h-7 w-7 sm:h-8 sm:w-8" />
            </div>
            <p className="mt-4 font-semibold text-slate-800">{tUi(language, "dashboard.noTextbooks")}</p>
            <p className="mt-1 text-sm text-slate-500">
              {tUi(language, "dashboard.runIngest")}
            </p>
          </div>
        ) : (
          <SubjectFilter subjects={subjects} language={language} />
        )}
      </section>
    </div>
  );
}
