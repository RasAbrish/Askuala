import { NextRequest } from "next/server";
import { generateStream as generateGeminiStream } from "@/lib/ai/gemini";
import { generateStream as generateGroqStream } from "@/lib/ai/groq";
import { tutorSystemPrompt, tutorUserPrompt } from "@/lib/ai/prompts";
import { retrieveContext } from "@/lib/ai/rag";
import { createClient } from "@/lib/supabase/server";
import type { Language } from "@/lib/supabase/types";
import { chatRequestSchema } from "@/lib/validation/api";

// Try Gemini first, fallback to Groq on rate limits
async function* generateWithFallback(
  prompt: string,
  systemInstruction?: string,
): AsyncGenerator<string> {
  const fullPrompt = systemInstruction
    ? `${systemInstruction}\n\n${prompt}`
    : prompt;

  // Try Gemini first
  try {
    for await (const chunk of generateGeminiStream(prompt, { systemInstruction })) {
      yield chunk;
    }
    return;
  } catch (geminiError: any) {
    // If rate limited (429), try Groq
    if (geminiError?.status === 429 || geminiError?.message?.includes("quota")) {
      console.log("[chat] Gemini rate limited, falling back to Groq...");
      for await (const chunk of generateGroqStream(fullPrompt)) {
        yield chunk;
      }
      return;
    }
    throw geminiError;
  }
}

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const parsed = chatRequestSchema.safeParse(await req.json());
  if (!parsed.success) {
    return new Response(parsed.error.issues[0]?.message ?? "Invalid request", {
      status: 400,
    });
  }
  const { question, chapterId, uploadId, history } = parsed.data;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("language_pref")
    .eq("id", user.id)
    .single();

  const language: Language = (profile?.language_pref ?? "en") as Language;

  // RAG: pull top chunks
  const chunks = await retrieveContext({
    question,
    chapterId: chapterId ?? null,
    uploadId: uploadId ?? null,
    k: 5,
  });

  // Persist the user message
  await supabase.from("chat_messages").insert({
    student_id: user.id,
    chapter_id: chapterId ?? null,
    upload_id: uploadId ?? null,
    role: "user",
    content: question,
    language,
  });

  const system = tutorSystemPrompt(language);
  const prompt = tutorUserPrompt({
    question,
    context: chunks.map((c) => ({
      content: c.content,
      page_number: c.page_number,
    })),
    language,
    history: history ?? [],
  });

  const encoder = new TextEncoder();
  let full = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const piece of generateWithFallback(prompt, system)) {
          full += piece;
          controller.enqueue(encoder.encode(piece));
        }
        // Persist the AI reply once streaming finishes.
        await supabase.from("chat_messages").insert({
          student_id: user.id,
          chapter_id: chapterId ?? null,
          upload_id: uploadId ?? null,
          role: "ai",
          content: full,
          language,
        });
        controller.close();
      } catch (err) {
        console.error("chat stream error", err);
        controller.enqueue(
          encoder.encode(
            "\n\n_Sorry — something went wrong reaching the tutor._",
          ),
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
