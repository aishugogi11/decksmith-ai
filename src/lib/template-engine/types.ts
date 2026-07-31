import type { Slide, ThemeId } from "@/lib/types";

/** High-level presentation kinds used for intent + ranking. */
export type PresentationType =
  | "pitch"
  | "business"
  | "education"
  | "marketing"
  | "product"
  | "creative"
  | "events"
  | "personal"
  | "nonprofit"
  | "reports"
  | "biography"
  | "sales"
  | "portfolio";

export type VisualStyle =
  | "minimal"
  | "modern"
  | "corporate"
  | "playful"
  | "bold"
  | "editorial"
  | "gradient"
  | "classic";

export type Tone =
  | "professional"
  | "friendly"
  | "authoritative"
  | "inspirational"
  | "casual"
  | "academic";

/**
 * Provider-agnostic template record.
 * Decksmith’s catalog, licensed packs, or future APIs all map into this shape.
 */
export interface TemplateRecord {
  id: string;
  /** Which TemplateProvider produced this record */
  source: string;
  name: string;
  description: string;
  presentationType: PresentationType;
  industry: string[];
  audience: string[];
  visualStyle: VisualStyle[];
  colorPalette: string[];
  layoutStyle: string;
  tone: Tone[];
  tags: string[];
  themeId: ThemeId;
  slideCount: number;
  preview: string;
  /** Searchable blob used for embeddings / lexical fallback */
  semanticText: string;
  /** Optional precomputed embedding (filled at index time) */
  embedding?: number[];
  /** Slide skeletons — layouts preserved during AI customize */
  slides: Omit<Slide, "id">[];
}

export interface TemplateMatch {
  template: TemplateRecord;
  score: number;
  reasons: string[];
}

export interface PresentationIntent {
  raw: string;
  presentationType?: PresentationType;
  industry: string[];
  audience: string[];
  visualStyle: VisualStyle[];
  tone: Tone[];
  keywords: string[];
  slideCount?: number;
  themeHint?: ThemeId;
  subject?: string;
  summary: string;
}

export interface TemplateProvider {
  readonly id: string;
  readonly label: string;
  list(): Promise<TemplateRecord[]>;
  getById(id: string): Promise<TemplateRecord | null>;
}
