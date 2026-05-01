"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthFormStore } from "@/lib/state/auth-form-store";
import { createClient } from "@/lib/supabase/client";
import { LANGUAGE_NAMES } from "@/lib/supabase/types";
import { signupSchema, type SignupInput } from "@/lib/validation/auth";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const {
    signupGrade,
    signupLanguage,
    signupRole,
    setSignupGrade,
    setSignupLanguage,
    setSignupRole,
  } =
    useAuthFormStore();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof SignupInput, string>>
  >({});

  useEffect(() => {
    const roleParam = new URLSearchParams(window.location.search).get("role");
    if (roleParam === "teacher" || roleParam === "student") {
      setSignupRole(roleParam);
    }
  }, [setSignupRole]);

  const signupMutation = useMutation({
    mutationFn: async (input: SignupInput) => {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            full_name: input.fullName,
            grade: String(input.grade),
            language_pref: input.language,
            role: input.role,
          },
        },
      });
      if (signUpError) throw new Error(signUpError.message);
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

    const parsed = signupSchema.safeParse({
      fullName,
      email,
      password,
      grade: signupGrade,
      language: signupLanguage,
      role: signupRole,
    });

    if (!parsed.success) {
      const fields = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        fullName: fields.fullName?.[0],
        email: fields.email?.[0],
        password: fields.password?.[0],
        role: fields.role?.[0],
      });
      setError("Please fix the highlighted fields and try again.");
      return;
    }

    signupMutation.mutate(parsed.data);
  }

  return (
    <div className="card border-white/60 bg-white/90 shadow-xl backdrop-blur dark:border-white/10 dark:bg-slate-900/80">
      <h1 className="text-3xl font-extrabold text-ink">Create your account</h1>
      <p className="mt-1 text-sm text-ink/70">
        Create a student or teacher account.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Full name</label>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Abebe Kebede"
            autoComplete="name"
            aria-invalid={Boolean(fieldErrors.fullName)}
            required
          />
          {fieldErrors.fullName && (
            <p className="mt-1 text-sm text-red-700">{fieldErrors.fullName}</p>
          )}
        </div>
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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
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
          <p className="mt-1 text-xs text-ink/60">
            Use at least 6 characters to secure your account.
          </p>
          {fieldErrors.password && (
            <p className="mt-1 text-sm text-red-700">{fieldErrors.password}</p>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Account type</label>
            <select
              className="input"
              value={signupRole}
              onChange={(e) => setSignupRole(e.target.value as "student" | "teacher")}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
            {fieldErrors.role && (
              <p className="mt-1 text-sm text-red-700">{fieldErrors.role}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Grade</label>
            <select
              className="input"
              value={signupGrade}
              onChange={(e) => setSignupGrade(Number(e.target.value))}
            >
              {[9, 10, 11, 12].map((g) => (
                <option key={g} value={g}>
                  Grade {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Language</label>
            <select
              className="input"
              value={signupLanguage}
              onChange={(e) => {
                setSignupLanguage(e.target.value as keyof typeof LANGUAGE_NAMES);
              }}
            >
              {Object.entries(LANGUAGE_NAMES).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={signupMutation.isPending}
          className="w-full"
        >
          {signupMutation.isPending ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/60">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary">
          Sign in
        </Link>
      </p>
    </div>
  );
}
