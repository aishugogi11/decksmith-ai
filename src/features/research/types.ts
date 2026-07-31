export type ResearchStageId =
  | "idle"
  | "search"
  | "sources"
  | "statistics"
  | "citations"
  | "outline"
  | "notes"
  | "visuals"
  | "generate"
  | "done"
  | "error";

export type ResearchSource = {
  id: string;
  title: string;
  url: string;
  publisher: string;
  trustScore: number;
  snippet: string;
};

export type ResearchStatistic = {
  id: string;
  value: string;
  label: string;
  sourceId: string;
  year?: string;
};

export type ResearchCitation = {
  id: string;
  sourceId: string;
  apa: string;
  inText: string;
};

export type ResearchOutlineBeat = {
  title: string;
  bullets: string[];
  visualHint?: string;
  speakerNotes?: string;
};

export type ResearchBundle = {
  topic: string;
  sources: ResearchSource[];
  statistics: ResearchStatistic[];
  citations: ResearchCitation[];
  outline: ResearchOutlineBeat[];
  visualSuggestions: string[];
  summary: string;
};

export type ResearchStageState = {
  id: ResearchStageId;
  label: string;
  status: "pending" | "running" | "done" | "error";
  detail?: string;
};

export type ResearchPipelineState = {
  input: string;
  stages: ResearchStageState[];
  output: ResearchBundle | null;
  status: ResearchStageId;
  processing: boolean;
  error: string | null;
};
