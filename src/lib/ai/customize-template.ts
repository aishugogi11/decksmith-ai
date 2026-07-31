import { fitSlideCount } from "@/lib/mock-ai";
import type { PresentationIntent, TemplateRecord } from "@/lib/template-engine/types";
import type { Presentation, Slide, SlideLayout, ThemeId } from "@/lib/types";
import { uid } from "@/lib/utils";

/**
 * AI personalization: keep every slide layout, rewrite copy + media hints
 * from the user's intent. Mock generator today — swap body for an LLM later.
 */
export function customizeTemplateWithAI(
  template: TemplateRecord,
  intent: PresentationIntent
): Presentation {
  const now = new Date().toISOString();
  const subject =
    intent.subject ||
    guessSubject(intent) ||
    template.name.replace(/\btemplate\b/i, "").trim();
  const themeId: ThemeId =
    intent.themeHint ||
    (intent.visualStyle.includes("minimal") || intent.visualStyle.includes("modern")
      ? intent.presentationType === "pitch"
        ? "startup"
        : "minimal"
      : template.themeId);

  const slides: Slide[] = template.slides.map((skeleton, index) =>
    personalizeSlide(skeleton, index, subject, intent, template)
  );

  let presentation: Presentation = {
    id: uid("deck"),
    title: titleFor(subject, intent, template),
    subtitle: intent.summary || template.description,
    themeId,
    slides,
    createdAt: now,
    updatedAt: now,
  };

  if (intent.slideCount) {
    presentation = fitSlideCount(presentation, intent.slideCount);
  }

  return presentation;
}

function guessSubject(intent: PresentationIntent): string | undefined {
  const industry = intent.industry[0];
  if (intent.presentationType === "pitch" && industry) {
    return `${capitalize(industry)} startup`;
  }
  if (intent.keywords.length) {
    return capitalize(intent.keywords.slice(0, 4).join(" "));
  }
  return undefined;
}

function titleFor(
  subject: string,
  intent: PresentationIntent,
  template: TemplateRecord
): string {
  if (intent.presentationType === "pitch") return `${subject} — Pitch`;
  if (intent.presentationType === "biography") return `${subject} — Biography`;
  if (intent.presentationType === "education") return `${subject}`;
  return subject || template.name;
}

function personalizeSlide(
  skeleton: Omit<Slide, "id">,
  index: number,
  subject: string,
  intent: PresentationIntent,
  template: TemplateRecord
): Slide {
  const layout = skeleton.layout;
  const industry = intent.industry[0] ?? "your market";
  const audience = intent.audience[0] ?? "your audience";
  const base: Slide = {
    ...structuredClone(skeleton),
    id: uid("slide"),
  };

  const content = contentForLayout(layout, index, subject, industry, audience, intent);

  return {
    ...base,
    ...content,
    // Preserve layout always
    layout,
    imageHint: content.imageHint ?? suggestImage(layout, subject, industry),
    chartHint: content.chartHint ?? (layout === "chart" ? suggestChart(subject, industry) : base.chartHint),
    notes: content.notes ?? `Speak to ${audience}. Template: ${template.name}.`,
  };
}

