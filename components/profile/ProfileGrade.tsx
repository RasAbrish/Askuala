"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { GraduationCap, User } from "lucide-react";
import { tUi } from "@/lib/i18n/ui";
import type { Language } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";

const GRADES = [
  { value: "9", label: "Grade 9" },
  { value: "10", label: "Grade 10" },
  { value: "11", label: "Grade 11" },
  { value: "12", label: "Grade 12" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "am", label: "Amharic" },
  { value: "om", label: "Afaan Oromo" },
  { value: "ti", label: "Tigrinya" },
];

interface ProfileGradeProps {
  initialGrade?: number;
  initialName?: string;
  initialLanguage?: string;
  initialAvatarUrl?: string;
  onSave?: (data: { grade: number; fullName: string; language: string }) => void;
}

export function ProfileGrade({
  initialGrade = 11,
  initialName = "",
  initialLanguage = "en",
  initialAvatarUrl = "",
  onSave,
}: ProfileGradeProps) {
  const [grade, setGrade] = useState<string>(initialGrade.toString());
  const [fullName, setFullName] = useState(initialName);
  const [language, setLanguage] = useState(initialLanguage);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lang = (language as Language) ?? "en";

  async function handleSave() {
    setSaving(true);
    setSuccess(null);
    setError(null);
    try {
      const payload = {
        grade: parseInt(grade, 10),
        fullName: fullName.trim(),
        language,
      };

      if (onSave) {
        await onSave(payload);
      } else {
        const res = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to save profile.");
        }
      }

      setSuccess(tUi(lang, "settings.saved"));
    } catch (e: any) {
      setError(e.message || tUi(lang, "settings.error"));
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(file: File) {
    setAvatarUploading(true);
    setError(null);
    setSuccess(null);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: dataUrl },
      });
      if (updateError) throw updateError;

      setAvatarUrl(dataUrl);
      setSuccess("Profile photo updated.");
    } catch (e: any) {
      setError(e.message || "Failed to update profile photo.");
    } finally {
      setAvatarUploading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {tUi(lang, "settings.title")}
        </CardTitle>
        <CardDescription>
          {tUi(lang, "settings.desc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Profile photo</label>
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Profile" className="h-14 w-14 rounded-full object-cover ring-2 ring-primary/20" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white">
                <User className="h-5 w-5" />
              </div>
            )}
            <Input
              type="file"
              accept="image/*"
              disabled={avatarUploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleAvatarUpload(file);
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{tUi(lang, "settings.fullName")}</label>
          <Input
            placeholder={tUi(lang, "settings.fullName")}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            {tUi(lang, "settings.grade")}
          </label>
          <Select value={grade} onValueChange={setGrade}>
            <SelectTrigger>
              <SelectValue placeholder="Select your grade" />
            </SelectTrigger>
            <SelectContent>
              {GRADES.map((g) => (
                <SelectItem key={g.value} value={g.value}>
                  {g.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{tUi(lang, "settings.language")}</label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger>
              <SelectValue placeholder={tUi(lang, "settings.language")} />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving || !fullName.trim()}
          className="w-full"
        >
          {saving ? tUi(lang, "settings.saving") : tUi(lang, "settings.save")}
        </Button>
        {success && (
          <p className="text-sm text-green-700">{success}</p>
        )}
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
