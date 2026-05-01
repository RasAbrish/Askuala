import { NextRequest, NextResponse } from "next/server";
import { generate as generateGemini } from "@/lib/ai/gemini";
import { generate as generateGroq } from "@/lib/ai/groq";
import { quizPrompt } from "@/lib/ai/prompts";
import { loadSourceText } from "@/lib/ai/rag";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { quizGenerateSchema } from "@/lib/validation/api";

// Try Gemini first, fallback to Groq on rate limits
async function generateWithFallback(prompt: string): Promise<string> {
  try {
    return await generateGemini(prompt, { jsonMode: true, temperature: 0.75 });
  } catch (geminiError: any) {
    if (geminiError?.status === 429 || geminiError?.message?.includes("quota")) {
      console.log("[quiz] Gemini rate limited, falling back to Groq...");
      return await generateGroq(prompt, { jsonMode: true, temperature: 0.75 });
    }
    throw geminiError;
  }
}

export const runtime = "nodejs";

interface ModelQuestion {
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
}

async function resolveSource(
  admin: ReturnType<typeof createAdminClient>,
  body: { chapterId?: string; uploadId?: string },
  userId: string,
): Promise<{ title: string; chapterId?: string; uploadId?: string } | null> {
  if (body.chapterId) {
    const { data } = (await admin
      .from("chapters")
      .select("id, title")
      .eq("id", body.chapterId)
      .single()) as { data: { id: string; title: string } | null };
    if (!data) return null;
    return { title: data.title, chapterId: data.id };
  }
  if (body.uploadId) {
    const { data } = (await admin
      .from("student_uploads")
      .select("id, title, student_id")
      .eq("id", body.uploadId)
      .single()) as {
      data: { id: string; title: string; student_id: string } | null;
    };
    if (!data || data.student_id !== userId) return null;
    return { title: data.title, uploadId: data.id };
  }
  return null;
}

async function fallbackChapterContext(
  admin: ReturnType<typeof createAdminClient>,
  chapterId?: string,
) {
  if (!chapterId) return null;
  const { data: chapter } = await admin
    .from("chapters")
    .select("summary, title")
    .eq("id", chapterId)
    .maybeSingle();
  if (chapter?.summary?.trim()) {
    return `Chapter: ${chapter.title}\n\nSummary:\n${chapter.summary}`;
  }

  // Final fallback: lightweight metadata context to avoid hard failures.
  const { data: meta } = await admin
    .from("chapters")
    .select("title, chapter_number, textbooks(title, subjects(name, grade))")
    .eq("id", chapterId)
    .maybeSingle();

  const textbook = Array.isArray(meta?.textbooks) ? meta?.textbooks[0] : meta?.textbooks;
  const subject = Array.isArray((textbook as any)?.subjects)
    ? (textbook as any)?.subjects[0]
    : (textbook as any)?.subjects;

  if (!meta) return null;
  return [
    `Chapter: ${meta.title ?? "Unknown Chapter"}`,
    `Chapter Number: ${meta.chapter_number ?? "N/A"}`,
    `Textbook: ${textbook?.title ?? "N/A"}`,
    `Subject: ${subject?.name ?? "N/A"}`,
    `Grade: ${subject?.grade ?? "N/A"}`,
    "Notes: Detailed extracted content is unavailable for this chapter. Generate a basic conceptual quiz from this metadata only and avoid fabricated specific facts.",
  ].join("\n");
}

export async function POST(req: NextRequest) {
  const parsedBody = quizGenerateSchema.safeParse(await req.json());
  if (!parsedBody.success)
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "Invalid request body." },
      { status: 400 },
    );
  const body = parsedBody.data;
  const count = body.count;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const source = await resolveSource(admin, body, user.id);
  if (!source)
    return NextResponse.json(
      { error: "Provide chapterId or uploadId." },
      { status: 400 },
    );

  const context = await loadSourceText({
    chapterId: source.chapterId ?? null,
    uploadId: source.uploadId ?? null,
  });
  const effectiveContext = context || (await fallbackChapterContext(admin, source.chapterId));
  if (!effectiveContext) {
    return NextResponse.json(
      { error: "No saved chapter/upload content yet. Upload or ingest material first." },
      { status: 400 },
    );
  }

  const variantSeed = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const raw = await generateWithFallback(
    quizPrompt({
      chapterTitle: source.title,
      context: effectiveContext,
      count,
      variantSeed,
    }),
  );

  let parsed: { title?: string; questions?: ModelQuestion[] };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { error: "Model returned invalid JSON." },
      { status: 502 },
    );
  }

  const valid =
    parsed.questions?.filter(
      (q) =>
        q.question_text &&
        Array.isArray(q.options) &&
        q.options.length >= 2 &&
        q.correct_answer &&
        q.options.includes(q.correct_answer),
    ) ?? [];

  if (!valid.length)
    return NextResponse.json(
      { error: "No valid quiz questions generated." },
      { status: 502 },
    );

  // Replace any prior generated quiz for this source (keeps things simple in MVP).
  let existingQuery = admin.from("quizzes").select("id");
  existingQuery = source.chapterId
    ? existingQuery.eq("chapter_id", source.chapterId)
    : existingQuery.eq("upload_id", source.uploadId!);
  const { data: existing } = (await existingQuery) as {
    data: { id: string }[] | null;
  };
  if (existing?.length) {
    await admin
      .from("quizzes")
      .delete()
      .in(
        "id",
        existing.map((q) => q.id),
      );
  }

  const { data: quiz, error: qErr } = await admin
    .from("quizzes")
    .insert({
      chapter_id: source.chapterId ?? null,
      upload_id: source.uploadId ?? null,
      title: parsed.title ?? `${source.title} — Practice Quiz`,
      question_count: valid.length,
      time_limit_seconds: Math.max(valid.length * 60, 300),
    })
    .select()
    .single();
  if (qErr)
    return NextResponse.json({ error: qErr.message }, { status: 500 });

  const { error: insErr } = await admin.from("questions").insert(
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
  if (insErr)
    return NextResponse.json({ error: insErr.message }, { status: 500 });

  return NextResponse.json({ quizId: quiz.id });
}
