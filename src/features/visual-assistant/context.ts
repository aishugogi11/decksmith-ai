import type { Presentation, Slide } from "@/lib/types";
import type { VisualDeckContext, VisualSlideContext } from "./types";

const THEME_STYLE: Record<string, string> = {
  apple: "clean Apple Keynote — generous whitespace, soft daylight photography",
  minimal: "minimal editorial — restrained palette, quiet documentary photos",
  corporate: "corporate professional — polished office and product imagery",
  bold: "bold contrast — graphic, high-energy visuals",
  academic: "academic — credible research and campus imagery",
  instagram:
    "Instagram carousel — bold color, lifestyle photography, punchy social frames",
  startup: "startup pitch — energetic product and growth imagery",
  gradient: "bold gradient — vivid abstract and lifestyle shots",
};

function slideContext(slide: Slide, index: number): VisualSlideContext {
  const objects = slide.objects ?? [];
  return {
    slideIndex: index,
    slideId: slide.id,
    title: slide.title || "Untitled slide",
    subtitle: slide.subtitle,
    bullets: slide.bullets ?? [],
    body: slide.body,
    layout: slide.layout,
    existingImageHints: [
      ...(slide.imageHint ? [slide.imageHint] : []),
      ...objects
        .filter((o) => o.type === "image" && o.imageHint)
        .map((o) => o.imageHint!),
    ].filter((h) => h !== "__import_page__"),
    hasChart:
      Boolean(slide.chartHint) || objects.some((o) => o.type === "chart"),
    hasTimeline: Boolean(slide.timeline?.length),
    objectCount: objects.length,
  };
}

/** Infer a light audience hint from slides title / slide language. */
function audienceHint(presentation: Presentation, slide: Slide | null): string | undefined {
  const blob = [
    presentation.title,
    presentation.subtitle,
    slide?.title,
    ...(slide?.bullets ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/investor|pitch|fundraising|series [abc]/.test(blob)) return "investors";
  if (/student|class|lecture|professor|rubric/.test(blob)) return "students / academic";
  if (/customer|buyer|sales|demo/.test(blob)) return "customers";
  if (/board|exec|leadership/.test(blob)) return "executives";
  if (/patient|clinic|care|health/.test(blob)) return "healthcare stakeholders";
  return undefined;
}

export function buildVisualContext(
  presentation: Presentation,
  selectedSlideId: string | null
): VisualDeckContext {
  const idx = selectedSlideId
    ? presentation.slides.findIndex((s) => s.id === selectedSlideId)
    : 0;
  const slide =
    idx >= 0 ? presentation.slides[idx] : presentation.slides[0] ?? null;

  return {
    title: presentation.title || "Untitled slides",
    themeId: presentation.themeId,
    designStyle:
      THEME_STYLE[presentation.themeId] ??
      "modern presentation — clear, purposeful imagery",
    audienceHint: audienceHint(presentation, slide),
    slide: slide ? slideContext(slide, Math.max(0, idx)) : null,
  };
}

export function summarizeContext(ctx: VisualDeckContext): string {
  const s = ctx.slide;
  if (!s) return `Slides “${ctx.title}” · ${ctx.designStyle}`;
  const bullets =
    s.bullets.length > 0
      ? `Bullets: ${s.bullets.slice(0, 4).join(" · ")}`
      : s.body
        ? `Body: ${s.body.slice(0, 120)}`
        : "No bullet points yet";
  const audience = ctx.audienceHint ? ` · Audience: ${ctx.audienceHint}` : "";
  return `Slide ${s.slideIndex + 1}: “${s.title}”${audience}\n${bullets}\nStyle: ${ctx.designStyle}`;
}
