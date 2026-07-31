import type { TemplateRecord } from "@/lib/template-engine/types";
import type { Slide, ThemeId } from "@/lib/types";
import { uid } from "@/lib/utils";

/** Decksmith portable template JSON (import / export interchange). */
export type PortableTemplate = {
  name: string;
  description?: string;
  themeId?: ThemeId;
  tags?: string[];
  slides: Omit<Slide, "id">[];
};

export function parsePortableTemplateJson(raw: string): TemplateRecord {
  const data = JSON.parse(raw) as PortableTemplate;
  if (!data?.name || !Array.isArray(data.slides) || data.slides.length === 0) {
    throw new Error("Invalid template JSON — need name and slides[]");
  }

  const themeId = data.themeId ?? "minimal";
  const id = uid("user-tpl");
  const slides = data.slides.map((s) => ({ ...s }));

  return {
    id,
    source: "user",
    name: data.name,
    description: data.description || "Imported template",
    presentationType: "business",
    industry: ["imported"],
    audience: ["general"],
    visualStyle: ["modern"],
    colorPalette: ["#111111", "#ffffff"],
    layoutStyle: "imported",
    tone: ["professional"],
    tags: [...(data.tags ?? []), "imported", "user"],
    themeId,
    slideCount: slides.length,
    preview: "linear-gradient(135deg,#e4e4e7,#18181b)",
    semanticText: [data.name, data.description, ...(data.tags ?? []), "imported"].join(" · "),
    slides,
  };
}

export function presentationToPortableJson(input: {
  title: string;
  subtitle?: string;
  themeId: ThemeId;
  slides: Slide[];
}): string {
  const portable: PortableTemplate = {
    name: input.title,
    description: input.subtitle,
    themeId: input.themeId,
    tags: ["exported"],
    slides: input.slides.map(({ id: _id, ...rest }) => rest),
  };
  return JSON.stringify(portable, null, 2);
}
