import "dotenv/config";
import TelegramBot from "node-telegram-bot-api";
import type { Message } from "node-telegram-bot-api";
import pdf from "pdf-parse";
import { generate as generateGemini } from "../../lib/ai/gemini";
import { generate as generateGroq } from "../../lib/ai/groq";
import { transcribeAudioFile } from "../../lib/ai/stt";
import type { Language } from "../../lib/supabase/types";

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN is not set.");
}

const bot = new TelegramBot(token, { polling: false });
const userLanguage = new Map<number, Language>();

const HELP = [
  "Askuala bot is running.",
  "Commands:",
  "/start - welcome message",
  "/help - this help text",
  "/health - check AI providers and bot status",
  "/lang <en|am|om|ti> - set reply language",
  "/ask <question> - ask the AI tutor",
  "/summary <topic/text> - get a short study summary",
  "/quiz <topic> - quick 5-question quiz",
  "Send PDF/TXT document - get summary + flashcards + quiz",
  "Send long text message - get summary + flashcards + quiz",
].join("\n");

function languageInstruction(lang: Language): string {
  if (lang === "am") return "Respond in simple Amharic.";
  if (lang === "om") return "Respond in simple Afaan Oromo.";
  if (lang === "ti") return "Respond in simple Tigrinya.";
  return "Respond in simple English.";
}

function getLang(userId?: number): Language {
  if (!userId) return "en";
  return userLanguage.get(userId) ?? "en";
}

function toPlainTutorText(text: string): string {
  return text
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "- ")
    .trim();
}

async function runTutorPrompt(prompt: string): Promise<string> {
  try {
    return await generateGroq(prompt, { temperature: 0.4 });
  } catch (groqError) {
    console.warn("[telegram] Groq unavailable, using Gemini fallback.", groqError);
    return generateGemini(prompt, { temperature: 0.4 });
  }
}

async function askTutor(question: string, lang: Language): Promise<string> {
  const prompt = [
    "You are Askuala tutor. Keep responses concise, clear, and student-friendly.",
    "Use professional plain text formatting with numbering and bullet points only.",
    "Do not use markdown symbols like **, *, `, or ###.",
    languageInstruction(lang),
    `Question: ${question}`,
  ].join("\n");
  const raw = await runTutorPrompt(prompt);
  return toPlainTutorText(raw);
}

function normalizeLang(input: string): Language | null {
  const v = input.trim().toLowerCase();
  if (v === "en" || v === "am" || v === "om" || v === "ti") return v;
  return null;
}

bot.onText(/\/start/, async (msg: Message) => {
  await bot.sendMessage(msg.chat.id, "Welcome to Askuala Telegram bot.\n" + HELP);
});

bot.onText(/\/help/, async (msg: Message) => {
  await bot.sendMessage(msg.chat.id, HELP);
});

bot.onText(/\/ask(?:\s+([\s\S]+))?/, async (msg: Message, match) => {
  const question = match?.[1]?.trim();
  if (!question) {
    await bot.sendMessage(msg.chat.id, "Usage: /ask Explain photosynthesis simply");
    return;
  }

  await bot.sendChatAction(msg.chat.id, "typing");
  try {
    const answer = await askTutor(question, getLang(msg.from?.id));
    await bot.sendMessage(msg.chat.id, answer.slice(0, 4000));
  } catch (error) {
    console.error("[telegram] ask failed", error);
    await bot.sendMessage(msg.chat.id, "Sorry, I couldn't answer right now. Please try again.");
  }
});

bot.onText(/\/lang(?:\s+([a-z]{2}))?/, async (msg: Message, match) => {
  const langRaw = match?.[1]?.trim();
  if (!langRaw) {
    await bot.sendMessage(msg.chat.id, "Usage: /lang en or /lang am or /lang om or /lang ti");
    return;
  }
  const lang = normalizeLang(langRaw);
  if (!lang) {
    await bot.sendMessage(msg.chat.id, "Unsupported language. Use one of: en, am, om, ti");
    return;
  }
  if (msg.from?.id) userLanguage.set(msg.from.id, lang);
  await bot.sendMessage(msg.chat.id, `Language updated to: ${lang.toUpperCase()}`);
});

