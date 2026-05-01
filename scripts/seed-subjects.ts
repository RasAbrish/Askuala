/**
 * Seed standard Ethiopian curriculum subjects into Supabase.
 *
 *   npx tsx scripts/seed-subjects.ts
 *
 * Data is based on the Ethiopian national education curriculum (free/open).
 */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import { createClient } from "@supabase/supabase-js";

const SUBJECTS = [
  // Grade 9
  { name: "English", grade: 9 },
  { name: "Mathematics", grade: 9 },
  { name: "Biology", grade: 9 },
  { name: "Chemistry", grade: 9 },
  { name: "Physics", grade: 9 },
  { name: "Geography", grade: 9 },
  { name: "History", grade: 9 },
  { name: "Civics and Ethical Education", grade: 9 },
  { name: "Amharic", grade: 9 },
  // Grade 10
  { name: "English", grade: 10 },
  { name: "Mathematics", grade: 10 },
  { name: "Biology", grade: 10 },
  { name: "Chemistry", grade: 10 },
  { name: "Physics", grade: 10 },
  { name: "Geography", grade: 10 },
  { name: "History", grade: 10 },
  { name: "Civics and Ethical Education", grade: 10 },
  { name: "Economics", grade: 10 },
  { name: "Amharic", grade: 10 },
  // Grade 11 — Natural Science
  { name: "English", grade: 11 },
  { name: "Mathematics", grade: 11 },
  { name: "Biology", grade: 11 },
  { name: "Chemistry", grade: 11 },
  { name: "Physics", grade: 11 },
  { name: "Geography", grade: 11 },
  { name: "History", grade: 11 },
  { name: "Civics and Ethical Education", grade: 11 },
  { name: "Economics", grade: 11 },
  { name: "Amharic", grade: 11 },
  { name: "Technical Drawing", grade: 11 },
  { name: "ICT", grade: 11 },
  // Grade 11 — Social Science
  { name: "English", grade: 12 },
  { name: "Mathematics", grade: 12 },
  { name: "Biology", grade: 12 },
  { name: "Chemistry", grade: 12 },
  { name: "Physics", grade: 12 },
  { name: "Geography", grade: 12 },
  { name: "History", grade: 12 },
  { name: "Civics and Ethical Education", grade: 12 },
  { name: "Economics", grade: 12 },
  { name: "Amharic", grade: 12 },
  { name: "General Business", grade: 12 },
];

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  console.log(`Seeding ${SUBJECTS.length} subjects...`);

  for (const s of SUBJECTS) {
    const { data: existing } = await supabase
      .from("subjects")
      .select("id")
      .eq("name", s.name)
      .eq("grade", s.grade)
      .maybeSingle();
    if (existing) {
      console.log(`  ⏭ ${s.name} (Grade ${s.grade}) — already exists`);
      continue;
    }
    const { error } = await supabase
      .from("subjects")
      .insert({ name: s.name, grade: s.grade });
    if (error) {
      console.error(`  ✗ ${s.name} (G${s.grade}):`, error.message);
    } else {
      console.log(`  ✓ ${s.name} (Grade ${s.grade})`);
    }
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
