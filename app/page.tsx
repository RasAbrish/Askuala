import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Globe2,
  GraduationCap,
  Languages,
  LineChart,
  Mail,
  MessageSquare,
  Phone,
  Sparkles,
  Target,
  Upload,
  Zap,
} from "lucide-react";
import { HeroCarousel } from "@/components/landing/HeroCarousel";
import { LandingNavLink } from "@/components/navigation/LandingNavLink";

const FEATURES = [
  {
    icon: Upload,
    title: "Drop Mode",
    desc: "Upload any PDF, photo, or paste text. Instant AI study tools in seconds.",
  },
  {
    icon: Brain,
    title: "AI Tutor",
    desc: "Ask questions in your language. Get answers grounded in your actual material.",
  },
  {
    icon: Sparkles,
    title: "Smart Flashcards",
    desc: "Auto-generated memory cards from any content. Review and master concepts faster.",
  },
  {
    icon: Target,
    title: "Exam Mode",
    desc: "Timed practice exams with instant grading and detailed feedback.",
  },
  {
    icon: LineChart,
    title: "Progress Dashboard",
    desc: "Track your improvement, identify weak topics, and stay motivated.",
  },
  {
    icon: Languages,
    title: "Multilingual",
    desc: "Learn in English, Amharic, Afaan Oromo, or Tigrinya.",
  },
  {
    icon: Globe2,
    title: "Works Offline",
    desc: "Download materials and study without internet. Syncs when online.",
  },
  {
    icon: GraduationCap,
    title: "Curriculum Aligned",
    desc: "Ethiopian Grade 9-12 textbooks built-in. Exam-ready content.",
  },
];

const STEPS = [
  {
    step: "1",
    title: "Drop your material",
    desc: "Upload a PDF, snap a photo of notes, or paste text from anywhere.",
  },
  {
    step: "2",
    title: "AI understands it",
    desc: "Askuala extracts key concepts, creates structure, and prepares study tools.",
  },
  {
    step: "3",
    title: "Learn and practice",
    desc: "Get summaries, flashcards, quizzes, and chat with your AI tutor.",
  },
];

