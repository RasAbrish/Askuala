import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { QuizPlayer } from "@/components/quiz/QuizPlayer";
import { tUi } from "@/lib/i18n/ui";
import { createClient } from "@/lib/supabase/server";
import type { Language, Question } from "@/lib/supabase/types";

export default async function QuizPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("language_pref")
        .eq("id", user.id)
        .single()
    : { data: null as { language_pref: Language } | null };
  const language = (profile?.language_pref ?? "en") as Language;

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, title, chapter_id, question_count, time_limit_seconds")
    .eq("id", params.id)
    .single();
  if (!quiz) notFound();

  const variantLabel = `#${quiz.id.slice(0, 6).toUpperCase()}`;

  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("quiz_id", params.id)
    .order("position", { ascending: true });

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/chapter/${quiz.chapter_id}`}
          className="text-xs text-ink/50 hover:text-ink"
        >
          {tUi(language, "quiz.backChapter")}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-ink">{quiz.title}</h1>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
            {tUi(language, "quiz.variant")} {variantLabel}
          </span>
          <Button asChild variant="ghost" size="sm" className="border border-black/10">
            <Link href={`/chapter/${quiz.chapter_id}/quiz`}>
              {tUi(language, "quiz.regenerate")} ({quiz.question_count ?? 10})
            </Link>
          </Button>
        </div>
        <p className="mt-2 text-xs text-ink/50">
          {quiz.time_limit_seconds
            ? `${tUi(language, "quiz.timedExam")}: ${Math.floor(quiz.time_limit_seconds / 60)} min`
            : tUi(language, "quiz.practiceMode")}
        </p>
      </div>
      <QuizPlayer
        quizId={quiz.id}
        questions={(questions ?? []) as Question[]}
        timeLimitSeconds={quiz.time_limit_seconds}
        language={language}
      />
    </div>
  );
}
