import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, House, Settings, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationsBell } from "@/components/profile/NotificationsBell";
import { ProfileBadgeMenu } from "@/components/profile/ProfileBadgeMenu";
import { LanguageSelector } from "@/components/profile/LanguageSelector";
import { FloatingAiButton } from "@/components/profile/FloatingAiButton";
import { NavLink } from "@/components/navigation/NavLink";
import { MobileMenu } from "@/components/navigation/MobileMenu";
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
  const navItems = [
    { href: "/dashboard", label: tUi(language, "nav.home"), iconName: "House" },
    { href: "/upload", label: tUi(language, "nav.upload"), iconName: "Upload" },
    { href: "/tutor", label: tUi(language, "nav.tutor"), iconName: "BookOpen" },
    { href: "/settings", label: tUi(language, "nav.settings"), iconName: "Settings" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Fixed Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-[280px] flex-col border-r border-border bg-card lg:flex">
        <div className="p-6">
          <Link href="/dashboard" className="block text-2xl font-extrabold tracking-tight text-primary">
            Askuala
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">Student dashboard</p>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto px-4">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              iconName={item.iconName}
              label={item.label}
            />
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-h-screen flex-1 flex-col lg:ml-[280px]">
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-4">
            <div className="flex items-center gap-3 lg:hidden">
              <MobileMenu 
                navItems={navItems}
                title="Askuala"
                subtitle="Student dashboard"
              />
              <Link href="/dashboard" className="text-xl font-bold text-primary">
                Askuala
              </Link>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-2 text-sm">
              <div className="lg:hidden">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard">{tUi(language, "nav.home")}</Link>
                </Button>
              </div>
              <LanguageSelector currentLanguage={language} />
              <NotificationsBell initialItems={(notifications ?? []) as any[]} />
              <ProfileBadgeMenu
                displayName={profile?.full_name?.trim() || user.email || "Student"}
                email={user.email || ""}
                avatarUrl={(user.user_metadata?.avatar_url as string | undefined) ?? null}
                grade={profile?.grade}
                settingsLabel={tUi(language, "nav.settings")}
                signOutLabel={tUi(language, "nav.signOut")}
              />
            </div>
          </div>
        </header>
        <main className="flex-1 px-6 py-8 lg:px-12 lg:py-10">{children}</main>
      </div>
      <FloatingAiButton />
    </div>
  );
}
