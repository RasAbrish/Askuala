import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single();
  if (me?.role !== "admin") redirect("/dashboard");

  const admin = createAdminClient();
  const [students, teachers, admins, subjects, chapters, uploads, attempts] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "teacher"),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin"),
    admin.from("subjects").select("id", { count: "exact", head: true }),
    admin.from("chapters").select("id", { count: "exact", head: true }),
    admin.from("student_uploads").select("id", { count: "exact", head: true }),
    admin.from("quiz_attempts").select("id", { count: "exact", head: true }),
  ]);

  return (
    <div className="space-y-6">
      <section className="card bg-gradient-to-br from-primary to-primary-700 text-white">
        <p className="text-sm uppercase tracking-wide opacity-80">Admin Control Center</p>
        <h1 className="mt-1 text-2xl font-bold">Platform Operations</h1>
        <p className="mt-1 text-sm opacity-90">
          Welcome, {me?.full_name?.trim() || user.email}. Manage users, monitor usage, and oversee content quality.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card"><p className="text-xs uppercase text-ink/40">Students</p><p className="mt-1 text-2xl font-bold text-ink">{students.count ?? 0}</p></div>
        <div className="card"><p className="text-xs uppercase text-ink/40">Teachers</p><p className="mt-1 text-2xl font-bold text-ink">{teachers.count ?? 0}</p></div>
        <div className="card"><p className="text-xs uppercase text-ink/40">Admins</p><p className="mt-1 text-2xl font-bold text-ink">{admins.count ?? 0}</p></div>
        <div className="card"><p className="text-xs uppercase text-ink/40">Quiz Attempts</p><p className="mt-1 text-2xl font-bold text-primary">{attempts.count ?? 0}</p></div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="card"><p className="text-xs uppercase text-ink/40">Subjects</p><p className="mt-1 text-2xl font-bold text-ink">{subjects.count ?? 0}</p></div>
        <div className="card"><p className="text-xs uppercase text-ink/40">Chapters</p><p className="mt-1 text-2xl font-bold text-ink">{chapters.count ?? 0}</p></div>
        <div className="card"><p className="text-xs uppercase text-ink/40">Student Uploads</p><p className="mt-1 text-2xl font-bold text-ink">{uploads.count ?? 0}</p></div>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold text-ink">Admin Actions</h2>
        <p className="mt-1 text-sm text-ink/60">Use the tools below to keep the platform healthy and organized.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/admin/users" className="btn-primary inline-flex">Manage users and roles</Link>
          <Link href="/admin/content" className="btn-ghost inline-flex">Open content operations</Link>
          <Link href="/admin/integrations" className="btn-ghost inline-flex">Open integrations</Link>
          <Link href="/teacher/analytics" className="btn-ghost inline-flex">View teacher analytics</Link>
        </div>
      </section>
    </div>
  );
}
