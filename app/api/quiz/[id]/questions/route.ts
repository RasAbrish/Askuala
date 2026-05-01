import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const { data: quiz, error: quizErr } = (await admin
    .from("quizzes")
    .select("id, upload_id, time_limit_seconds")
    .eq("id", params.id)
    .single()) as {
    data: { id: string; upload_id: string | null; time_limit_seconds: number | null } | null;
    error: { message: string } | null;
  };
  if (quizErr || !quiz)
    return NextResponse.json({ error: "Quiz not found." }, { status: 404 });

  // Upload-based quizzes are private to the owning student.
  if (quiz.upload_id) {
    const { data: upload } = (await admin
      .from("student_uploads")
      .select("id, student_id")
      .eq("id", quiz.upload_id)
      .single()) as {
      data: { id: string; student_id: string } | null;
    };
    if (!upload || upload.student_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { data: questions, error } = (await admin
    .from("questions")
    .select(
      "id, quiz_id, question_text, question_type, options, correct_answer, explanation, position",
    )
    .eq("quiz_id", params.id)
    .order("position", { ascending: true })) as {
    data:
      | {
          id: string;
          quiz_id: string;
          question_text: string;
          question_type: "mcq" | "short" | "true_false";
          options: string[] | null;
          correct_answer: string;
          explanation: string | null;
          position: number;
        }[]
      | null;
    error: { message: string } | null;
  };

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    questions: questions ?? [],
    timeLimitSeconds: quiz.time_limit_seconds,
  });
}
