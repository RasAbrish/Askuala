"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const QUIZ_COUNT_OPTIONS = [5, 10, 15, 20];

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
    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId: params.id, count: quizCount }),
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
        <select
          value={quizCount}
          onChange={(e) => setQuizCount(Number(e.target.value))}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          {QUIZ_COUNT_OPTIONS.map((count) => (
            <option key={count} value={count}>
              {count} questions
            </option>
          ))}
        </select>
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
