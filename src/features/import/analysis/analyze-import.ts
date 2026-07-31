import { analyzePresentationCoach } from "@/features/coach/analyze";
import type { ImportAnalysis } from "@/features/import/types";
import type { Presentation, Slide } from "@/lib/types";

/**
 * Lightweight post-import snapshot — estimated speaking time only.
 * Redesign suggestions come from Feedback → Redesign, not auto-scores.
 */
export function analyzeImportedPresentation(
  presentation: Presentation
): ImportAnalysis {
  const coach = analyzePresentationCoach(presentation);
  const counts = presentation.importMeta?.counts ?? {
    slides: presentation.slides.length,
    textboxes: 0,
    images: 0,
    charts: 0,
    shapes: 0,
    notes: 0,
  };

  return {
    slideCount: presentation.slides.length,
    wordCount: countDeckWords(presentation),
    estimatedMinutes: coach.estimatedMinutes,
    issues: [],
    counts,
    themeId: presentation.themeId,
    quickActions: [],
    summary: `${presentation.slides.length} slides ready — redesign from feedback or research`,
  };
}

function countDeckWords(presentation: Presentation): number {
  return presentation.slides.reduce((sum, slide) => sum + countSlideWords(slide), 0);
}

function countSlideWords(slide: Slide): number {
  const parts = [
    slide.title,
    slide.subtitle,
    slide.body,
    slide.callout,
    slide.quote,
    ...(slide.bullets || []),
  ];
  return parts
    .filter(Boolean)
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
}
