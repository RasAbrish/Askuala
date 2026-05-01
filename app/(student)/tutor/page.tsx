import { ChatPanel } from "@/components/tutor/ChatPanel";
import { tUi } from "@/lib/i18n/ui";
import { createClient } from "@/lib/supabase/server";
import type { Language } from "@/lib/supabase/types";

export default async function TutorPage({
  searchParams,
}: {
  searchParams: { chapter?: string };
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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-ink">{tUi(language, "tutor.title")}</h1>
        <p className="text-sm text-ink/60">
          {searchParams.chapter
            ? tUi(language, "tutor.chapterHint")
            : tUi(language, "tutor.generalHint")}
        </p>
      </div>
      <ChatPanel
        chapterId={searchParams.chapter}
        language={language}
        suggestions={[
          tUi(language, "tutor.suggestionsExplain"),
          tUi(language, "tutor.suggestionsSummary"),
          tUi(language, "tutor.suggestionsMemorize"),
        ]}
      />
    </div>
  );
}
