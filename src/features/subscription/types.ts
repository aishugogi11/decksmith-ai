export type PlanId = "free" | "pro";

export type FeatureFlag =
  | "ai_generate"
  | "voice_edit"
  | "basic_templates"
  | "basic_themes"
  | "pptx_export"
  | "basic_suggestions"
  | "research_mode"
  | "presentation_coach"
  | "feedback_redesign"
  | "premium_templates"
  | "advanced_themes"
  | "brand_kit"
  | "unlimited_ai"
  | "unlimited_voice"
  | "unlimited_exports"
  | "priority_ai";

export type UsageCounters = {
  /** Calendar day key YYYY-MM-DD */
  day: string;
  aiRequestsToday: number;
  presentationCount: number;
};

export type SubscriptionState = {
  plan: PlanId;
  usage: UsageCounters;
  upgradeOpen: boolean;
  upgradeReason: string | null;
};

export const FREE_LIMITS = {
  aiRequestsPerDay: 10,
  maxPresentations: 5,
} as const;

export const FREE_FEATURES: FeatureFlag[] = [
  "ai_generate",
  "voice_edit",
  "basic_templates",
  "basic_themes",
  "pptx_export",
  "basic_suggestions",
];

export const PRO_FEATURES: FeatureFlag[] = [
  ...FREE_FEATURES,
  "research_mode",
  "presentation_coach",
  "feedback_redesign",
  "premium_templates",
  "advanced_themes",
  "brand_kit",
  "unlimited_ai",
  "unlimited_voice",
  "unlimited_exports",
  "priority_ai",
];
