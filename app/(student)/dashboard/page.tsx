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
    <div className="space-y-8">
      <section className="card bg-gradient-to-br from-primary to-primary-700 text-white">
        <p className="text-sm uppercase tracking-wide opacity-80">{tUi(language, "dashboard.today")}</p>
        <h1 className="mt-1 text-2xl font-bold">{tUi(language, "dashboard.letsStudy")}</h1>
        <p className="mt-1 text-sm opacity-90">
          {tUi(language, "dashboard.pickSubject")}
        </p>
        <Link
          href="/tutor"
          className="mt-4 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-medium text-primary hover:bg-white/90"
        >
          {tUi(language, "dashboard.openTutor")}
        </Link>
      </section>

      <section>
        <div className="mb-4 grid grid-cols-2 gap-2 sm:mb-6 sm:gap-3 lg:grid-cols-4">
          <div className="card p-3 sm:p-5">
            <p className="text-xs uppercase tracking-wide text-ink/40">{tUi(language, "dashboard.quizAttempts")}</p>
            <p className="mt-1 text-lg font-bold text-ink sm:text-2xl">{totalAttempts}</p>
          </div>
          <div className="card p-3 sm:p-5">
            <p className="text-xs uppercase tracking-wide text-ink/40">{tUi(language, "dashboard.avgScore")}</p>
            <p className="mt-1 text-lg font-bold text-ink sm:text-2xl">{avgPercent}%</p>
          </div>
          <div className="card p-3 sm:p-5">
            <p className="text-xs uppercase tracking-wide text-ink/40">{tUi(language, "dashboard.streak")}</p>
            <p className="mt-1 text-lg font-bold text-ink sm:text-2xl">{streakDays} {tUi(language, streakDays === 1 ? "dashboard.day" : "dashboard.days")}</p>
          </div>
          <div className="card p-3 sm:p-5">
            <p className="text-xs uppercase tracking-wide text-ink/40">{tUi(language, "dashboard.readiness")}</p>
            <p className="mt-1 text-lg font-bold text-primary sm:text-2xl">{readiness}%</p>
          </div>
        </div>

        <div className="mb-6 grid gap-3 md:grid-cols-2">
          <div className="card">
            <h3 className="text-base font-semibold text-ink">Recommended next step</h3>
            <p className="mt-1 text-sm text-ink/60">
              {totalAttempts === 0
                ? "Start with a small quiz after uploading one material to unlock readiness tracking."
                : `You have ${strongAttempts} strong attempts. Focus one weak topic today and retake a quiz.`}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/upload" className="btn-primary inline-flex items-center gap-2">
                Drop material <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/tutor" className="btn-ghost inline-flex">
                Ask Tutor
              </Link>
            </div>
          </div>

          <div className="card">
            <h3 className="text-base font-semibold text-ink">Study cadence</h3>
            <div className="mt-3 space-y-2 text-sm text-ink/70">
              <p className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-primary" />
                Keep your streak by answering at least one quiz daily.
              </p>
              <p>
                Current readiness blends average score and consistency. Aim for 75%+ readiness before mock exams.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/upload"
          className="card mb-6 flex items-center gap-3 border-2 border-dashed border-primary/40 bg-primary-50/40 p-3 transition hover:border-primary hover:bg-primary-50 sm:gap-4 sm:p-5"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white sm:h-12 sm:w-12">
            <Upload className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-ink">{tUi(language, "dashboard.dropAnything")}</h3>
            <p className="text-sm text-ink/60">
              {tUi(language, "dashboard.uploadDesc")}
            </p>
          </div>
        </Link>

        <h2 className="mb-3 text-lg font-semibold text-ink">{tUi(language, "dashboard.subjects")}</h2>
        {!!assignedQuizzes?.length && (
          <div className="card mb-6">
            <h3 className="text-base font-semibold text-ink">Assigned Exams</h3>
            <ul className="mt-3 space-y-2">
              {assignedQuizzes.map((q) => (
                <li key={q.id} className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-ink">{q.title}</p>
                    <p className="text-xs text-ink/50">
                      {q.time_limit_seconds ? `${Math.floor(q.time_limit_seconds / 60)} min` : "No timer"}
                    </p>
                  </div>
                  <Link href={`/quiz/${q.id}`} className="text-sm font-medium text-primary hover:underline">
                    Open
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="card mb-6">
          <h3 className="text-base font-semibold text-ink">Recent attempts</h3>
          {!recentAttempts.length ? (
            <p className="mt-2 text-sm text-ink/60">No attempts yet. Take your first quiz to build insights.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {recentAttempts.map((a, idx) => {
                const percent = a.total > 0 ? Math.round((a.score / a.total) * 100) : 0;
                return (
                  <li key={`${a.attempted_at}-${idx}`} className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2">
                    <p className="text-sm text-ink">
                      Attempt {idx + 1} on {new Date(a.attempted_at).toLocaleDateString()}
                    </p>
                    <span className="text-sm font-semibold text-primary">{percent}%</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {!subjects?.length ? (
          <div className="card text-center text-ink/60">
            <p>{tUi(language, "dashboard.noTextbooks")}</p>
            <p className="mt-1 text-xs">
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