bot.onText(/\/summary(?:\s+([\s\S]+))?/, async (msg: Message, match) => {
  const topic = match?.[1]?.trim();
  if (!topic) {
    await bot.sendMessage(msg.chat.id, "Usage: /summary Cell division");
    return;
  }
  await bot.sendChatAction(msg.chat.id, "typing");
  const lang = getLang(msg.from?.id);
  const prompt = [
    "Create a concise high-school-friendly summary in 6-8 bullet points.",
    languageInstruction(lang),
    `Topic/Text: ${topic}`,
  ].join("\n");
  try {
    const answer = await runTutorPrompt(prompt);
    await bot.sendMessage(msg.chat.id, toPlainTutorText(answer).slice(0, 4000));
  } catch (error) {
    console.error("[telegram] summary failed", error);
    await bot.sendMessage(msg.chat.id, "Could not generate summary right now.");
  }
});

bot.onText(/\/quiz(?:\s+([\s\S]+))?/, async (msg: Message, match) => {
  const topic = match?.[1]?.trim();
  if (!topic) {
    await bot.sendMessage(msg.chat.id, "Usage: /quiz Biology Chapter 3");
    return;
  }
  await bot.sendChatAction(msg.chat.id, "typing");
  const lang = getLang(msg.from?.id);
  const prompt = [
    "Generate 5 MCQ questions for Ethiopian high-school students.",
    languageInstruction(lang),
    "Format exactly as numbered list with options A-D and mark answer on next line as 'Answer: ...'.",
    `Topic: ${topic}`,
  ].join("\n");
  try {
    const quiz = await runTutorPrompt(prompt);
    await bot.sendMessage(msg.chat.id, toPlainTutorText(quiz).slice(0, 4000));
  } catch (error) {
    console.error("[telegram] quiz failed", error);
    await bot.sendMessage(msg.chat.id, "Could not generate quiz right now.");
  }
});

async function summarizeMaterial(content: string, lang: Language): Promise<string> {
  const prompt = [
    "Summarize this study material for an Ethiopian high school student.",
    languageInstruction(lang),
    "Use 6-8 bullet points and keep it concise.",
    `Material:\n${content.slice(0, 12000)}`,
  ].join("\n");
  return runTutorPrompt(prompt);
}

async function makeFlashcards(content: string, lang: Language): Promise<string> {
  const prompt = [
    "Generate 8 flashcards from this material.",
    languageInstruction(lang),
    "Format as numbered list. Each line: Q: ... | A: ...",
    `Material:\n${content.slice(0, 12000)}`,
  ].join("\n");
  return runTutorPrompt(prompt);
}

async function makeQuiz(content: string, lang: Language): Promise<string> {
  const prompt = [
    "Generate 5 MCQ questions from this material.",
    languageInstruction(lang),
    "Format exactly as numbered list with A-D options and answer line below each question.",
    `Material:\n${content.slice(0, 12000)}`,
  ].join("\n");
  return runTutorPrompt(prompt);
}

async function processUploadedText(msg: Message, title: string, content: string) {
  const lang = getLang(msg.from?.id);
  await bot.sendMessage(msg.chat.id, `Processing "${title}"...`);
  await bot.sendChatAction(msg.chat.id, "typing");

  const summary = await summarizeMaterial(content, lang);
  await bot.sendMessage(msg.chat.id, `Summary:\n${toPlainTutorText(summary)}`.slice(0, 4000));

  const cards = await makeFlashcards(content, lang);
  await bot.sendMessage(msg.chat.id, `Flashcards:\n${toPlainTutorText(cards)}`.slice(0, 4000));

  const quiz = await makeQuiz(content, lang);
  await bot.sendMessage(msg.chat.id, `Quiz:\n${toPlainTutorText(quiz)}`.slice(0, 4000));
}

