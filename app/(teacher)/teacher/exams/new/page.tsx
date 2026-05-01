import { redirect } from "next/navigation";
import { ExamBuilderForm } from "@/components/teacher/ExamBuilderForm";
import { createAdminClient, createClient } from "@/lib/supabase/server";

type ChapterRow = {
  id: string;
  title: string;
  chapter_number: number;
  textbook_id: string;
};
type TextbookRow = { id: string; subject_id: string };
type SubjectRow = { id: string; name: string };

export default async function NewTeacherExamPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, language_pref")
    .eq("id", user.id)
    .single();

  const isTeacher = profile?.role === "teacher" || profile?.role === "admin";
  if (!isTeacher) redirect("/dashboard");

  const admin = createAdminClient();
  const { data: chapters } = await admin
    .from("chapters")
    .select("id, title, chapter_number, textbook_id")
    .order("chapter_number", { ascending: true });
  const chapterRows = (chapters ?? []) as ChapterRow[];

  const textbookIds = Array.from(new Set(chapterRows.map((c: ChapterRow) => c.textbook_id)));

  const { data: textbooks } = textbookIds.length
    ? await admin
        .from("textbooks")
        .select("id, subject_id")
        .in("id", textbookIds)
    : { data: [] as { id: string; subject_id: string }[] };
  const textbookRows = (textbooks ?? []) as TextbookRow[];

  const subjectIds = Array.from(new Set(textbookRows.map((t: TextbookRow) => t.subject_id)));

  const { data: subjects } = subjectIds.length
    ? await admin.from("subjects").select("id, name").in("id", subjectIds)
    : { data: [] as { id: string; name: string }[] };
  const subjectRows = (subjects ?? []) as SubjectRow[];
  const { data: students } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "student")
    .order("full_name", { ascending: true });

  const textbookToSubject = new Map(textbookRows.map((t: TextbookRow) => [t.id, t.subject_id]));
  const subjectNameById = new Map(subjectRows.map((s: SubjectRow) => [s.id, s.name]));

  const chapterOptions = chapterRows.map((c: ChapterRow) => ({
    id: c.id,
    chapterNumber: c.chapter_number,
    chapterTitle: c.title,
    subjectName: subjectNameById.get(textbookToSubject.get(c.textbook_id) ?? "") ?? "Subject",
  }));
  const studentOptions = (students ?? []).map((s: { id: string; full_name: string | null; email: string }) => ({
    id: s.id,
    fullName: s.full_name?.trim() || s.email,
    email: s.email,
  }));
  const language = (profile?.language_pref ?? "en") as "en" | "am" | "om" | "ti";

  return <ExamBuilderForm chapters={chapterOptions} students={studentOptions} language={language} />;
}
