import { ensureEditorActionsRegistered } from "@/lib/voice-agent/actions";
import { shouldAutoExecute } from "@/lib/voice-agent/execute";
import { interpretVoiceCommand } from "@/lib/voice-agent/interpret";
import { isLiveEditCommand } from "@/lib/ai/edit-engine";
import { uid } from "@/lib/utils";
import type {
  EditorSelectionState,
  VoiceAgentContext,
  VoiceAgentResult,
  VoiceDebugLogEntry,
} from "@/lib/voice-agent/types";
import type { Presentation } from "@/lib/types";

export function isVoiceAgentCommand(
  text: string,
  selection: EditorSelectionState
): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  // Don't steal full deck creation
  if (
    /^(make|create|build|generate)\s+(me\s+)?(a|an)\s+.+\b(pitch|deck|presentation)\b/.test(
      t
    ) &&
    t.length < 90
  ) {
    return false;
  }
  if (
    selection.objectId &&
    /^(make it|move it|delete it|enlarge|shrink|minimize|minimise|adjust)/.test(
      t
    )
  ) {
    return true;
  }
  return (
    isLiveEditCommand(text) ||
    /\b(textbox|text box|font|icon|object|duplicate slide|delete slide|add a slide|minimize|minimise|adjust (the )?text)\b/.test(
      t
    )
  );
}

/**
 * Full voice pipeline: transcript → JSON commands → execute registered actions.
 * Adding actions never requires changing this function — only registerEditorAction.
 */
export async function runVoiceAgent(
  transcript: string,
  presentation: Presentation,
  selectedSlideId: string | null,
  selection: EditorSelectionState,
  opts?: { preferLocal?: boolean }
): Promise<VoiceAgentResult | null> {
  ensureEditorActionsRegistered();

  if (!presentation.slides.length) return null;
  if (!isVoiceAgentCommand(transcript, selection)) return null;

  const ctx: VoiceAgentContext = {
    presentation,
    selectedSlideId,
    selection,
  };

  let source: VoiceDebugLogEntry["source"] = "local";
  let envelope;
  let rawModelText: string | undefined;

  try {
    const interpreted = await interpretVoiceCommand(transcript, ctx, opts);
    envelope = interpreted.envelope;
    source = interpreted.source;
    rawModelText = interpreted.rawModelText;
  } catch (err) {
    const log = makeLog({
      transcript,
      intent: "error",
      confidence: 0,
      clarification: null,
      envelopeJson: "{}",
      source: "error",
      executed: [],
      reply:
        err instanceof Error
          ? `Couldn’t parse command JSON: ${err.message}`
          : "Couldn’t parse command JSON.",
    });
    return {
      kind: "noop",
      presentation,
      selectedSlideId,
      selection,
      reply: log.reply,
      envelope: {
        confidence: 0,
        clarification: log.reply,
        intent: "error",
        commands: [],
      },
      log,
      changedSlideIds: [],
    };
  }

  const envelopeJson = JSON.stringify(
    { ...envelope, _rawModelText: rawModelText },
    null,
    2
  );

  if (!shouldAutoExecute(envelope)) {
    const reply =
      envelope.clarification ||
      `I’m not sure what you meant (confidence ${Math.round(
        envelope.confidence * 100
      )}%). Try a clearer command like “Create a textbox on slide two.”`;
    const log = makeLog({
      transcript,
      intent: envelope.intent,
      confidence: envelope.confidence,
      clarification: envelope.clarification,
      envelopeJson,
      source,
      executed: [],
      reply,
    });
    return {
      kind: "clarify",
      presentation,
      selectedSlideId,
      selection,
      reply,
      envelope,
      log,
      changedSlideIds: [],
    };
  }

  const { dispatchEditorCommands } = await import("@/lib/editor/dispatch");
  const { useEditorDebugStore } = await import("@/lib/editor/debug-store");
  const { useEditorFocusStore } = await import("@/lib/editor/focus");

  const batch = dispatchEditorCommands({
    presentation: ctx.presentation,
    selectedSlideId: ctx.selectedSlideId,
    selection: ctx.selection,
    commands: envelope.commands,
    source: "voice",
    voiceTranscript: transcript,
  });
  for (const entry of batch.debugEntries) {
    useEditorDebugStore.getState().push(entry);
  }
  if (batch.focusObjectId) {
    useEditorFocusStore.getState().requestFocus(batch.focusObjectId);
  }

  const okCount = batch.executed.filter((e) => e.ok).length;
  const fail = batch.executed.filter((e) => !e.ok);
  const reply = [
    okCount
      ? `Executed ${okCount} command${okCount === 1 ? "" : "s"}: ${batch.executed
          .filter((e) => e.ok)
          .map((e) => e.detail)
          .join("; ")}.`
      : "No commands executed.",
    fail.length
      ? `Failed: ${fail.map((e) => `${e.action} (${e.detail})`).join("; ")}.`
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  const log = makeLog({
    transcript,
    intent: envelope.intent,
    confidence: envelope.confidence,
    clarification: envelope.clarification,
    envelopeJson,
    source,
    executed: batch.executed,
    reply,
  });

  return {
    kind: okCount ? "executed" : "noop",
    presentation: batch.presentation,
    selectedSlideId: batch.selectedSlideId,
    selection: batch.selection,
    reply,
    themePersonality: batch.themePersonality,
    envelope,
    log,
    changedSlideIds: batch.changedSlideIds,
  };
}

function makeLog(
  partial: Omit<VoiceDebugLogEntry, "id" | "at">
): VoiceDebugLogEntry {
  return {
    id: uid("vlog"),
    at: new Date().toISOString(),
    ...partial,
  };
}
