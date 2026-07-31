import { coachPresentation, type CoachReport } from "@/lib/ai/coach";
import type { Presentation } from "@/lib/types";
import { uid } from "@/lib/utils";

export type CoachMetric = {
  id: string;
  label: string;
  value: string | number;
  hint?: string;
};

export type CoachRecommendation = {
  id: string;
  message: string;
  slideIndex?: number;
  severity: "info" | "warn" | "critical";
  actionLabel: "Apply" | "Rewrite";
  command: { action: string; params: Record<string, unknown> };
};

export type CoachWorkspaceReport = {
  /** Estimated delivery time only — no composite scores. */
  estimatedMinutes: number;
  metrics: CoachMetric[];
  recommendations: CoachRecommendation[];
  legacy: CoachReport;
  summary: string;
};

/**
 * Presentation Coach — speaking-time estimate + actionable Apply/Rewrite commands.
 */
export function analyzePresentationCoach(
  presentation: Presentation,
  opts?: { audienceHint?: string }
): CoachWorkspaceReport {
  const legacy = coachPresentation(presentation, opts);
  const speakingMinutes = legacy.estimatedMinutes;

  const metrics: CoachMetric[] = [
    {
      id: "time",
      label: "Estimated speaking time",
      value: `~${speakingMinutes} min`,
    },
  ];

  const recommendations = buildRecommendations(presentation, legacy);

  return {
    estimatedMinutes: speakingMinutes,
    metrics,
    recommendations,
    legacy,
    summary:
      recommendations.length > 0
        ? `~${speakingMinutes} min to present · ${recommendations.length} suggestions`
        : `~${speakingMinutes} min to present`,
  };
}

function buildRecommendations(
  presentation: Presentation,
  legacy: CoachReport
): CoachRecommendation[] {
  const out: CoachRecommendation[] = [];

  for (const issue of legacy.issues.slice(0, 8)) {
    const slide = issue.slideIndex + 1;
    if (/crowded|words|text|bullets/i.test(issue.message)) {
      out.push({
        id: uid("crec"),
        message: issue.message,
        slideIndex: issue.slideIndex,
        severity: issue.severity,
        actionLabel: "Apply",
        command: {
          action: "replace_text_with_bullets",
          params: { slide },
        },
      });
      continue;
    }
    if (/placeholder|metric/i.test(issue.message)) {
      out.push({
        id: uid("crec"),
        message: issue.message,
        slideIndex: issue.slideIndex,
        severity: issue.severity,
        actionLabel: "Rewrite",
        command: {
          action: "set_slide_field",
          params: {
            slide,
            field: "notes",
            value: "Replace placeholder metrics with real numbers before presenting.",
          },
        },
      });
      continue;
    }
    out.push({
      id: uid("crec"),
      message: issue.message,
      slideIndex: issue.slideIndex,
      severity: issue.severity,
      actionLabel: "Apply",
      command: {
        action: "improve_layout",
        params: { slide, style: "apple" },
      },
    });
  }

  for (const beat of legacy.weakBeats.slice(0, 3)) {
    out.push({
      id: uid("crec"),
      message: beat,
      severity: "warn",
      actionLabel: "Rewrite",
      command: {
        action: "rewrite_conclusion",
        params: {},
      },
    });
  }

  if (presentation.slides.length > 20) {
    out.push({
      id: uid("crec"),
      message: `This deck is ${presentation.slides.length} slides — consider tightening for a shorter talk.`,
      severity: "info",
      actionLabel: "Apply",
      command: {
        action: "improve_layout",
        params: { style: "minimal" },
      },
    });
  }

  return out.slice(0, 10);
}
