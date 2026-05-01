import { GoogleGenerativeAI } from "@google/generative-ai";

function client() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to .env.local (see .env.example).",
    );
  }
  return new GoogleGenerativeAI(apiKey);
}

const GENERATION_MODEL_CANDIDATES = Array.from(
  new Set(
    [
      process.env.GEMINI_GENERATION_MODEL?.trim(),
      "gemini-1.5-flash",
      "gemini-1.5-flash-latest",
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
    ].filter((v): v is string => Boolean(v)),
  ),
);
const TARGET_EMBEDDING_DIMENSIONS = 768;
const EMBEDDING_MODEL_CANDIDATES = Array.from(
  new Set(
    [
      process.env.GEMINI_EMBEDDING_MODEL?.trim(),
      "text-embedding-004",
      "embedding-001",
    ].filter((v): v is string => Boolean(v)),
  ),
);
let resolvedEmbeddingModel: string | null = null;
let discoveredEmbeddingModel: string | null = null;
let resolvedGenerationModel: string | null = null;
let modelListCache: GeminiModelInfo[] | null = null;

type GeminiModelInfo = {
  name?: string;
  supportedGenerationMethods?: string[];
};

function normalizeModelName(name: string): string {
  return name.replace(/^models\//, "");
}

function normalizeEmbedding(values: number[]): number[] {
  if (values.length === TARGET_EMBEDDING_DIMENSIONS) return values;
  if (values.length > TARGET_EMBEDDING_DIMENSIONS) {
    return values.slice(0, TARGET_EMBEDDING_DIMENSIONS);
  }
  return values.concat(
    Array(TARGET_EMBEDDING_DIMENSIONS - values.length).fill(0),
  );
}

async function listGeminiModels(): Promise<GeminiModelInfo[]> {
  if (modelListCache) return modelListCache;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
      { method: "GET" },
    );
    if (!res.ok) return [];

    const data = (await res.json()) as { models?: GeminiModelInfo[] };
    modelListCache = data.models ?? [];
    return modelListCache;
  } catch {
    return [];
  }
}

async function discoverEmbeddingModelViaList(): Promise<string | null> {
  if (discoveredEmbeddingModel) return discoveredEmbeddingModel;

  try {
    const models = await listGeminiModels();
    const embeddingModels = models.filter((m) =>
      (m.supportedGenerationMethods ?? []).includes("embedContent"),
    );
    if (!embeddingModels.length) return null;

    // Prefer modern Gemini embedding IDs when available.
    const preferredOrder = [
      "models/gemini-embedding-001",
      "models/text-embedding-004",
      "models/embedding-001",
    ];
    for (const preferred of preferredOrder) {
      const found = embeddingModels.find((m) => m.name === preferred);
      if (found?.name) {
        discoveredEmbeddingModel = normalizeModelName(found.name);
        return discoveredEmbeddingModel;
      }
    }

    const fallback = embeddingModels.find((m) => m.name)?.name;
    if (!fallback) return null;
    discoveredEmbeddingModel = normalizeModelName(fallback);
    return discoveredEmbeddingModel;
  } catch {
    return null;
  }
}

async function discoverGenerationModelViaList(): Promise<string | null> {
  const models = await listGeminiModels();
  const generationModels = models.filter((m) =>
    (m.supportedGenerationMethods ?? []).includes("generateContent"),
  );
  if (!generationModels.length) return null;

  const preferredOrder = [
    "models/gemini-2.5-flash",
    "models/gemini-2.5-flash-lite",
    "models/gemini-2.0-flash",
    "models/gemini-2.0-flash-lite",
    "models/gemini-1.5-flash",
    "models/gemini-1.5-flash-latest",
  ];
  for (const preferred of preferredOrder) {
    const found = generationModels.find((m) => m.name === preferred);
    if (found?.name) return normalizeModelName(found.name);
  }

  const fallback = generationModels.find((m) => m.name)?.name;
  return fallback ? normalizeModelName(fallback) : null;
}

function isUnsupportedEmbeddingModelError(error: unknown): boolean {
  const anyErr = error as { status?: number; message?: string };
  const msg = (anyErr?.message ?? "").toLowerCase();
  return (
    anyErr?.status === 404 ||
    msg.includes("not found") ||
    msg.includes("not supported")
  );
}

function isUnsupportedGenerationModelError(error: unknown): boolean {
  const anyErr = error as { status?: number; message?: string };
  const msg = (anyErr?.message ?? "").toLowerCase();
  return (
    anyErr?.status === 404 ||
    msg.includes("not found") ||
    msg.includes("not supported")
  );
}

async function generationModelsToTry(): Promise<string[]> {
  if (resolvedGenerationModel) return [resolvedGenerationModel];
  const discovered = await discoverGenerationModelViaList();
  return Array.from(
    new Set([
      ...GENERATION_MODEL_CANDIDATES,
      ...(discovered ? [discovered] : []),
    ]),
  );
}

