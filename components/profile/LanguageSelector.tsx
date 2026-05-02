"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Language } from "@/lib/supabase/types";
import { LANGUAGE_NAMES } from "@/lib/supabase/types";

interface Props {
  currentLanguage: Language;
}

export function LanguageSelector({ currentLanguage }: Props) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleLanguageChange = async (newLanguage: Language) => {
    if (isUpdating || newLanguage === currentLanguage) return;
    
    setIsUpdating(true);
    try {
      const response = await fetch("/api/profile/language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: newLanguage }),
      });
      
      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to update language:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          aria-label="Select language"
        >
          <Languages className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Select Language
        </DropdownMenuLabel>
        <div className="space-y-1 px-1 pb-1">
          {(Object.keys(LANGUAGE_NAMES) as Language[]).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => handleLanguageChange(lang)}
              disabled={isUpdating}
              className={`w-full rounded px-3 py-2 text-left text-sm transition ${
                currentLanguage === lang
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-foreground hover:bg-accent hover:text-accent-foreground"
              } ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {LANGUAGE_NAMES[lang]}
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
