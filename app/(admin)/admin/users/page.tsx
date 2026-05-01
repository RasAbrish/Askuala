import { redirect } from "next/navigation";
import { UserRoleTable } from "@/components/admin/UserRoleTable";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export default async function AdminUsersPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") redirect("/dashboard");

  const admin = createAdminClient();
  const { data: users } = await admin
    .from("profiles")
    .select("id, email, full_name, role, grade")
    .order("created_at", { ascending: false })
    .limit(500);

  return (
    <div className="space-y-6">
      <section className="card">
        <h1 className="text-2xl font-bold text-ink">User Administration</h1>
        <p className="mt-1 text-sm text-ink/60">
          Manage role access for students, teachers, and administrators.
        </p>
      </section>
      <UserRoleTable users={(users ?? []) as any[]} />
    </div>
  );
}
