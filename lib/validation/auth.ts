import { z } from "zod";
import { LANGUAGE_NAMES } from "@/lib/supabase/types";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export const signupSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters.")
    .max(80, "Full name is too long."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters.")
    .max(72, "Password is too long."),
  grade: z.coerce.number().int().min(9).max(12),
  language: z.enum(Object.keys(LANGUAGE_NAMES) as [keyof typeof LANGUAGE_NAMES]),
  role: z.enum(["student", "teacher"]),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