bot.on("document", async (msg: Message) => {
  const doc = msg.document;
  if (!doc) return;

  await bot.sendChatAction(msg.chat.id, "typing");
  try {
    const file = await bot.getFile(doc.file_id);
    if (!file.file_path) throw new Error("missing_file_path");
    const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
    const res = await fetch(fileUrl);
    if (!res.ok) throw new Error("file_download_failed");
    const bytes = Buffer.from(await res.arrayBuffer());

    const name = doc.file_name || "document";
    const mime = doc.mime_type || "";

    if (mime.includes("pdf") || name.toLowerCase().endsWith(".pdf")) {
      const parsed = await pdf(bytes);
      const text = parsed.text?.trim();
      if (!text || text.length < 80) {
        await bot.sendMessage(msg.chat.id, "I could not extract enough text from this PDF.");
        return;
      }
      await processUploadedText(msg, name, text);
      return;
    }

    if (mime.includes("text") || name.toLowerCase().endsWith(".txt") || name.toLowerCase().endsWith(".md")) {
      const text = bytes.toString("utf8").trim();
      if (text.length < 80) {
        await bot.sendMessage(msg.chat.id, "Text file is too short. Send a longer file.");
        return;
      }
      await processUploadedText(msg, name, text);
      return;
    }

    await bot.sendMessage(
      msg.chat.id,
      "Unsupported file type. Send PDF or TXT and I will generate summary, flashcards, and quiz.",
    );
  } catch (error) {
    console.error("[telegram] document failed", error);
    await bot.sendMessage(msg.chat.id, "Sorry, file processing failed. Try another PDF/TXT.");
  }
});

bot.on("text", async (msg: Message) => {
  const text = msg.text?.trim();
  if (!text || text.startsWith("/")) return;

  // Treat normal short text as direct tutor questions.
  if (text.length < 120) {
    await bot.sendChatAction(msg.chat.id, "typing");
    try {
      const answer = await askTutor(text, getLang(msg.from?.id));
      await bot.sendMessage(msg.chat.id, answer.slice(0, 4000));
    } catch (error) {
      console.error("[telegram] short text ask failed", error);
      await bot.sendMessage(msg.chat.id, "Sorry, I couldn't answer right now. Please try again.");
    }
    return;
  }

  await bot.sendMessage(
    msg.chat.id,
    "I detected long study text. Generating summary, flashcards, and quiz...",
  );
  try {
    await processUploadedText(msg, "Pasted text", text);
  } catch (error) {
    console.error("[telegram] pasted text processing failed", error);
    await bot.sendMessage(msg.chat.id, "Could not process that text right now.");
  }
});

bot.onText(/\/health/, async (msg: Message) => {
  await bot.sendChatAction(msg.chat.id, "typing");
  const checks: string[] = [];
  checks.push(token ? "Telegram token: OK" : "Telegram token: Missing");
  checks.push(process.env.GEMINI_API_KEY ? "Gemini key: OK" : "Gemini key: Missing");
  checks.push(process.env.GROQ_API_KEY ? "Groq key: OK" : "Groq key: Missing");
  try {
    await runTutorPrompt("Reply with exactly: HEALTH_OK");
    checks.push("AI generation: OK");
  } catch {
    checks.push("AI generation: Failed");
  }
  await bot.sendMessage(msg.chat.id, checks.join("\n"));
});

bot.on("voice", async (msg: Message) => {
  const voice = msg.voice;
  if (!voice) return;

  await bot.sendChatAction(msg.chat.id, "typing");
  try {
    const file = await bot.getFile(voice.file_id);
    if (!file.file_path) throw new Error("missing_file_path");

    const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
    const res = await fetch(fileUrl);
    if (!res.ok) throw new Error("voice_download_failed");

    const blob = await res.blob();
    const audioFile = new File([blob], "voice.ogg", { type: blob.type || "audio/ogg" });
    const transcript = await transcribeAudioFile(audioFile);
    if (!transcript) {
      await bot.sendMessage(msg.chat.id, "I could not hear clear speech. Please try again.");
      return;
    }

    const answer = await askTutor(transcript, getLang(msg.from?.id));
    await bot.sendMessage(
      msg.chat.id,
      `You said: ${transcript}\n\n${answer.slice(0, 3600)}`,
    );
  } catch (error) {
    console.error("[telegram] voice failed", error);
    await bot.sendMessage(msg.chat.id, "Sorry, voice processing failed. Try /ask with text.");
  }
});

bot.on("polling_error", (err) => {
  console.error("[telegram] polling_error", err);
});

async function start() {
  try {
    await bot.deleteWebHook();
  } catch (error) {
    console.warn("[telegram] deleteWebHook skipped/failed", error);
  }
  await bot.startPolling({
    restart: true,
  });
  console.log("[telegram] Bot is running with polling...");
}

start().catch((error) => {
  console.error("[telegram] failed to start bot", error);
  process.exit(1);
});
