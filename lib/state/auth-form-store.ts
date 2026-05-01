import { create } from "zustand";
import { LANGUAGE_NAMES } from "@/lib/supabase/types";

type AuthFormState = {
  signupGrade: number;
  signupLanguage: keyof typeof LANGUAGE_NAMES;
  signupRole: "student" | "teacher";
  setSignupGrade: (grade: number) => void;
  setSignupLanguage: (language: keyof typeof LANGUAGE_NAMES) => void;
  setSignupRole: (role: "student" | "teacher") => void;
};

export const useAuthFormStore = create<AuthFormState>((set) => ({
  signupGrade: 11,
  signupLanguage: "en",
  signupRole: "student",
  setSignupGrade: (grade) => set({ signupGrade: grade }),
  setSignupLanguage: (language) => set({ signupLanguage: language }),
  setSignupRole: (role) => set({ signupRole: role }),
}));
