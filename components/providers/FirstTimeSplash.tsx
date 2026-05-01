"use client";

import { useEffect, useState } from "react";
import { BookOpen, Sparkles, Mic, Brain } from "lucide-react";

const STORAGE_KEY = "askuala:first-visit:v1";

export function FirstTimeSplash() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const seen = window.localStorage.getItem(STORAGE_KEY);
    if (!seen) setOpen(true);
  }, []);

  function closeSplash() {
    window.localStorage.setItem(STORAGE_KEY, "yes");
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/20 bg-slate-900 text-white shadow-2xl">
        <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-emerald-400/30 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-cyan-400/25 blur-3xl" />
        <div className="relative grid gap-6 p-6 sm:p-8">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs uppercase tracking-wide">
              <Sparkles className="h-3.5 w-3.5" />
              Welcome to Askuala
            </p>
            <h2 className="mt-3 text-2xl font-bold sm:text-4xl">Luxury learning experience, built for focus.</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-200 sm:text-base">
              Upload notes, ask by voice, and generate flashcards and quizzes that stay grounded in your material.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Feature title="Smart Tutor" desc="Answers based on your chapter" icon={Brain} />
            <Feature title="Voice Ready" desc="Ask and listen in one tap" icon={Mic} />
            <Feature title="Study Faster" desc="Flashcards and quizzes instantly" icon={BookOpen} />
          </div>

          <button
            type="button"
            onClick={closeSplash}
            className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400"
          >
            Start Learning
          </button>
        </div>
      </div>
    </div>
  );
}

function Feature({
  title,
  desc,
  icon: Icon,
}: {
  title: string;
  desc: string;
  icon: typeof Brain;
}) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/5 p-4">
      <Icon className="h-5 w-5 text-emerald-300" />
      <h3 className="mt-2 text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-xs text-slate-300">{desc}</p>
    </div>
  );
}
