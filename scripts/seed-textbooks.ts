/**
 * Seed textbook metadata + chapters for ALL seeded subjects/grades (9-12).
 *
 * Strategy:
 * - Uses free/open-source learning references for `pdf_url` or source URL.
 * - Creates one textbook per subject/grade if missing.
 * - Creates 8 starter chapters per textbook if missing.
 *
 * Usage:
 *   npx tsx scripts/seed-textbooks.ts
 */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

const FREE_SOURCES: Record<string, string> = {
  English: "https://openstax.org/subjects",
  Mathematics: "https://openstax.org/subjects/math",
  Biology: "https://openstax.org/details/books/biology-2e",
  Chemistry: "https://openstax.org/details/books/chemistry-2e",
  Physics: "https://openstax.org/details/books/college-physics-2e",
  Geography: "https://www.wikibooks.org/wiki/Geography",
  History: "https://www.wikibooks.org/wiki/World_History",
  "Civics and Ethical Education": "https://www.wikibooks.org/wiki/Social_and_Political_Philosophy",
  Economics: "https://www.core-econ.org/the-economy/",
  Amharic: "https://www.wikipedia.org/",
  "Technical Drawing": "https://www.wikibooks.org/wiki/Engineering_Drawing_and_Design",
  ICT: "https://www.wikibooks.org/wiki/ICT",
  "General Business": "https://www.wikibooks.org/wiki/Business",
};

type SubjectRow = { id: string; name: string; grade: number };

type ChapterDef = { number: number; title: string; summary: string };

function chapterTemplate(subject: string, grade: number): ChapterDef[] {
  return [
    {
      number: 1,
      title: `Introduction to ${subject}`,
      summary: `${subject} Grade ${grade}: foundations, key vocabulary, and why this subject matters in real life and national exams.`,
    },
    {
      number: 2,
      title: `${subject} Core Concepts I`,
      summary: `First major unit for Grade ${grade} ${subject}. Focus on definitions, examples, and guided practice.`,
    },
    {
      number: 3,
      title: `${subject} Core Concepts II`,
      summary: `Second core unit with worked examples, concept checks, and common exam-style questions.`,
    },
    {
      number: 4,
      title: `Methods and Applications in ${subject}`,
      summary: `How to apply ${subject} concepts in classroom tasks, assignments, and contextual Ethiopian examples.`,
    },
    {
      number: 5,
      title: `Problem Solving in ${subject}`,
      summary: `Step-by-step strategies for solving structured and open-ended ${subject} questions.`,
    },
    {
      number: 6,
      title: `${subject} and Society`,
      summary: `Connections between ${subject}, community needs, technology, ethics, and development goals.`,
    },
    {
      number: 7,
      title: `Revision Unit: ${subject}`,
      summary: `Consolidated revision notes for Grade ${grade} ${subject}, including misconceptions and checkpoints.`,
    },
    {
      number: 8,
      title: `${subject} Exam Preparation`,
      summary: `Exam tips, likely question patterns, and a final summary for Grade ${grade} ${subject}.`,
    },
  ];
}

async function seedTextbookForSubject(subject: SubjectRow) {
  const title = `${subject.name} - Grade ${subject.grade} (Open Learning Edition)`;
  const sourceUrl = FREE_SOURCES[subject.name] ?? "https://www.wikibooks.org/";

  const { data: existingTb } = await admin
    .from("textbooks")
    .select("id")
    .eq("subject_id", subject.id)
    .eq("title", title)
    .maybeSingle();

  let textbookId = existingTb?.id as string | undefined;

  if (!textbookId) {
    const { data: inserted, error } = await admin
      .from("textbooks")
      .insert({
        subject_id: subject.id,
        title,
        pdf_url: sourceUrl,
        total_pages: 160,
      })
      .select("id")
      .single();

    if (error || !inserted) {
      console.error(`  ✗ ${subject.name} G${subject.grade} textbook failed:`, error?.message);
      return;
    }
    textbookId = inserted.id;
    console.log(`  ✓ ${subject.name} G${subject.grade} textbook created`);
  } else {
    console.log(`  ⏭ ${subject.name} G${subject.grade} textbook already exists`);
  }

  const chapters = chapterTemplate(subject.name, subject.grade);

  for (const ch of chapters) {
    const { data: exists } = await admin
      .from("chapters")
      .select("id")
      .eq("textbook_id", textbookId)
      .eq("chapter_number", ch.number)
      .maybeSingle();

    if (exists) continue;

    const { error } = await admin.from("chapters").insert({
      textbook_id: textbookId,
      chapter_number: ch.number,
      title: ch.title,
      summary: ch.summary,
      start_page: (ch.number - 1) * 20 + 1,
      end_page: ch.number * 20,
    });

    if (error) {
      console.error(`    ✗ Chapter ${ch.number} failed:`, error.message);
    }
  }
}

async function main() {
  const { data: subjects, error } = await admin
    .from("subjects")
    .select("id,name,grade")
    .order("grade", { ascending: true })
    .order("name", { ascending: true });

  if (error || !subjects) {
    throw new Error(error?.message || "Could not load subjects.");
  }

  if (!subjects.length) {
    console.log("No subjects found. Run: npm run seed:subjects");
    return;
  }

  console.log(`Seeding textbooks for ${subjects.length} subject rows (grades 9-12)...`);
  for (const subject of subjects as SubjectRow[]) {
    await seedTextbookForSubject(subject);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
