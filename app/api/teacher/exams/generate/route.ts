import { NextRequest, NextResponse } from "next/server";
import { generate as generateGemini } from "@/lib/ai/gemini";
import { generate as generateGroq } from "@/lib/ai/groq";
import { quizPrompt } from "@/lib/ai/prompts";
import { loadSourceText } from "@/lib/ai/rag";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { teacherExamGenerateSchema } from "@/lib/validation/api";

export const runtime = "nodejs";

interface ModelQuestion {
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
}

async function generateWithFallback(prompt: string): Promise<string> {
  try {
    return await generateGemini(prompt, { jsonMode: true, temperature: 0.7 });
  } catch (geminiError: any) {
    if (geminiError?.status === 429 || geminiError?.message?.includes("quota")) {
      return generateGroq(prompt, { jsonMode: true, temperature: 0.7 });
    }
    throw geminiError;
  }
}

export async function POST(req: NextRequest) {
  const parsed = teacherExamGenerateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!(me?.role === "teacher" || me?.role === "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { chapterId, title, count, timeLimitSeconds } = parsed.data;
  const admin = createAdminClient();

  const { data: chapter } = (await admin
    .from("chapters")
    .select("id, title, summary")
    .eq("id", chapterId)
    .single()) as { data: { id: string; title: string; summary: string | null } | null };

  if (!chapter) {
    return NextResponse.json({ error: "Chapter not found." }, { status: 404 });
  }

  const contextFromChunks = await loadSourceText({ chapterId: chapter.id, uploadId: null });
  const context = contextFromChunks || chapter.summary || null;
  if (!context) {
    return NextResponse.json(
      { error: "No chapter content found. Ingest textbook pages or add chapter summaries." },
      { status: 400 },
    );
  }

  const raw = await generateWithFallback(
    quizPrompt({
      chapterTitle: chapter.title,
      context,
      count,
      variantSeed: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    }),
  );

  let model: { questions?: ModelQuestion[] };
  try {
    model = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Model returned invalid JSON." }, { status: 502 });
  }

  const valid =
    model.questions?.filter(
      (q) =>
        q.question_text &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        q.correct_answer &&
        q.options.includes(q.correct_answer),
    ) ?? [];

  if (!valid.length) {
    return NextResponse.json({ error: "No valid exam questions generated." }, { status: 502 });
  }

  const { data: quiz, error: quizErr } = await admin
    .from("quizzes")
    .insert({
      chapter_id: chapter.id,
      upload_id: null,
      title,
      question_count: valid.length,
      time_limit_seconds: timeLimitSeconds,
    })
    .select("id")
    .single();

  if (quizErr || !quiz) {
    return NextResponse.json({ error: quizErr?.message || "Could not create exam." }, { status: 500 });
  }

  const { error: qErr } = await admin.from("questions").insert(
    valid.map((q, i) => ({
      quiz_id: quiz.id,
      question_text: q.question_text,
      question_type: "mcq",
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation ?? null,
      position: i,
    })),
  );

  if (qErr) {
    return NextResponse.json({ error: qErr.message }, { status: 500 });
  }

  return NextResponse.json({ quizId: quiz.id });
}
