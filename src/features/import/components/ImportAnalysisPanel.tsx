"use client";

import { MessageSquareWarning, Mic, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ImportAnalysis } from "@/features/import/types";
import { useFeedbackStore } from "@/features/feedback/store";
import { useResearchStore } from "@/features/research/store";
import { usePresentationStore } from "@/store/presentation-store";

const TRANSFORM_EXAMPLES = [
  {
    label: "Student",
    source: "professor" as const,
    text: "Slides 3–5 are too text-heavy. Add recent statistics and improve the conclusion.",
  },
  {
    label: "Consultant",
    source: "manager" as const,
    text: "Update branding to the client’s new colors. Align all titles. Replace every icon.",
  },
  {
    label: "Founder",
    source: "investor" as const,
    text: "Make this more persuasive for investors. Improve visual hierarchy and add speaker notes.",
  },
];

/**
 * Post-import hub — import is the on-ramp; Feedback redesign + Research are the product.
 */
export function ImportAnalysisPanel({
  analysis,
  onDone,
  onOpenFeedback,
  onOpenResearch,
}: {
  analysis: ImportAnalysis;
  onBack?: () => void;
  onDone?: () => void;
  onOpenFeedback?: () => void;
  onOpenResearch?: () => void;
}) {
  const presentation = usePresentationStore((s) => s.presentation);
  const setPanelTab = usePresentationStore((s) => s.setPanelTab);
  const setLibraryTab = usePresentationStore((s) => s.setLibraryTab);
  const setFeedbackInput = useFeedbackStore((s) => s.setInput);
  const setSourceKind = useFeedbackStore((s) => s.setSourceKind);
  const setResearchInput = useResearchStore((s) => s.setInput);

  function goFeedback(example?: (typeof TRANSFORM_EXAMPLES)[number]) {
    if (example) {
      setSourceKind(example.source);
      setFeedbackInput(example.text);
    }
    onOpenFeedback?.();
    setPanelTab("feedback");
  }

  function goResearch() {
    const seed =
      presentation.title && !/untitled|imported/i.test(presentation.title)
        ? presentation.title
        : presentation.slides[0]?.title || "";
    if (seed) setResearchInput(seed);
    onOpenResearch?.();
    setLibraryTab("research");
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-bold text-zinc-950">
          Deck ready to transform
        </p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
          You brought existing work into Decksmith — now redesign it with
          feedback, enrich it with research, or tell the editor what to change.
        </p>
      </div>

      <div className="grid gap-2">
        <button
          type="button"
          onClick={() => goFeedback()}
          className="flex items-start gap-3 rounded-2xl border border-zinc-900 bg-zinc-950 px-4 py-3.5 text-left text-white transition hover:bg-zinc-800"
        >
          <MessageSquareWarning className="mt-0.5 h-4 w-4 shrink-0 opacity-90" />
          <span>
            <span className="block text-sm font-semibold">
              Redesign from feedback
            </span>
            <span className="mt-0.5 block text-[11px] leading-snug text-white/70">
              Paste professor, client, or investor comments → preview actions →
              apply
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={goResearch}
          className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3.5 text-left transition hover:border-zinc-400 hover:bg-zinc-50"
        >
          <Search className="mt-0.5 h-4 w-4 shrink-0 text-zinc-700" />
          <span>
            <span className="block text-sm font-semibold text-zinc-950">
              Research Mode
            </span>
            <span className="mt-0.5 block text-[11px] leading-snug text-zinc-500">
              Find current stats, sources, and citations to strengthen this deck
            </span>
          </span>
        </button>
      </div>

      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
          Try a real workflow
        </p>
        <div className="mt-2 space-y-2">
          {TRANSFORM_EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              type="button"
              onClick={() => goFeedback(ex)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 text-left transition hover:border-zinc-400 hover:bg-white"
            >
              <p className="text-[11px] font-semibold text-zinc-800">
                {ex.label}
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">
                “{ex.text}”
              </p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2.5">
        <div className="flex items-center gap-2 text-zinc-600">
          <Mic className="h-3.5 w-3.5" />
          <p className="text-[11px] leading-snug">
            Or say: “Make this look like an Apple Keynote.” · “Reduce this to 15
            slides.” · “Replace every icon.”
          </p>
        </div>
        {analysis.estimatedMinutes > 0 && (
          <p className="mt-2 text-[11px] text-zinc-400">
            ~{analysis.estimatedMinutes} min estimated speaking time
          </p>
        )}
      </section>

      {onDone && (
        <Button type="button" variant="secondary" className="w-full" onClick={onDone}>
          Keep editing on canvas
        </Button>
      )}
    </div>
  );
}
