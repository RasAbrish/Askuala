import { redirect } from "next/navigation";
import { ClassManager } from "@/components/teacher/ClassManager";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export default async function TeacherClassesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!(me?.role === "teacher" || me?.role === "admin")) redirect("/dashboard");

  const admin = createAdminClient();
  const { data: subjects } = await admin
    .from("subjects")
    .select("id,name,grade")
    .order("grade", { ascending: true })
    .order("name", { ascending: true });

  return (
    <div className="space-y-6">
      <section className="card">
        <h1 className="text-2xl font-bold text-ink">Class Management</h1>
        <p className="mt-1 text-sm text-ink/60">Create and track your classes for assignment workflows.</p>
      </section>
      <ClassManager subjects={(subjects ?? []) as any[]} />
    </div>
  );
}
