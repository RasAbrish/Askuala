import { GoogleGenerativeAI } from "@google/generative-ai";

const VISION_MODEL = "gemini-1.5-flash";

export interface ExtractResult {
  text: string;
  pageCount: number;
}

/** Extract text from a PDF buffer (with per-page boundaries preserved). */
export async function extractPdf(buf: Buffer): Promise<ExtractResult> {
  const pdf = (await import("pdf-parse")).default;
  // pdf-parse renders each page; we collect them ourselves so RAG keeps page numbers.
  const pages: string[] = [];
  let pageNum = 0;
  await pdf(buf, {
    pagerender: async (pageData: any) => {
      pageNum += 1;
      const tc = await pageData.getTextContent();
      const text = tc.items.map((it: any) => it.str).join(" ");
      pages.push(text);
      return text;
    },
  });
  return {
    text: pages.map((t, i) => `=== Page ${i + 1} ===\n${t}`).join("\n\n"),
    pageCount: pages.length,
  };
}

/** OCR a single image (jpg/png/webp) with Gemini Vision. Handles handwriting + Amharic. */
export async function extractImage(
  buf: Buffer,
  mimeType: string,
): Promise<ExtractResult> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set.");
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: VISION_MODEL });

  const result = await model.generateContent([
    "Extract ALL text from this image exactly as written. Preserve structure (headings, lists, equations). If the text is in Amharic, Tigrinya, or Oromo, keep the original script. Output the text only — no commentary.",
    {
      inlineData: {
        mimeType,
        data: buf.toString("base64"),
      },
    },
  ]);
  const text = result.response.text().trim();
  return { text, pageCount: 1 };
}

export function extractText(text: string): ExtractResult {
  return { text: text.trim(), pageCount: 1 };
}

/** Best-effort title from the extracted text. */
export function inferTitle(text: string, fallback: string): string {
  const firstLine = text
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 0 && l.length < 120);
  if (!firstLine) return fallback;
  // Strip our own page marker if present
  return firstLine.replace(/^=== Page \d+ ===/, "").trim() || fallback;
}

/** Guess source type from a File mime type. */
export function detectSourceType(
  mime: string,
): "pdf" | "image" | "text" | null {
  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("text/")) return "text";
  return null;
}
