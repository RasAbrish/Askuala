import Link from "next/link";
import {
  BookOpen,
  Brain,
  CheckCircle2,
  GraduationCap,
  MessageSquareText,
  ShieldCheck,
  Upload,
  Zap,
} from "lucide-react";
import { HeroSlider } from "@/components/landing/HeroSlider";

const FEATURES = [
  {
    icon: Brain,
    title: "AI Tutor",
    desc: "Ask anything, get grounded answers from your real material.",
  },
  {
    icon: Zap,
    title: "Instant Flashcards",
    desc: "Generate polished memory cards in seconds.",
  },
  {
    icon: GraduationCap,
    title: "Smart Quizzes",
    desc: "Exam-style practice with auto-grading and timing.",
  },
  {
    icon: BookOpen,
    title: "Multi-language",
    desc: "English, Amharic, Oromo, and Tigrinya support.",
  },
];

const STEPS = [
  {
    icon: Upload,
    title: "Upload material",
    desc: "PDF, image notes, or text from class.",
  },
  {
    icon: Brain,
    title: "AI learns it",
    desc: "Askuala extracts and organizes the key concepts.",
  },
  {
    icon: MessageSquareText,
    title: "Practice deeply",
    desc: "Tutor chat, flashcards, summaries, and quizzes.",
  },
];
const TRUST = [
  "Curriculum-aware study flow",
  "Works on web and Android build",
  "Built for low-data learning",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f7f4ed] text-ink dark:bg-[#071224] dark:text-slate-100">
      <header className="sticky top-0 z-30 border-b border-black/5 bg-[#f7f4ed]/85 backdrop-blur dark:border-white/10 dark:bg-[#071224]/80">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <span className="text-2xl font-extrabold tracking-tight text-primary">Askuala</span>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link href="/login" className="btn-ghost text-sm">
              Sign in
            </Link>
            <Link href="/signup" className="btn rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600">
              Get started
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
        <div className="animate-rise" style={{ ["--stagger" as any]: "40ms" }}>
          <HeroSlider />
        </div>
      </section>

      <section className="relative mx-auto max-w-4xl px-4 py-10 text-center sm:px-6 sm:py-16">
        <p className="animate-rise mx-auto inline-flex items-center rounded-full border border-primary/20 bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary dark:bg-primary/15 dark:text-emerald-300" style={{ ["--stagger" as any]: "80ms" }}>
          AI Learning OS
        </p>
        <h1 className="animate-rise mt-4 text-4xl font-extrabold leading-tight sm:text-6xl" style={{ ["--stagger" as any]: "130ms" }}>
          Luxury learning,
          <br />
          built for results.
        </h1>
        <p className="animate-rise mx-auto mt-4 max-w-2xl text-base text-ink/70 dark:text-slate-300 sm:text-lg" style={{ ["--stagger" as any]: "180ms" }}>
          Askuala transforms textbook study into a premium, fast, and interactive experience on web, tablet, and phone.
        </p>
        <div className="animate-rise mt-8 flex flex-col justify-center gap-3 sm:flex-row" style={{ ["--stagger" as any]: "230ms" }}>
          <Link href="/signup" className="btn-primary hover-lift px-6 py-3">
            Create free account
          </Link>
          <Link href="/login" className="btn-ghost hover-lift border border-black/10 px-6 py-3 dark:border-white/20">
            I already have an account
          </Link>
        </div>
        <ul className="mt-5 grid gap-2 text-xs text-ink/65 dark:text-slate-300 sm:grid-cols-3 sm:text-sm">
          {TRUST.map((item) => (
            <li key={item} className="rounded-full border border-black/10 px-3 py-1.5 dark:border-white/15">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 sm:pb-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="card hover-lift animate-rise border-black/5 bg-white/85 p-5 shadow-md backdrop-blur dark:border-white/10 dark:bg-slate-900/70" style={{ ["--stagger" as any]: `${80 + Math.min(4, FEATURES.indexOf(f)) * 70}ms` }}>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary dark:bg-primary/20 dark:text-emerald-300">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="font-bold">{f.title}</h3>
              <p className="mt-1 text-sm text-ink/65 dark:text-slate-300">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 sm:pb-16">
        <div className="animate-rise rounded-3xl border border-black/10 bg-gradient-to-br from-white to-[#eef6f0] p-6 shadow-lg dark:border-white/10 dark:from-slate-900 dark:to-slate-800 sm:p-8" style={{ ["--stagger" as any]: "120ms" }}>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">How it works</p>
          <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">From classroom material to confidence</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.title} className="hover-lift animate-rise rounded-2xl border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/60" style={{ ["--stagger" as any]: `${110 + Math.min(3, STEPS.indexOf(step)) * 75}ms` }}>
                <step.icon className="h-5 w-5 text-primary dark:text-emerald-300" />
                <h3 className="mt-3 font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-ink/70 dark:text-slate-300">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="animate-rise float-soft rounded-3xl bg-gradient-to-r from-primary to-emerald-700 p-7 text-white shadow-xl sm:p-10" style={{ ["--stagger" as any]: "180ms" }}>
          <p className="inline-flex items-center gap-2 text-sm font-medium opacity-95">
            <ShieldCheck className="h-4 w-4" />
            Students, teachers, and admins in one platform
          </p>
          <h2 className="mt-2 text-2xl font-extrabold sm:text-4xl">
            Ready to launch your smartest semester?
          </h2>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/signup" className="btn rounded-lg bg-white px-5 py-2 text-primary hover:bg-white/90">
              Start Free
            </Link>
            <Link href="/login" className="btn rounded-lg border border-white/40 bg-transparent px-5 py-2 text-white hover:bg-white/10">
              Sign In
            </Link>
          </div>
          <ul className="mt-5 grid gap-2 text-sm text-white/90 sm:grid-cols-3">
            {["Student", "Teacher", "Admin"].map((role) => (
              <li key={role} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {role} workflow enabled
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
