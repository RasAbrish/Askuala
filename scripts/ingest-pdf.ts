/**
 * Ingest a PDF textbook into Supabase.
 *
 *   npm run ingest -- \
 *     --pdf ./data/textbooks/biology-grade-11.pdf \
 *     --subject "Biology" \
 *     --grade 11 \
 *     --title "Biology — Grade 11"
 *
 * Pipeline:
 *   1. Read PDF, extract per-page text (pdf-parse)
 *   2. Detect chapter markers (Chapter N / Unit N)
 *   3. For each chapter, chunk text + embed (Gemini text-embedding-004)
 *   4. Insert into subjects / textbooks / chapters / textbook_chunks
 */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env" });
loadEnv();
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { createClient } from "@supabase/supabase-js";
import { chunkPages, detectChapters } from "../lib/ai/chunking";
import { embedBatch } from "../lib/ai/gemini";

interface PageText {
  page_number: number;
  text: string;
}

async function extractPages(pdfPath: string): Promise<PageText[]> {
  // pdf-parse exposes a per-page hook via render options.
  const buf = fs.readFileSync(pdfPath);
  const pdf = (await import("pdf-parse")).default;
  const pages: PageText[] = [];
  let pageNum = 0;

  await pdf(buf, {
    pagerender: async (pageData: any) => {
      pageNum += 1;
      const textContent = await pageData.getTextContent();
      const text = textContent.items.map((it: any) => it.str).join(" ");
      pages.push({ page_number: pageNum, text });
      return text;
    },
  });
  return pages;
}

async function main() {
  const { values } = parseArgs({
    options: {
      pdf: { type: "string" },
      subject: { type: "string" },
      grade: { type: "string" },
      title: { type: "string" },
    },
  });

  if (!values.pdf || !values.subject || !values.grade || !values.title) {
    console.error(
      "Usage: npm run ingest -- --pdf <path> --subject <name> --grade <9-12> --title <textbook title>",
    );
    process.exit(1);
  }

  const pdfPath = path.resolve(values.pdf);
  if (!fs.existsSync(pdfPath)) {
    console.error(`PDF not found: ${pdfPath}`);
    process.exit(1);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  console.log(`📖 Reading ${pdfPath}…`);
  const pages = await extractPages(pdfPath);
  console.log(`   ${pages.length} pages extracted`);

  // 1. Subject
  const grade = Number(values.grade);
  let { data: subject } = await supabase
    .from("subjects")
    .select("*")
    .eq("name", values.subject)
    .eq("grade", grade)
    .maybeSingle();

  if (!subject) {
    const { data, error } = await supabase
      .from("subjects")
      .insert({ name: values.subject, grade })
      .select()
      .single();
    if (error) throw error;
    subject = data;
  }
  console.log(`📚 Subject: ${subject!.name} (Grade ${subject!.grade})`);

  // 2. Textbook
  const { data: textbook, error: tbErr } = await supabase
    .from("textbooks")
    .insert({
      subject_id: subject!.id,
      title: values.title,
      total_pages: pages.length,
    })
    .select()
    .single();
  if (tbErr) throw tbErr;
  console.log(`📕 Textbook inserted: ${textbook.id}`);

  // 3. Chapters (or one fallback chapter)
  let detected = detectChapters(pages);
  if (!detected.length) {
    detected = [
      {
        number: 1,
        title: values.title,
        start_page: 1,
        end_page: pages.length,
      },
    ];
    console.log("ℹ️  No chapter markers detected — using a single chapter.");
  } else {
    console.log(`📑 Detected ${detected.length} chapters`);
  }

  for (const ch of detected) {
    const { data: chapter, error: chErr } = await supabase
      .from("chapters")
      .insert({
        textbook_id: textbook.id,
        chapter_number: ch.number,
        title: ch.title,
        start_page: ch.start_page,
        end_page: ch.end_page,
      })
      .select()
      .single();
    if (chErr) throw chErr;

    const chapterPages = pages.filter(
      (p) => p.page_number >= ch.start_page && p.page_number <= ch.end_page,
    );
    const chunks = chunkPages(chapterPages);
    console.log(
      `   • Ch.${ch.number} "${ch.title}" — ${chunks.length} chunks`,
    );

    if (!chunks.length) continue;

    // Embed in batches of 50
    const BATCH = 50;
    for (let i = 0; i < chunks.length; i += BATCH) {
      const slice = chunks.slice(i, i + BATCH);
      const embeddings = await embedBatch(slice.map((c) => c.content));
      const rows = slice.map((c, idx) => ({
        chapter_id: chapter.id,
        content: c.content,
        page_number: c.page_number,
        embedding: embeddings[idx],
      }));
      const { error: insErr } = await supabase
        .from("textbook_chunks")
        .insert(rows);
      if (insErr) throw insErr;
      process.stdout.write(
        `     embedded ${Math.min(i + BATCH, chunks.length)}/${chunks.length}\r`,
      );
    }
    console.log("");
  }

  console.log("✅ Ingestion complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
