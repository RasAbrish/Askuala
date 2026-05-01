import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CompactNavMenu } from "@/components/navigation/CompactNavMenu";
import { ProfileBadgeMenu } from "@/components/profile/ProfileBadgeMenu";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
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
    .select("full_name, grade, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
          <Link href="/admin/dashboard" className="text-xl font-bold text-primary">
            Askuala Admin
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/dashboard">Dashboard</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/users">Users</Link>
            </Button>
            <div>
              <CompactNavMenu
                links={[
                  { href: "/admin/content", label: "Content Ops" },
                  { href: "/admin/integrations", label: "Integrations" },
                  { href: "/teacher/dashboard", label: "Teacher View" },
                  { href: "/dashboard", label: "Student View" },
                ]}
              />
            </div>
            <ProfileBadgeMenu
              displayName={profile?.full_name?.trim() || user.email || "Admin"}
              email={user.email || ""}
              grade={profile?.grade}
              settingsLabel="Settings"
              signOutLabel="Sign out"
            />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
