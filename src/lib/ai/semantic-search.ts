import {
  cosineSimilarity,
  createEmbeddingProvider,
  expandQueryText,
} from "@/lib/ai/embeddings";
import type { PresentationIntent, TemplateMatch, TemplateRecord } from "@/lib/template-engine/types";

export type RankOptions = {
  limit?: number;
  intent?: PresentationIntent;
};

/**
 * Semantic template search over provider-agnostic TemplateRecords.
 * Uses embeddings (local by default) + intent boosts for ranking.
 */
export async function rankTemplates(
  query: string,
  catalog: TemplateRecord[],
  options: RankOptions = {}
): Promise<TemplateMatch[]> {
  const limit = options.limit ?? 8;
  const intent = options.intent;
  const embedder = createEmbeddingProvider();

  const queryText = [
    query,
    intent?.summary,
    intent?.presentationType,
    ...(intent?.industry ?? []),
    ...(intent?.audience ?? []),
    ...(intent?.visualStyle ?? []),
    ...(intent?.tone ?? []),
    ...(intent?.keywords ?? []),
  ]
    .filter(Boolean)
    .join(" ");

  const docs = catalog.map((t) => t.semanticText);
  const [queryVec, ...docVecs] = await embedder.embed([
    expandQueryText(queryText),
    ...docs,
  ]);

  const scored: TemplateMatch[] = catalog.map((template, i) => {
    const semantic = cosineSimilarity(queryVec, docVecs[i]);
    const { boost, reasons } = intentBoost(template, intent);
    const score = clamp01(semantic * 0.72 + boost * 0.28);
    return { template, score, reasons };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).filter((m) => m.score > 0.08);
}

function intentBoost(
  template: TemplateRecord,
  intent?: PresentationIntent
): { boost: number; reasons: string[] } {
  if (!intent) return { boost: 0.35, reasons: ["semantic match"] };

  let boost = 0;
  const reasons: string[] = [];

  if (
    intent.presentationType &&
    template.presentationType === intent.presentationType
  ) {
    boost += 0.45;
    reasons.push(`type: ${intent.presentationType}`);
  }

  for (const ind of intent.industry) {
    if (
      template.industry.some((t) => t.includes(ind) || ind.includes(t)) ||
      template.semanticText.toLowerCase().includes(ind.split(" ")[0]!)
    ) {
      boost += 0.12;
      reasons.push(`industry: ${ind}`);
    }
  }

  for (const aud of intent.audience) {
    if (template.audience.some((a) => a.includes(aud) || aud.includes(a))) {
      boost += 0.1;
      reasons.push(`audience: ${aud}`);
    }
  }

  for (const style of intent.visualStyle) {
    if (template.visualStyle.includes(style)) {
      boost += 0.1;
      reasons.push(`style: ${style}`);
    }
  }

  for (const t of intent.tone) {
    if (template.tone.includes(t)) {
      boost += 0.06;
      reasons.push(`tone: ${t}`);
    }
  }

  if (intent.themeHint && template.themeId === intent.themeHint) {
    boost += 0.12;
    reasons.push(`theme: ${intent.themeHint}`);
  }

  for (const kw of intent.keywords.slice(0, 8)) {
    if (template.semanticText.toLowerCase().includes(kw)) {
      boost += 0.03;
    }
  }

  if (reasons.length === 0) reasons.push("semantic match");
  return { boost: Math.min(1, boost), reasons: [...new Set(reasons)].slice(0, 4) };
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}
