import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ProfileBadgeMenu } from "@/components/profile/ProfileBadgeMenu";
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

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link href="/teacher/dashboard" className="text-xl font-bold text-primary">
            {am ? "አስኩአላ መምህር" : "Askuala Teacher"}
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Button asChild variant="ghost" size="sm">
              <Link href="/teacher/dashboard">{am ? "ዳሽቦርድ" : "Dashboard"}</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/teacher/exams/new">{am ? "ፈተናዎች" : "Exams"}</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/teacher/classes">{am ? "ክፍሎች" : "Classes"}</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/teacher/analytics">{am ? "ትንታኔ" : "Analytics"}</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/teacher/premium">{am ? "ፕሪሚየም" : "Premium"}</Link>
            </Button>
            {profile?.role === "admin" && (
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin/dashboard">{am ? "አስተዳዳሪ" : "Admin"}</Link>
              </Button>
            )}
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard">{am ? "የተማሪ እይታ" : "Student View"}</Link>
            </Button>
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
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
