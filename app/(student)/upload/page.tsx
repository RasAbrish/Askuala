import { DropZone } from "@/components/upload/DropZone";
import { tUi } from "@/lib/i18n/ui";
import { createClient } from "@/lib/supabase/server";
import type { Language } from "@/lib/supabase/types";

export default async function UploadPage() {
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
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-ink">{tUi(language, "dashboard.dropAnything")}</h1>
        <p className="text-sm text-ink/60">
          {tUi(language, "dashboard.uploadDesc")}
        </p>
      </div>
      <DropZone language={language} />
    </div>
  );
}
