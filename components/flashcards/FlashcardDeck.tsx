"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import type { Flashcard } from "@/lib/supabase/types";

type FlashcardSource =
  | { chapterId: string; source?: never }
  | { chapterId?: never; source: { uploadId: string } };

export function FlashcardDeck({
  initialCards,
  chapterId,
  source,
}: {
  initialCards: Flashcard[];
} & FlashcardSource) {
  const [cards, setCards] = useState<Flashcard[]>(initialCards);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const payload = chapterId ? { chapterId, count: 10 } : { uploadId: source!.uploadId, count: 10 };

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      return data.flashcards as Flashcard[];
    },
    onMutate: () => {
      setError(null);
    },
    onSuccess: (nextCards) => {
      setCards(nextCards);
      setIndex(0);
      setRevealed(false);
    },
    onError: (mutationError) => {
      setError(mutationError.message);
    },
  });

  async function generate() {
    generateMutation.mutate();
  }

  if (!cards.length) {
    return (
      <div className="card text-center">
        <p className="mb-4 text-ink/70">
          No flashcards yet. Generate a set from this chapter.
        </p>
        <button
          onClick={generate}
          disabled={generateMutation.isPending}
          className="btn-primary"
        >
          {generateMutation.isPending ? "Generating…" : "Generate flashcards"}
        </button>
        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }

  const card = cards[index];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-ink/60">
        <span>
          Card {index + 1} of {cards.length}
        </span>
        <span className="capitalize">{card.difficulty}</span>
      </div>

      <button
        type="button"
        onClick={() => setRevealed((r) => !r)}
        className="flex min-h-[260px] w-full flex-col items-center justify-center rounded-2xl border-2 border-primary-100 bg-white p-8 text-center shadow-sm transition hover:border-primary"
      >
        {!revealed ? (
          <>
            <p className="mb-3 text-xs uppercase tracking-wide text-primary">
              Question
            </p>
            <p className="text-lg font-medium text-ink">{card.question}</p>
            <p className="mt-6 text-xs text-ink/40">Tap to reveal answer</p>
          </>
        ) : (
          <>
            <p className="mb-3 text-xs uppercase tracking-wide text-accent">
              Answer
            </p>
            <p className="text-base text-ink">{card.answer}</p>
          </>
        )}
      </button>

      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => {
            setIndex((i) => Math.max(0, i - 1));
            setRevealed(false);
          }}
          disabled={index === 0}
          className="btn-ghost"
        >
          ← Previous
        </button>
        <button
          onClick={generate}
          disabled={generateMutation.isPending}
          className="btn-ghost text-xs"
        >
          {generateMutation.isPending ? "Regenerating…" : "Regenerate set"}
        </button>
        <button
          onClick={() => {
            setIndex((i) => Math.min(cards.length - 1, i + 1));
            setRevealed(false);
          }}
          disabled={index === cards.length - 1}
          className="btn-primary"
        >
          Next →
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
