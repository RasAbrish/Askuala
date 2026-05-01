import { NextRequest } from "next/server";
import twilio from "twilio";
import { generate as generateGemini } from "@/lib/ai/gemini";
import { generate as generateGroq } from "@/lib/ai/groq";
import { transcribeAudioFile } from "@/lib/ai/stt";

export const runtime = "nodejs";

async function askTutor(question: string): Promise<string> {
  const prompt = `You are Askuala tutor. Keep responses concise, clear, and student-friendly.\nQuestion: ${question}`;
  try {
    return await generateGemini(prompt, { temperature: 0.4 });
  } catch {
    return generateGroq(prompt, { temperature: 0.4 });
  }
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const incoming = String(form.get("Body") ?? "").trim();
  const numMedia = Number(form.get("NumMedia") ?? "0");
  const mediaUrl = String(form.get("MediaUrl0") ?? "");
  const mediaContentType = String(form.get("MediaContentType0") ?? "");

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
        const answer = await askTutor(transcript);
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
      const answer = await askTutor(incoming);
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
