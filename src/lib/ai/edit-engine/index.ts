import type { Presentation, ThemeId } from "@/lib/types";
import { applyEditPatch, mergePatches } from "@/lib/ai/edit-engine/apply-patch";
import { EDIT_COMMANDS } from "@/lib/ai/edit-engine/commands";
import {
  appendContextTurn,
  resolveTarget,
} from "@/lib/ai/edit-engine/resolve";
import {
  emptyEditContext,
  type EditConversationContext,
  type EditEngineResult,
  type EditPatch,
} from "@/lib/ai/edit-engine/types";

export type {
  EditConversationContext,
  EditEngineResult,
  EditHistoryEntry,
  EditPatch,
  EditReferent,
} from "@/lib/ai/edit-engine/types";
export { emptyEditContext } from "@/lib/ai/edit-engine/types";
export { registerEditCommand, EDIT_COMMANDS } from "@/lib/ai/edit-engine/commands";
export { applyEditPatch } from "@/lib/ai/edit-engine/apply-patch";

const CREATE_DECK =
  /^(make|create|build|generate)\s+(me\s+)?(a|an)\s+.+\b(pitch|deck|presentation)\b/;

/** True when the user is editing the open deck by voice/text, not starting a new one. */
export function isLiveEditCommand(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  if (CREATE_DECK.test(t) && t.length < 90) return false;

  // Follow-ups that rely on conversation context (“actually put it on slide 8”)
  if (
    /^(actually|also|now|then|ok|okay|instead)\b/.test(t) &&
    /\b(slide|put|move|make|larger|bigger|it|that|this)\b/.test(t)
  ) {
    return true;
  }

  return (
    /\b(this slide|the slide|make this|move the|turn this|use .+ style|more minimal|less text|add a |change (the )?theme|dark mode|timeline|apple|graph|chart|rewrite|spacing|image|company colors|brand colors|speaker notes|transition|align|cite|citation|instagram|insta\b|ig post|carousel|square)\b/.test(
      t
    ) ||
    /^(make|move|use|turn|shorten|simplify|restyle|replace|put|increase|rewrite|enlarge|generate citation|redesign)\b/.test(
      t
    )
  );
}

export function personalityForTheme(themeId: ThemeId): string | undefined {
  const map: Partial<Record<ThemeId, string>> = {
    apple: "minimal",
    minimal: "minimal",
    dark: "bold",
    startup: "playful",
    instagram: "playful",
    corporate: "professional",
    education: "friendly",
  };
  return map[themeId];
}

/**
 * Universal Edit Engine — modular NL commands with conversational referents.
 * Applies partial patches only (no full deck regeneration).
 */
export function runEditEngine(
  rawText: string,
  presentation: Presentation,
  selectedSlideId: string | null,
  context: EditConversationContext = emptyEditContext()
): EditEngineResult | null {
  if (!presentation.slides.length) return null;
  if (!isLiveEditCommand(rawText) && !context.lastReferent) return null;

  // Allow pronoun follow-ups even if isLiveEditCommand is strict
  const allowFollowUp =
    Boolean(context.lastReferent) &&
    /\b(it|that|this|actually|larger|bigger|slide\s+\d+)\b/i.test(rawText);

  if (!isLiveEditCommand(rawText) && !allowFollowUp) return null;

  const target = resolveTarget(
    presentation,
    selectedSlideId,
    context,
    rawText
  );
  if (!target) return null;

  const matched = EDIT_COMMANDS.map((cmd) => ({
    cmd,
    score: cmd.match(target.text, target),
  }))
    .filter((m) => m.score >= 0.8)
    .sort((a, b) => b.score - a.score);

  if (!matched.length) {
    if (!allowFollowUp) return null;
    // Soft follow-up: enlarge last referent
    if (context.lastReferent?.kind === "chart" && /larger|bigger|enlarge/i.test(rawText)) {
      const enlarge = EDIT_COMMANDS.find((c) => c.id === "chart.enlarge");
      if (enlarge) {
        matched.push({ cmd: enlarge, score: 0.99 });
      }
    } else {
      return null;
    }
  }

  // Run top-scoring commands that don't conflict (max 3)
  const patches: EditPatch[] = [];
  const replies: string[] = [];
  const commandIds: string[] = [];
  let themePersonality: string | undefined;
  let referent = context.lastReferent;
  let selectId = selectedSlideId ?? target.slideId;

  for (const { cmd } of matched.slice(0, 3)) {
    const result = cmd.apply(target.text, presentation, target);
    if (!result) continue;
    patches.push(result.patch);
    replies.push(result.reply);
    commandIds.push(cmd.id);
    if (result.themePersonality) themePersonality = result.themePersonality;
    if (result.referent) referent = result.referent;
    if (result.referent?.slideId) selectId = result.referent.slideId;
  }

  if (!patches.length) return null;

  const merged = mergePatches(...patches);
  const { presentation: next, changedSlideIds } = applyEditPatch(
    presentation,
    merged
  );

  const reply = replies.join(" ");
  const nextContext = appendContextTurn(context, rawText.trim(), reply, {
    referent,
    action: commandIds[0] ?? null,
    slideId: selectId,
    changedSlideIds,
  });

  return {
    applied: true,
    reply,
    presentation: next,
    selectedSlideId: selectId,
    context: nextContext,
    themePersonality,
    changedSlideIds,
    commandIds,
  };
}