const PROBLEMS = [
  "Textbooks are hard to understand",
  "Need help in my own language",
  "Exam prep is stressful",
  "Private tutoring is expensive",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-paper via-white to-paper">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-700 text-white font-bold text-lg">
              A
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-800">Askuala</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <LandingNavLink href="#features" label="Features" />
            <LandingNavLink href="#how-it-works" label="How It Works" />
            <LandingNavLink href="#about" label="About" />
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost text-sm">
              Sign in
            </Link>
            <Link href="/signup" className="btn-primary text-sm">
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Left: Content */}
            <div className="flex flex-col justify-center">
              <div className="animate-rise inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-50 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-primary w-fit" style={{ ["--stagger" as any]: "0ms" }}>
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                AI Learning OS for Ethiopian Students
              </div>
              
              <h1 className="animate-rise mt-4 sm:mt-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-tight text-slate-800" style={{ ["--stagger" as any]: "100ms" }}>
                Turn any textbook into your{" "}
                <span className="bg-gradient-to-r from-primary to-primary-700 bg-clip-text text-transparent">
                  personal AI tutor
                </span>
              </h1>
              
              <p className="animate-rise mt-4 sm:mt-6 text-base sm:text-lg lg:text-xl text-slate-600" style={{ ["--stagger" as any]: "200ms" }}>
                Askuala helps Ethiopian students study smarter with AI-powered summaries, quizzes, flashcards, and multilingual tutoring — from any learning material.
              </p>
              
              <div className="animate-rise mt-6 sm:mt-8 flex flex-col gap-3 sm:flex-row" style={{ ["--stagger" as any]: "300ms" }}>
                <Link href="/signup" className="btn-primary px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base justify-center">
                  Start Learning Free
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
                <Link href="#how-it-works" className="btn-secondary px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base justify-center">
                  See How It Works
                </Link>
              </div>
              
              <div className="animate-rise mt-6 sm:mt-8 flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-slate-600" style={{ ["--stagger" as any]: "400ms" }}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  <span>Free for students</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  <span>Works offline</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  <span>4 languages</span>
                </div>
              </div>
            </div>

            {/* Right: Visual */}
            <div className="animate-rise relative order-first lg:order-last" style={{ ["--stagger" as any]: "200ms" }}>
              <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary-50 to-accent-50 p-4 sm:p-6 lg:p-8 shadow-2xl">
                {/* Mock Dashboard Card */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="rounded-2xl bg-white p-6 shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary">
                        <Upload className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">Biology Chapter 5</p>
                        <p className="text-sm text-slate-500">Uploaded 2 mins ago</p>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <div className="rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary">
                        Summary ready
                      </div>
                      <div className="rounded-lg bg-accent-50 px-3 py-1.5 text-xs font-medium text-accent-700">
                        10 flashcards
                      </div>
                      <div className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                        Quiz ready
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white p-6 shadow-md">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white text-sm font-semibold">
                        AI
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-700">
                          Photosynthesis is the process where plants convert light energy into chemical energy...
                        </p>
                        <button className="mt-2 text-xs font-medium text-primary hover:underline">
                          Ask follow-up question
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-white p-4 shadow-sm">
                      <p className="text-2xl font-bold text-primary">85%</p>
                      <p className="text-xs text-slate-600">Avg Score</p>
                    </div>
                    <div className="rounded-xl bg-white p-4 shadow-sm">
                      <p className="text-2xl font-bold text-accent-600">12</p>
                      <p className="text-xs text-slate-600">Day Streak</p>
                    </div>
                    <div className="rounded-xl bg-white p-4 shadow-sm">
                      <p className="text-2xl font-bold text-slate-800">24</p>
                      <p className="text-xs text-slate-600">Quizzes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Carousel Section */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <HeroCarousel />
        </div>
      </section>

      {/* Problem Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">The Challenge</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-800 sm:text-4xl">
              Students face real barriers to learning
            </h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PROBLEMS.map((problem, i) => (
              <div key={i} className="card hover-lift text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <span className="text-xl">⚠️</span>
                </div>
                <p className="mt-4 font-medium text-slate-800">{problem}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="bg-gradient-to-br from-primary-50 to-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">The Solution</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-800 sm:text-4xl">
              Askuala makes learning accessible
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
              Upload any material and get instant AI-powered study tools in your language
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Features</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-800 sm:text-4xl">
              Everything you need to excel
            </h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature, i) => (
              <div key={i} className="card hover-lift group">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-50 text-primary transition-all group-hover:bg-primary group-hover:text-white">
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-800">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-gradient-to-br from-slate-50 to-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">How It Works</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-800 sm:text-4xl">
              Three simple steps to smarter studying
            </h2>
          </div>
          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={i} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-700 text-2xl font-bold text-white shadow-xl">
                    {step.step}
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-slate-800">{step.title}</h3>
                  <p className="mt-3 text-slate-600">{step.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="absolute right-0 top-8 hidden h-0.5 w-full bg-gradient-to-r from-primary/20 to-transparent lg:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl bg-gradient-to-br from-white to-primary-50 p-8 shadow-2xl sm:p-12">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">About Askuala</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-800 sm:text-4xl">
              Built for Ethiopian classrooms
            </h2>
            <p className="mt-4 max-w-3xl text-lg text-slate-600">
              Askuala is an AI-first study platform helping students and teachers turn curriculum content into guided practice. We focus on speed, clarity, and measurable progress.
            </p>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary">
                  <Target className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-800">Mission</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Make quality study support accessible to every high school learner in Ethiopia.
                </p>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-100 text-accent-700">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-800">Who We Serve</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Students, teachers, and school admins who need one connected platform.
                </p>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-800">Why It Works</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Fast generation, grounded responses, and repeated practice loops.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-primary-700 px-8 py-16 text-center shadow-2xl sm:px-12">
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Ready to transform your learning?
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-100">
                Join thousands of Ethiopian students already studying smarter with Askuala
              </p>
              <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                <Link href="/signup" className="btn rounded-xl bg-white px-8 py-4 text-base font-semibold text-primary hover:bg-primary-50">
                  Start Free Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link href="/login" className="btn rounded-xl border-2 border-white bg-transparent px-8 py-4 text-base font-semibold text-white hover:bg-white/10">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-700 text-white font-bold text-lg">
                  A
                </div>
                <span className="text-xl font-bold text-slate-800">Askuala</span>
              </div>
              <p className="mt-4 text-sm text-slate-600">
                AI Learning OS for Ethiopian high school students
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Contact</h3>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  support@askuala.com
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  +251 11 000 0000
                </p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Location</h3>
              <p className="mt-4 text-sm text-slate-600">
                Addis Ababa, Ethiopia
              </p>
            </div>
          </div>
          <div className="mt-8 border-t border-slate-200 pt-8 text-center text-sm text-slate-500">
            <p>© 2026 Askuala Education Technologies. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
