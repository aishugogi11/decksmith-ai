import { uid } from "@/lib/utils";
import type {
  ResearchBundle,
  ResearchStageId,
  ResearchStageState,
} from "@/features/research/types";

const STAGE_DEFS: { id: ResearchStageId; label: string }[] = [
  { id: "search", label: "Searching the web" },
  { id: "sources", label: "Extracting trustworthy sources" },
  { id: "statistics", label: "Finding statistics" },
  { id: "citations", label: "Generating citations" },
  { id: "outline", label: "Creating slide outline" },
  { id: "notes", label: "Writing speaker notes" },
  { id: "visuals", label: "Suggesting visuals" },
  { id: "generate", label: "Generating presentation structure" },
];

export function initialResearchStages(): ResearchStageState[] {
  return STAGE_DEFS.map((s) => ({
    id: s.id,
    label: s.label,
    status: "pending",
  }));
}

export type ResearchProgress = {
  stages: ResearchStageState[];
  stage: ResearchStageId;
  message: string;
};

/**
 * Research pipeline — mock providers today, same I/O for real search later.
 * input → search → sources → stats → citations → outline → notes → visuals → structure
 */
export async function runResearchPipeline(
  topic: string,
  onProgress?: (p: ResearchProgress) => void
): Promise<ResearchBundle> {
  const trimmed = topic.trim();
  if (!trimmed) throw new Error("Enter a research topic.");

  let stages = initialResearchStages();
  const bump = async (
    id: ResearchStageId,
    detail: string,
    delay = 220
  ) => {
    stages = stages.map((s) =>
      s.id === id
        ? { ...s, status: "running" as const, detail }
        : s.status === "running"
          ? { ...s, status: "done" as const }
          : s
    );
    onProgress?.({ stages: [...stages], stage: id, message: detail });
    await wait(delay);
    stages = stages.map((s) =>
      s.id === id ? { ...s, status: "done" as const, detail } : s
    );
    onProgress?.({ stages: [...stages], stage: id, message: detail });
  };

  await bump("search", "Searching…", 280);

  const sources = mockSources(trimmed);
  await bump("sources", `✓ ${sources.length} sources`, 240);

  const statistics = mockStats(trimmed, sources);
  await bump("statistics", `✓ ${statistics.length} statistics`, 240);

  const citations = sources.map((s) => ({
    id: uid("rcite"),
    sourceId: s.id,
    apa: `${s.publisher}. (${new Date().getFullYear()}). ${s.title}. ${s.url}`,
    inText: `(${s.publisher.split(" ")[0]}, ${new Date().getFullYear()})`,
  }));
  await bump("citations", `✓ ${citations.length} citations`, 200);

  const outline = mockOutline(trimmed, statistics);
  await bump("outline", "Creating outline…", 260);

  // Attach speaker notes
  const withNotes = outline.map((beat) => ({
    ...beat,
    speakerNotes:
      beat.speakerNotes ||
      `Talk track: ${beat.title}. Pause after the key number. Ask if they want the source.`,
  }));
  await bump("notes", "Speaker notes ready", 180);

  const visualSuggestions = [
    `${trimmed} workplace · candid · soft daylight`,
    "Simple bar chart · before / after",
    "Wide negative space · single object hero",
  ];
  await bump("visuals", `✓ ${visualSuggestions.length} visual ideas`, 180);

  await bump("generate", "Finished", 200);

  return {
    topic: trimmed,
    sources,
    statistics,
    citations,
    outline: withNotes,
    visualSuggestions,
    summary: `Research pack for “${trimmed}”: ${sources.length} sources, ${statistics.length} stats, ${withNotes.length} outline beats.`,
  };
}

function mockSources(topic: string) {
  const year = new Date().getFullYear();
  return [
    {
      id: uid("src"),
      title: `${topic}: market overview ${year}`,
      url: `https://example.com/research/${slug(topic)}-market`,
      publisher: "Industry Insights",
      trustScore: 0.82,
      snippet: `Directional overview of ${topic} adoption and spend.`,
    },
    {
      id: uid("src"),
      title: `Peer-reviewed notes on ${topic}`,
      url: `https://doi.org/10.1000/${slug(topic)}`,
      publisher: "Academic Review",
      trustScore: 0.9,
      snippet: "Methodology-backed findings — verify before investor use.",
    },
    {
      id: uid("src"),
      title: `${topic} buyer survey`,
      url: `https://example.com/surveys/${slug(topic)}`,
      publisher: "Survey Collective",
      trustScore: 0.76,
      snippet: "Synthetic survey stub for pipeline demos.",
    },
  ];
}

function mockStats(
  topic: string,
  sources: ReturnType<typeof mockSources>
) {
  return [
    {
      id: uid("stat"),
      value: "67%",
      label: `Buyers evaluating ${topic} this year`,
      sourceId: sources[2]?.id ?? sources[0].id,
      year: String(new Date().getFullYear()),
    },
    {
      id: uid("stat"),
      value: "3.2×",
      label: "Projected category growth (decade)",
      sourceId: sources[0].id,
    },
    {
      id: uid("stat"),
      value: "12–18 mo",
      label: "Typical proof window for new workflows",
      sourceId: sources[1].id,
    },
  ];
}

function mockOutline(
  topic: string,
  stats: ReturnType<typeof mockStats>
) {
  return [
    {
      title: `Why ${topic} matters now`,
      bullets: [
        "The shift in buyer behavior",
        "Cost of the status quo",
        "What changed in the last 18 months",
      ],
      visualHint: "Hero with one sharp metric",
      speakerNotes: "Open with the tension — not the product.",
    },
    {
      title: "The numbers",
      bullets: stats.map((s) => `${s.value} — ${s.label}`),
      visualHint: "Bar chart · key metrics",
      speakerNotes: "Cite sources verbally; don't read every digit.",
    },
    {
      title: "How it works",
      bullets: ["Input", "Insight", "Action"],
      visualHint: "3-step process",
    },
    {
      title: "What to do next",
      bullets: [
        "Pick one workflow to prove",
        "Instrument one metric",
        "Schedule the follow-up",
      ],
      visualHint: "Clear CTA card",
      speakerNotes: "End with a decision, not a summary.",
    },
  ];
}

function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
