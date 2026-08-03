import type { Presentation } from "@/lib/types";
import { uid } from "@/lib/utils";

/**
 * Realistic “imported” investor deck for the product demo —
 * intentional density issues so Redesign / Coach / Voice have something to fix.
 */
export function createImportedPitchDemo(): Presentation {
  const now = new Date().toISOString();
  const slides = [
    {
      id: uid("slide"),
      layout: "hero" as const,
      title: "NovaCare",
      subtitle: "Clinical documentation that writes itself",
      body: "Series A pitch",
      notes: "Open with the problem — not the product.",
    },
    {
      id: uid("slide"),
      layout: "section" as const,
      title: "The problem",
      subtitle: "Clinicians drown in paperwork",
      body: "Physicians spend nearly two hours on documentation for every hour of patient care. Burnout is rising. Accuracy suffers. Patients wait.",
      bullets: [
        "2 hours documentation per 1 hour of care",
        "EHR interfaces designed for billing, not clinicians",
        "Notes are late, incomplete, or copy-pasted",
        "Hospitals lose revenue to under-coding",
        "No real-time coaching for junior residents",
        "Existing scribes are expensive and don’t scale",
      ],
      notes: "Too many bullets — Redesign will shorten this.",
      objects: [
        {
          id: uid("obj"),
          type: "textbox" as const,
          x: 8,
          y: 78,
          w: 84,
          h: 10,
          text: "Slide is text-heavy — perfect for Feedback → Redesign",
          fontSize: 14,
        },
      ],
    },
    {
      id: uid("slide"),
      layout: "bullets" as const,
      title: "Our solution",
      subtitle: "Ambient listening that drafts the note while you talk",
      bullets: [
        "Listens in the exam room (with consent)",
        "Drafts SOAP notes in under 60 seconds",
        "Clinician reviews and signs — always in control",
        "Integrates with Epic, Cerner, and athenahealth",
      ],
      objects: [
        {
          id: uid("obj"),
          type: "chart" as const,
          x: 58,
          y: 38,
          w: 36,
          h: 42,
          chartHint: "Time saved per encounter",
        },
      ],
    },
    {
      id: uid("slide"),
      layout: "stats" as const,
      title: "Traction",
      subtitle: "Early proof from three health systems",
      stats: [
        { value: "14k", label: "Notes drafted / week" },
        { value: "41%", label: "Less after-hours charting" },
        { value: "$2.1M", label: "ARR · growing 18% MoM" },
      ],
      body: "We need fresher market stats — Research Mode can pull them.",
    },
    {
      id: uid("slide"),
      layout: "comparison" as const,
      title: "Why we win",
      subtitle: "Purpose-built for clinical workflows",
      comparison: [
        {
          title: "Generic note tools",
          items: ["Hallucinate meds", "No EHR write-back", "One-size prompts"],
        },
        {
          title: "NovaCare",
          items: [
            "Specialty models",
            "Signed write-back",
            "Audit trail + citations",
          ],
        },
      ],
    },
    {
      id: uid("slide"),
      layout: "section" as const,
      title: "The ask",
      subtitle: "Raising $18M Series A",
      body: "Fuel clinical expansion across 40 hospitals and deepen EHR integrations. Use of funds: 45% engineering, 30% clinical success, 25% go-to-market.",
      callout: "Conclusion is soft — Coach will flag it.",
    },
    {
      id: uid("slide"),
      layout: "thankyou" as const,
      title: "Let’s rewrite the note",
      subtitle: "nova.care · investors@nova.care",
      body: "Questions welcome.",
    },
  ];

  return {
    id: uid("deck"),
    title: "NovaCare — Series A",
    subtitle: "Demo: imported deck ready to transform",
    themeId: "startup",
    slides,
    createdAt: now,
    updatedAt: now,
    importMeta: {
      sourceFormat: "pptx",
      sourceFileName: "NovaCare_SeriesA_v3.pptx",
      importedAt: now,
      counts: {
        slides: slides.length,
        textboxes: 3,
        images: 0,
        charts: 1,
        shapes: 0,
        notes: 2,
      },
      warnings: [],
    },
  };
}

export const DEMO_FEEDBACK = {
  source: "investor" as const,
  text: `Slides 2 is too text-heavy — cut to three bullets max.
Add a recent market statistic with a citation.
The conclusion isn't convincing — make the ask sharper.
Improve visual hierarchy so titles dominate.`,
};

export const DEMO_VOICE_EXAMPLES = [
  "Make this look like an Apple Keynote.",
  "Redesign this for Instagram.",
  "Create a textbox that says Clinical proof",
  "Reduce the text on slide 2.",
];
