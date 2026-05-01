import Link from "next/link";
import { notFound } from "next/navigation";
import { FlashcardDeck } from "@/components/flashcards/FlashcardDeck";
import { createClient } from "@/lib/supabase/server";
import type { Flashcard } from "@/lib/supabase/types";

export default async function ChapterFlashcardsPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: chapter } = await supabase
    .from("chapters")
    .select("id, title")
    .eq("id", params.id)
    .single();
  if (!chapter) notFound();

  const { data: cards } = await supabase
    .from("flashcards")
    .select("*")
    .eq("chapter_id", params.id);

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/chapter/${chapter.id}`}
          className="text-xs text-ink/50 hover:text-ink"
        >
          ← Back to chapter
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-ink">
          Flashcards · {chapter.title}
        </h1>
      </div>
      <FlashcardDeck
        chapterId={chapter.id}
        initialCards={(cards ?? []) as Flashcard[]}
      />
    </div>
  );
}
