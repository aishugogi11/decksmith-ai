import type { Presentation, Slide } from "@/lib/types";
import type { EditorCommand } from "@/lib/editor/types";
import type { VisualCandidate, VisualPlacement, VisualRecommendation } from "./types";

function rightSideClear(slide: Slide): boolean {
  const objects = slide.objects ?? [];
  const rightOccupied = objects.some(
    (o) => o.x + o.w * 0.5 > 55 && o.type !== "image"
  );
  return !rightOccupied;
}

function leftSideClear(slide: Slide): boolean {
  const objects = slide.objects ?? [];
  const leftOccupied = objects.some(
    (o) => o.x < 45 && (o.type === "textbox" || o.type === "image")
  );
  // Prefer right when left has title/body text density
  const textHeavy =
    (slide.bullets?.length ?? 0) >= 2 || Boolean(slide.body?.length);
  return !leftOccupied && !textHeavy;
}

/** Choose placement from current slide layout density. */
export function inferPlacement(slide: Slide | null): VisualPlacement {
  if (!slide) {
    return { anchor: "top right", x: 55, y: 18, w: 38, h: 55 };
  }

  if (slide.layout === "hero") {
    return { anchor: "center", x: 28, y: 32, w: 44, h: 48 };
  }

  if (rightSideClear(slide)) {
    return { anchor: "top right", x: 55, y: 16, w: 38, h: 58 };
  }

  if (leftSideClear(slide)) {
    return { anchor: "top left", x: 6, y: 16, w: 38, h: 58 };
  }

  // Crowded — smaller inset bottom-right
  return { anchor: "bottom right", x: 58, y: 52, w: 34, h: 38 };
}

export function placeImageCommands(
  candidate: VisualCandidate,
  opts: {
    slideNumber: number;
    slide: Slide | null;
    replaceObjectId?: string | null;
  }
): EditorCommand[] {
  const place = inferPlacement(opts.slide);
  const hint = candidate.alt;

  if (opts.replaceObjectId) {
    return [
      {
        type: "SET_SLIDE_FIELD",
        params: {
          slide: opts.slideNumber,
          field: "imageHint",
          value: hint,
        },
        source: "ai",
        meta: { label: "visual-assistant" },
      },
      // No dedicated set_src action — delete + recreate with src
      {
        type: "DELETE_OBJECT",
        params: {
          slide: opts.slideNumber,
          objectId: opts.replaceObjectId,
        },
        source: "ai",
        meta: { label: "visual-assistant-replace" },
      },
      {
        type: "CREATE_IMAGE",
        params: {
          slide: opts.slideNumber,
          imageHint: hint,
          src: candidate.src,
          x: place.x,
          y: place.y,
          w: place.w,
          h: place.h,
          anchor: place.anchor,
        },
        source: "ai",
        meta: { label: "visual-assistant" },
      },
    ];
  }

  return [
    {
      type: "CREATE_IMAGE",
      params: {
        slide: opts.slideNumber,
        imageHint: hint,
        src: candidate.src,
        x: place.x,
        y: place.y,
        w: place.w,
        h: place.h,
        anchor: place.anchor,
      },
      source: "ai",
      meta: { label: "visual-assistant" },
    },
  ];
}

export function placeRecommendationCommands(
  rec: VisualRecommendation,
  slideNumber: number
): EditorCommand[] {
  if (rec.kind === "chart" || rec.kind === "diagram") {
    return [
      {
        type: "CREATE_CHART",
        params: {
          slide: slideNumber,
          chartHint: rec.hint,
          anchor: "top right",
        },
        source: "ai",
        meta: { label: "visual-assistant" },
      },
    ];
  }
  if (rec.kind === "icon") {
    return [
      {
        type: "CREATE_ICON",
        params: {
          slide: slideNumber,
          iconName: "sparkles",
          iconStyle: "outlined",
          anchor: "top right",
        },
        source: "ai",
        meta: { label: "visual-assistant" },
      },
    ];
  }
  if (rec.kind === "timeline") {
    return [
      {
        type: "CREATE_CHART",
        params: {
          slide: slideNumber,
          chartHint: `Timeline · ${rec.hint}`,
          anchor: "center",
        },
        source: "ai",
        meta: { label: "visual-assistant-timeline" },
      },
      {
        type: "SET_SLIDE_FIELD",
        params: {
          slide: slideNumber,
          field: "notes",
          value: `Visual Assistant: timeline recommended — ${rec.hint}`,
        },
        source: "ai",
        meta: { label: "visual-assistant" },
      },
    ];
  }
  // illustration → caller should re-run search with illustration preference
  return [];
}

export function slideNumberFor(
  presentation: Presentation,
  selectedSlideId: string | null
): number {
  const idx = selectedSlideId
    ? presentation.slides.findIndex((s) => s.id === selectedSlideId)
    : 0;
  return Math.max(1, (idx >= 0 ? idx : 0) + 1);
}

export function currentSlide(
  presentation: Presentation,
  selectedSlideId: string | null
): Slide | null {
  if (!selectedSlideId) return presentation.slides[0] ?? null;
  return presentation.slides.find((s) => s.id === selectedSlideId) ?? null;
}
