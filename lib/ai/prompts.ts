import type { Language } from "@/lib/supabase/types";

const LANGUAGE_INSTRUCTION: Record<Language, string> = {
  en: "Respond in clear, simple English suitable for an Ethiopian high school student.",
  am: "በቀላሉ ሊረዱት በሚችል አማርኛ ብቻ መልስ ይስጡ።",
  om: "Afaan Oromoo salphaa ta'een deebii kenni.",
  ti: "ብቐሊል ትግርኛ መልሲ ሃቦም።",
};

export function tutorSystemPrompt(language: Language) {
  return [
    "You are Askuala, a warm and encouraging tutor for Ethiopian high school students.",
    LANGUAGE_INSTRUCTION[language],
    "Always ground answers in the provided textbook context. If the context does not cover the question, say so honestly and answer using general knowledge — clearly marking that as a guide, not the textbook.",
    "Match the depth the student asks for. If the student asks for details, forms, structure, rules, or examples, give a full structured explanation with headings, formulas/patterns, multiple examples, and common mistakes.",
    "Use an industry-standard teaching format: concise intro, numbered sections, bullet points for rules/examples, and clear labels.",
    "Do not use markdown heading hashes like ###. Prefer plain numbered titles like '1) Definition'.",
    "Do not use markdown emphasis symbols (no **bold**, no *italic*, no backticks) in normal tutor replies.",
    "Use emojis only when they improve clarity (for example: ✅, ⚠️, 💡), not in every line.",
    "Keep answers clear with short paragraphs and lists. Add a follow-up question only when it naturally helps.",
  ].join("\n\n");
}

export function tutorUserPrompt(args: {
  question: string;
  context: { content: string; page_number: number | null }[];
  language: Language;
  history?: { role: "user" | "ai"; content: string }[];
}) {
  const detailedAsk =
    /(detail|in detail|forms?|structure|examples?|rules?|differences?|explain fully|step by step)/i.test(
      args.question,
    );

  const contextBlock = args.context.length
    ? args.context
        .map(
          (c, i) =>
            `[Source ${i + 1}${c.page_number ? `, p. ${c.page_number}` : ""}]\n${c.content}`,
        )
        .join("\n\n")
    : "(no textbook context available — answer carefully)";
  const historyBlock = (args.history ?? []).length
    ? (args.history ?? [])
        .map((m, i) => `${i + 1}. ${m.role.toUpperCase()}: ${m.content}`)
        .join("\n")
    : "(no prior messages)";
  const responseShape = detailedAsk
    ? `Response format (strict):
1) Definition
- 2-3 lines maximum
2) Forms / Structure
- Show clear formulas/patterns in bullet points
3) Usage Rules
- Numbered or bulleted rules
4) Examples
- Start from easy then harder examples
- Include at least 6 examples
5) Common Mistakes
- Show wrong vs correct forms
6) Quick Practice
- Give 3 short practice items

Style rules:
- Use plain numbering like "1) ...", "2) ..."
- Use bullet points for lists
- Avoid markdown headers with # symbols`
    : `Response format:
- Give a concise, clear explanation with 1-2 examples.`;

  return `Conversation so far:\n${historyBlock}\n\nTextbook context:\n\n${contextBlock}\n\nStudent question: ${args.question}\n\n${responseShape}`;
}

export function flashcardsPrompt(args: {
  chapterTitle: string;
  context: string;
  count?: number;
}) {
  const count = args.count ?? 10;
  return `You are generating study flashcards for an Ethiopian high school chapter titled "${args.chapterTitle}".

Use ONLY the textbook excerpt below. Generate ${count} flashcards that test the key concepts.

Return strictly valid JSON in this shape:
{
  "flashcards": [
    { "question": "...", "answer": "...", "difficulty": "easy" | "medium" | "hard" }
  ]
}

Rules:
- Question: a single clear sentence ending in "?"
- Answer: 1-3 sentences, factually grounded in the excerpt
- Mix difficulties; about half medium, a few easy and a few hard
- No markdown, no commentary outside the JSON

Textbook excerpt:
"""
${args.context}
"""`;
}

export function quizPrompt(args: {
  chapterTitle: string;
  context: string;
  count?: number;
  variantSeed?: string;
}) {
  const count = args.count ?? 10;
  const variantSeed = args.variantSeed ?? "standard";
  return `Create a ${count}-question multiple-choice quiz for the chapter "${args.chapterTitle}", grounded only in the excerpt below.

Quiz variant seed: ${variantSeed}
Use this seed to create a different set/order/focus each time while staying grounded in the excerpt.

Return strictly valid JSON:
{
  "title": "${args.chapterTitle} — Practice Quiz",
  "questions": [
    {
      "question_text": "...",
      "options": ["A ...", "B ...", "C ...", "D ..."],
      "correct_answer": "B ...",
      "explanation": "1-2 sentences citing the excerpt"
    }
  ]
}

Rules:
- Exactly 4 options per question
- "correct_answer" MUST exactly match one of the strings in "options"
- Cover different concepts from the excerpt — avoid duplicates
- For this variant, avoid reusing the exact same question wording/order as common baseline quizzes
- No markdown outside the JSON

Textbook excerpt:
"""
${args.context}
"""`;
}

export function summaryPrompt(args: {
  chapterTitle: string;
  context: string;
  language: Language;
}) {
  return `Summarize the chapter "${args.chapterTitle}" in about 200 words.

${LANGUAGE_INSTRUCTION[args.language]}

Use only the excerpt below. Keep it engaging and clear for a high school student.

Excerpt:
"""
${args.context}
"""`;
}
