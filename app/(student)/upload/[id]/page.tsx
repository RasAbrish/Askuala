import Link from "next/link";
import { notFound } from "next/navigation";
import { StudyTabs } from "@/components/upload/StudyTabs";
import { tUi } from "@/lib/i18n/ui";
import { createClient } from "@/lib/supabase/server";
import type { ChatMessage, Flashcard, Language, Question } from "@/lib/supabase/types";

export default async function UploadStudyPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("language_pref")
    .eq("id", user.id)
    .single();
  const language = (profile?.language_pref ?? "en") as Language;

  const { data: upload } = (await supabase
    .from("student_uploads")
    .select("id, title, student_id")
    .eq("id", params.id)
    .single()) as {
    data: { id: string; title: string; student_id: string } | null;
  };

  if (!upload || upload.student_id !== user.id) notFound();

  const { data: flashcards } = (await supabase
    .from("flashcards")
    .select("id, chapter_id, question, answer, difficulty")
    .eq("upload_id", upload.id)
    .order("created_at", { ascending: true })) as { data: Flashcard[] | null };

  const { data: quiz } = (await supabase
    .from("quizzes")
    .select("id, time_limit_seconds")
    .eq("upload_id", upload.id)
    .maybeSingle()) as { data: { id: string; time_limit_seconds: number | null } | null };

  let quizData: { id: string; questions: Question[]; timeLimitSeconds?: number | null } | null = null;
  if (quiz) {
    const { data: questions } = (await supabase
      .from("questions")
      .select(
        "id, quiz_id, question_text, question_type, options, correct_answer, explanation, position",
      )
      .eq("quiz_id", quiz.id)
      .order("position", { ascending: true })) as { data: Question[] | null };
    quizData = {
      id: quiz.id,
      questions: questions ?? [],
      timeLimitSeconds: quiz.time_limit_seconds,
    };
  }

  const { data: tutorHistory } = (await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("student_id", user.id)
    .eq("upload_id", upload.id)
    .order("created_at", { ascending: true })
    .limit(30)) as { data: Pick<ChatMessage, "role" | "content">[] | null };
  const initialTutorMessages = (tutorHistory ?? [])
    .map((m) => ({ role: m.role, content: m.content?.trim() ?? "" }))
    .filter((m) => m.content.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/upload" className="text-xs text-ink/50 hover:text-ink">
          {tUi(language, "upload.back")}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-ink">{upload.title}</h1>
        <p className="text-sm text-ink/60">
          {tUi(language, "upload.explore")}
        </p>
      </div>

      <StudyTabs
        uploadId={upload.id}
        uploadTitle={upload.title}
        initialFlashcards={flashcards ?? []}
        quiz={quizData}
        initialTutorMessages={initialTutorMessages}
        language={language}
      />
    </div>
  );
}
