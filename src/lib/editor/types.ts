import type { Presentation } from "@/lib/types";
import type { EditorSelectionState, VoiceCommand } from "@/lib/voice-agent/types";

/** Canonical editor operations — map 1:1 onto registered voice-agent actions. */
export type EditorCommandName =
  | "CREATE_TEXTBOX"
  | "CREATE_IMAGE"
  | "CREATE_ICON"
  | "CREATE_CHART"
  | "DELETE_OBJECT"
  | "MOVE_OBJECT"
  | "RESIZE_OBJECT"
  | "UPDATE_TEXT"
  | "SET_FONT_SIZE"
  | "ADJUST_TEXTBOX"
  | "CHANGE_THEME"
  | "DUPLICATE_SLIDE"
  | "DELETE_SLIDE"
  | "ADD_SLIDE"
  | "SELECT_OBJECT"
  | "SET_SLIDE_FIELD"
  | "REPLACE_TEXT_WITH_BULLETS"
  | "IMPROVE_LAYOUT"
  | "REWRITE_CONCLUSION"
  | "REPLACE_ICONS_STYLE"
  | "INSERT_IMAGE"
  | string; // allow forward-compat registered actions

export type EditorCommandSource =
  | "ui"
  | "voice"
  | "keyboard"
  | "feedback"
  | "coach"
  | "import"
  | "research"
  | "ai"
  | "system";

export type EditorCommand = {
  /** Uppercase semantic name or lowercase registered action */
  type: EditorCommandName;
  params?: Record<string, unknown>;
  source?: EditorCommandSource;
  /** Optional correlation for voice / AI batches */
  meta?: {
    voiceTranscript?: string;
    label?: string;
  };
};

export type EditorHistorySnapshot = {
  presentation: Presentation;
  selectedSlideId: string | null;
  editorSelection: EditorSelectionState;
};

export type EditorDebugEntry = {
  id: string;
  at: string;
  source: EditorCommandSource;
  commandType: string;
  action: string;
  params: Record<string, unknown>;
  ok: boolean;
  detail: string;
  durationMs: number;
  slideId: string | null;
  selectedObjectIds: string[];
  voiceTranscript?: string;
  error?: string;
};

export type EditorDispatchResult = {
  ok: boolean;
  presentation: Presentation;
  selectedSlideId: string | null;
  selection: EditorSelectionState;
  executed: { action: string; ok: boolean; detail: string }[];
  durationMs: number;
  focusObjectId: string | null;
  /** VoiceCommand(s) that were actually run */
  commands: VoiceCommand[];
  themePersonality?: string;
  changedSlideIds: string[];
};
