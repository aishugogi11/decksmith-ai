import type { Presentation, Slide, ThemeId } from "@/lib/types";

/** What the user was last talking about — for “it”, “that chart”, follow-ups. */
export type EditReferentKind =
  | "chart"
  | "image"
  | "slide"
  | "text"
  | "table"
  | "theme"
  | "notes"
  | "spacing"
  | "animation";

export type EditReferent = {
  kind: EditReferentKind;
  slideId: string | null;
  label?: string;
};

export type EditConversationContext = {
  lastReferent: EditReferent | null;
  lastAction: string | null;
  lastSlideId: string | null;
  lastChangedSlideIds: string[];
  turns: { role: "user" | "assistant"; text: string; at: string }[];
};

export function emptyEditContext(): EditConversationContext {
  return {
    lastReferent: null,
    lastAction: null,
    lastSlideId: null,
    lastChangedSlideIds: [],
    turns: [],
  };
}

/** Partial deck mutation — never regenerates the whole presentation from scratch. */
export type EditPatch = {
  themeId?: ThemeId;
  format?: Presentation["format"];
  title?: string;
  subtitle?: string;
  slidePatches: { id: string; patch: Partial<Slide> }[];
  /** Full slide replacements when layout transforms need more than a patch */
  replaceSlides?: { id: string; slide: Slide }[];
  insertAfter?: { afterId: string | null; slides: Slide[] }[];
  removeSlideIds?: string[];
  /** New order of slide ids (must include all remaining slides) */
  reorder?: string[];
  /** Replace the entire slide list (Instagram carousel redesign, etc.) */
  slides?: Slide[];
};

export type EditCommandMatch = {
  commandId: string;
  confidence: number;
};

export type EditCommandHandler = {
  id: string;
  description: string;
  /** Return confidence 0–1 if this command should run */
  match: (text: string, resolved: ResolvedEditTarget) => number;
  apply: (
    text: string,
    presentation: Presentation,
    target: ResolvedEditTarget
  ) => {
    patch: EditPatch;
    reply: string;
    referent?: EditReferent;
    themePersonality?: string;
  } | null;
};

export type ResolvedEditTarget = {
  slideId: string;
  slideIndex: number;
  slide: Slide;
  /** Pronoun / “it” resolved against conversation context */
  referent: EditReferent | null;
  text: string;
  rawText: string;
};

export type EditEngineResult = {
  applied: boolean;
  reply: string;
  presentation: Presentation;
  selectedSlideId: string | null;
  context: EditConversationContext;
  themePersonality?: string;
  changedSlideIds: string[];
  commandIds: string[];
};

export type EditHistoryEntry = {
  id: string;
  at: string;
  userText: string;
  reply: string;
  commandIds: string[];
  changedSlideIds: string[];
};
