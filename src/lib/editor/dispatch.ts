import { toVoiceCommands } from "@/lib/editor/map-command";
import { multiIds, normalizeEditorSelection } from "@/lib/editor/selection";
import type {
  EditorCommand,
  EditorCommandSource,
  EditorDebugEntry,
  EditorDispatchResult,
} from "@/lib/editor/types";
import { uid } from "@/lib/utils";
import { ensureEditorActionsRegistered } from "@/lib/voice-agent/actions";
import { executeVoiceCommands } from "@/lib/voice-agent/execute";
import type {
  EditorSelectionState,
  VoiceAgentContext,
  VoiceCommand,
} from "@/lib/voice-agent/types";
import type { Presentation } from "@/lib/types";

export type DispatchInput = {
  presentation: Presentation;
  selectedSlideId: string | null;
  selection: EditorSelectionState;
  commands: EditorCommand[] | VoiceCommand[];
  source?: EditorCommandSource;
  voiceTranscript?: string;
};

function isEditorCommand(
  c: EditorCommand | VoiceCommand
): c is EditorCommand {
  return "type" in c && typeof (c as EditorCommand).type === "string";
}

/**
 * Pure command execution — no Zustand. Callers commit the result.
 * All UI / voice / AI paths should go through here.
 */
export function dispatchEditorCommands(
  input: DispatchInput
): EditorDispatchResult & { debugEntries: EditorDebugEntry[] } {
  const started = performance.now();
  ensureEditorActionsRegistered();

  const normalized = normalizeEditorSelection(
    input.presentation,
    input.selectedSlideId,
    input.selection
  );

  const source = input.source ?? "system";
  const voiceCommands: VoiceCommand[] = input.commands.map((c) =>
    isEditorCommand(c)
      ? toVoiceCommands([c])[0]!
      : { action: c.action, params: c.params ?? {} }
  );

  const ctx: VoiceAgentContext = {
    presentation: input.presentation,
    selectedSlideId: normalized.selectedSlideId,
    selection: normalized.selection,
  };

  const batch = executeVoiceCommands(voiceCommands, ctx);
  const durationMs = Math.round(performance.now() - started);

  const debugEntries: EditorDebugEntry[] = batch.executed.map((ex, i) => {
    const cmd = voiceCommands[i];
    const semantic =
      (isEditorCommand(input.commands[i]!) &&
        (input.commands[i] as EditorCommand).type) ||
      cmd?.action ||
      "unknown";
    return {
      id: uid("edbg"),
      at: new Date().toISOString(),
      source,
      commandType: String(semantic),
      action: ex.action,
      params: cmd?.params ?? {},
      ok: ex.ok,
      detail: ex.detail,
      durationMs,
      slideId: batch.selection.slideId ?? batch.selectedSlideId,
      selectedObjectIds: multiIds(batch.selection),
      voiceTranscript: input.voiceTranscript,
      error: ex.ok ? undefined : ex.detail,
    };
  });

  const focusObjectId =
    batch.selection.objectId &&
    batch.executed.some((e) => e.ok && /create_|set_text|select_/.test(e.action))
      ? batch.selection.objectId
      : batch.selection.objectId;

  return {
    ok: batch.executed.some((e) => e.ok),
    presentation: batch.presentation,
    selectedSlideId: batch.selectedSlideId,
    selection: batch.selection,
    executed: batch.executed,
    durationMs,
    focusObjectId,
    commands: voiceCommands,
    themePersonality: batch.themePersonality,
    changedSlideIds: batch.changedSlideIds,
    debugEntries,
  };
}

/** Convenience: single command */
export function dispatchEditorCommand(
  input: Omit<DispatchInput, "commands"> & {
    command: EditorCommand | VoiceCommand;
  }
): EditorDispatchResult & { debugEntries: EditorDebugEntry[] } {
  return dispatchEditorCommands({
    ...input,
    commands: [input.command] as EditorCommand[] | VoiceCommand[],
  });
}
