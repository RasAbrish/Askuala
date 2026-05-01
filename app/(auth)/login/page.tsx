"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof LoginInput, string>>
  >({});

  const loginMutation = useMutation({
    mutationFn: async (input: LoginInput) => {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });
      if (signInError) throw new Error(signInError.message);
    },
    onSuccess: () => {
      router.replace("/dashboard");
      router.refresh();
    },
    onError: (mutationError) => {
      setError(mutationError.message);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const parsed = loginSchema.safeParse({
      email,
      password,
    });

    if (!parsed.success) {
      const fields = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        email: fields.email?.[0],
        password: fields.password?.[0],
      });
      setError("Please fix the highlighted fields and try again.");
      return;
    }

    loginMutation.mutate(parsed.data);
  }

  return (
    <div className="card border-white/60 bg-white/90 shadow-xl backdrop-blur dark:border-white/10 dark:bg-slate-900/80">
      <h1 className="text-3xl font-extrabold text-ink">Welcome back</h1>
      <p className="mt-1 text-sm text-ink/70">Sign in to continue learning.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@example.com"
            autoComplete="email"
            aria-invalid={Boolean(fieldErrors.email)}
            required
          />
          {fieldErrors.email && (
            <p className="mt-1 text-sm text-red-700">{fieldErrors.email}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Password</label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              aria-invalid={Boolean(fieldErrors.password)}
              required
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink/60 hover:text-ink"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="mt-1 text-sm text-red-700">{fieldErrors.password}</p>
          )}
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full"
        >
          {loginMutation.isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="mt-6 space-y-1 text-center text-sm text-ink/60">
        <p>
          New to Askuala?{" "}
          <Link href="/signup?role=student" className="font-medium text-primary">
            Student sign up
          </Link>
        </p>
        <p>
          Are you a teacher?{" "}
          <Link href="/signup?role=teacher" className="font-medium text-primary">
            Teacher sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
