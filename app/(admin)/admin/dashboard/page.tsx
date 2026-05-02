import Link from "next/link";
import { redirect } from "next/navigation";
import { SimpleBarChart } from "@/components/charts/SimpleBarChart";
import { SimpleLineChart } from "@/components/charts/SimpleLineChart";
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
  const [students, teachers, admins, subjects, chapters, uploads, attempts, recentAttempts] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "teacher"),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin"),
    admin.from("subjects").select("id", { count: "exact", head: true }),
    admin.from("chapters").select("id", { count: "exact", head: true }),
    admin.from("student_uploads").select("id", { count: "exact", head: true }),
    admin.from("quiz_attempts").select("id", { count: "exact", head: true }),
    admin.from("quiz_attempts").select("attempted_at").order("attempted_at", { ascending: false }).limit(400),
  ]);

  const last7 = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx));
    const key = d.toISOString().slice(0, 10);
    const count = (recentAttempts.data ?? []).filter((r: any) => String(r.attempted_at).startsWith(key)).length;
    return { label: key.slice(5), value: count };
  });

  return (
    <div className="space-y-6">
      {/* Welcome Hero Card */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-600 to-primary-700 p-8 text-white shadow-2xl">
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-primary-100">
                Admin Control Center
              </p>
              <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
                Platform Operations
              </h1>
              <p className="mt-2 text-base text-primary-100">
                Welcome, {me?.full_name?.trim() || user.email}. Manage users, monitor usage, and oversee content quality.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 text-center backdrop-blur-sm">
              <p className="text-3xl font-bold">{(students.count ?? 0) + (teachers.count ?? 0)}</p>
              <p className="text-xs text-primary-100">Total Users</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-primary transition-all hover:bg-primary-50 hover:shadow-md"
            >
              Manage Users
            </Link>
            <Link
              href="/admin/content"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              Content Operations
            </Link>
          </div>
        </div>
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
      </section>

      {/* Stats Grid - Users */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-slate-800">User Statistics</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="card group hover-lift bg-gradient-to-br from-white to-primary-50">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Students
            </p>
            <p className="mt-3 text-4xl font-bold text-slate-800">{students.count ?? 0}</p>
            <div className="mt-2 h-1 w-12 rounded-full bg-primary" />
          </div>
          <div className="card group hover-lift bg-gradient-to-br from-white to-blue-50">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Teachers
            </p>
            <p className="mt-3 text-4xl font-bold text-slate-800">{teachers.count ?? 0}</p>
            <div className="mt-2 h-1 w-12 rounded-full bg-blue-500" />
          </div>
          <div className="card group hover-lift bg-gradient-to-br from-white to-purple-50">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Admins
            </p>
            <p className="mt-3 text-4xl font-bold text-slate-800">{admins.count ?? 0}</p>
            <div className="mt-2 h-1 w-12 rounded-full bg-purple-500" />
          </div>
          <div className="card group hover-lift bg-gradient-to-br from-white to-green-50">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Quiz Attempts
            </p>
            <p className="mt-3 text-4xl font-bold text-primary">{attempts.count ?? 0}</p>
            <div className="mt-2 h-1 w-12 rounded-full bg-green-500" />
          </div>
        </div>
      </section>

      {/* Stats Grid - Content */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-slate-800">Content Statistics</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="card group hover-lift bg-gradient-to-br from-white to-accent-50">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Subjects
            </p>
            <p className="mt-3 text-4xl font-bold text-slate-800">{subjects.count ?? 0}</p>
            <div className="mt-2 h-1 w-12 rounded-full bg-accent" />
          </div>
          <div className="card group hover-lift bg-gradient-to-br from-white to-orange-50">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Chapters
            </p>
            <p className="mt-3 text-4xl font-bold text-slate-800">{chapters.count ?? 0}</p>
            <div className="mt-2 h-1 w-12 rounded-full bg-orange-500" />
          </div>
          <div className="card group hover-lift bg-gradient-to-br from-white to-cyan-50">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Student Uploads
            </p>
            <p className="mt-3 text-4xl font-bold text-slate-800">{uploads.count ?? 0}</p>
            <div className="mt-2 h-1 w-12 rounded-full bg-cyan-500" />
          </div>
        </div>
      </section>

      {/* Charts Section */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card hover-lift">
          <SimpleBarChart
            title="Platform Totals"
            points={[
              { label: "Students", value: students.count ?? 0 },
              { label: "Teachers", value: teachers.count ?? 0 },
              { label: "Admins", value: admins.count ?? 0 },
              { label: "Subjects", value: subjects.count ?? 0 },
              { label: "Chapters", value: chapters.count ?? 0 },
              { label: "Uploads", value: uploads.count ?? 0 },
            ]}
          />
        </div>
        <div className="card hover-lift">
          <SimpleLineChart title="Quiz Attempts (Last 7 Days)" points={last7} />
        </div>
      </section>

      {/* Quick Actions */}
      <section className="card bg-gradient-to-br from-primary-50 to-accent-50">
        <h2 className="text-xl font-bold text-slate-800">Admin Actions</h2>
        <p className="mt-2 text-sm text-slate-600">
          Use the tools below to keep the platform healthy and organized.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/admin/users" className="btn-primary">
            Manage Users & Roles
          </Link>
          <Link href="/admin/content" className="btn-secondary">
            Content Operations
          </Link>
          <Link href="/admin/integrations" className="btn-secondary">
            Integrations
          </Link>
          <Link href="/teacher/analytics" className="btn-secondary">
            Teacher Analytics
          </Link>
        </div>
      </section>
    </div>
  );
}
