import type { Presentation } from "@/lib/types";
import type {
  EditConversationContext,
  EditReferent,
  ResolvedEditTarget,
} from "@/lib/ai/edit-engine/types";

/** Expand pronouns / “the chart” using conversation context before matching commands. */
export function resolveEditText(
  rawText: string,
  context: EditConversationContext
): string {
  let text = rawText.trim();
  const lower = text.toLowerCase();
  const ref = context.lastReferent;

  if (!ref) return text;

  const hasPronoun =
    /\b(it|that|this|them|those)\b/.test(lower) ||
    /^(actually |also |now |then )?(put|move|make|resize|enlarge|shrink)/.test(
      lower
    );

  if (!hasPronoun) return text;

  if (ref.kind === "chart" && !/\b(chart|graph)\b/.test(lower)) {
    text = text.replace(/\bit\b/gi, "the chart").replace(/\bthat\b/gi, "the chart");
  } else if (ref.kind === "image" && !/\b(image|photo|picture)\b/.test(lower)) {
    text = text.replace(/\bit\b/gi, "the image").replace(/\bthat\b/gi, "the image");
  } else if (ref.kind === "slide" && !/\bslide\b/.test(lower)) {
    text = text.replace(/\bit\b/gi, "this slide");
  }

  // “Actually put it on slide 8” — keep as-is; slide number parsed in commands
  return text;
}

export function resolveTarget(
  presentation: Presentation,
  selectedSlideId: string | null,
  context: EditConversationContext,
  rawText: string
): ResolvedEditTarget | null {
  const text = resolveEditText(rawText, context).toLowerCase();
  const slideNum = text.match(/\bslide\s+(\d+)\b/);
  let slideIndex = Math.max(
    0,
    presentation.slides.findIndex((s) => s.id === selectedSlideId)
  );

  if (slideNum) {
    const n = Number(slideNum[1]) - 1;
    if (n >= 0 && n < presentation.slides.length) slideIndex = n;
  } else if (
    /\b(last|final)\s+slide\b/.test(text) ||
    /\bto the (last|end)\b/.test(text)
  ) {
    slideIndex = presentation.slides.length - 1;
  } else if (context.lastSlideId && /\b(it|that|this)\b/.test(text)) {
    const prev = presentation.slides.findIndex((s) => s.id === context.lastSlideId);
    if (prev >= 0) slideIndex = prev;
  }

  const slide = presentation.slides[slideIndex];
  if (!slide) return null;

  let referent = context.lastReferent;
  if (/\b(chart|graph)\b/.test(text)) {
    referent = { kind: "chart", slideId: slide.id, label: slide.chartHint || "chart" };
  } else if (/\b(image|photo|picture)\b/.test(text)) {
    referent = { kind: "image", slideId: slide.id, label: slide.imageHint || "image" };
  } else if (/\b(notes|speaker notes)\b/.test(text)) {
    referent = { kind: "notes", slideId: slide.id };
  } else if (/\b(spacing|padding|margin)\b/.test(text)) {
    referent = { kind: "spacing", slideId: slide.id };
  }

  return {
    slideId: slide.id,
    slideIndex,
    slide,
    referent,
    text,
    rawText: rawText.trim(),
  };
}

export function appendContextTurn(
  context: EditConversationContext,
  userText: string,
  reply: string,
  opts: {
    referent?: EditReferent | null;
    action?: string;
    slideId?: string | null;
    changedSlideIds?: string[];
  }
): EditConversationContext {
  const turns = [
    ...context.turns,
    {
      role: "user" as const,
      text: userText,
      at: new Date().toISOString(),
    },
    {
      role: "assistant" as const,
      text: reply,
      at: new Date().toISOString(),
    },
  ].slice(-24);

  return {
    lastReferent: opts.referent ?? context.lastReferent,
    lastAction: opts.action ?? context.lastAction,
    lastSlideId: opts.slideId ?? context.lastSlideId,
    lastChangedSlideIds: opts.changedSlideIds ?? context.lastChangedSlideIds,
    turns,
  };
}
