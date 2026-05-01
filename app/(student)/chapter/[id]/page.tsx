import Link from "next/link";
import { notFound } from "next/navigation";
import { tUi } from "@/lib/i18n/ui";
import { createClient } from "@/lib/supabase/server";
import type { Language } from "@/lib/supabase/types";

export default async function ChapterPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: chapter } = await supabase
    .from("chapters")
    .select("id, title, chapter_number, summary, textbook_id")
    .eq("id", params.id)
    .single();
  if (!chapter) notFound();

  const { data: textbook } = await supabase
    .from("textbooks")
    .select("subject_id")
    .eq("id", chapter.textbook_id)
    .single();
  const backHref = textbook?.subject_id ? `/subjects/${textbook.subject_id}` : "/dashboard";

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("language_pref")
        .eq("id", user.id)
        .single()
    : { data: null as { language_pref: Language } | null };
  const language = (profile?.language_pref ?? "en") as Language;

  const { data: existingQuiz } = await supabase
    .from("quizzes")
    .select("id")
    .eq("chapter_id", params.id)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <div>
        <Link href={backHref} className="text-xs text-ink/50 hover:text-ink">
          {tUi(language, "chapter.backSubjects")}
        </Link>
        <p className="mt-2 text-xs uppercase tracking-wide text-ink/40">
          {tUi(language, "chapter.chapter")} {chapter.chapter_number}
        </p>
        <h1 className="text-3xl font-bold text-ink">{chapter.title}</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href={`/tutor?chapter=${chapter.id}`}
          className="card text-center transition hover:border-primary"
        >
          <div className="text-3xl">💬</div>
          <p className="mt-2 font-semibold">{tUi(language, "chapter.askTutor")}</p>
          <p className="mt-1 text-xs text-ink/50">
            {tUi(language, "chapter.tutorDesc")}
          </p>
        </Link>
        <Link
          href={`/chapter/${chapter.id}/flashcards`}
          className="card text-center transition hover:border-primary"
        >
          <div className="text-3xl">🃏</div>
          <p className="mt-2 font-semibold">{tUi(language, "chapter.flashcards")}</p>
          <p className="mt-1 text-xs text-ink/50">
            {tUi(language, "chapter.flashcardsDesc")}
          </p>
        </Link>
        <Link
          href={
            existingQuiz
              ? `/quiz/${existingQuiz.id}`
              : `/chapter/${chapter.id}/quiz`
          }
          className="card text-center transition hover:border-primary"
        >
          <div className="text-3xl">📝</div>
          <p className="mt-2 font-semibold">{tUi(language, "chapter.practiceQuiz")}</p>
          <p className="mt-1 text-xs text-ink/50">
            {tUi(language, "chapter.quizDesc")}
          </p>
        </Link>
      </div>

      {chapter.summary && (
        <div className="card">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink/50">
            {tUi(language, "chapter.summary")}
          </h2>
          <p className="whitespace-pre-wrap text-ink/80">{chapter.summary}</p>
        </div>
      )}
    </div>
  );
}
