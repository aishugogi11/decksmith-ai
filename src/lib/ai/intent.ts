import { extractSlideCount } from "@/lib/mock-ai";
import type {
  PresentationIntent,
  PresentationType,
  Tone,
  VisualStyle,
} from "@/lib/template-engine/types";
import type { ThemeId } from "@/lib/types";
import { expandQueryText, tokenize } from "@/lib/ai/embeddings";

const TYPE_RULES: { type: PresentationType; patterns: RegExp[] }[] = [
  {
    type: "pitch",
    patterns: [
      /pitch/,
      /investor/,
      /fundraising/,
      /series\s*[a-c]/,
      /seed\s*round/,
      /venture/,
      /\byc\b/,
      /y\s*combinator/,
      /demo\s*day/,
    ],
  },
  { type: "biography", patterns: [/biograph/, /\bbio\b/, /life\s*story/, /steve\s*jobs/] },
  { type: "education", patterns: [/lesson/, /classroom/, /students?/, /teach/, /course/, /quantum/] },
  { type: "marketing", patterns: [/marketing/, /campaign/, /brand/, /go-?to-?market/] },
  { type: "product", patterns: [/product\s*launch/, /product\s*design/, /roadmap/, /feature/, /saas/, /\bux\b/, /\bui\b/] },
  { type: "sales", patterns: [/sales/, /pipeline/, /quota/, /prospect/] },
  { type: "portfolio", patterns: [/portfolio/, /case\s*stud/, /design\s*portfolio/] },
  { type: "nonprofit", patterns: [/nonprofit/, /charity/, /donor/, /mission\s*impact/] },
  { type: "reports", patterns: [/okr/, /qbr/, /quarterly/, /board\s*update/, /report/] },
  { type: "events", patterns: [/webinar/, /conference/, /keynote/, /event/] },
  { type: "personal", patterns: [/personal\s*brand/, /interview/, /about\s*me/] },
  { type: "business", patterns: [/business/, /strategy/, /executive/, /corporate/] },
  { type: "creative", patterns: [/creative/, /agency/, /design\s*review/, /product\s*design/, /design\s*system/] },
];

const INDUSTRY_RULES: { industry: string; patterns: RegExp[] }[] = [
  { industry: "healthcare", patterns: [/health\s*care/, /healthcare/, /medical/, /clinic/, /hospital/] },
  { industry: "artificial intelligence", patterns: [/\bai\b/, /machine\s*learning/, /\bllm\b/, /artificial\s*intelligence/] },
  { industry: "finance", patterns: [/fintech/, /finance/, /banking/, /payments?/] },
  { industry: "education", patterns: [/education/, /edtech/, /school/] },
  { industry: "climate", patterns: [/climate/, /sustainab/, /green\s*tech/] },
  { industry: "software", patterns: [/software/, /saas/, /platform/, /app\b/] },
  { industry: "design", patterns: [/product\s*design/, /\bux\b/, /\bui\b/, /design\s*system/, /figma/] },
];

const STYLE_RULES: { style: VisualStyle; patterns: RegExp[] }[] = [
  { style: "modern", patterns: [/modern/, /sleek/, /clean/] },
  { style: "minimal", patterns: [/minimal/, /simple/, /quiet/] },
  { style: "corporate", patterns: [/corporate/, /enterprise/, /executive/] },
  { style: "playful", patterns: [/playful/, /fun/, /friendly\s*visual/] },
  { style: "bold", patterns: [/bold/, /high\s*contrast/, /dramatic/] },
  { style: "gradient", patterns: [/gradient/, /vibrant/] },
  { style: "editorial", patterns: [/editorial/, /magazine/] },
  { style: "classic", patterns: [/classic/, /traditional/] },
];

const TONE_RULES: { tone: Tone; patterns: RegExp[] }[] = [
  { tone: "professional", patterns: [/professional/, /polished/, /credible/] },
  { tone: "friendly", patterns: [/friendly/, /warm/, /approachable/] },
  { tone: "authoritative", patterns: [/authoritative/, /expert/, /credible/] },
  { tone: "inspirational", patterns: [/inspirational/, /visionary/, /bold\s*vision/] },
  { tone: "casual", patterns: [/casual/, /conversational/] },
  { tone: "academic", patterns: [/academic/, /research/, /scholarly/] },
];

