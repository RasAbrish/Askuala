import { NextRequest, NextResponse } from "next/server";
import { generate as generateGemini } from "@/lib/ai/gemini";
import { generate as generateGroq } from "@/lib/ai/groq";
import { summaryPrompt } from "@/lib/ai/prompts";
import { loadSourceText } from "@/lib/ai/rag";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { Language } from "@/lib/supabase/types";

export const runtime = "nodejs";

async function generateSummaryWithFallback(prompt: string): Promise<string> {
  try {
    return await generateGemini(prompt, { temperature: 0.4 });
  } catch (geminiError: any) {
    if (geminiError?.status === 429 || geminiError?.message?.includes("quota")) {
      console.log("[summary] Gemini rate limited, falling back to Groq...");
      return await generateGroq(prompt, { temperature: 0.4 });
    }
    throw geminiError;
  }
}

export async function POST(
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
  const { data: upload } = (await admin
    .from("student_uploads")
    .select("id, title, student_id")
    .eq("id", params.id)
    .single()) as { data: { id: string; title: string; student_id: string } | null };
  if (!upload || upload.student_id !== user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("language_pref")
    .eq("id", user.id)
    .single();
  const language: Language = (profile?.language_pref ?? "en") as Language;

  const context = await loadSourceText({ uploadId: upload.id });
  if (!context)
    return NextResponse.json(
      { error: "No content to summarize." },
      { status: 400 },
    );

  const summary = await generateSummaryWithFallback(
    summaryPrompt({ chapterTitle: upload.title, context, language }),
  );

  return NextResponse.json({ summary });
}