async function embedMany(texts: string[]): Promise<number[][]> {
  const baseModels = resolvedEmbeddingModel
    ? [resolvedEmbeddingModel]
    : EMBEDDING_MODEL_CANDIDATES;
  const modelsToTry = [...baseModels];

  let lastError: unknown;
  for (const modelName of modelsToTry) {
    const model = client().getGenerativeModel({ model: modelName });
    try {
      const requests = texts.map((t) => ({
        content: { role: "user", parts: [{ text: t }] },
        outputDimensionality: TARGET_EMBEDDING_DIMENSIONS,
      }));
      const result = await (model as any).batchEmbedContents({ requests });
      resolvedEmbeddingModel = modelName;
      return result.embeddings.map((e: { values: number[] }) =>
        normalizeEmbedding(e.values),
      );
    } catch (batchErr) {
      try {
        const singleResults = await Promise.all(
          texts.map(async (t) => {
            const r = await model.embedContent({
              content: { role: "user", parts: [{ text: t }] },
              outputDimensionality: TARGET_EMBEDDING_DIMENSIONS,
            } as any);
            return normalizeEmbedding(r.embedding.values);
          }),
        );
        resolvedEmbeddingModel = modelName;
        return singleResults;
      } catch (singleErr) {
        lastError = singleErr;
        if (!isUnsupportedEmbeddingModelError(singleErr)) throw singleErr;
        if (!resolvedEmbeddingModel) {
          console.warn(
            `[gemini] Embedding model "${modelName}" unavailable, trying fallback...`,
          );
        }
      }
      if (!isUnsupportedEmbeddingModelError(batchErr)) throw batchErr;
    }
  }

  const discovered = await discoverEmbeddingModelViaList();
  if (discovered && !modelsToTry.includes(discovered)) {
    console.warn(
      `[gemini] Trying discovered embedding model "${discovered}" from models.list...`,
    );
    const model = client().getGenerativeModel({ model: discovered });
    try {
      const requests = texts.map((t) => ({
        content: { role: "user", parts: [{ text: t }] },
        outputDimensionality: TARGET_EMBEDDING_DIMENSIONS,
      }));
      const result = await (model as any).batchEmbedContents({ requests });
      resolvedEmbeddingModel = discovered;
      return result.embeddings.map((e: { values: number[] }) =>
        normalizeEmbedding(e.values),
      );
    } catch {
      const singleResults = await Promise.all(
        texts.map(async (t) => {
          const r = await model.embedContent({
            content: { role: "user", parts: [{ text: t }] },
            outputDimensionality: TARGET_EMBEDDING_DIMENSIONS,
          } as any);
          return normalizeEmbedding(r.embedding.values);
        }),
      );
      resolvedEmbeddingModel = discovered;
      return singleResults;
    }
  }

  throw lastError ?? new Error("No supported Gemini embedding model found.");
}

export async function embedText(text: string): Promise<number[]> {
  const [embedding] = await embedMany([text]);
  return embedding;
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  return embedMany(texts);
}

export interface GenerateOptions {
  systemInstruction?: string;
  temperature?: number;
  jsonMode?: boolean;
}

export async function generate(
  prompt: string,
  options: GenerateOptions = {},
): Promise<string> {
  let lastError: unknown;
  for (const modelName of await generationModelsToTry()) {
    const model = client().getGenerativeModel({
      model: modelName,
      systemInstruction: options.systemInstruction,
      generationConfig: {
        temperature: options.temperature ?? 0.4,
        ...(options.jsonMode ? { responseMimeType: "application/json" } : {}),
      },
    });
    try {
      const result = await model.generateContent(prompt);
      resolvedGenerationModel = modelName;
      return result.response.text();
    } catch (error) {
      lastError = error;
      if (!isUnsupportedGenerationModelError(error)) throw error;
      console.warn(
        `[gemini] Generation model "${modelName}" unavailable, trying fallback...`,
      );
    }
  }
  throw lastError ?? new Error("No supported Gemini generation model found.");
}

export async function* generateStream(
  prompt: string,
  options: GenerateOptions = {},
): AsyncGenerator<string> {
  let lastError: unknown;
  for (const modelName of await generationModelsToTry()) {
    const model = client().getGenerativeModel({
      model: modelName,
      systemInstruction: options.systemInstruction,
      generationConfig: {
        temperature: options.temperature ?? 0.4,
      },
    });
    try {
      const result = await model.generateContentStream(prompt);
      resolvedGenerationModel = modelName;
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) yield text;
      }
      return;
    } catch (error) {
      lastError = error;
      if (!isUnsupportedGenerationModelError(error)) throw error;
      console.warn(
        `[gemini] Generation model "${modelName}" unavailable, trying fallback...`,
      );
    }
  }
  throw lastError ?? new Error("No supported Gemini generation model found.");
}
