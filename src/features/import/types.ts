import type {
  Presentation,
  PresentationImportMeta,
  ThemeId,
} from "@/lib/types";
import type { VoiceCommand } from "@/lib/voice-agent/types";

export type ImportFormat =
  | "pptx"
  | "pdf"
  | "decksmith-json"
  | "google-slides"
  | "canva"
  | "keynote"
  | "unsupported";

export type ImportProviderId =
  | "pptx"
  | "pdf"
  | "decksmith"
  | "google-slides"
  | "canva"
  | "keynote";

export type ImportStatus =
  | "idle"
  | "reading"
  | "parsing"
  | "analyzing"
  | "ready"
  | "error";

export type ImportResult = {
  presentation: Presentation;
  meta: PresentationImportMeta;
  providerId: ImportProviderId;
};

export type ImportIssue = {
  id: string;
  label: string;
  severity: "info" | "warn" | "critical";
  slideIndex?: number;
};

export type ImportQuickActionId =
  | "improve_layout"
  | "reduce_text"
  | "modernize"
  | "style_apple"
  | "style_startup"
  | "style_corporate"
  | "style_academic"
  | "add_speaker_notes"
  | "improve_accessibility"
  | "generate_citations"
  | "improve_hierarchy"
  | "shorten_10"
  | "expand_20";

export type ImportQuickAction = {
  id: ImportQuickActionId;
  label: string;
  description: string;
  commands: VoiceCommand[];
};

export type ImportAnalysis = {
  slideCount: number;
  wordCount: number;
  estimatedMinutes: number;
  issues: ImportIssue[];
  counts: PresentationImportMeta["counts"];
  themeId: ThemeId;
  quickActions: ImportQuickAction[];
  summary: string;
};

export type ImportPipelineState = {
  status: ImportStatus;
  fileName: string | null;
  format: ImportFormat | null;
  result: ImportResult | null;
  analysis: ImportAnalysis | null;
  error: string | null;
  progressMessage: string;
  modalOpen: boolean;
};
