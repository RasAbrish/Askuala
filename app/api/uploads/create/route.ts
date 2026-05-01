import { NextRequest, NextResponse } from "next/server";
import { embedBatch as embedGemini } from "@/lib/ai/gemini";
import { embedBatch as embedHuggingFace } from "@/lib/ai/huggingface";
import { embedBatchLocal } from "@/lib/ai/local-embed";
import { chunkPages, chunkText } from "@/lib/ai/chunking";
import {
  detectSourceType,
  extractImage,
  extractPdf,
  extractText,
  inferTitle,
} from "@/lib/ai/extract";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { SourceType } from "@/lib/supabase/types";
import { uploadCreateTextSchema } from "@/lib/validation/api";

// Try Gemini embeddings first, fallback to Hugging Face on rate limits
async function embedWithFallback(texts: string[]): Promise<number[][]> {
  try {
    return await embedGemini(texts);
  } catch (geminiError: any) {
    if (geminiError?.status === 429 || geminiError?.message?.includes("quota")) {
      console.log("[upload] Gemini embeddings rate limited, falling back to Hugging Face...");
      try {
        return await embedHuggingFace(texts);
      } catch (hfError: any) {
        console.warn(
          `[upload] Hugging Face embeddings failed (${hfError?.message ?? "unknown"}); using local embeddings fallback.`,
        );
        return embedBatchLocal(texts);
      }
    }
    throw geminiError;
  }
}

export const runtime = "nodejs";
export const maxDuration = 60;

interface CreatedUpload {
  id: string;
  title: string;
  source_type: SourceType;
}

async function persistUpload(args: {
  studentId: string;
  title: string;
  sourceType: SourceType;
  rawText: string;
  pageCount: number;
}): Promise<CreatedUpload> {
  const admin = createAdminClient();

  const { data: upload, error: upErr } = await admin
    .from("student_uploads")
    .insert({
      student_id: args.studentId,
      title: args.title,
      source_type: args.sourceType,
      word_count: args.rawText.split(/\s+/).filter(Boolean).length,
    })
    .select()
    .single();
  if (upErr) throw upErr;

  // PDFs come back with "=== Page N ===" markers — split them back into pages.
  let chunks;
  if (args.sourceType === "pdf") {
    const pages = args.rawText.split(/=== Page (\d+) ===\n?/).slice(1);
    const pageObjects: { page_number: number; text: string }[] = [];
    for (let i = 0; i < pages.length; i += 2) {
      pageObjects.push({
        page_number: Number(pages[i]),
        text: pages[i + 1] ?? "",
      });
    }
    chunks = chunkPages(pageObjects);
  } else {
    chunks = chunkText(args.rawText);
  }

  if (!chunks.length) {
    // Roll back
    await admin.from("student_uploads").delete().eq("id", upload.id);
    throw new Error(
      "Couldn't extract enough text from this upload to study from.",
    );
  }

  // Embed in batches
  const BATCH = 50;
  try {
    for (let i = 0; i < chunks.length; i += BATCH) {
      const slice = chunks.slice(i, i + BATCH);
      const embeddings = await embedWithFallback(slice.map((c) => c.content));
      const rows = slice.map((c, idx) => ({
        upload_id: upload.id,
        content: c.content,
        page_number: c.page_number,
        embedding: embeddings[idx],
      }));
      const { error: insErr } = await admin.from("textbook_chunks").insert(rows);
      if (insErr) throw insErr;
    }
  } catch (embeddingErr) {
    await admin.from("textbook_chunks").delete().eq("upload_id", upload.id);
    await admin.from("student_uploads").delete().eq("id", upload.id);
    throw embeddingErr;
  }

  return {
    id: upload.id,
    title: upload.title,
    source_type: upload.source_type,
  };
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contentType = req.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file") as File | null;
      const titleHint = (form.get("title") as string | null) ?? null;
      const cleanedTitle =
        titleHint?.toString().trim().slice(0, 120) || null;

      if (!file)
        return NextResponse.json(
          { error: "No file uploaded." },
          { status: 400 },
        );

      const sourceType = detectSourceType(file.type);
      if (!sourceType)
        return NextResponse.json(
          {
            error: `Unsupported file type: ${file.type}. Use PDF or an image.`,
          },
          { status: 400 },
        );

      const buf = Buffer.from(await file.arrayBuffer());
      const extracted =
        sourceType === "pdf"
          ? await extractPdf(buf)
          : sourceType === "image"
            ? await extractImage(buf, file.type)
            : extractText(buf.toString("utf8"));

      if (!extracted.text || extracted.text.length < 80)
        return NextResponse.json(
          { error: "We couldn't get usable text from that file." },
          { status: 400 },
        );

      const created = await persistUpload({
        studentId: user.id,
        title: cleanedTitle || inferTitle(extracted.text, file.name),
        sourceType,
        rawText: extracted.text,
        pageCount: extracted.pageCount,
      });
      return NextResponse.json(created);
    }

    // JSON body for pasted text
    const parsedBody = uploadCreateTextSchema.safeParse(await req.json());
    if (!parsedBody.success)
      return NextResponse.json(
        { error: parsedBody.error.issues[0]?.message ?? "Invalid request." },
        { status: 400 },
      );
    const { text, title } = parsedBody.data;

    const extracted = extractText(text);
    const created = await persistUpload({
      studentId: user.id,
      title: title || inferTitle(extracted.text, "Pasted note"),
      sourceType: "text",
      rawText: extracted.text,
      pageCount: 1,
    });
    return NextResponse.json(created);
  } catch (e: any) {
    console.error("upload create failed", e);
    return NextResponse.json(
      { error: e.message ?? "Upload failed." },
      { status: 500 },
    );
  }
}