const AUDIENCE_RULES: { audience: string; patterns: RegExp[] }[] = [
  { audience: "investors", patterns: [/investor/, /vc/, /venture/, /\byc\b/, /y\s*combinator/] },
  { audience: "students", patterns: [/student/, /high\s*school/, /classroom/, /professor/] },
  { audience: "executives", patterns: [/executive/, /board/, /c-?suite/] },
  { audience: "customers", patterns: [/customer/, /user/, /buyer/] },
  { audience: "donors", patterns: [/donor/, /philanthrop/] },
];

export function analyzePresentationIntent(raw: string): PresentationIntent {
  const lower = raw.toLowerCase();
  const expanded = expandQueryText(raw).toLowerCase();

  let presentationType: PresentationType | undefined;
  for (const rule of TYPE_RULES) {
    if (rule.patterns.some((p) => p.test(lower) || p.test(expanded))) {
      presentationType = rule.type;
      break;
    }
  }

  const industry = INDUSTRY_RULES.filter((r) =>
    r.patterns.some((p) => p.test(lower))
  ).map((r) => r.industry);

  const visualStyle = STYLE_RULES.filter((r) =>
    r.patterns.some((p) => p.test(lower))
  ).map((r) => r.style);

  const tone = TONE_RULES.filter((r) =>
    r.patterns.some((p) => p.test(lower))
  ).map((r) => r.tone);

  const audience = AUDIENCE_RULES.filter((r) =>
    r.patterns.some((p) => p.test(lower))
  ).map((r) => r.audience);

  if (visualStyle.length === 0 && /modern|sleek/.test(lower)) {
    visualStyle.push("modern");
  }
  if (tone.length === 0) {
    tone.push(presentationType === "education" ? "friendly" : "professional");
  }

  let themeHint: ThemeId | undefined;
  if (/apple/.test(lower)) themeHint = "apple";
  else if (/dark/.test(lower)) themeHint = "dark";
  else if (/luxury/.test(lower)) themeHint = "luxury";
  else if (/corporate|executive/.test(lower)) themeHint = "corporate";
  else if (/modern|minimal/.test(lower)) themeHint = "minimal";
  else if (/startup|pitch|investor/.test(lower)) themeHint = "startup";

  const subject = extractSubject(raw);
  const keywords = Array.from(
    new Set(
      tokenize(expandQueryText(raw)).filter(
        (t) =>
          ![
            "create",
            "make",
            "build",
            "need",
            "want",
            "presentation",
            "deck",
            "slides",
            "template",
            "for",
            "with",
            "the",
            "and",
          ].includes(t)
      )
    )
  ).slice(0, 16);

  const slideCount = extractSlideCount(raw) ?? undefined;

  const bits = [
    presentationType && `${presentationType} deck`,
    industry.length && industry.join(" / "),
    audience.length && `for ${audience.join(", ")}`,
    visualStyle.length && `${visualStyle.join(", ")} style`,
    slideCount && `${slideCount} slides`,
  ].filter(Boolean);

  return {
    raw,
    presentationType,
    industry,
    audience,
    visualStyle,
    tone,
    keywords,
    slideCount,
    themeHint,
    subject,
    summary: bits.length ? bits.join(" · ") : raw.slice(0, 120),
  };
}

function extractSubject(text: string): string | undefined {
  if (/steve\s*jobs/i.test(text)) return "Steve Jobs";
  const m =
    text.match(
      /(?:for|about|on)\s+(?:an?\s+)?(.+?)(?:\s+in\s+\d+\s+slides?|\s+template|$)/i
    ) ?? text.match(/biography(?:\s+presentation)?(?:\s+for|\s+of)\s+(.+)/i);
  if (!m?.[1]) return undefined;
  const subject = m[1]
    .replace(/\b(modern|investor|pitch|deck|slides?|template)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return subject.length > 2 ? subject : undefined;
}

/** True when the user is asking to start / find a deck (vs. edit the current one). */
export function isTemplateDiscoveryIntent(text: string): boolean {
  const lower = text.toLowerCase();
  if (
    /^(make this|restyle|shorter|longer|add a|remove|change the|rewrite|edit)/i.test(
      lower.trim()
    )
  ) {
    return false;
  }
  return (
    /\b(create|make|build|generate|need|want|find|recommend|suggest)\b/.test(lower) ||
    /\b(presentation|deck|template|pitch|biography|lesson)\b/.test(lower) ||
    /\b\d+\s*-?\s*slides?\b/.test(lower)
  );
}
