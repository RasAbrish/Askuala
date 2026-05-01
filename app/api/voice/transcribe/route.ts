import { NextRequest } from "next/server";
import { Groq } from "groq-sdk";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function getClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set.");
  }
  return new Groq({ apiKey });
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    const formData = await req.formData();
    const audio = formData.get("audio");

    if (!(audio instanceof File)) {
      return new Response("Missing audio file", { status: 400 });
    }

    const groq = getClient();
    const transcription = await groq.audio.transcriptions.create({
      file: audio,
      model: "whisper-large-v3-turbo",
      response_format: "json",
      temperature: 0,
    });

    return Response.json({ text: transcription.text ?? "" });
  } catch (error) {
    console.error("[voice/transcribe] failed", error);
    return new Response("Failed to transcribe audio", { status: 500 });
  }
}
