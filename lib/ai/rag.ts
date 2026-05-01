import { embedText as embedGemini } from "@/lib/ai/gemini";
import { embedText as embedHuggingFace } from "@/lib/ai/huggingface";
import { embedTextLocal } from "@/lib/ai/local-embed";
import { createAdminClient } from "@/lib/supabase/server";
import type { MatchedChunk } from "@/lib/supabase/types";

async function embedQueryWithFallback(question: string): Promise<number[]> {
  try {
    return await embedGemini(question);
  } catch (geminiError: any) {
    if (geminiError?.status === 429 || geminiError?.message?.includes("quota")) {
      try {
        return await embedHuggingFace(question);
      } catch (hfError: any) {
        console.warn(
          `[rag] Hugging Face query embedding failed (${hfError?.message ?? "unknown"}); using local embeddings fallback.`,
        );
        return embedTextLocal(question);
      }
    }
    throw geminiError;
  }
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length > 2);
}

function lexicalScore(queryTerms: Set<string>, content: string): number {
  if (!queryTerms.size) return 0;
  const terms = new Set(tokenize(content));
  let hits = 0;
  for (const t of queryTerms) {
    if (terms.has(t)) hits += 1;
  }
  return hits / queryTerms.size;
}

export async function retrieveContext(args: {
  question: string;
  chapterId?: string | null;
  uploadId?: string | null;
  k?: number;
}): Promise<MatchedChunk[]> {
  const embedding = await embedQueryWithFallback(args.question);
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("match_textbook_chunks", {
    query_embedding: embedding,
    match_chapter_id: args.chapterId ?? null,
    match_upload_id: args.uploadId ?? null,
    match_count: args.k ?? 5,
  });
  if (error) {
    const isOldRpcSignature =
      error.code === "PGRST202" && error.message.includes("match_upload_id");
    if (isOldRpcSignature && args.chapterId && !args.uploadId) {
      const fallback = await supabase.rpc("match_textbook_chunks", {
        query_embedding: embedding,
        match_chapter_id: args.chapterId,
        match_count: args.k ?? 5,
      });
      if (fallback.error) throw fallback.error;
      return (fallback.data ?? []) as MatchedChunk[];
    }
    throw error;
  }

  const matched = (data ?? []) as MatchedChunk[];
  if (matched.length) return matched;

  // Fallback: if vector retrieval has no matches, do lexical retrieval from source chunks.
  if (!args.chapterId && !args.uploadId) return [];

  let query = supabase
    .from("textbook_chunks")
    .select("id, chapter_id, upload_id, content, page_number")
    .order("page_number", { ascending: true })
    .limit(200);

  if (args.chapterId) query = query.eq("chapter_id", args.chapterId);
  if (args.uploadId) query = query.eq("upload_id", args.uploadId);

  const { data: rawChunks, error: rawErr } = await query;
  if (rawErr) throw rawErr;

  const candidates =
    ((rawChunks ?? []) as Omit<MatchedChunk, "similarity">[]).map((chunk) => ({
      ...chunk,
      similarity: 0,
    })) as MatchedChunk[];
  if (!candidates.length) return [];

  const queryTerms = new Set(tokenize(args.question));
  const ranked = candidates
    .map((c) => ({ ...c, similarity: lexicalScore(queryTerms, c.content) }))
    .sort((a, b) => b.similarity - a.similarity);

  const top = ranked.slice(0, args.k ?? 5);
  if (top[0]?.similarity > 0) return top;

  // Last-resort: return first chunks so tutor still has source context.
  return candidates.slice(0, args.k ?? 5);
}

/** Concatenate chunks for a chapter or upload — used by flashcard / quiz / summary generators. */
export async function loadSourceText(
  source: { chapterId?: string | null; uploadId?: string | null },
  maxChars = 12000,
): Promise<string> {
  const supabase = createAdminClient();
  let query = supabase
    .from("textbook_chunks")
    .select("content, page_number")
    .order("page_number", { ascending: true });
  if (source.chapterId) query = query.eq("chapter_id", source.chapterId);
  else if (source.uploadId) query = query.eq("upload_id", source.uploadId);
  else return "";

  const { data, error } = await query;
  if (error) throw error;

  let out = "";
  for (const row of (data ?? []) as { content: string }[]) {
    if (out.length + row.content.length > maxChars) break;
    out += row.content + "\n\n";
  }
  return out.trim();
}

/** @deprecated — use loadSourceText({ chapterId }) instead. Kept for backward compat. */
export async function loadChapterText(chapterId: string, maxChars?: number) {
  return loadSourceText({ chapterId }, maxChars);
}
