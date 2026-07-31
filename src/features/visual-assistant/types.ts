export type VisualKind =
  | "photo"
  | "illustration"
  | "icon"
  | "chart"
  | "diagram"
  | "timeline";

export type VisualCandidate = {
  id: string;
  kind: "photo" | "illustration";
  src: string;
  thumb: string;
  alt: string;
  photographer?: string;
  query: string;
  tags: string[];
};

export type VisualRecommendation = {
  kind: Exclude<VisualKind, "photo">;
  title: string;
  reason: string;
  /** Suggested chart/icon/timeline hint for the editor */
  hint: string;
  cta: string;
};

export type VisualClarifyOption = {
  id: string;
  label: string;
};

export type VisualAssistMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  at: string;
  candidates?: VisualCandidate[];
  recommendations?: VisualRecommendation[];
  clarifyOptions?: VisualClarifyOption[];
  searchQueries?: string[];
};

export type VisualSlideContext = {
  slideIndex: number;
  slideId: string;
  title: string;
  subtitle?: string;
  bullets: string[];
  body?: string;
  layout: string;
  existingImageHints: string[];
  hasChart: boolean;
  hasTimeline: boolean;
  objectCount: number;
};

export type VisualDeckContext = {
  title: string;
  themeId: string;
  designStyle: string;
  audienceHint?: string;
  slide: VisualSlideContext | null;
};

export type VisualAssistTurn =
  | {
      type: "clarify";
      message: string;
      options: VisualClarifyOption[];
    }
  | {
      type: "gallery";
      message: string;
      queries: string[];
      candidates: VisualCandidate[];
      recommendations?: VisualRecommendation[];
    }
  | {
      type: "recommend";
      message: string;
      recommendations: VisualRecommendation[];
      /** Optional photo gallery as secondary option */
      candidates?: VisualCandidate[];
      queries?: string[];
    };

export type VisualPlacement = {
  anchor: string;
  x: number;
  y: number;
  w: number;
  h: number;
};
