import type { EditorObject, Presentation, Slide } from "@/lib/types";
import { uid } from "@/lib/utils";
import type { EditorSelectionState, VoiceAgentContext } from "@/lib/voice-agent/types";

export function clonePresentation(p: Presentation): Presentation {
  return structuredClone(p);
}

export function resolveSlideIndex(
  params: Record<string, unknown>,
  ctx: VoiceAgentContext
): number {
  const slides = ctx.presentation.slides;
  if (typeof params.slide === "number") {
    const i = Math.floor(params.slide) - 1;
    if (i >= 0 && i < slides.length) return i;
  }
  if (typeof params.slideIndex === "number") {
    const i = Math.floor(params.slideIndex);
    if (i >= 0 && i < slides.length) return i;
  }
  if (params.slide === "last" || params.target === "last") {
    return Math.max(0, slides.length - 1);
  }
  // Prefer the slide the user is viewing. Only trust selection.slideId when
  // it matches selectedSlideId (avoids stale object selection after navigate).
  if (ctx.selectedSlideId) {
    const i = slides.findIndex((s) => s.id === ctx.selectedSlideId);
    if (i >= 0) {
      if (
        !ctx.selection.slideId ||
        ctx.selection.slideId === ctx.selectedSlideId
      ) {
        return i;
      }
      // Disagreement: visible slide wins
      return i;
    }
  }
  if (ctx.selection.slideId) {
    const i = slides.findIndex((s) => s.id === ctx.selection.slideId);
    if (i >= 0) return i;
  }
  return 0;
}

export function resolveObjectId(
  params: Record<string, unknown>,
  ctx: VoiceAgentContext,
  slide: Slide
): string | null {
  if (typeof params.objectId === "string") return params.objectId;

  const wantType =
    typeof params.type === "string" ? String(params.type) : null;

  if (ctx.selection.objectId) {
    const selected = slide.objects?.find((o) => o.id === ctx.selection.objectId);
    if (selected && (!wantType || selected.type === wantType)) {
      return selected.id;
    }
  }

  if (wantType) {
    const match = [...(slide.objects ?? [])]
      .reverse()
      .find((o) => o.type === wantType);
    if (match) return match.id;
  }

  // Fall back to selection even if type mismatched (generic “it”)
  if (ctx.selection.objectId) {
    const exists = slide.objects?.some((o) => o.id === ctx.selection.objectId);
    if (exists) return ctx.selection.objectId;
  }

  const last = slide.objects?.[slide.objects.length - 1];
  return last?.id ?? null;
}

export function updateSlide(
  presentation: Presentation,
  slideIndex: number,
  updater: (slide: Slide) => Slide
): Presentation {
  const slides = presentation.slides.map((s, i) =>
    i === slideIndex ? updater(s) : s
  );
  return {
    ...presentation,
    slides,
    updatedAt: new Date().toISOString(),
  };
}

export function patchObject(
  slide: Slide,
  objectId: string,
  patch: Partial<EditorObject>
): Slide {
  return {
    ...slide,
    objects: (slide.objects ?? []).map((o) =>
      o.id === objectId ? { ...o, ...patch } : o
    ),
  };
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function num(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

export function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

export function makeObject(
  type: EditorObject["type"],
  partial: Partial<EditorObject> = {}
): EditorObject {
  return {
    id: uid("obj"),
    x: 20,
    y: 30,
    w: 40,
    h: 20,
    ...partial,
    type,
  };
}

export function selectionFor(
  slideId: string,
  obj: EditorObject | null,
  action: string
): EditorSelectionState {
  return {
    slideId,
    objectId: obj?.id ?? null,
    objectType: obj?.type ?? null,
    lastAction: action,
  };
}

/** Named anchors → percent positions */
export function anchorToXY(
  anchor: string
): { x: number; y: number } | null {
  const a = anchor.toLowerCase().replace(/[_-]/g, " ").trim();
  const map: Record<string, { x: number; y: number }> = {
    "top left": { x: 6, y: 8 },
    "top right": { x: 58, y: 8 },
    "top center": { x: 30, y: 8 },
    "bottom left": { x: 6, y: 68 },
    "bottom right": { x: 58, y: 68 },
    "bottom center": { x: 30, y: 68 },
    center: { x: 30, y: 35 },
    left: { x: 6, y: 35 },
    right: { x: 58, y: 35 },
  };
  return map[a] ?? null;
}
