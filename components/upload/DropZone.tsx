"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Camera, FileText } from "lucide-react";
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
    <Card>
      <CardContent className="p-5">
        <div className="mb-4 flex gap-1 rounded-lg bg-stone-100 p-1 text-sm">
          <Button
            type="button"
            variant={mode === "file" ? "default" : "ghost"}
            className="flex-1"
            onClick={() => setMode("file")}
          >
            <Upload className="mr-2 h-4 w-4" />
            {tUi(language, "upload.uploadFile")}
          </Button>
          <Button
            type="button"
            variant={mode === "text" ? "default" : "ghost"}
            className="flex-1"
            onClick={() => setMode("text")}
          >
            <FileText className="mr-2 h-4 w-4" />
            {tUi(language, "upload.pasteText")}
          </Button>
        </div>

        <Input
          className="mb-3"
          placeholder={tUi(language, "upload.titlePlaceholder")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={busy}
        />

      {mode === "file" ? (
        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          className="rounded-2xl border-2 border-dashed border-primary/40 bg-primary-50/40 p-8 text-center"
        >
          <div className="text-4xl">📤</div>
          <p className="mt-2 font-medium text-ink">
            {tUi(language, "upload.dragDrop")}
          </p>
          <p className="mt-1 text-xs text-ink/50">
            {tUi(language, "upload.dragHintPdf")}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
            >
              <Upload className="mr-2 h-4 w-4" />
              {tUi(language, "upload.chooseFile")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => cameraRef.current?.click()}
              disabled={busy}
            >
              <Camera className="mr-2 h-4 w-4" />
              {tUi(language, "upload.takePhoto")}
            </Button>
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
        </div>
      ) : (
        <div>
          <Textarea
            className="min-h-[200px]"
            placeholder={tUi(language, "upload.pastePlaceholder")}
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            disabled={busy}
          />
          <Button
            onClick={uploadText}
            disabled={busy || pasted.trim().length < 80}
            className="mt-3 w-full"
          >
            {tUi(language, "upload.processOpen")}
          </Button>
        </div>
      )}

        {status && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <span className="inline-block animate-pulse">●</span> {status}
          </p>
        )}
        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
