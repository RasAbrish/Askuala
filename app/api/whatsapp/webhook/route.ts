import { NextRequest } from "next/server";
import twilio from "twilio";
import { generate as generateGemini } from "@/lib/ai/gemini";
import { generate as generateGroq } from "@/lib/ai/groq";
import { transcribeAudioFile } from "@/lib/ai/stt";

export const runtime = "nodejs";
const memoryBySender = new Map<string, { role: "user" | "ai"; content: string }[]>();
const MAX_MEMORY_TURNS = 12;

async function askTutor(question: string, sender: string): Promise<string> {
  const history = memoryBySender.get(sender) ?? [];
  const prompt = [
    "You are Askuala tutor. Keep responses concise, clear, and student-friendly.",
    history.length
      ? `Conversation history:\n${history
          .map((m, i) => `${i + 1}. ${m.role.toUpperCase()}: ${m.content}`)
          .join("\n")}`
      : "Conversation history: (none)",
    `Question: ${question}`,
  ].join("\n");
  try {
    return await generateGemini(prompt, { temperature: 0.4 });
  } catch {
    return generateGroq(prompt, { temperature: 0.4 });
  }
}

function pushHistory(sender: string, role: "user" | "ai", content: string) {
  if (!sender || !content.trim()) return;
  const existing = memoryBySender.get(sender) ?? [];
  memoryBySender.set(sender, [...existing, { role, content: content.trim() }].slice(-MAX_MEMORY_TURNS));
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const incoming = String(form.get("Body") ?? "").trim();
  const numMedia = Number(form.get("NumMedia") ?? "0");
  const mediaUrl = String(form.get("MediaUrl0") ?? "");
  const mediaContentType = String(form.get("MediaContentType0") ?? "");
  const sender = String(form.get("From") ?? "").trim() || "unknown";

  const twiml = new twilio.twiml.MessagingResponse();

  if (numMedia > 0 && mediaUrl && mediaContentType.startsWith("audio/")) {
    try {
      const sid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      if (!sid || !authToken) throw new Error("twilio_credentials_missing");

      const audioRes = await fetch(mediaUrl, {
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${authToken}`).toString("base64")}`,
        },
      });
      if (!audioRes.ok) throw new Error("audio_download_failed");

      const blob = await audioRes.blob();
      const file = new File([blob], "voice-note.ogg", { type: mediaContentType });
      const transcript = await transcribeAudioFile(file);
      if (!transcript) {
        twiml.message("I could not hear clear speech. Please try again.");
      } else {
        const answer = await askTutor(transcript, sender);
        pushHistory(sender, "user", transcript);
        pushHistory(sender, "ai", answer);
        twiml.message(`You said: ${transcript}\n\n${answer.slice(0, 1300)}`);
      }
    } catch (error) {
      console.error("[whatsapp] voice transcribe failed", error);
      twiml.message("Voice note processing failed. Please send text for now.");
    }
  } else if (!incoming) {
    twiml.message("Send a text or a voice note and I will help you study.");
  } else {
    try {
      const answer = await askTutor(incoming, sender);
      pushHistory(sender, "user", incoming);
      pushHistory(sender, "ai", answer);
      twiml.message(answer.slice(0, 1500));
    } catch (error) {
      console.error("[whatsapp] webhook failed", error);
      twiml.message("Sorry, I couldn't answer right now. Please try again.");
    }
  }

  return new Response(twiml.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}
