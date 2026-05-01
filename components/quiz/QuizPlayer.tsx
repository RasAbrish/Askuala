"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { tUi } from "@/lib/i18n/ui";
import type { Language, Question } from "@/lib/supabase/types";

interface QuestionDetail {
  question_id: string;
  chosen: string | null;
  correct_answer: string;
  correct: boolean;
  explanation: string | null;
}

interface SubmitResponse {
  score: number;
  total: number;
  detail: QuestionDetail[];
}

export function QuizPlayer({
  quizId,
  questions,
  timeLimitSeconds,
  language = "en" as Language,
}: {
  quizId: string;
  questions: Question[];
  timeLimitSeconds?: number | null;
  language?: Language;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<SubmitResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(
    timeLimitSeconds ?? null,
  );

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/quiz/${quizId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = (await res.json()) as SubmitResponse & { error?: string };
      if (!res.ok) throw new Error(data.error || tUi(language, "common.errorRetry"));
      return data;
    },
    onMutate: () => {
      setError(null);
    },
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (mutationError) => {
      setError(mutationError.message);
    },
  });

  async function submit() {
    submitMutation.mutate();
  }

  useEffect(() => {
    setRemainingSeconds(timeLimitSeconds ?? null);
  }, [quizId, timeLimitSeconds]);

  useEffect(() => {
    if (!timeLimitSeconds || result || submitMutation.isPending) return;
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null) return prev;
        if (prev <= 1) {
          clearInterval(timer);
          submitMutation.mutate();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLimitSeconds, result, submitMutation]);

  function formatTime(total: number) {
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  if (result) {
    const detailById = new Map(result.detail.map((d) => [d.question_id, d]));
    return (
      <div className="space-y-6">
        <div className="card text-center">
          <p className="text-sm uppercase tracking-wide text-ink/50">
            {tUi(language, "quiz.yourScore")}
          </p>
          <p className="my-2 text-5xl font-bold text-primary">
            {result.score}
            <span className="text-2xl text-ink/40"> / {result.total}</span>
          </p>
          <p className="text-sm text-ink/60">
            {result.score === result.total
              ? tUi(language, "quiz.perfect")
              : result.score / result.total >= 0.6
                ? tUi(language, "quiz.niceWork")
                : tUi(language, "quiz.keepTrying")}
          </p>
        </div>
        {questions.map((q, i) => {
          const d = detailById.get(q.id);
          if (!d) return null;
          return (
            <div key={q.id} className="card">
              <p className="mb-3 text-sm font-semibold text-ink/80">
                {i + 1}. {q.question_text}
              </p>
              <ul className="space-y-1 text-sm">
                {q.options?.map((opt) => {
                  const isCorrect = opt === d.correct_answer;
                  const isChosen = opt === d.chosen;
                  return (
                    <li
                      key={opt}
                      className={`rounded-lg px-3 py-2 ${
                        isCorrect
                          ? "bg-green-50 text-green-800"
                          : isChosen
                            ? "bg-red-50 text-red-700"
                            : "bg-paper text-ink/70"
                      }`}
                    >
                      {opt}
                      {isCorrect && " ✓"}
                      {isChosen && !isCorrect && ` ✗ ${tUi(language, "quiz.yourAnswer")}`}
                    </li>
                  );
                })}
              </ul>
              {d.explanation && (
                <p className="mt-3 rounded-lg bg-primary-50 px-3 py-2 text-xs text-primary-700">
                  {d.explanation}
                </p>
              )}
            </div>
          );
        })}
        <button
          onClick={() => {
            setResult(null);
            setAnswers({});
            setRemainingSeconds(timeLimitSeconds ?? null);
          }}
          className="btn-ghost w-full"
        >
          {tUi(language, "quiz.retake")}
        </button>
      </div>
    );
  }

  const allAnswered = questions.every((q) => answers[q.id]);

  return (
    <div className="space-y-6">
      {remainingSeconds !== null && !result && (
        <div
          className={`card flex items-center justify-between text-sm ${
            remainingSeconds <= 60 ? "border-red-200 bg-red-50" : ""
          }`}
        >
          <span className="font-medium text-ink/70">{tUi(language, "quiz.timeRemaining")}</span>
          <span
            className={`font-bold ${
              remainingSeconds <= 60 ? "text-red-700" : "text-primary"
            }`}
          >
            {formatTime(remainingSeconds)}
          </span>
        </div>
      )}
      {questions.map((q, i) => (
        <div key={q.id} className="card">
          <p className="mb-3 text-sm font-semibold text-ink/80">
            {i + 1}. {q.question_text}
          </p>
          <div className="space-y-2">
            {q.options?.map((opt) => {
              const selected = answers[q.id] === opt;
              return (
                <label
                  key={opt}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition ${
                    selected
                      ? "border-primary bg-primary-50"
                      : "border-black/10 bg-white hover:bg-paper"
                  }`}
                >
                  <input
                    type="radio"
                    className="accent-primary"
                    name={q.id}
                    checked={selected}
                    onChange={() =>
                      setAnswers((a) => ({ ...a, [q.id]: opt }))
                    }
                  />
                  <span>{opt}</span>
                </label>
              );
            })}
          </div>
        </div>
      ))}

      <button
        onClick={submit}
        disabled={!allAnswered || submitMutation.isPending}
        className="btn-primary w-full"
      >
        {submitMutation.isPending
          ? tUi(language, "quiz.grading")
          : tUi(language, "quiz.submitQuiz")}
      </button>
      {error && <p className="text-center text-sm text-red-600">{error}</p>}
    </div>
  );
}
