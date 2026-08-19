import { coachPresentation, type CoachReport } from "@/lib/ai/coach";
import { emptyPatch, applyEditPatch } from "@/lib/ai/edit-engine/apply-patch";
import type { Presentation, Slide } from "@/lib/types";
import { uid } from "@/lib/utils";

export type DesignSuggestionAction =
  | { type: "edit-command"; command: string }
  | {
      type: "patch";
      slideId?: string;
      slidePatch?: Partial<Slide>;
      themeId?: Presentation["themeId"];
      removeSlideIds?: string[];
    };

export type DesignSuggestion = {
  id: string;
  severity: "info" | "warn" | "critical";
  title: string;
  message: string;
  slideIndex?: number;
  action: DesignSuggestionAction;
};

/**
 * Smart Design Assistant — actionable suggestions with Apply payloads.
 */
export function buildDesignSuggestions(
  presentation: Presentation,
  coach?: CoachReport | null
): DesignSuggestion[] {
  const report = coach ?? coachPresentation(presentation);
  const out: DesignSuggestion[] = [];

  for (const issue of report.issues) {
    const slide = presentation.slides[issue.slideIndex];
    if (!slide) continue;

    if (/crowded|words|too much text/i.test(issue.message)) {
      out.push({
        id: uid("sug"),
        severity: issue.severity,
        title: "Too much text",
        message: issue.message,
        slideIndex: issue.slideIndex,
        action: {
          type: "edit-command",
          command: "Less text on this slide.",
        },
      });
      continue;
    }

    if (/bullets/i.test(issue.message)) {
      out.push({
        id: uid("sug"),
        severity: issue.severity,
        title: "Trim bullets",
        message: issue.message,
        slideIndex: issue.slideIndex,
        action: {
          type: "patch",
          slideId: slide.id,
          slidePatch: { bullets: slide.bullets?.slice(0, 4) },
        },
      });
      continue;
    }

    if (/placeholder metrics/i.test(issue.message)) {
      out.push({
        id: uid("sug"),
        severity: issue.severity,
        title: "Replace placeholder metrics",
        message: issue.message,
        slideIndex: issue.slideIndex,
        action: {
          type: "edit-command",
          command: "Rewrite this professionally.",
        },
      });
      continue;
    }

    out.push({
      id: uid("sug"),
      severity: issue.severity,
      title: "Design note",
      message: issue.message,
      slideIndex: issue.slideIndex,
      action: { type: "edit-command", command: "Make this slide more minimal." },
    });
  }

  // Chart type suggestion
  presentation.slides.forEach((slide, i) => {
    if (
      slide.layout === "chart" &&
      slide.chartHint &&
      !/bar/i.test(slide.chartHint)
    ) {
      out.push({
        id: uid("sug"),
        severity: "info",
        title: "Prefer a bar chart",
        message: `Slide ${i + 1} (“${slide.title}”) may read clearer as a bar chart.`,
        slideIndex: i,
        action: { type: "edit-command", command: "Make this a bar chart." },
      });
    }
  });

  // Spacing inconsistency (heuristic: mix of dense + sparse)
  const wordCounts = presentation.slides.map((s) => countWords(s));
  const avg =
    wordCounts.reduce((a, b) => a + b, 0) / Math.max(1, wordCounts.length);
  const inconsistent = wordCounts.some(
    (w) => w > avg * 1.8 || (w < avg * 0.35 && avg > 40)
  );
  if (inconsistent) {
    out.push({
      id: uid("sug"),
      severity: "warn",
      title: "Spacing is inconsistent",
      message:
        "Some slides are much denser than others. Increase spacing on crowded ones.",
      action: { type: "edit-command", command: "Increase spacing." },
    });
  }

  // Shorten deck
  if (presentation.slides.length >= 10) {
    out.push({
      id: uid("sug"),
      severity: "info",
      title: "Slides may be long",
      message: `This presentation could be shortened by ~3 slides (currently ${presentation.slides.length}).`,
      action: {
        type: "patch",
        removeSlideIds: pickRemovableSlideIds(presentation, 3),
      },
    });
  }

  for (const beat of report.weakBeats.slice(0, 2)) {
    out.push({
      id: uid("sug"),
      severity: "info",
      title: "Story gap",
      message: beat,
      action: { type: "edit-command", command: "Add a chart." },
    });
  }

  // Dedupe by message
  const seen = new Set<string>();
  return out.filter((s) => {
    if (seen.has(s.message)) return false;
    seen.add(s.message);
    return true;
  }).slice(0, 12);
}

export function applyDesignSuggestion(
  presentation: Presentation,
  suggestion: DesignSuggestion,
  selectedSlideId: string | null
): {
  presentation: Presentation;
  selectedSlideId: string | null;
  command?: string;
} | null {
  if (suggestion.action.type === "edit-command") {
    return {
      presentation,
      selectedSlideId:
        suggestion.slideIndex != null
          ? presentation.slides[suggestion.slideIndex]?.id ?? selectedSlideId
          : selectedSlideId,
      command: suggestion.action.command,
    };
  }

  const a = suggestion.action;
  const { presentation: next } = applyEditPatch(presentation, {
    ...emptyPatch(),
    themeId: a.themeId,
    removeSlideIds: a.removeSlideIds,
    slidePatches:
      a.slideId && a.slidePatch
        ? [{ id: a.slideId, patch: a.slidePatch }]
        : [],
  });

  return {
    presentation: next,
    selectedSlideId:
      next.slides.find((s) => s.id === selectedSlideId)?.id ??
      next.slides[0]?.id ??
      null,
  };
}

function countWords(slide: Slide): number {
  const parts = [
    slide.title,
    slide.subtitle,
    slide.body,
    slide.callout,
    ...(slide.bullets || []),
  ];
  return parts.filter(Boolean).join(" ").split(/\s+/).filter(Boolean).length;
}

function pickRemovableSlideIds(presentation: Presentation, n: number): string[] {
  const candidates = presentation.slides
    .map((s, i) => ({ s, i, words: countWords(s) }))
    .filter(
      ({ s, i }) =>
        i > 0 &&
        s.layout !== "hero" &&
        s.layout !== "thankyou" &&
        !/ask|thanks|next steps/i.test(s.title)
    )
    .sort((a, b) => a.words - b.words);

  return candidates.slice(0, n).map((c) => c.s.id);
}
