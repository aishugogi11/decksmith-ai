import { ensureEditorActionsRegistered } from "@/lib/voice-agent/actions";
import { getEditorAction, knownActionNames } from "@/lib/voice-agent/registry";
import type {
  VoiceAgentContext,
  VoiceCommand,
  VoiceCommandEnvelope,
} from "@/lib/voice-agent/types";
import type { Presentation } from "@/lib/types";
import type { EditorSelectionState } from "@/lib/voice-agent/types";

const HIGH_CONFIDENCE = 0.7;

export function shouldAutoExecute(envelope: VoiceCommandEnvelope): boolean {
  return (
    envelope.confidence >= HIGH_CONFIDENCE &&
    !envelope.clarification &&
    envelope.commands.length > 0
  );
}

export function validateEnvelope(
  envelope: VoiceCommandEnvelope
): { ok: true; envelope: VoiceCommandEnvelope } | { ok: false; error: string } {
  if (
    typeof envelope.confidence !== "number" ||
    !Array.isArray(envelope.commands) ||
    typeof envelope.intent !== "string"
  ) {
    return { ok: false, error: "Invalid envelope shape" };
  }
  const known = new Set(knownActionNames());
  for (const cmd of envelope.commands) {
    if (!cmd || typeof cmd.action !== "string") {
      return { ok: false, error: "Command missing action" };
    }
    if (!known.has(cmd.action)) {
      return { ok: false, error: `Unknown action: ${cmd.action}` };
    }
    if (!cmd.params || typeof cmd.params !== "object") {
      cmd.params = {};
    }
  }
  return { ok: true, envelope };
}

export function parseEnvelopeJson(raw: string): VoiceCommandEnvelope {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const parsed = JSON.parse(cleaned) as VoiceCommandEnvelope;
  const validated = validateEnvelope({
    confidence: Number(parsed.confidence) || 0,
    clarification: parsed.clarification ?? null,
    intent: parsed.intent || "unknown",
    commands: Array.isArray(parsed.commands) ? parsed.commands : [],
  });
  if (!validated.ok) throw new Error(validated.error);
  return validated.envelope;
}

export type ExecuteBatchResult = {
  presentation: Presentation;
  selectedSlideId: string | null;
  selection: EditorSelectionState;
  themePersonality?: string;
  changedSlideIds: string[];
  executed: { action: string; ok: boolean; detail: string }[];
};

/** Run registered actions in order — deterministic editor functions only. */
export function executeVoiceCommands(
  commands: VoiceCommand[],
  ctx: VoiceAgentContext
): ExecuteBatchResult {
  ensureEditorActionsRegistered();

  let presentation = ctx.presentation;
  let selectedSlideId = ctx.selectedSlideId;
  let selection = ctx.selection;
  let themePersonality: string | undefined;
  const changed = new Set<string>();
  const executed: ExecuteBatchResult["executed"] = [];

  for (const cmd of commands) {
    const def = getEditorAction(cmd.action);
    if (!def) {
      executed.push({
        action: cmd.action,
        ok: false,
        detail: "Action not registered",
      });
      continue;
    }
    try {
      const beforeIds = new Set(presentation.slides.map((s) => s.id));
      const result = def.execute(cmd.params ?? {}, {
        presentation,
        selectedSlideId,
        selection,
      });
      presentation = result.presentation;
      selectedSlideId = result.selectedSlideId;
      selection = result.selection;
      if (result.themePersonality) themePersonality = result.themePersonality;

      for (const s of presentation.slides) {
        if (!beforeIds.has(s.id)) changed.add(s.id);
      }
      if (selection.slideId) changed.add(selection.slideId);

      executed.push({
        action: cmd.action,
        ok: true,
        detail: result.detail,
      });
    } catch (err) {
      executed.push({
        action: cmd.action,
        ok: false,
        detail: err instanceof Error ? err.message : "Execution failed",
      });
    }
  }

  return {
    presentation,
    selectedSlideId,
    selection,
    themePersonality,
    changedSlideIds: [...changed],
    executed,
  };
}
