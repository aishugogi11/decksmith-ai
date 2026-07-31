export type ThemeId =
  | "apple"
  | "microsoft"
  | "google"
  | "minimal"
  | "startup"
  | "corporate"
  | "education"
  | "luxury"
  | "dark"
  | "gradient";

export type SlideLayout =
  | "hero"
  | "section"
  | "bullets"
  | "stats"
  | "quote"
  | "timeline"
  | "comparison"
  | "process"
  | "image"
  | "chart"
  | "thankyou"
  /** Freeform / imported PDF page — objects only, no template chrome */
  | "blank";

export interface SlideStat {
  value: string;
  label: string;
}

export interface TimelineItem {
  title: string;
  description: string;
}

export interface ComparisonColumn {
  title: string;
  items: string[];
}

export interface ProcessStep {
  title: string;
  description: string;
}

/** Freeform objects for command-based voice/canvas editing (percent coords 0–100). */
export type EditorObjectType =
  | "textbox"
  | "image"
  | "icon"
  | "shape"
  | "chart";

export interface EditorObject {
  id: string;
  type: EditorObjectType;
  x: number;
  y: number;
  w: number;
  h: number;
  text?: string;
  fontSize?: number;
  /** Data URL or remote URL for imported images */
  src?: string;
  imageHint?: string;
  iconName?: string;
  iconStyle?: "filled" | "outlined";
  shape?: "rect" | "ellipse" | "line";
  fill?: string;
  chartHint?: string;
  zIndex?: number;
}

/** Optional metadata attached after universal import */
export interface PresentationImportMeta {
  sourceFormat: "pptx" | "pdf" | "decksmith-json" | "unknown";
  sourceFileName?: string;
  importedAt: string;
  counts: {
    slides: number;
    textboxes: number;
    images: number;
    charts: number;
    shapes: number;
    notes: number;
  };
  warnings: string[];
}

export interface Slide {
  id: string;
  layout: SlideLayout;
  title: string;
  subtitle?: string;
  body?: string;
  bullets?: string[];
  stats?: SlideStat[];
  quote?: string;
  quoteAuthor?: string;
  timeline?: TimelineItem[];
  comparison?: ComparisonColumn[];
  process?: ProcessStep[];
  imageHint?: string;
  chartHint?: string;
  callout?: string;
  notes?: string;
  /** Optional overlay objects manipulated by the voice command agent */
  objects?: EditorObject[];
}

export interface Presentation {
  id: string;
  title: string;
  subtitle?: string;
  themeId: ThemeId;
  slides: Slide[];
  updatedAt: string;
  createdAt: string;
  importMeta?: PresentationImportMeta;
}

export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  streaming?: boolean;
}

export interface RecentDeck {
  id: string;
  title: string;
  updatedAt: string;
}
