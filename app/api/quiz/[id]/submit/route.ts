import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { quizSubmitSchema } from "@/lib/validation/api";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const parsed = quizSubmitSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request body." },
      { status: 400 },
    );
  const { answers } = parsed.data;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: questions, error } = (await admin
    .from("questions")
    .select("id, correct_answer, explanation")
    .eq("quiz_id", params.id)) as {
    data: { id: string; correct_answer: string; explanation: string | null }[] | null;
    error: { message: string } | null;
  };
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  let score = 0;
  const detail = (questions ?? []).map((q) => {
    const chosen = answers[q.id];
    const correct = chosen === q.correct_answer;
    if (correct) score += 1;
    return {
      question_id: q.id,
      chosen: chosen ?? null,
      correct_answer: q.correct_answer,
      correct,
      explanation: q.explanation,
    };
  });
  const total = (questions ?? []).length;

  await supabase.from("quiz_attempts").insert({
    student_id: user.id,
    quiz_id: params.id,
    score,
    total,
    answers: detail,
  });

  return NextResponse.json({ score, total, detail });
}
