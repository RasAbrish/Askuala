import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const assignSchema = z.object({
  quizId: z.string().min(1),
  all: z.boolean().optional().default(false),
  studentIds: z.array(z.string().min(1)).optional().default([]),
});

export async function POST(req: NextRequest) {
  const body = assignSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!(profile?.role === "teacher" || profile?.role === "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { quizId, all, studentIds } = body.data;
  const admin = createAdminClient();

  const { data: quiz } = await admin.from("quizzes").select("id").eq("id", quizId).single();
  if (!quiz) return NextResponse.json({ error: "Exam not found." }, { status: 404 });

  let targets: string[] = studentIds;
  if (all) {
    const { data: students } = await admin
      .from("profiles")
      .select("id")
      .eq("role", "student")
      .order("created_at", { ascending: true });
    targets = (students ?? []).map((s: { id: string }) => s.id);
  }

  targets = Array.from(new Set(targets));
  if (!targets.length) {
    return NextResponse.json({ error: "Select at least one student or choose All." }, { status: 400 });
  }

  const assignments = targets.map((studentId) => ({
    quiz_id: quizId,
    teacher_id: user.id,
    student_id: studentId,
  }));

  const { error: assignError } = await admin
    .from("exam_assignments")
    .upsert(assignments, { onConflict: "quiz_id,student_id", ignoreDuplicates: true });

  if (assignError) {
    return NextResponse.json(
      { error: "Exam assignments table missing. Run supabase/patch-exam-assignments-notifications.sql" },
      { status: 400 },
    );
  }

  const notifications = targets.map((studentId) => ({
    user_id: studentId,
    type: "exam_assigned",
    title: "New exam assigned",
    body: "Your teacher assigned you a new exam.",
    link: `/quiz/${quizId}`,
    read: false,
  }));

  await admin.from("notifications").insert(notifications);

  return NextResponse.json({ ok: true, assigned: targets.length });
}
