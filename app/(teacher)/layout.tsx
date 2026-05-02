import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, Crown, GraduationCap, LayoutDashboard, Layers3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileBadgeMenu } from "@/components/profile/ProfileBadgeMenu";
import { LanguageSelector } from "@/components/profile/LanguageSelector";
import { NavLink } from "@/components/navigation/NavLink";
import { MobileMenu } from "@/components/navigation/MobileMenu";
import { createClient } from "@/lib/supabase/server";

export default async function TeacherLayout({
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
    .select("full_name, grade, role, language_pref")
    .eq("id", user.id)
    .single();

  const isTeacher = profile?.role === "teacher" || profile?.role === "admin";
  if (!isTeacher) redirect("/dashboard");
  const am = profile?.language_pref === "am";
  const language = (profile?.language_pref ?? "en") as "en" | "am" | "om" | "ti";
  const navItems = [
    { href: "/teacher/dashboard", label: am ? "ዳሽቦርድ" : "Dashboard", iconName: "LayoutDashboard" },
    { href: "/teacher/exams/new", label: am ? "ፈተናዎች" : "Exams", iconName: "GraduationCap" },
    { href: "/teacher/classes", label: am ? "ክፍሎች" : "Classes", iconName: "Layers3" },
    { href: "/teacher/analytics", label: am ? "ትንታኔ" : "Analytics", iconName: "BarChart3" },
    { href: "/teacher/premium", label: am ? "ፕሪሚየም" : "Premium", iconName: "Crown" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Fixed Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-[280px] flex-col border-r border-border bg-card lg:flex">
        <div className="p-6">
          <Link href="/teacher/dashboard" className="block text-2xl font-extrabold tracking-tight text-primary">
            {am ? "አስኩአላ መምህር" : "Askuala Teacher"}
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">{am ? "የመምህር ቦታ" : "Teacher workspace"}</p>
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
          <div className="flex items-center justify-between gap-2 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="lg:hidden">
                <MobileMenu 
                  navItems={navItems}
                  title={am ? "አስኩአላ መምህር" : "Askuala Teacher"}
                  subtitle={am ? "የመምህር ቦታ" : "Teacher workspace"}
                />
              </div>
              <p className="text-base font-semibold text-foreground">{am ? "መምህር ዳሽቦርድ" : "Teacher Dashboard"}</p>
            </div>
            <nav className="flex items-center gap-2 text-sm">
              {profile?.role === "admin" && (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/admin/dashboard">{am ? "አስተዳዳሪ" : "Admin"}</Link>
                </Button>
              )}
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">{am ? "የተማሪ እይታ" : "Student View"}</Link>
              </Button>
              <LanguageSelector currentLanguage={language} />
              <ProfileBadgeMenu
                displayName={profile?.full_name?.trim() || user.email || "Teacher"}
                email={user.email || ""}
                grade={profile?.grade}
                settingsLabel={am ? "ቅንብሮች" : "Settings"}
                signOutLabel={am ? "ውጣ" : "Sign out"}
              />
            </nav>
          </div>
        </header>
        <main className="flex-1 px-6 py-8 lg:px-12 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
