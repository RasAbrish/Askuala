"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChatPanel } from "@/components/tutor/ChatPanel";
import { FlashcardDeck } from "@/components/flashcards/FlashcardDeck";
import { QuizPlayer } from "@/components/quiz/QuizPlayer";
import { tUi } from "@/lib/i18n/ui";
import type { Flashcard, Language, Question } from "@/lib/supabase/types";

type Tab = "summary" | "flashcards" | "quiz" | "tutor";
const DEFAULT_QUIZ_COUNT = 10;
const MIN_QUIZ_COUNT = 1;
const MAX_QUIZ_COUNT = 40;

interface Props {
  uploadId: string;
  uploadTitle: string;
  initialFlashcards: Flashcard[];
  quiz: { id: string; questions: Question[]; timeLimitSeconds?: number | null } | null;
  language?: Language;
}

export function StudyTabs({
  uploadId,
  uploadTitle,
  initialFlashcards,
  quiz: initialQuiz,
  language = "en",
}: Props) {
  const [tab, setTab] = useState<Tab>("summary");

  // Quiz state — generated lazily
  const [quiz, setQuiz] = useState(initialQuiz);
  const [quizVariant, setQuizVariant] = useState(initialQuiz ? 1 : 0);
  const [quizCount, setQuizCount] = useState(DEFAULT_QUIZ_COUNT);
  const summaryQuery = useQuery({
    queryKey: ["upload-summary", uploadId],
    queryFn: async () => {
      const res = await fetch(`/api/uploads/${uploadId}/summary`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to summarize upload.");
      return data.summary as string;
    },
    enabled: tab === "summary",
  });

  const quizMutation = useMutation({
    mutationFn: async () => {
      const safeCount = Math.min(MAX_QUIZ_COUNT, Math.max(MIN_QUIZ_COUNT, quizCount || DEFAULT_QUIZ_COUNT));
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId, count: safeCount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate quiz.");

      const qRes = await fetch(`/api/quiz/${data.quizId}/questions`);
      const qData = await qRes.json();
      if (!qRes.ok)
        throw new Error(qData.error || "Failed to load generated questions.");
      return {
        id: data.quizId as string,
        questions: qData.questions as Question[],
        timeLimitSeconds: (qData.timeLimitSeconds as number | null) ?? null,
      };
    },
    onSuccess: (createdQuiz) => {
      setQuiz(createdQuiz);
      setQuizVariant((v) => v + 1);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-lg bg-paper p-1 text-sm">
        {(
          [
            ["summary", tUi(language, "upload.summary")],
            ["flashcards", tUi(language, "upload.flashcards")],
            ["quiz", tUi(language, "upload.quiz")],
            ["tutor", tUi(language, "upload.tutor")],
          ] as [Tab, string][]
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex-1 rounded-md py-1.5 transition ${
              tab === k ? "bg-white shadow-sm font-medium" : "text-ink/60"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "summary" && (
        <div className="card">
          {summaryQuery.isPending ? (
            <p className="text-center text-sm text-ink/60">
              {tUi(language, "upload.summarizing")}
            </p>
          ) : summaryQuery.isError ? (
            <p className="text-sm text-red-600">{summaryQuery.error.message}</p>
          ) : (
            <p className="whitespace-pre-wrap text-ink/80">{summaryQuery.data}</p>
          )}
        </div>
      )}

      {tab === "flashcards" && (
        <FlashcardDeck
          source={{ uploadId }}
          initialCards={initialFlashcards}
        />
      )}

      {tab === "quiz" && (
        <>
          {!quiz ? (
            <div className="card text-center">
              <p className="mb-4 text-ink/70">
                Set how many questions you want, then generate the quiz.
              </p>
              <div className="mx-auto mb-4 max-w-xs text-left">
                <label className="mb-1 block text-sm font-medium text-ink">Number of questions</label>
                <input
                  type="number"
                  min={MIN_QUIZ_COUNT}
                  max={MAX_QUIZ_COUNT}
                  step={1}
                  value={quizCount}
                  onChange={(e) => setQuizCount(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <p className="mt-1 text-xs text-ink/50">
                  Enter any value from {MIN_QUIZ_COUNT} to {MAX_QUIZ_COUNT}. Default is {DEFAULT_QUIZ_COUNT}.
                </p>
              </div>
              <button
                onClick={() => quizMutation.mutate()}
                disabled={quizMutation.isPending}
                className="btn-primary"
              >
                {quizMutation.isPending ? tUi(language, "upload.generating") : tUi(language, "upload.generateQuiz")}
              </button>
              {quizMutation.isError && (
                <p className="mt-3 text-sm text-red-600">
                  {quizMutation.error.message}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
                  {tUi(language, "quiz.variant")} #{quizVariant}
                </span>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="number"
                    min={MIN_QUIZ_COUNT}
                    max={MAX_QUIZ_COUNT}
                    step={1}
                    value={quizCount}
                    onChange={(e) => setQuizCount(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 sm:w-36"
                    aria-label="Number of questions"
                  />
                  <button
                    onClick={() => quizMutation.mutate()}
                    disabled={quizMutation.isPending}
                    className="btn-ghost border border-black/10"
                  >
                    {quizMutation.isPending ? tUi(language, "upload.regenerating") : tUi(language, "quiz.regenerate")}
                  </button>
                </div>
              </div>
              {quizMutation.isError && (
                <p className="text-sm text-red-600">{quizMutation.error.message}</p>
              )}
              <QuizPlayer
                quizId={quiz.id}
                questions={quiz.questions}
                timeLimitSeconds={quiz.timeLimitSeconds ?? null}
                language={language}
              />
            </div>
          )}
        </>
      )}

      {tab === "tutor" && (
        <ChatPanel
          uploadId={uploadId}
          chapterTitle={uploadTitle}
          language={language}
          suggestions={[
            tUi(language, "tutor.suggestionsSummary"),
            tUi(language, "tutor.suggestionsExplain"),
            tUi(language, "tutor.suggestionsMemorize"),
          ]}
        />
      )}
    </div>
  );
}
