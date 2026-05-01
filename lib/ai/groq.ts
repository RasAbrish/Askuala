import { Groq } from "groq-sdk";

function client() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY is not set. Add it to .env.local (get free key at groq.com).",
    );
  }
  return new Groq({ apiKey });
}

export interface GenerateOptions {
  temperature?: number;
  jsonMode?: boolean;
  maxTokens?: number;
}

const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const FALLBACK_MODEL = "llama-3.1-8b-instant";

export async function generate(
  prompt: string,
  options: GenerateOptions = {},
): Promise<string> {
  const groq = client();
  
  const messages = [
    {
      role: "user" as const,
      content: prompt,
    },
  ];

  const modelsToTry = [DEFAULT_MODEL, FALLBACK_MODEL];
  let lastError: unknown;

  for (const model of modelsToTry) {
    try {
      const response = await groq.chat.completions.create({
        model,
        messages,
        temperature: options.temperature ?? 0.4,
        max_tokens: options.maxTokens ?? 4096,
        response_format: options.jsonMode ? { type: "json_object" } : undefined,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Empty response from Groq");
      }
      return content;
    } catch (error: any) {
      lastError = error;
      const msg = JSON.stringify(error?.error ?? error?.message ?? "").toLowerCase();
      // If rate limited or model unavailable/decommissioned, try next model
      if (
        error?.status === 429 ||
        msg.includes("decommissioned") ||
        msg.includes("model_decommissioned") ||
        msg.includes("not supported") ||
        msg.includes("invalid_request_error")
      ) {
        console.warn(`[groq] Model "${model}" rate limited, trying fallback...`);
        continue;
      }
      throw error;
    }
  }

  throw lastError ?? new Error("All Groq models failed");
}

export async function* generateStream(
  prompt: string,
  options: GenerateOptions = {},
): AsyncGenerator<string> {
  const groq = client();

  const messages = [
    {
      role: "user" as const,
      content: prompt,
    },
  ];

  const modelsToTry = [DEFAULT_MODEL, FALLBACK_MODEL];
  
  for (const model of modelsToTry) {
    try {
      const stream = await groq.chat.completions.create({
        model,
        messages,
        temperature: options.temperature ?? 0.4,
        max_tokens: options.maxTokens ?? 4096,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
      return;
    } catch (error: any) {
      const msg = JSON.stringify(error?.error ?? error?.message ?? "").toLowerCase();
      if (
        error?.status === 429 ||
        msg.includes("decommissioned") ||
        msg.includes("model_decommissioned") ||
        msg.includes("not supported") ||
        msg.includes("invalid_request_error")
      ) {
        console.warn(`[groq] Model "${model}" rate limited, trying fallback...`);
        continue;
      }
      throw error;
    }
  }
}

// Groq doesn't have embeddings - keep using Gemini or use HuggingFace for embeddings
export async function generateWithFallback(
  prompt: string,
  options: GenerateOptions = {},
): Promise<string> {
  // Try Groq first (fast, high quota)
  try {
    return await generate(prompt, options);
  } catch (groqError: any) {
    console.warn("[groq] Failed, falling back...", groqError.message);
    throw groqError;
  }
}
