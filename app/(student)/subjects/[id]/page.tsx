import Link from "next/link";
import { notFound } from "next/navigation";
import { tUi } from "@/lib/i18n/ui";
import { createClient } from "@/lib/supabase/server";
import type { Language } from "@/lib/supabase/types";

export default async function SubjectPage({
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

  const { data: subject } = await supabase
    .from("subjects")
    .select("id, name, grade")
    .eq("id", params.id)
    .single();
  if (!subject) notFound();

  const { data: textbooks } = await supabase
    .from("textbooks")
    .select("id, title")
    .eq("subject_id", params.id);

  const textbookIds = (textbooks ?? []).map((t) => t.id);
  const { data: chapters } = textbookIds.length
    ? await supabase
        .from("chapters")
        .select("id, chapter_number, title, start_page, end_page")
        .in("textbook_id", textbookIds)
        .order("chapter_number", { ascending: true })
    : { data: [] as any[] };
  const chapterCount = chapters?.length ?? 0;
  const pageCovered = (chapters ?? []).filter((c) => c.start_page && c.end_page).length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wide text-ink/40">
          {tUi(language, "subject.grade")} {subject.grade}
        </p>
        <h1 className="text-3xl font-bold text-ink">{subject.name}</h1>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        <div className="card p-3 sm:p-4">
          <p className="text-xs uppercase tracking-wide text-ink/40">Textbooks</p>
          <p className="mt-1 text-lg font-bold text-ink sm:text-2xl">{textbookIds.length}</p>
        </div>
        <div className="card p-3 sm:p-4">
          <p className="text-xs uppercase tracking-wide text-ink/40">Chapters</p>
          <p className="mt-1 text-lg font-bold text-ink sm:text-2xl">{chapterCount}</p>
        </div>
        <div className="card p-3 sm:p-4 col-span-2 sm:col-span-1">
          <p className="text-xs uppercase tracking-wide text-ink/40">Paged Chapters</p>
          <p className="mt-1 text-lg font-bold text-primary sm:text-2xl">{pageCovered}</p>
        </div>
      </div>

      {!chapters?.length ? (
        <div className="card text-center text-ink/60">
          {tUi(language, "subject.noChapters")}
        </div>
      ) : (
        <ul className="space-y-2">
          {chapters.map((ch) => (
            <li key={ch.id}>
              <Link
                href={`/chapter/${ch.id}`}
                className="card flex items-center justify-between p-3 transition hover:border-primary sm:p-5"
              >
                <div>
                  <p className="text-xs text-ink/40">
                    {tUi(language, "chapter.chapter")} {ch.chapter_number}
                  </p>
                  <p className="font-medium text-ink">{ch.title}</p>
                </div>
                <span className="text-sm text-primary">{tUi(language, "subject.open")} →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
