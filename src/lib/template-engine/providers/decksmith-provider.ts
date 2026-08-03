import { DECK_TEMPLATES, getTemplateById } from "@/lib/templates";
import { deckTemplateToRecord } from "@/lib/template-engine/metadata";
import type { TemplateProvider, TemplateRecord } from "@/lib/template-engine/types";

/** Built-in EchoFlow catalog — first-party TemplateProvider. */
export class EchoFlowTemplateProvider implements TemplateProvider {
  readonly id = "decksmith";
  readonly label = "EchoFlow Library";

  async list(): Promise<TemplateRecord[]> {
    return DECK_TEMPLATES.map(deckTemplateToRecord);
  }

  async getById(id: string): Promise<TemplateRecord | null> {
    const raw = getTemplateById(id);
    return raw ? deckTemplateToRecord(raw) : null;
  }
}
