import type { VoiceCommand } from "@/lib/voice-agent/types";

export type FeedbackSourceKind =
  | "youtube"
  | "instagram"
  | "professor"
  | "manager"
  | "investor"
  | "customer"
  | "rubric"
  | "general";

export type FeedbackIssueCategory =
  | "too_much_text"
  | "needs_visuals"
  | "weak_conclusion"
  | "weak_intro"
  | "poor_hierarchy"
  | "needs_chart"
  | "unclear_story"
  | "brand_inconsistent"
  | "pacing"
  | "other";

export type FeedbackIssue = {
  id: string;
  category: FeedbackIssueCategory;
  label: string;
  severity: "info" | "warn" | "critical";
  quote?: string;
};

export type SlideIssueMap = {
  slideIndex: number;
  slideId: string;
  slideTitle: string;
  issueIds: string[];
  notes: string[];
};

/** Deterministic editor command previewed before apply */
export type RedesignAction = {
  id: string;
  issueId: string;
  label: string;
  command: VoiceCommand;
  status: "pending" | "applied" | "dismissed";
};

export type FeedbackPipelineStage =
  | "idle"
  | "parsing"
  | "mapping"
  | "generating"
  | "ready"
  | "applying"
  | "error";

export type FeedbackPipelineResult = {
  issues: FeedbackIssue[];
  slideMap: SlideIssueMap[];
  actions: RedesignAction[];
  summary: string;
};

export type PipelineStatus<T> = {
  status: FeedbackPipelineStage;
  input: string;
  sourceKind: FeedbackSourceKind;
  output: T | null;
  error: string | null;
  processing: boolean;
};
