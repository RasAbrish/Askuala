"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Camera, FileText, Sparkles } from "lucide-react";
import { tUi } from "@/lib/i18n/ui";
import type { Language } from "@/lib/supabase/types";

type Mode = "file" | "text";

export function DropZone({ language = "en" }: { language?: Language }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("file");
  const [pasted, setPasted] = useState("");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const uiText = {
    reading:
      language === "am"
        ? "ፋይሉን በማንበብ ላይ…"
        : language === "om"
          ? "Faayila dubbisaa jira…"
          : language === "ti"
            ? "ፋይል ይንበብ ኣሎ…"
            : "Reading file…",
    embedding:
      language === "am"
        ? "ገፆች በማውጣት እና በመቀነጭበር ላይ…"
        : language === "om"
          ? "Fuula baasuufi embedding godhaa jira…"
          : language === "ti"
            ? "ገጻት እናውጽእ ኣለና እሞ embedding ንገብር…"
            : "Extracting pages and embedding…",
    vision:
      language === "am"
        ? "ምስሉን በGemini Vision በማንበብ ላይ…"
        : language === "om"
          ? "Suuraa Gemini Vision'n dubbisaa jira…"
          : language === "ti"
            ? "ስእሊ ብGemini Vision ይንበብ ኣሎ…"
            : "Reading image with Gemini Vision…",
    chunking:
      language === "am"
        ? "ጽሑፉን በመክፈል እና embedding በማድረግ ላይ…"
        : language === "om"
          ? "Barruu qooduun embedding godhaa jira…"
          : language === "ti"
            ? "ጽሑፍ ንኽፈል እሞ embedding ንገብር ኣለና…"
            : "Chunking and embedding…",
  };

  async function uploadFile(file: File) {
    setBusy(true);
    setError(null);
    setStatus(`${uiText.reading} (${file.name})`);

    const fd = new FormData();
    fd.append("file", file);
    if (title.trim()) fd.append("title", title.trim());

    try {
      setStatus(
        file.type === "application/pdf"
          ? uiText.embedding
          : uiText.vision,
      );
      const res = await fetch("/api/uploads/create", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      router.push(`/upload/${data.id}`);
    } catch (e: any) {
      setError(e.message);
      setBusy(false);
      setStatus(null);
    }
  }

  async function uploadText() {
    if (pasted.trim().length < 80) {
      setError(tUi(language, "upload.pasteMinChars"));
      return;
    }
    setBusy(true);
    setError(null);
    setStatus(uiText.chunking);
    try {
      const res = await fetch("/api/uploads/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pasted, title: title.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      router.push(`/upload/${data.id}`);
    } catch (e: any) {
      setError(e.message);
      setBusy(false);
      setStatus(null);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) uploadFile(f);
  }

  return (
    <Card className="overflow-hidden border-slate-200 shadow-xl">
      <CardContent className="p-4 sm:p-6">
        <div className="mb-4 flex gap-2 rounded-xl bg-slate-100 p-1.5 sm:mb-6">
          <Button
            type="button"
            variant={mode === "file" ? "default" : "ghost"}
            className="flex-1 rounded-lg text-xs sm:text-sm"
            onClick={() => setMode("file")}
          >
            <Upload className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{tUi(language, "upload.uploadFile")}</span>
            <span className="sm:hidden">Upload</span>
          </Button>
          <Button
            type="button"
            variant={mode === "text" ? "default" : "ghost"}
            className="flex-1 rounded-lg text-xs sm:text-sm"
            onClick={() => setMode("text")}
          >
            <FileText className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{tUi(language, "upload.pasteText")}</span>
            <span className="sm:hidden">Text</span>
          </Button>
        </div>

        <Input
          className="mb-4 text-sm"
          placeholder={tUi(language, "upload.titlePlaceholder")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={busy}
        />

      {mode === "file" ? (
        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          className="relative overflow-hidden rounded-2xl border-2 border-dashed border-primary/40 bg-gradient-to-br from-primary-50/50 to-accent-50/30 p-6 text-center transition-all hover:border-primary hover:bg-primary-50/60 sm:rounded-3xl sm:p-12"
        >
          <div className="relative z-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-md sm:h-20 sm:w-20">
              <Upload className="h-8 w-8 sm:h-10 sm:w-10" />
            </div>
            <h3 className="mt-3 text-base font-bold text-slate-800 sm:mt-4 sm:text-lg">
              {tUi(language, "upload.dragDrop")}
            </h3>
            <p className="mt-1 text-xs text-slate-600 sm:mt-2 sm:text-sm">
              {tUi(language, "upload.dragHintPdf")}
            </p>
            <div className="mt-4 flex flex-col justify-center gap-2 sm:mt-6 sm:flex-row sm:gap-3">
              <Button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="btn-primary w-full text-sm sm:w-auto"
              >
                <Upload className="mr-2 h-4 w-4" />
                {tUi(language, "upload.chooseFile")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => cameraRef.current?.click()}
                disabled={busy}
                className="w-full text-sm sm:w-auto"
              >
                <Camera className="mr-2 h-4 w-4" />
                {tUi(language, "upload.takePhoto")}
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs sm:mt-4">
              <span className="rounded-full bg-white px-3 py-1 font-medium text-slate-700">PDF</span>
              <span className="rounded-full bg-white px-3 py-1 font-medium text-slate-700">Images</span>
              <span className="rounded-full bg-white px-3 py-1 font-medium text-slate-700">Text</span>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,image/*,text/plain"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadFile(f);
            }}
          />
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadFile(f);
            }}
          />
          <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-primary/10 blur-3xl sm:h-32 sm:w-32" />
          <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-accent/10 blur-3xl sm:h-32 sm:w-32" />
        </div>
      ) : (
        <div>
          <Textarea
            className="min-h-[200px] text-sm sm:min-h-[240px]"
            placeholder={tUi(language, "upload.pastePlaceholder")}
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            disabled={busy}
          />
          <Button
            onClick={uploadText}
            disabled={busy || pasted.trim().length < 80}
            className="btn-primary mt-4 w-full text-sm"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {tUi(language, "upload.processOpen")}
          </Button>
        </div>
      )}

        {status && (
          <div className="mt-4 rounded-xl bg-primary-50 px-3 py-2 text-center sm:mt-6 sm:px-4 sm:py-3">
            <div className="flex items-center justify-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              <p className="text-xs font-medium text-primary sm:text-sm">{status}</p>
            </div>
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-xl bg-red-50 px-3 py-2 sm:px-4 sm:py-3">
            <p className="text-xs font-medium text-red-700 sm:text-sm">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
