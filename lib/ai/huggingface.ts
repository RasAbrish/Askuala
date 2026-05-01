// Hugging Face Inference API - free tier fallback for embeddings
// Get free token at https://huggingface.co/settings/tokens
// Uses the inference API with the correct endpoint format

const HF_API_URL = "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2";
const TARGET_DIMENSIONS = 768;

function getApiKey(): string {
  const key = process.env.HF_API_KEY;
  if (!key) {
    throw new Error(
      "HF_API_KEY is not set. Add it to .env.local (get free key at huggingface.co/settings/tokens).",
    );
  }
  return key;
}

function normalizeEmbedding(values: number[]): number[] {
  if (values.length === TARGET_DIMENSIONS) return values;
  if (values.length > TARGET_DIMENSIONS) {
    return values.slice(0, TARGET_DIMENSIONS);
  }
  return values.concat(
    Array(TARGET_DIMENSIONS - values.length).fill(0),
  );
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const apiKey = getApiKey();
  console.log(`[huggingface] Using token: ${apiKey.slice(0, 10)}...`);
  console.log(`[huggingface] Calling: ${HF_API_URL}`);

  try {
    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: texts }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`[huggingface] API error: ${response.status} - ${error}`);
      throw new Error(`Hugging Face API error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    console.log(`[huggingface] Success! Got ${result.length} embeddings`);
    
    // HF returns array of embeddings directly or wrapped
    const embeddings: number[][] = Array.isArray(result[0]) ? result : [result];
    return embeddings.map((e) => normalizeEmbedding(e));
  } catch (e: any) {
    console.error(`[huggingface] Request failed: ${e.message}`);
    throw e;
  }
}

export async function embedText(text: string): Promise<number[]> {
  const [embedding] = await embedBatch([text]);
  return embedding;
}
