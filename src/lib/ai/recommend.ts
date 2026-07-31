import { analyzePresentationIntent } from "@/lib/ai/intent";
import { rankTemplates } from "@/lib/ai/semantic-search";
import { listAllTemplates } from "@/lib/template-engine";
import type { PresentationIntent, TemplateMatch } from "@/lib/template-engine/types";

export type RecommendResult = {
  intent: PresentationIntent;
  matches: TemplateMatch[];
};

/** Full recommend pipeline: intent → multi-provider catalog → semantic rank. */
export async function recommendTemplates(
  prompt: string,
  limit = 8
): Promise<RecommendResult> {
  const intent = analyzePresentationIntent(prompt);
  const catalog = await listAllTemplates();
  const matches = await rankTemplates(prompt, catalog, { limit, intent });
  return { intent, matches };
}
