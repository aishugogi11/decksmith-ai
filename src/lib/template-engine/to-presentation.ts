import type { TemplateRecord } from "@/lib/template-engine/types";
import type { Presentation } from "@/lib/types";
import { uid } from "@/lib/utils";

export function templateRecordToPresentation(
  template: TemplateRecord
): Presentation {
  const now = new Date().toISOString();
  return {
    id: uid("deck"),
    title: template.name,
    subtitle: template.description,
    themeId: template.themeId,
    createdAt: now,
    updatedAt: now,
    slides: template.slides.map((s) => ({
      ...structuredClone(s),
      id: uid("slide"),
    })),
  };
}
