import type { PresentationIntent } from "@/lib/template-engine/types";
import type { Presentation, Slide } from "@/lib/types";

export type ResearchBundle = {
  stats: { value: string; label: string; source: string }[];
  citations: string[];
  imageSuggestions: string[];
  chartIdeas: string[];
  summary: string;
};

/**
 * Real-time research layer (mock today — swap for web search / data APIs).
 * Enriches decks with stats, citations, chart & image suggestions.
 */
export async function gatherResearch(
  intent: PresentationIntent
): Promise<ResearchBundle> {
  // Simulate latency of a research pass
  await new Promise((r) => setTimeout(r, 280));

  const industry = intent.industry[0] || "technology";
  const isAi = intent.industry.some((i) => /artificial|ai/i.test(i));
  const isHealth = intent.industry.some((i) => /health/i.test(i));
  const isPitch = intent.presentationType === "pitch";

  const stats = [
    isAi
      ? {
          value: "$200B+",
          label: "AI software market trajectory (decade)",
          source: "Industry consensus · verify before investor use",
        }
      : {
          value: "3.2×",
          label: `Digital spend growth in ${industry}`,
          source: "Synthetic research stub · replace with live API",
        },
    isHealth
      ? {
          value: "30%",
          label: "Clinician time lost to admin / documentation",
          source: "Common healthcare ops benchmark · cite primary study",
        }
      : {
          value: "67%",
          label: "Buyers who prioritize workflow AI in RFPs",
          source: "Synthetic survey stub",
        },
    isPitch
      ? {
          value: "12–18 mo",
          label: "Typical seed→Series A proof window",
          source: "Startup fundraising heuristics",
        }
      : {
          value: "2.4×",
          label: "Engagement lift with clear visual hierarchy",
          source: "Presentation design research stub",
        },
  ];

  const citations = [
    `Suggested cite: market sizing for ${industry} — pull latest from a primary analyst note.`,
    isHealth
      ? "Suggested cite: peer-reviewed study on clinical documentation burden."
      : "Suggested cite: recent earnings or usage report from a category leader.",
    "Always verify figures before board or YC interviews — stubs are directional only.",
  ];

  const imageSuggestions = [
    `${industry} workplace · candid · soft daylight`,
    isAi ? "Abstract neural / product UI mock · dark glass" : "Product in context · hands + screen",
    intent.visualStyle.includes("minimal")
      ? "Wide negative space · single object hero"
      : "Dynamic conference stage · shallow depth of field",
  ];

  const chartIdeas = [
    `Bar: adoption of ${industry} workflows (before / after)`,
    "Line: retention or weekly active usage over 6 months",
    isPitch ? "Funnel: leads → pilots → paid" : "Pie: time allocation by team",
  ];

  return {
    stats,
    citations,
    imageSuggestions,
    chartIdeas,
    summary: `Research pass for ${intent.summary || industry}: ${stats.length} stats, ${citations.length} citation prompts, ${imageSuggestions.length} image ideas.`,
  };
}

/** Merge research into slide stats / hints / notes without breaking layouts. */
export function applyResearchToPresentation(
  presentation: Presentation,
  research: ResearchBundle
): Presentation {
  const slides = presentation.slides.map((slide, index) =>
    enrichSlide(slide, index, research)
  );
  return {
    ...presentation,
    slides,
    updatedAt: new Date().toISOString(),
  };
}

function enrichSlide(
  slide: Slide,
  index: number,
  research: ResearchBundle
): Slide {
  const next = { ...slide };

  if (slide.layout === "stats" && research.stats.length) {
    next.stats = research.stats.slice(0, 3).map((s) => ({
      value: s.value,
      label: s.label,
    }));
    next.notes = [
      slide.notes,
      "Sources:",
      ...research.stats.slice(0, 3).map((s) => `• ${s.source}`),
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (slide.layout === "chart") {
    next.chartHint = research.chartIdeas[index % research.chartIdeas.length];
    next.notes = [slide.notes, `Citation: ${research.citations[0]}`]
      .filter(Boolean)
      .join("\n");
  }

  if (slide.layout === "image" || slide.layout === "hero") {
    next.imageHint =
      research.imageSuggestions[index % research.imageSuggestions.length];
  }

  if (slide.layout === "section" && index === 1 && research.stats[0]) {
    next.callout = `${research.stats[0].value} — ${research.stats[0].label}`;
  }

  return next;
}

export function formatResearchReply(research: ResearchBundle): string {
  const lines = [
    "I pulled a quick research pass:",
    ...research.stats.map((s) => `• ${s.value} ${s.label}`),
    "",
    "Citations to verify:",
    ...research.citations.map((c) => `• ${c}`),
    "",
    `Image ideas: ${research.imageSuggestions.slice(0, 2).join(" · ")}`,
  ];
  return lines.join("\n");
}