function contentForLayout(
  layout: SlideLayout,
  index: number,
  subject: string,
  industry: string,
  audience: string,
  intent: PresentationIntent
): Partial<Slide> {
  const isPitch = intent.presentationType === "pitch";
  const isBio = intent.presentationType === "biography";
  const isHealthAi =
    intent.industry.includes("healthcare") &&
    intent.industry.includes("artificial intelligence");

  switch (layout) {
    case "hero":
      return {
        title: isBio ? subject : subject,
        subtitle: isPitch
          ? isHealthAi
            ? "AI that makes care teams faster and patients safer"
            : `Modern ${industry} story for ${audience}`
          : intent.summary,
        body: isPitch ? "Confidential · Seed / Series narrative" : undefined,
        imageHint: `${subject} hero · ${intent.visualStyle[0] ?? "modern"} product atmosphere`,
      };
    case "section":
      return {
        title: isPitch
          ? index <= 1
            ? "The problem"
            : "Our solution"
          : baseSectionTitle(index, subject),
        subtitle: isPitch ? `Felt daily by ${audience} in ${industry}` : undefined,
        body: isPitch
          ? index <= 1
            ? `Teams in ${industry} waste hours on fragmented tools and late insights.`
            : `${subject} unifies the workflow with AI copilots built for real clinical and ops constraints.`
          : `Key narrative beat for ${subject}.`,
        callout: isPitch ? "Pain is frequent, expensive, and still underserved." : undefined,
      };
    case "bullets":
      return {
        title: isPitch ? "Why now" : `What matters about ${subject}`,
        bullets: isPitch
          ? [
              "Regulatory + data readiness finally allow AI in the loop",
              "Buyers already budget for workflow software",
              "Models are good enough for assistive, audited use cases",
              "Incumbents are slow — startups can win the wedge",
            ]
          : [
              `Define the core story of ${subject}`,
              `Connect it to ${audience}`,
              "Show proof, not slogans",
              "End with a clear next step",
            ],
      };
    case "stats":
      return {
        title: isPitch ? "Traction" : "At a glance",
        subtitle: "Update with your real numbers",
        stats: [
          { value: isPitch ? "$0" : "01", label: isPitch ? "ARR" : "Milestone" },
          { value: isPitch ? "12" : "02", label: isPitch ? "Design partners" : "Proof point" },
          { value: isPitch ? "40%" : "03", label: isPitch ? "Time saved (pilot)" : "Outcome" },
        ],
      };
    case "timeline":
      return {
        title: isBio ? "A life in chapters" : "Roadmap",
        timeline: isBio
          ? [
              { title: "Beginnings", description: `Formative years of ${subject}` },
              { title: "Breakthrough", description: "The work that changed the path" },
              { title: "Peak", description: "Defining achievements" },
              { title: "Legacy", description: "Why it still matters" },
            ]
          : [
              { title: "Now", description: "Beachhead wedge" },
              { title: "+6 mo", description: "Expand use cases" },
              { title: "+12 mo", description: "Platform layer" },
              { title: "+18 mo", description: "Category leadership" },
            ],
      };
    case "comparison":
      return {
        title: "How we’re different",
        comparison: [
          {
            title: "Status quo",
            items: ["Manual workflows", "Siloed data", "Generic AI chat"],
          },
          {
            title: subject,
            items: [
              `Built for ${industry}`,
              "Audit-ready assistance",
              "Workflow-native UX",
            ],
          },
        ],
      };
    case "process":
      return {
        title: isPitch ? "Go-to-market" : "How it works",
        process: [
          { title: "Wedge", description: `Win a sharp ${industry} use case` },
          { title: "Prove", description: "Measurable time / quality gains" },
          { title: "Expand", description: `Land adjacent teams for ${audience}` },
        ],
      };
    case "quote":
      return {
        title: "In their words",
        quote: isBio
          ? `A defining idea associated with ${subject}.`
          : "This is the first AI tool our team trusts in the daily workflow.",
        quoteAuthor: isBio ? subject : "Design partner · Ops lead",
      };
    case "image":
      return {
        title: "Product atmosphere",
        subtitle: subject,
        body: `Visual of ${subject} in a ${industry} context.`,
        imageHint: suggestImage("image", subject, industry),
      };
    case "chart":
      return {
        title: "Where value compounds",
        subtitle: industry,
        chartHint: suggestChart(subject, industry),
        bullets: [
          "Baseline workflow cost",
          "With assistive AI",
          "Projected at scale",
        ],
      };
    case "thankyou":
      return {
        title: isPitch ? "Let’s build together" : "Questions?",
        subtitle: isPitch ? "The ask" : subject,
        body: isPitch
          ? "Raising to accelerate product, clinical validation, and GTM."
          : "Happy to go deeper on any slide.",
      };
    default:
      return { title: subject };
  }
}

function baseSectionTitle(index: number, subject: string): string {
  const titles = ["Context", "The idea", "Proof", "Implications", "Next steps"];
  return titles[Math.min(index, titles.length - 1)] ?? subject;
}

function suggestImage(layout: SlideLayout, subject: string, industry: string): string {
  if (layout === "hero") return `${subject} · cinematic ${industry} workspace`;
  return `${industry} · ${subject} · editorial photo · soft light`;
}

function suggestChart(subject: string, industry: string): string {
  return `Bar chart: ${subject} impact across ${industry} workflows`;
}

function capitalize(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}
