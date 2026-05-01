"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const QUIZ_COUNT = 10;

export default function GenerateQuizPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId: params.id, count: QUIZ_COUNT }),
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
        We&apos;ll generate {QUIZ_COUNT} textbook-grounded questions in a few seconds.
      </p>
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
