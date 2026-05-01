import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

type AttemptExportRow = {
  student_id: string;
  score: number;
  total: number;
  attempted_at: string;
  quiz_id: string;
};

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!(profile?.role === "teacher" || profile?.role === "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: attempts } = await admin
    .from("quiz_attempts")
    .select("student_id, score, total, attempted_at, quiz_id")
    .order("attempted_at", { ascending: false })
    .limit(5000);
  const attemptRows = (attempts ?? []) as AttemptExportRow[];

  const rows = [
    ["student_id", "quiz_id", "score", "total", "percent", "attempted_at"],
    ...(attemptRows.map((a: AttemptExportRow) => [
      a.student_id,
      a.quiz_id,
      String(a.score),
      String(a.total),
      a.total > 0 ? ((a.score / a.total) * 100).toFixed(1) : "0.0",
      a.attempted_at,
    ])),
  ];

  const csv = rows
    .map((r) => r.map((v: string) => `"${String(v).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="askuala-analytics.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
