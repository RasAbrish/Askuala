import { ProfileGrade } from "@/components/profile/ProfileGrade";
import { RoleSwitcher } from "@/components/profile/RoleSwitcher";
import { tUi } from "@/lib/i18n/ui";
import { createClient } from "@/lib/supabase/server";
import type { Language } from "@/lib/supabase/types";

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, grade, language_pref, role")
    .eq("id", user?.id ?? "")
    .single();

  const language = (profile?.language_pref ?? "en") as Language;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">{tUi(language, "settings.title")}</h1>
        <p className="text-sm text-ink/60">
          {tUi(language, "settings.desc")}
        </p>
      </div>

      <ProfileGrade
        initialName={profile?.full_name ?? ""}
        initialGrade={profile?.grade ?? 11}
        initialLanguage={language}
        initialAvatarUrl={(user?.user_metadata?.avatar_url as string | undefined) ?? ""}
      />
      {profile?.role && <RoleSwitcher currentRole={profile.role} />}
    </div>
  );
}
