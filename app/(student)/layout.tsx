import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NotificationsBell } from "@/components/profile/NotificationsBell";
import { ProfileBadgeMenu } from "@/components/profile/ProfileBadgeMenu";
import { FloatingAiButton } from "@/components/profile/FloatingAiButton";
import { tUi } from "@/lib/i18n/ui";
import { createClient } from "@/lib/supabase/server";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, grade, language_pref")
    .eq("id", user.id)
    .single();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id,title,body,link,read,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const language = (profile?.language_pref ?? "en") as
    | "en"
    | "am"
    | "om"
    | "ti";

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6">
          <Link href="/dashboard" className="text-xl font-bold text-primary dark:text-primary-400">
            Askuala
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-1.5 text-sm sm:gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard">{tUi(language, "nav.home")}</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/upload">{tUi(language, "nav.upload")}</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/tutor">{tUi(language, "nav.tutor")}</Link>
            </Button>
            <NotificationsBell initialItems={(notifications ?? []) as any[]} />
            <ProfileBadgeMenu
              displayName={profile?.full_name?.trim() || user.email || "Student"}
              email={user.email || ""}
              avatarUrl={(user.user_metadata?.avatar_url as string | undefined) ?? null}
              grade={profile?.grade}
              settingsLabel={tUi(language, "nav.settings")}
              signOutLabel={tUi(language, "nav.signOut")}
            />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      <FloatingAiButton />
    </div>
  );
}
