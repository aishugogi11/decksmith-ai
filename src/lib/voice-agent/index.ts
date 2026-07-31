export { ensureEditorActionsRegistered } from "@/lib/voice-agent/actions";
export {
  registerEditorAction,
  getEditorAction,
  listEditorActions,
  actionsCatalogForPrompt,
} from "@/lib/voice-agent/registry";
export { runVoiceAgent, isVoiceAgentCommand } from "@/lib/voice-agent/pipeline";
export { interpretVoiceCommand } from "@/lib/voice-agent/interpret";
export {
  executeVoiceCommands,
  parseEnvelopeJson,
  shouldAutoExecute,
} from "@/lib/voice-agent/execute";
export {
  emptyEditorSelection,
  type EditorSelectionState,
  type VoiceAgentResult,
  type VoiceCommand,
  type VoiceCommandEnvelope,
  type VoiceDebugLogEntry,
  type EditorActionDefinition,
} from "@/lib/voice-agent/types";
