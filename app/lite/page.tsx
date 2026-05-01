import Link from "next/link";

export const dynamic = "force-static";

export default function LitePage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-8 text-sm leading-7">
      <p className="text-xs uppercase tracking-wide text-ink/60">Low-bandwidth mode</p>
      <h1 className="mt-2 text-2xl font-bold text-ink">Askuala Lite</h1>
      <p className="mt-3 text-ink/80">
        Text-only experience for slower connections. No large images, no hero slider, and minimal UI.
      </p>

      <div className="mt-6 space-y-2">
        <Link href="/login" className="block underline">Sign in</Link>
        <Link href="/signup" className="block underline">Create account</Link>
        <Link href="/tutor" className="block underline">Open AI Tutor</Link>
        <Link href="/upload" className="block underline">Drop Mode upload</Link>
      </div>

      <p className="mt-8 text-xs text-ink/60">
        Tip: bookmark <code>/lite</code> if your internet is unstable.
      </p>
    </main>
  );
}
