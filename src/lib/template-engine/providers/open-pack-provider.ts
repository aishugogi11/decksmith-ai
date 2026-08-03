import { deckTemplateToRecord } from "@/lib/template-engine/metadata";
import type { TemplateProvider, TemplateRecord } from "@/lib/template-engine/types";
import { OPEN_TEMPLATE_PACK } from "@/lib/template-packs/open-pack";

/** MIT open template pack — original EchoFlow layouts for AI customization. */
export class OpenPackTemplateProvider implements TemplateProvider {
  readonly id = "open-pack";
  readonly label = "EchoFlow Open Pack (MIT)";

  private cache: TemplateRecord[] | null = null;

  async list(): Promise<TemplateRecord[]> {
    if (!this.cache) {
      this.cache = OPEN_TEMPLATE_PACK.map(deckTemplateToRecord).map((r) => ({
        ...r,
        source: this.id,
      }));
    }
    return this.cache;
  }

  async getById(id: string): Promise<TemplateRecord | null> {
    const all = await this.list();
    return all.find((t) => t.id === id) ?? null;
  }
}
