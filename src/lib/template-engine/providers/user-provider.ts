import type { TemplateProvider, TemplateRecord } from "@/lib/template-engine/types";

/**
 * User-imported templates (JSON / PPTX extracts).
 * Backed by an in-memory list the store syncs from localStorage.
 */
export class UserTemplateProvider implements TemplateProvider {
  readonly id = "user";
  readonly label = "Your imports";

  private templates: TemplateRecord[] = [];

  setTemplates(templates: TemplateRecord[]) {
    this.templates = templates.map((t) => ({ ...t, source: this.id }));
  }

  async list(): Promise<TemplateRecord[]> {
    return this.templates;
  }

  async getById(id: string): Promise<TemplateRecord | null> {
    return this.templates.find((t) => t.id === id) ?? null;
  }
}

export const userTemplateProvider = new UserTemplateProvider();
