import Link from "next/link";
import { Sparkles } from "lucide-react";

export function FloatingAiButton() {
  return (
    <Link
      href="/tutor"
      className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-primary/30 transition hover:bg-primary-600 sm:bottom-6 sm:right-6"
      aria-label="Ask AI Tutor"
    >
      <Sparkles className="h-4 w-4" />
      Ask AI
    </Link>
  );
}
