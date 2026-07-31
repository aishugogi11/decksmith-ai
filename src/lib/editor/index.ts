export { dispatchEditorCommand, dispatchEditorCommands } from "@/lib/editor/dispatch";
export { toVoiceCommand, toVoiceCommands } from "@/lib/editor/map-command";
export {
  normalizeEditorSelection,
  selectionForSlideChange,
  multiIds,
} from "@/lib/editor/selection";
export { useEditorDebugStore } from "@/lib/editor/debug-store";
export { useEditorFocusStore } from "@/lib/editor/focus";
export type {
  EditorCommand,
  EditorCommandName,
  EditorCommandSource,
  EditorDebugEntry,
  EditorDispatchResult,
  EditorHistorySnapshot,
} from "@/lib/editor/types";
