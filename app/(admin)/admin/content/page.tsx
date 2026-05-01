import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export default async function AdminContentPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") redirect("/dashboard");

  const admin = createAdminClient();
  const [{ data: subjects }, { data: textbooks }, { data: chapters }, { data: uploads }] = await Promise.all([
    admin.from("subjects").select("id,name,grade").order("grade", { ascending: true }).order("name", { ascending: true }),
    admin.from("textbooks").select("id,title,total_pages").order("uploaded_at", { ascending: false }).limit(20),
    admin.from("chapters").select("id,title,chapter_number").order("chapter_number", { ascending: true }).limit(30),
    admin.from("student_uploads").select("id,title,source_type,created_at,saved").order("created_at", { ascending: false }).limit(20),
  ]);

  return (
    <div className="space-y-6">
      <section className="card">
        <h1 className="text-2xl font-bold text-ink">Content Operations</h1>
        <p className="mt-1 text-sm text-ink/60">
          Monitor curriculum coverage and recent student content activity.
        </p>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold text-ink">Subjects by Grade</h2>
        <div className="mt-2">
          <Link href="/admin/content/subjects" className="text-sm font-medium text-primary hover:underline">
            Manage subjects
          </Link>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(subjects ?? []).map((s: any) => (
            <div key={s.id} className="rounded-lg border border-black/10 px-3 py-2 text-sm">
              Grade {s.grade}: <span className="font-medium">{s.name}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <div className="card">
          <h2 className="text-lg font-semibold text-ink">Recent Textbooks</h2>
          <div className="mt-2">
            <Link href="/admin/content/textbooks" className="text-sm font-medium text-primary hover:underline">
              Manage textbooks
            </Link>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {(textbooks ?? []).map((b: any) => (
              <li key={b.id} className="rounded-lg border border-black/10 px-3 py-2">
                <p className="font-medium text-ink">{b.title}</p>
                <p className="text-ink/60">Pages: {b.total_pages ?? "-"}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-ink">Recent Chapters</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(chapters ?? []).map((c: any) => (
              <li key={c.id} className="rounded-lg border border-black/10 px-3 py-2">
                <p className="font-medium text-ink">Chapter {c.chapter_number}</p>
                <p className="text-ink/60">{c.title}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="card">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Recent Student Uploads</h2>
          <Link href="/teacher/analytics" className="text-sm font-medium text-primary hover:underline">Open analytics</Link>
        </div>
        <ul className="mt-3 space-y-2 text-sm">
          {(uploads ?? []).map((u: any) => (
            <li key={u.id} className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2">
              <div>
                <p className="font-medium text-ink">{u.title}</p>
                <p className="text-ink/60">
                  {u.source_type} • {new Date(u.created_at).toLocaleDateString()}
                </p>
              </div>
              <span className={`rounded-full px-2 py-1 text-xs ${u.saved ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                {u.saved ? "Saved" : "Temporary"}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
