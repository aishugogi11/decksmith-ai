import type { EditorObject, Presentation, ThemeId } from "@/lib/types";

/** Last-selected target so follow-ups like “make it bigger” resolve deterministically. */
export type EditorSelectionState = {
  slideId: string | null;
  objectId: string | null;
  objectType: EditorObject["type"] | null;
  lastAction: string | null;
};

export function emptyEditorSelection(): EditorSelectionState {
  return {
    slideId: null,
    objectId: null,
    objectType: null,
    lastAction: null,
  };
}

export type VoiceCommand = {
  action: string;
  params: Record<string, unknown>;
};

/** Strict JSON envelope the LLM (or local parser) must return. */
export type VoiceCommandEnvelope = {
  confidence: number;
  clarification: string | null;
  intent: string;
  commands: VoiceCommand[];
};

export type VoiceDebugLogEntry = {
  id: string;
  at: string;
  transcript: string;
  intent: string;
  confidence: number;
  clarification: string | null;
  envelopeJson: string;
  source: "llm" | "local" | "error";
  executed: {
    action: string;
    ok: boolean;
    detail: string;
  }[];
  reply: string;
};

export type VoiceAgentContext = {
  presentation: Presentation;
  selectedSlideId: string | null;
  selection: EditorSelectionState;
};

export type VoiceAgentResult = {
  kind: "executed" | "clarify" | "noop";
  presentation: Presentation;
  selectedSlideId: string | null;
  selection: EditorSelectionState;
  reply: string;
  themePersonality?: string;
  envelope: VoiceCommandEnvelope;
  log: VoiceDebugLogEntry;
  changedSlideIds: string[];
};

export type ActionParamSchema = {
  name: string;
  type: "string" | "number" | "boolean" | "enum";
  required?: boolean;
  description: string;
  enumValues?: string[];
};

export type EditorActionDefinition = {
  name: string;
  description: string;
  params: ActionParamSchema[];
  examples: string[];
  execute: (
    params: Record<string, unknown>,
    ctx: VoiceAgentContext
  ) => {
    presentation: Presentation;
    selectedSlideId: string | null;
    selection: EditorSelectionState;
    detail: string;
    themePersonality?: string;
    themeId?: ThemeId;
  };
};
