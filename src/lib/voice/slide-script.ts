import type { Slide } from "@/lib/types";

/** Build a natural spoken script from a slide’s visible content + notes. */
export function slideToSpeechText(slide: Slide, slideNumber?: number): string {
  const parts: string[] = [];

  if (slideNumber != null) {
    parts.push(`Slide ${slideNumber}.`);
  }

  if (slide.title) parts.push(slide.title);
  if (slide.subtitle) parts.push(slide.subtitle);
  if (slide.body) parts.push(slide.body);

  if (slide.bullets?.length) {
    parts.push(slide.bullets.map((b, i) => `${i + 1}. ${b}`).join(" "));
  }

  if (slide.stats?.length) {
    parts.push(
      slide.stats.map((s) => `${s.value} ${s.label}`).join(". ")
    );
  }

  if (slide.quote) {
    parts.push(
      slide.quoteAuthor
        ? `Quote: ${slide.quote}. — ${slide.quoteAuthor}`
        : `Quote: ${slide.quote}`
    );
  }

  if (slide.timeline?.length) {
    parts.push(
      slide.timeline
        .map((t) => `${t.title}: ${t.description}`)
        .join(". ")
    );
  }

  if (slide.comparison?.length) {
    parts.push(
      slide.comparison
        .map((c) => `${c.title}: ${c.items.join(", ")}`)
        .join(". ")
    );
  }

  if (slide.process?.length) {
    parts.push(
      slide.process
        .map((p, i) => `Step ${i + 1}: ${p.title}. ${p.description}`)
        .join(" ")
    );
  }

  if (slide.callout) parts.push(slide.callout);

  if (slide.notes) {
    parts.push(`Speaker notes: ${slide.notes}`);
  }

  return parts
    .map((p) => p.trim())
    .filter(Boolean)
    .join(". ")
    .replace(/\s+/g, " ")
    .trim();
}
