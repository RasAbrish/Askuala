import { NextRequest, NextResponse } from "next/server";
import { generate as generateGemini } from "@/lib/ai/gemini";
import { generate as generateGroq } from "@/lib/ai/groq";
import { flashcardsPrompt } from "@/lib/ai/prompts";
import { loadSourceText } from "@/lib/ai/rag";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { flashcardsGenerateSchema } from "@/lib/validation/api";

// Try Gemini first, fallback to Groq on rate limits
async function generateWithFallback(prompt: string): Promise<string> {
  try {
    return await generateGemini(prompt, { jsonMode: true, temperature: 0.5 });
  } catch (geminiError: any) {
    if (geminiError?.status === 429 || geminiError?.message?.includes("quota")) {
      console.log("[flashcards] Gemini rate limited, falling back to Groq...");
      return await generateGroq(prompt, { jsonMode: true, temperature: 0.5 });
    }
    throw geminiError;
  }
}

export const runtime = "nodejs";

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
  const { data } = await admin
    .from("chapters")
    .select("summary, title")
    .eq("id", chapterId)
    .maybeSingle();
  if (!data?.summary?.trim()) return null;
  return `Chapter: ${data.title}\n\nSummary:\n${data.summary}`;
}

export async function POST(req: NextRequest) {
  const parsedBody = flashcardsGenerateSchema.safeParse(await req.json());
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

  const raw = await generateWithFallback(
    flashcardsPrompt({ chapterTitle: source.title, context: effectiveContext, count }),
  );

  let parsed: { flashcards?: { question: string; answer: string; difficulty?: string }[] };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { error: "Model returned invalid JSON." },
      { status: 502 },
    );
  }
  const cards = (parsed.flashcards ?? []).filter(
    (c) => c.question && c.answer,
  );
  if (!cards.length)
    return NextResponse.json(
      { error: "No flashcards generated." },
      { status: 502 },
    );

  // Wipe any prior set for this source so we get a clean regeneration.
  if (source.chapterId)
    await admin.from("flashcards").delete().eq("chapter_id", source.chapterId);
  if (source.uploadId)
    await admin.from("flashcards").delete().eq("upload_id", source.uploadId);

  const { data, error } = await admin
    .from("flashcards")
    .insert(
      cards.map((c) => ({
        chapter_id: source.chapterId ?? null,
        upload_id: source.uploadId ?? null,
        question: c.question,
        answer: c.answer,
        difficulty: ["easy", "medium", "hard"].includes(c.difficulty ?? "")
          ? c.difficulty
          : "medium",
      })),
    )
    .select();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ flashcards: data });
}
