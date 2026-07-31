/**
 * Back-compat shim — live voice/text edits now run through the universal Edit Engine.
 */
import {
  isLiveEditCommand,
  personalityForTheme,
  runEditEngine,
  emptyEditContext,
  type EditEngineResult,
} from "@/lib/ai/edit-engine";
import type { Presentation } from "@/lib/types";

export type EditResult = {
  presentation: Presentation;
  selectedSlideId: string | null;
  reply: string;
  themePersonality?: string;
  context?: EditEngineResult["context"];
  changedSlideIds?: string[];
  commandIds?: string[];
};

export { isLiveEditCommand, personalityForTheme };

/** @deprecated Prefer runEditEngine with conversation context */
export function applyLiveEdit(
  text: string,
  presentation: Presentation,
  selectedSlideId: string | null
): EditResult | null {
  const result = runEditEngine(
    text,
    presentation,
    selectedSlideId,
    emptyEditContext()
  );
  if (!result) return null;
  return {
    presentation: result.presentation,
    selectedSlideId: result.selectedSlideId,
    reply: result.reply,
    themePersonality: result.themePersonality,
    context: result.context,
    changedSlideIds: result.changedSlideIds,
    commandIds: result.commandIds,
  };
}
