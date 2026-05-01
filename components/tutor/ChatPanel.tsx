"use client";

import { useEffect, useRef, useState } from "react";
import { tUi } from "@/lib/i18n/ui";
import type { Language } from "@/lib/supabase/types";

interface Message {
  role: "user" | "ai";
  content: string;
}

interface Props {
  chapterId?: string;
  uploadId?: string;
  chapterTitle?: string;
  initialMessages?: Message[];
  suggestions?: string[];
  language?: Language;
}

type BrowserSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void) | null;
  onerror: ((event: unknown) => void) | null;
};

type BrowserWindow = Window & {
  webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
  SpeechRecognition?: new () => BrowserSpeechRecognition;
};

export function ChatPanel({
  chapterId,
  uploadId,
  chapterTitle,
  initialMessages = [],
  suggestions = [],
  language = "en",
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [depth, setDepth] = useState<"brief" | "standard" | "detailed">("standard");
  const [style, setStyle] = useState<"explain" | "examples" | "step_by_step">("explain");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [recording, setRecording] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [input]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const Browser = window as BrowserWindow;
    const Recognition = Browser.SpeechRecognition || Browser.webkitSpeechRecognition;
    if (!Recognition) return;

    const recognition = new Recognition();
    const speechLocale =
      language === "am"
        ? "am-ET"
        : language === "om"
          ? "om-ET"
          : language === "ti"
            ? "ti-ET"
            : "en-US";
    recognition.lang = speechLocale;
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      setListening(false);
    };
    recognition.onerror = () => {
      setListening(false);
    };
    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [language]);

  function withGuidance(text: string) {
    const depthHint =
      depth === "brief"
        ? "Keep the answer brief and direct."
        : depth === "detailed"
          ? "Give a detailed answer with forms, rules, and examples."
          : "Give a balanced explanation with a few examples.";
    const styleHint =
      style === "examples"
        ? "Focus on practical examples."
        : style === "step_by_step"
          ? "Explain step by step in numbered points."
          : "Explain concept first, then examples.";
    return `${text}\n\n[Answer preference: ${depthHint} ${styleHint}]`;
  }

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    setMessages((m) => [...m, userMsg, { role: "ai", content: "" }]);
    setInput("");
    setLoading(true);

    try {
      const recentHistory = messages
        .filter((m) => m.content.trim())
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: withGuidance(text.trim()),
          chapterId,
          uploadId,
          history: recentHistory,
        }),
      });
      if (!res.body) throw new Error("no stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((m) => {
          const next = [...m];
          next[next.length - 1] = {
            role: "ai",
            content: next[next.length - 1].content + chunk,
          };
          return next;
        });
      }
    } catch (err) {
      console.error(err);
      setMessages((m) => {
        const next = [...m];
        next[next.length - 1] = {
          role: "ai",
          content: tUi(language, "common.errorRetry"),
        };
        return next;
      });
    } finally {
      setLoading(false);
    }
  }

  function toggleVoiceInput() {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (listening) {
      recognition.stop();
      setListening(false);
      return;
    }
    recognition.start();
    setListening(true);
  }

  function insertTemplate(text: string) {
    setInput((prev) => `${prev}${prev ? "\n" : ""}${text}`);
  }

  async function speakLastAnswer() {
    const lastAi = [...messages].reverse().find((m) => m.role === "ai" && m.content.trim());
    if (!lastAi) return;
    setVoiceBusy(true);
    setVoiceError(null);
    try {
      const res = await fetch("/api/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: lastAi.content, language }),
      });
      if (!res.ok) throw new Error("tts_failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      await audio.play();
    } catch (error) {
      // Browser fallback when remote TTS is unavailable.
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(lastAi.content);
        utterance.lang =
          language === "am"
            ? "am-ET"
            : language === "om"
              ? "om-ET"
              : language === "ti"
                ? "ti-ET"
                : "en-US";
        window.speechSynthesis.speak(utterance);
      } else {
        setVoiceError("Read answer is unavailable on this device/browser.");
      }
    } finally {
      setVoiceBusy(false);
    }
  }

  async function toggleRecordAndTranscribe() {
    if (typeof window === "undefined" || !navigator.mediaDevices) return;

    if (recording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio", blob, "voice.webm");

        setVoiceBusy(true);
        try {
          const res = await fetch("/api/voice/transcribe", {
            method: "POST",
            body: formData,
          });
          if (!res.ok) throw new Error("transcribe_failed");
          const data = (await res.json()) as { text?: string };
          if (data.text?.trim()) {
            setInput((prev) => (prev ? `${prev} ${data.text!.trim()}` : data.text!.trim()));
          }
        } catch (error) {
          console.error(error);
        } finally {
          setVoiceBusy(false);
        }
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (error) {
      console.error(error);
      setRecording(false);
    }
  }

  return (
    <div className="flex h-[70vh] flex-col rounded-2xl border border-black/5 bg-white shadow-sm">
      <div className="border-b border-black/5 px-5 py-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold text-ink">
            {tUi(language, "tutor.title")}{chapterTitle ? ` · ${chapterTitle}` : ""}
          </h2>
          <button
            type="button"
            onClick={speakLastAnswer}
            disabled={voiceBusy}
            className="btn-ghost text-xs disabled:opacity-60"
          >
            🔊 {tUi(language, "tutor.readAnswer")}
          </button>
        </div>
        <p className="text-xs text-ink/50">
          {tUi(language, "tutor.grounded")}
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center text-ink/50">
            <p className="mb-4 text-sm">
              {chapterId || uploadId
                ? tUi(language, "tutor.chapterHint")
                : tUi(language, "tutor.generalHint")}
            </p>
            {suggestions.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-black/10 bg-paper px-3 py-1 text-xs hover:bg-primary-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role} content={m.content} />
        ))}
        {loading &&
          messages[messages.length - 1]?.content === "" && (
            <Bubble role="ai" content={tUi(language, "tutor.thinking")} />
          )}
      </div>

      <form
        className="border-t border-black/5 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <button type="button" className="btn-ghost text-xs" onClick={() => insertTemplate("Important point: ")}>
            Important
          </button>
          <button type="button" className="btn-ghost text-xs" onClick={() => insertTemplate("Definition: ")}>
            Definition
          </button>
          <button type="button" className="btn-ghost text-xs" onClick={() => insertTemplate("Example: ")}>
            Example
          </button>
          <button type="button" className="btn-ghost text-xs" onClick={() => insertTemplate("- ")}>
            Bullet List
          </button>
          <select
            className="input h-9 w-auto min-w-[160px] py-1 text-xs"
            value={depth}
            onChange={(e) => setDepth(e.target.value as typeof depth)}
          >
            <option value="brief">Depth: Brief</option>
            <option value="standard">Depth: Standard</option>
            <option value="detailed">Depth: Detailed</option>
          </select>
          <select
            className="input h-9 w-auto min-w-[190px] py-1 text-xs"
            value={style}
            onChange={(e) => setStyle(e.target.value as typeof style)}
          >
            <option value="explain">Style: Concept First</option>
            <option value="examples">Style: Example Driven</option>
            <option value="step_by_step">Style: Step-by-Step</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            className="input min-h-[92px] max-h-[220px] flex-1 resize-none overflow-y-auto"
            placeholder={
              chapterId || uploadId
                ? tUi(language, "tutor.placeholderMaterial")
                : tUi(language, "tutor.placeholderGeneral")
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!loading && !voiceBusy && input.trim()) {
                  void send(input);
                }
              }
            }}
            disabled={loading}
          />
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={toggleVoiceInput}
              disabled={loading || voiceBusy || !recognitionRef.current}
              className={`btn-ghost ${listening ? "bg-primary-50 text-primary" : ""}`}
              title={listening ? "Listening now" : "Start speech recognition"}
            >
              {listening ? `🎙️ ${tUi(language, "tutor.listening")}` : `🎤 ${tUi(language, "tutor.voice")}`}
            </button>
            <button
              type="button"
              onClick={toggleRecordAndTranscribe}
              disabled={loading || voiceBusy}
              className={`btn-ghost ${recording ? "bg-primary-50 text-primary" : ""}`}
              title={recording ? "Stop recording and transcribe" : "Record voice and transcribe"}
            >
              {recording
                ? `⏹ ${tUi(language, "common.close")}`
                : `⏺ ${tUi(language, "tutor.voice")}`}
            </button>
            <button
              className="btn-primary"
              type="submit"
              disabled={loading || voiceBusy || !input.trim()}
              title="Send message to AI tutor"
            >
              {tUi(language, "common.send")}
            </button>
          </div>
        </div>
      </form>
      {voiceError && <p className="px-3 pb-3 text-xs text-red-500">{voiceError}</p>}
    </div>
  );
}

function Bubble({ role, content }: Message) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm leading-relaxed ${
          isUser
            ? "bg-primary text-white"
            : "bg-paper text-ink border border-black/5"
        }`}
      >
        {content || "…"}
      </div>
    </div>
  );
}
