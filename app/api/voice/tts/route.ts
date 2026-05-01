import { NextRequest } from "next/server";
import { tts } from "edge-tts/out/index.js";
import { createClient } from "@/lib/supabase/server";
import { ttsRequestSchema } from "@/lib/validation/api";

export const runtime = "nodejs";

const VOICES: Record<string, string> = {
  en: "en-US-AriaNeural",
  am: "am-ET-AmehaNeural",
  om: "en-US-AriaNeural",
  ti: "am-ET-AmehaNeural",
};

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const parsed = ttsRequestSchema.safeParse(await req.json());
  if (!parsed.success) {
    return new Response(parsed.error.issues[0]?.message ?? "Invalid request", {
      status: 400,
    });
  }

  const { text, language } = parsed.data;

  try {
    const audio = await tts(text, {
      voice: VOICES[language] ?? VOICES.en,
      rate: "+0%",
      pitch: "+0Hz",
      volume: "+0%",
    });

    return new Response(new Uint8Array(audio), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[voice/tts] failed", error);
    return new Response("Failed to synthesize speech", { status: 500 });
  }
}
