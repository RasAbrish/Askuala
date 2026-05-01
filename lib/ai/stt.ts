import { Groq } from "groq-sdk";

function client() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set.");
  }
  return new Groq({ apiKey });
}

export async function transcribeAudioFile(file: File): Promise<string> {
  const groq = client();
  const transcription = await groq.audio.transcriptions.create({
    file,
    model: "whisper-large-v3-turbo",
    response_format: "json",
    temperature: 0,
  });
  return transcription.text?.trim() ?? "";
}
