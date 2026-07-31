import type { ResearchBundle } from "@/features/research/types";
import type { Presentation, Slide } from "@/lib/types";
import { uid } from "@/lib/utils";

/** Turn research outline into a Presentation the studio can load. */
export function researchBundleToPresentation(
  bundle: ResearchBundle
): Presentation {
  const now = new Date().toISOString();
  const slides: Slide[] = [
    {
      id: uid("slide"),
      layout: "hero",
      title: bundle.topic,
      subtitle: "Research-backed narrative",
      body: bundle.summary,
      notes: bundle.outline[0]?.speakerNotes,
    },
    ...bundle.outline.map((beat, i) => {
      const isStats = i === 1 && bundle.statistics.length;
      if (isStats) {
        return {
          id: uid("slide"),
          layout: "stats" as const,
          title: beat.title,
          stats: bundle.statistics.slice(0, 3).map((s) => ({
            value: s.value,
            label: s.label,
          })),
          notes: [
            beat.speakerNotes,
            ...bundle.statistics.map((s) => {
              const cite = bundle.citations.find((c) => c.sourceId === s.sourceId);
              return cite ? `${s.value}: ${cite.inText}` : s.label;
            }),
          ]
            .filter(Boolean)
            .join(" · "),
          chartHint: beat.visualHint,
        };
      }
      return {
        id: uid("slide"),
        layout: "bullets" as const,
        title: beat.title,
        bullets: beat.bullets,
        imageHint: beat.visualHint,
        notes: beat.speakerNotes,
      };
    }),
    {
      id: uid("slide"),
      layout: "bullets",
      title: "References",
      subtitle: "Generated from research pack",
      bullets: bundle.citations.map((c) => c.apa).slice(0, 8),
      notes: "Verify stubs before external presentation.",
    },
  ];

  return {
    id: uid("deck"),
    title: bundle.topic,
    subtitle: "From Research Mode",
    themeId: "minimal",
    slides,
    createdAt: now,
    updatedAt: now,
  };
}
