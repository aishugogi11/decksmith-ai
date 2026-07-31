import type { DeckTemplate, TemplateCategory } from "@/lib/templates";
import { THEMES } from "@/lib/themes";
import type {
  PresentationType,
  TemplateRecord,
  Tone,
  VisualStyle,
} from "@/lib/template-engine/types";

const CATEGORY_TYPE: Record<TemplateCategory, PresentationType> = {
  pitch: "pitch",
  business: "business",
  education: "education",
  marketing: "marketing",
  product: "product",
  creative: "creative",
  events: "events",
  personal: "personal",
  nonprofit: "nonprofit",
  reports: "reports",
};

const THEME_STYLE: Record<string, VisualStyle[]> = {
  apple: ["minimal", "modern"],
  microsoft: ["corporate", "classic"],
  google: ["playful", "modern"],
  minimal: ["minimal", "editorial"],
  startup: ["modern", "bold", "gradient"],
  corporate: ["corporate", "classic"],
  education: ["classic", "modern"],
  luxury: ["editorial", "minimal"],
  dark: ["bold", "modern"],
  gradient: ["gradient", "bold", "modern"],
};

const CATEGORY_AUDIENCE: Record<TemplateCategory, string[]> = {
  pitch: ["investors", "founders", "VCs"],
  business: ["executives", "teams", "stakeholders"],
  education: ["students", "teachers", "learners"],
  marketing: ["customers", "marketers", "prospects"],
  product: ["users", "PMs", "engineers"],
  creative: ["clients", "creative teams"],
  events: ["attendees", "organizers"],
  personal: ["peers", "recruiters", "friends"],
  nonprofit: ["donors", "board", "community"],
  reports: ["leadership", "teams"],
};

const CATEGORY_TONE: Record<TemplateCategory, Tone[]> = {
  pitch: ["professional", "authoritative"],
  business: ["professional", "authoritative"],
  education: ["friendly", "academic"],
  marketing: ["inspirational", "friendly"],
  product: ["professional", "friendly"],
  creative: ["inspirational", "casual"],
  events: ["friendly", "inspirational"],
  personal: ["friendly", "inspirational"],
  nonprofit: ["inspirational", "professional"],
  reports: ["professional", "authoritative"],
};

const INDUSTRY_HINTS: { match: RegExp; industry: string }[] = [
  { match: /health|medical|clinic|care/i, industry: "healthcare" },
  { match: /ai|machine learning|ml|llm/i, industry: "artificial intelligence" },
  { match: /fintech|bank|finance|payment/i, industry: "finance" },
  { match: /edu|school|lesson|course/i, industry: "education" },
  { match: /climate|sustain|green/i, industry: "climate" },
  { match: /saas|software|platform|product/i, industry: "software" },
  { match: /retail|e-?comm|shop/i, industry: "retail" },
  { match: /nonprofit|charity|mission/i, industry: "nonprofit" },
];

/** Enrich a Decksmith catalog entry into a provider-agnostic TemplateRecord. */
export function deckTemplateToRecord(t: DeckTemplate): TemplateRecord {
  const presentationType: PresentationType =
    /biograph|steve jobs|life story/i.test(`${t.name} ${t.tags.join(" ")}`)
      ? "biography"
      : /portfolio|case study/i.test(`${t.name} ${t.tags.join(" ")}`)
        ? "portfolio"
        : /sales|pipeline/i.test(`${t.name} ${t.tags.join(" ")}`)
          ? "sales"
          : CATEGORY_TYPE[t.category];

  const theme = THEMES[t.themeId];
  const industries = new Set<string>([t.category]);
  const blob = `${t.name} ${t.description} ${t.tags.join(" ")}`;
  for (const hint of INDUSTRY_HINTS) {
    if (hint.match.test(blob)) industries.add(hint.industry);
  }

  const visualStyle = THEME_STYLE[t.themeId] ?? ["modern"];
  const tone = CATEGORY_TONE[t.category] ?? ["professional"];
  const audience = CATEGORY_AUDIENCE[t.category] ?? ["general"];

  const semanticText = [
    t.name,
    t.description,
    presentationType,
    t.category,
    ...t.tags,
    ...industries,
    ...audience,
    ...visualStyle,
    ...tone,
    t.themeId,
    theme?.label,
    theme?.description,
    `${t.slides.length} slides`,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    id: t.id,
    source: "decksmith",
    name: t.name,
    description: t.description,
    presentationType,
    industry: [...industries],
    audience,
    visualStyle,
    colorPalette: theme
      ? [theme.accent, theme.slideFg, theme.muted]
      : ["#111111", "#ffffff"],
    layoutStyle: inferLayoutStyle(t),
    tone,
    tags: t.tags,
    themeId: t.themeId,
    slideCount: t.slides.length,
    preview: t.preview,
    semanticText,
    slides: t.slides,
  };
}

function inferLayoutStyle(t: DeckTemplate): string {
  const layouts = new Set(t.slides.map((s) => s.layout));
  if (layouts.has("stats") && layouts.has("timeline")) return "narrative-metrics";
  if (layouts.has("comparison")) return "compare-contrast";
  if (layouts.has("process")) return "step-flow";
  if (layouts.has("chart")) return "data-led";
  if (layouts.has("quote")) return "story-quote";
  return "structured-sections";
}
