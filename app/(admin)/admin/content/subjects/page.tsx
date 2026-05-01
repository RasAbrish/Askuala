import { redirect } from "next/navigation";
import { SubjectManager } from "@/components/admin/SubjectManager";
import { createClient } from "@/lib/supabase/server";

export default async function AdminSubjectsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") redirect("/dashboard");

  return (
    <div className="space-y-6">
      <section className="card">
        <h1 className="text-2xl font-bold text-ink">Manage Subjects</h1>
        <p className="mt-1 text-sm text-ink/60">Create and remove subject catalog entries.</p>
      </section>
      <SubjectManager />
    </div>
  );
}
