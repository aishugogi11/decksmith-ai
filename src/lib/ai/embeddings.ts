/**
 * Embedding providers for semantic template search.
 * Default: local hashed bag-of-words (no API key).
 * Swap in OpenAI / Voyage / etc. via createEmbeddingProvider().
 */

const DIM = 256;

export interface EmbeddingProvider {
  readonly id: string;
  embed(texts: string[]): Promise<number[][]>;
}

/** Synonym expansion so “startup fundraising” hits investor / Series A templates. */
const SYNONYMS: Record<string, string[]> = {
  fundraising: ["investor", "pitch", "venture", "capital", "series", "seed", "vc"],
  startup: ["founder", "pitch", "venture", "seed", "saas"],
  investor: ["pitch", "fundraising", "venture", "capital", "series", "seed"],
  pitch: ["investor", "fundraising", "startup", "venture", "deck", "yc"],
  yc: ["ycombinator", "investor", "seed", "startup", "pitch", "demo"],
  ycombinator: ["yc", "investor", "seed", "startup", "pitch"],
  healthcare: ["health", "medical", "clinic", "care", "hospital"],
  health: ["healthcare", "medical", "care"],
  ai: ["artificial", "intelligence", "machine", "learning", "llm", "ml"],
  modern: ["minimal", "clean", "sleek", "contemporary"],
  corporate: ["business", "executive", "professional", "enterprise"],
  education: ["school", "lesson", "students", "teaching", "course"],
  marketing: ["campaign", "brand", "growth", "launch"],
  sales: ["pipeline", "revenue", "quota", "prospect"],
  biography: ["bio", "life", "story", "personal", "history"],
  portfolio: ["case", "study", "work", "samples"],
  webinar: ["online", "event", "session", "workshop"],
  okrs: ["okr", "goals", "objectives", "planning"],
  nonprofit: ["charity", "mission", "donor", "impact"],
};

export function expandQueryText(text: string): string {
  const tokens = tokenize(text);
  const extra: string[] = [];
  for (const t of tokens) {
    const syns = SYNONYMS[t];
    if (syns) extra.push(...syns);
  }
  return `${text} ${extra.join(" ")}`;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s+-]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1);
}

function hashToken(token: string): number {
  let h = 2166136261;
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % DIM;
}

/** Deterministic local embedding — embedding-ready swap point for real models. */
export class LocalHashEmbeddingProvider implements EmbeddingProvider {
  readonly id = "local-hash";

  async embed(texts: string[]): Promise<number[][]> {
    return texts.map((text) => {
      const vec = new Array<number>(DIM).fill(0);
      const tokens = tokenize(expandQueryText(text));
      for (const token of tokens) {
        vec[hashToken(token)] += 1;
        // bigrams
      }
      for (let i = 0; i < tokens.length - 1; i++) {
        vec[hashToken(`${tokens[i]}_${tokens[i + 1]}`)] += 0.6;
      }
      return l2normalize(vec);
    });
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function l2normalize(v: number[]): number[] {
  let n = 0;
  for (const x of v) n += x * x;
  n = Math.sqrt(n) || 1;
  return v.map((x) => x / n);
}

let cached: EmbeddingProvider | null = null;

export function createEmbeddingProvider(): EmbeddingProvider {
  if (cached) return cached;
  // Future: if (process.env.OPENAI_API_KEY) return new OpenAIEmbeddingProvider()
  cached = new LocalHashEmbeddingProvider();
  return cached;
}
