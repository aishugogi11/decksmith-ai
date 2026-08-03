import { EchoFlowTemplateProvider } from "@/lib/template-engine/providers/decksmith-provider";
import { OpenPackTemplateProvider } from "@/lib/template-engine/providers/open-pack-provider";
import { userTemplateProvider } from "@/lib/template-engine/providers/user-provider";
import type { TemplateProvider, TemplateRecord } from "@/lib/template-engine/types";

const providers: TemplateProvider[] = [
  new EchoFlowTemplateProvider(),
  new OpenPackTemplateProvider(),
  userTemplateProvider,
];

/**
 * Register additional licensed / future template sources without touching
 * the recommendation UI or editor.
 */
export function registerTemplateProvider(provider: TemplateProvider) {
  if (providers.some((p) => p.id === provider.id)) return;
  providers.push(provider);
}

export function getTemplateProviders(): TemplateProvider[] {
  return [...providers];
}

export async function listAllTemplates(): Promise<TemplateRecord[]> {
  const batches = await Promise.all(providers.map((p) => p.list()));
  return batches.flat();
}

export async function getTemplateRecordById(
  id: string
): Promise<TemplateRecord | null> {
  for (const provider of providers) {
    const found = await provider.getById(id);
    if (found) return found;
  }
  return null;
}

export { userTemplateProvider };
