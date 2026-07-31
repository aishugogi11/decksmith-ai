import { detectFeedbackSourceKind, parseFeedbackIssues } from "@/features/feedback/parse";
import { mapIssuesToSlides } from "@/features/feedback/map-issues";
import { generateRedesignActions } from "@/features/feedback/generate-actions";
import type { FeedbackPipelineResult } from "@/features/feedback/types";
import type { Presentation } from "@/lib/types";

export type FeedbackPipelineProgress = {
  stage: "parsing" | "mapping" | "generating" | "ready";
  message: string;
};

/**
 * Feedback → Issues → Slide map → Redesign actions.
 * Each stage is replaceable (e.g. swap parseFeedbackIssues for an LLM).
 */
export async function runFeedbackPipeline(
  rawFeedback: string,
  presentation: Presentation,
  onProgress?: (p: FeedbackPipelineProgress) => void
): Promise<FeedbackPipelineResult> {
  const text = rawFeedback.trim();
  if (!text) throw new Error("Paste some feedback first.");
  if (!presentation.slides.length) {
    throw new Error("Open or generate a presentation first.");
  }

  onProgress?.({ stage: "parsing", message: "Parsing feedback into issues…" });
  await tick(180);
  const sourceKind = detectFeedbackSourceKind(text);
  const issues = parseFeedbackIssues(text);

  onProgress?.({ stage: "mapping", message: "Mapping issues to slides…" });
  await tick(160);
  const slideMap = mapIssuesToSlides(presentation, issues, text);

  onProgress?.({
    stage: "generating",
    message: "Generating redesign actions…",
  });
  await tick(200);
  const actions = generateRedesignActions(presentation, issues, slideMap);

  const summary = [
    `Parsed ${issues.length} issue(s) from ${sourceKind} feedback.`,
    `Mapped to ${slideMap.length} slide(s).`,
    `${actions.length} redesign action(s) ready to preview.`,
  ].join(" ");

  onProgress?.({ stage: "ready", message: "Preview ready." });

  return { issues, slideMap, actions, summary };
}

function tick(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
