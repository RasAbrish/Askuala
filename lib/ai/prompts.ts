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
    "Keep responses SHORT and CONCISE. Use 2-4 sentences maximum for simple questions.",
    "For detailed questions, use: 1 short paragraph (3-4 sentences) + 3-5 bullet points.",
    "Do not write long paragraphs. Students prefer quick, clear answers.",
    "Do not use markdown heading hashes like ###. Prefer plain numbered titles like '1) Definition'.",
    "Do not use markdown emphasis symbols (no **bold**, no *italic*, no backticks) in normal tutor replies.",
    "Never output raw markdown markers such as **, *, #, or backticks in final answers.",
    "Use emojis sparingly, only when they improve clarity (✅, ⚠️, 💡).",
    "Be direct and professional. Avoid unnecessary explanations.",
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
    ? `Response format:
1) Brief Answer (2-3 sentences)
2) Key Points
- 4-6 bullet points maximum
3) Examples
- 2-3 clear examples
4) Common Mistakes (if relevant)
- 1-2 points

Keep it SHORT and CLEAR.`
    : `Response format:
- Answer in 2-4 sentences
- Add 2-3 bullet points if needed
- Include 1 example if helpful

Be CONCISE. No long paragraphs.`;

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
