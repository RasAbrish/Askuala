export type Language = "en" | "am" | "om" | "ti";

export const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English",
  am: "አማርኛ (Amharic)",
  om: "Afaan Oromo",
  ti: "ትግርኛ (Tigrinya)",
};

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: "student" | "teacher" | "admin";
  grade: number | null;
  language_pref: Language;
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  grade: number;
  cover_image: string | null;
}

export interface Textbook {
  id: string;
  subject_id: string;
  title: string;
  pdf_url: string | null;
  total_pages: number | null;
}

export interface Chapter {
  id: string;
  textbook_id: string;
  chapter_number: number;
  title: string;
  start_page: number | null;
  end_page: number | null;
  summary: string | null;
}

export type SourceType = "pdf" | "text" | "image" | "url" | "audio";

export interface StudentUpload {
  id: string;
  student_id: string;
  title: string;
  source_type: SourceType;
  language_detected: string | null;
  saved: boolean;
  word_count: number | null;
  created_at: string;
  expires_at: string | null;
}

export interface Flashcard {
  id: string;
  chapter_id: string | null;
  upload_id?: string | null;
  question: string;
  answer: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface Quiz {
  id: string;
  chapter_id: string | null;
  upload_id?: string | null;
  title: string;
  question_count: number;
  time_limit_seconds: number | null;
}

export interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: "mcq" | "short" | "true_false";
  options: string[] | null;
  correct_answer: string;
  explanation: string | null;
  position: number;
}

export interface ChatMessage {
  id: string;
  student_id: string;
  chapter_id: string | null;
  upload_id?: string | null;
  role: "user" | "ai";
  content: string;
  language: Language;
  created_at: string;
}

export interface MatchedChunk {
  id: string;
  chapter_id: string | null;
  upload_id: string | null;
  content: string;
  page_number: number | null;
  similarity: number;
}
