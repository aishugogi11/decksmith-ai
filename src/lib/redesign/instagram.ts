import type { Presentation, Slide, SlideLayout } from "@/lib/types";
import { uid } from "@/lib/utils";

const MAX_CAROUSEL = 8;

function clip(text: string | undefined, max: number): string | undefined {
  if (!text) return undefined;
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

function punchyTitle(title: string): string {
  const t = clip(title, 42) || title;
  return t.replace(/\.$/, "");
}

/** Turn one slide into Instagram-friendly copy + layout. */
function toInstagramSlide(slide: Slide, index: number, total: number): Slide {
  const bullets = (slide.bullets ?? [])
    .map((b) => clip(b, 48)!)
    .filter(Boolean)
    .slice(0, 3);

  const dense =
    (slide.body?.length ?? 0) > 90 ||
    (slide.bullets?.length ?? 0) > 3 ||
    slide.layout === "comparison" ||
    slide.layout === "process" ||
    slide.layout === "timeline";

  let layout: SlideLayout = slide.layout;
  if (index === 0) layout = "hero";
  else if (slide.layout === "quote" || slide.quote) layout = "quote";
  else if (slide.layout === "stats" || slide.stats?.length) layout = "stats";
  else if (slide.layout === "thankyou" || index === total - 1)
    layout = "thankyou";
  else if (dense || bullets.length) layout = "bullets";
  else if (slide.imageHint) layout = "image";
  else layout = "section";

  const body =
    layout === "hero" || layout === "section" || layout === "thankyou"
      ? clip(slide.body || slide.subtitle, 90)
      : layout === "bullets"
        ? undefined
        : clip(slide.body, 70);

  return {
    ...slide,
    id: slide.id || uid("slide"),
    layout,
    title: punchyTitle(slide.title || `Post ${index + 1}`),
    subtitle:
      layout === "hero"
        ? clip(slide.subtitle || "Swipe for the story", 56)
        : clip(slide.subtitle, 48),
    body,
    bullets: layout === "bullets" ? bullets : undefined,
    callout: undefined,
    notes: clip(
      slide.notes ||
        (index === 0
          ? "Cover frame — keep the hook under 5 words if you can."
          : "Carousel frame — one idea per slide."),
      120
    ),
    stats: slide.stats?.slice(0, 3).map((s) => ({
      value: clip(s.value, 8) || s.value,
      label: clip(s.label, 24) || s.label,
    })),
    quote: clip(slide.quote, 110),
    quoteAuthor: clip(slide.quoteAuthor, 28),
    objects: undefined,
  };
}

/**
 * Redesign any deck into an Instagram carousel set:
 * square format, bold theme, short captions, ≤8 frames.
 */
export function redesignForInstagram(presentation: Presentation): Presentation {
  const source = presentation.slides;
  if (!source.length) {
    return {
      ...presentation,
      themeId: "instagram",
      format: "instagram",
      updatedAt: new Date().toISOString(),
    };
  }

  // Prefer cover + key middle + close when trimming long decks
  let picks = source;
  if (source.length > MAX_CAROUSEL) {
    const mid = source.slice(1, -1);
    const keepMid = Math.max(0, MAX_CAROUSEL - 2);
    const step = Math.max(1, Math.ceil(mid.length / keepMid));
    const selectedMid = mid.filter((_, i) => i % step === 0).slice(0, keepMid);
    picks = [source[0]!, ...selectedMid, source[source.length - 1]!].slice(
      0,
      MAX_CAROUSEL
    );
  }

  const slides = picks.map((s, i) =>
    toInstagramSlide(s, i, picks.length)
  );

  return {
    ...presentation,
    title: clip(presentation.title, 48) || presentation.title,
    subtitle:
      clip(presentation.subtitle, 64) || "Instagram carousel · square frames",
    themeId: "instagram",
    format: "instagram",
    slides,
    updatedAt: new Date().toISOString(),
  };
}

export function isInstagramRedesignIntent(text: string): boolean {
  const t = text.toLowerCase().replace(/[’']/g, "'");
  if (/\bas (an? )?instagram (post|carousel|story)\b/.test(t)) return true;
  if (/\bfor instagram\b/.test(t)) return true;
  if (/\binstagram(-| )?ready\b/.test(t)) return true;
  if (/\bsquare (post|format|carousel)\b/.test(t) && /\b(redesign|make|format)\b/.test(t))
    return true;
  if (
    /\binstagram\b/.test(t) &&
    /\b(redesign|make|suitable|post|carousel|story|reel|format|style|look|convert)\b/.test(
      t
    )
  ) {
    return true;
  }
  if (
    /\b(ig|insta)\b/.test(t) &&
    /\b(redesign|make|suitable|style|look|convert|format|post)\b/.test(t)
  ) {
    return true;
  }
  return false;
}
