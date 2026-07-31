import type { Presentation, Slide } from "@/lib/types";

export type CoachIssue = {
  slideIndex: number;
  severity: "info" | "warn" | "critical";
  message: string;
};

export type CoachReport = {
  estimatedMinutes: number;
  /** @deprecated Kept for older callers; no longer shown in UI. */
  storyScore: number;
  issues: CoachIssue[];
  weakBeats: string[];
  likelyQuestions: string[];
  summary: string;
};

/**
 * Presentation coach — reviews density, story arc, timing, and anticipated Q&A.
 */
export function coachPresentation(
  presentation: Presentation,
  opts?: { audienceHint?: string }
): CoachReport {
  const issues: CoachIssue[] = [];
  const weakBeats: string[] = [];
  let wordCount = 0;

  presentation.slides.forEach((slide, i) => {
    const words = countWords(slide);
    wordCount += words;

    if (words > 85) {
      issues.push({
        slideIndex: i,
        severity: words > 120 ? "critical" : "warn",
        message: `Slide ${i + 1} (“${slide.title}”) looks crowded (~${words} words). Cut to one idea.`,
      });
    }

    if (slide.layout === "bullets" && (slide.bullets?.length ?? 0) > 5) {
      issues.push({
        slideIndex: i,
        severity: "warn",
        message: `Slide ${i + 1} has ${slide.bullets!.length} bullets — aim for 3–4.`,
      });
    }

    if (
      (slide.layout === "section" || slide.layout === "hero") &&
      !slide.body &&
      !slide.subtitle
    ) {
      weakBeats.push(`Slide ${i + 1} needs a sharper point under “${slide.title}”.`);
    }

    if (slide.layout === "stats") {
      const empty = slide.stats?.some((s) => s.value === "—" || s.value === "$0");
      if (empty) {
        issues.push({
          slideIndex: i,
          severity: "info",
          message: `Slide ${i + 1} still has placeholder metrics — replace before you present.`,
        });
      }
    }
  });

  const hasHero = presentation.slides.some((s) => s.layout === "hero");
  const hasProof = presentation.slides.some(
    (s) => s.layout === "stats" || s.layout === "chart"
  );
  const hasAsk = presentation.slides.some(
    (s) =>
      s.layout === "thankyou" ||
      /ask|join|invest|next/i.test(`${s.title} ${s.body || ""}`)
  );

  if (!hasHero) weakBeats.push("Open with a stronger title / promise slide.");
  if (!hasProof) weakBeats.push("Add a proof beat — stats, chart, or customer voice.");
  if (!hasAsk) weakBeats.push("Close with a clear ask or next step.");

  const storyScore = clamp(
    100 -
      issues.filter((i) => i.severity !== "info").length * 8 -
      weakBeats.length * 10 +
      (hasProof ? 8 : 0) +
      (hasAsk ? 6 : 0),
    35,
    96
  );

  // ~135 wpm spoken + 8s dwell per slide
  const estimatedMinutes = Math.max(
    3,
    Math.round(wordCount / 135 + presentation.slides.length * 0.15)
  );

  const audience = (opts?.audienceHint || "").toLowerCase();
  const likelyQuestions = buildQuestions(presentation, audience);

  const summary = [
    `Coach review for “${presentation.title}”:`,
    `• Estimated speaking time: ~${estimatedMinutes} minutes (${presentation.slides.length} slides)`,
    issues.length
      ? `• ${issues.length} delivery note${issues.length === 1 ? "" : "s"} to review`
      : "• Density looks healthy for delivery",
    weakBeats.length ? `• Story gap: ${weakBeats[0]}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    estimatedMinutes,
    storyScore,
    issues,
    weakBeats,
    likelyQuestions,
    summary,
  };
}

export function formatCoachReply(report: CoachReport): string {
  const q = report.likelyQuestions
    .slice(0, 4)
    .map((x) => `• ${x}`)
    .join("\n");
  const flags = report.issues
    .slice(0, 4)
    .map((i) => `• ${i.message}`)
    .join("\n");

  return [
    report.summary,
    "",
    flags ? `Watch-outs:\n${flags}` : "Density looks healthy.",
    "",
    `They might ask:\n${q}`,
  ].join("\n");
}

function countWords(slide: Slide): number {
  const parts = [
    slide.title,
    slide.subtitle,
    slide.body,
    slide.callout,
    slide.quote,
    ...(slide.bullets || []),
    ...(slide.stats || []).map((s) => `${s.value} ${s.label}`),
    ...(slide.timeline || []).map((t) => `${t.title} ${t.description}`),
    ...(slide.process || []).map((p) => `${p.title} ${p.description}`),
  ];
  return parts
    .filter(Boolean)
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
}

function buildQuestions(presentation: Presentation, audience: string): string[] {
  const title = presentation.title;
  const investor = /investor|yc|venture|pitch/.test(audience) || /pitch/i.test(title);
  const student = /student|class|professor|school/.test(audience);

  if (investor) {
    return [
      "What is your unfair advantage if a big incumbent copies this?",
      "How do you get the first 10 design partners?",
      "What metric proves you are working — this quarter?",
      "How much are you raising, and what does it buy?",
    ];
  }
  if (student) {
    return [
      "Can you explain this without jargon in one sentence?",
      "What is a real-world example we can picture?",
      "What is still unknown or debated?",
      "What should we remember a week from now?",
    ];
  }
  return [
    "Why now — what changed in the last 18 months?",
    "Who is the buyer, and who is the user?",
    "What happens if we do nothing?",
    "What is the next milestone after this presentation?",
  ];
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
