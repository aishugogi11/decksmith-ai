import type { Presentation } from "@/lib/types";
import type { FeedbackIssue, SlideIssueMap } from "@/features/feedback/types";

/**
 * Step 2 — Map issues to affected slides (heuristic; LLM-swappable).
 */
export function mapIssuesToSlides(
  presentation: Presentation,
  issues: FeedbackIssue[],
  rawFeedback: string
): SlideIssueMap[] {
  const maps = new Map<number, SlideIssueMap>();

  const ensure = (index: number) => {
    const slide = presentation.slides[index];
    if (!slide) return null;
    if (!maps.has(index)) {
      maps.set(index, {
        slideIndex: index,
        slideId: slide.id,
        slideTitle: slide.title,
        issueIds: [],
        notes: [],
      });
    }
    return maps.get(index)!;
  };

  // Explicit “Slide N …” mentions
  const mentions = [
    ...rawFeedback.matchAll(/slide\s+(\d+)\s*[:\-]?\s*([^\n.]+)/gi),
  ];
  for (const m of mentions) {
    const idx = Number(m[1]) - 1;
    const note = m[2]?.trim();
    const row = ensure(idx);
    if (!row) continue;
    if (note) row.notes.push(note);
    // Attach matching issues by keyword overlap
    for (const issue of issues) {
      if (
        note &&
        note.toLowerCase().includes(issue.label.split(" ")[0].toLowerCase())
      ) {
        if (!row.issueIds.includes(issue.id)) row.issueIds.push(issue.id);
      }
    }
  }

  for (const issue of issues) {
    const targets = inferSlideTargets(presentation, issue);
    for (const idx of targets) {
      const row = ensure(idx);
      if (!row) continue;
      if (!row.issueIds.includes(issue.id)) row.issueIds.push(issue.id);
      row.notes.push(issue.label);
    }
  }

  return [...maps.values()].sort((a, b) => a.slideIndex - b.slideIndex);
}

function inferSlideTargets(
  presentation: Presentation,
  issue: FeedbackIssue
): number[] {
  const n = presentation.slides.length;
  if (!n) return [];

  switch (issue.category) {
    case "weak_intro":
      return [0];
    case "weak_conclusion": {
      const thank = presentation.slides.findIndex(
        (s) =>
          s.layout === "thankyou" ||
          /thank|next|ask|conclusion|close/i.test(s.title)
      );
      return [thank >= 0 ? thank : n - 1];
    }
    case "too_much_text":
      return densestSlides(presentation, 2);
    case "needs_visuals":
      return presentation.slides
        .map((s, i) => ({
          i,
          score:
            (s.layout === "bullets" || s.layout === "section" ? 2 : 0) +
            (!s.imageHint && !s.objects?.some((o) => o.type === "image")
              ? 2
              : 0),
        }))
        .filter((x) => x.score >= 2)
        .sort((a, b) => b.score - a.score)
        .slice(0, 2)
        .map((x) => x.i);
    case "needs_chart": {
      const hasChart = presentation.slides.findIndex(
        (s) => s.layout === "chart" || s.chartHint
      );
      if (hasChart < 0) {
        const mid = Math.min(Math.floor(n / 2), n - 1);
        return [mid];
      }
      return [hasChart];
    }
    case "poor_hierarchy":
      return densestSlides(presentation, 2);
    case "brand_inconsistent":
      return [0];
    case "pacing":
      return n > 8 ? [n - 2, n - 1] : densestSlides(presentation, 1);
    case "unclear_story":
      return [0, Math.min(1, n - 1)];
    default:
      return densestSlides(presentation, 1);
  }
}

function densestSlides(presentation: Presentation, count: number): number[] {
  return presentation.slides
    .map((s, i) => ({
      i,
      words: [
        s.title,
        s.subtitle,
        s.body,
        ...(s.bullets ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .split(/\s+/).length,
    }))
    .sort((a, b) => b.words - a.words)
    .slice(0, count)
    .map((x) => x.i);
}
