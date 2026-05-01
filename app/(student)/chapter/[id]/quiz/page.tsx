"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const MIN_QUIZ_COUNT = 1;
const MAX_QUIZ_COUNT = 40;

export default function GenerateQuizPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [quizCount, setQuizCount] = useState<number>(10);

  async function generate() {
    setGenerating(true);
    setError(null);
    const safeCount = Math.min(MAX_QUIZ_COUNT, Math.max(MIN_QUIZ_COUNT, quizCount || 10));
    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId: params.id, count: safeCount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate quiz");
      router.replace(`/quiz/${data.quizId}`);
    } catch (e: any) {
      setError(e.message);
      setGenerating(false);
    }
  }

  return (
    <div className="card mx-auto max-w-md text-center">
      <h1 className="text-xl font-bold text-ink">Generate a quiz</h1>
      <p className="mt-2 text-sm text-ink/60">
        We&apos;ll generate {quizCount} textbook-grounded questions in a few seconds.
      </p>
      <div className="mt-4 text-left">
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
        <p className="mt-1 text-xs text-ink/60">
          Enter any value from {MIN_QUIZ_COUNT} to {MAX_QUIZ_COUNT}.
        </p>
      </div>
      <button
        onClick={generate}
        disabled={generating}
        className="btn-primary mt-6 w-full"
      >
        {generating ? "Generating…" : "Generate quiz"}
      </button>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
