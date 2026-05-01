const DIMENSIONS = 768;

function l2Normalize(values: number[]): number[] {
  const norm = Math.sqrt(values.reduce((sum, v) => sum + v * v, 0));
  if (!norm) return values;
  return values.map((v) => v / norm);
}

function hashToken(token: string): number {
  let h = 2166136261;
  for (let i = 0; i < token.length; i += 1) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function embedTextLocal(text: string): number[] {
  const vector = new Array<number>(DIMENSIONS).fill(0);
  const tokens = text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

  if (!tokens.length) return vector;

  for (const token of tokens) {
    const hash = hashToken(token);
    const idxA = hash % DIMENSIONS;
    const idxB = ((hash >>> 11) ^ (hash * 31)) % DIMENSIONS;
    const sign = hash & 1 ? 1 : -1;
    const weight = Math.max(0.3, Math.min(2, token.length / 6));

    vector[idxA] += sign * weight;
    vector[Math.abs(idxB)] += -sign * (weight * 0.75);
  }

  return l2Normalize(vector);
}

export function embedBatchLocal(texts: string[]): number[][] {
  return texts.map((text) => embedTextLocal(text));
}
