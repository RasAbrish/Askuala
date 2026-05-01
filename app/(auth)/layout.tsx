export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f6f4ef] dark:bg-[#081223]">
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-emerald-300/40 blur-3xl dark:bg-emerald-400/20 float-soft" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-cyan-300/40 blur-3xl dark:bg-cyan-400/20 float-soft" />
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-4 py-10 sm:px-6 sm:py-12 animate-rise">
        <a href="/" className="mb-6 self-center text-3xl font-extrabold tracking-tight text-primary hover-lift">
          Askuala
        </a>
        {children}
      </div>
    </div>
  );
}
