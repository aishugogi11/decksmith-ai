"use client";

import { Loader2, Sparkles } from "lucide-react";
import { ProBadge, ProGate } from "@/features/subscription";
import { useCoachStore } from "@/features/coach/store";
import { usePresentationStore } from "@/store/presentation-store";
import { cn } from "@/lib/utils";

export function CoachPanel() {
  const report = useCoachStore((s) => s.report);
  const processing = useCoachStore((s) => s.processing);
  const error = useCoachStore((s) => s.error);
  const dismissed = useCoachStore((s) => s.dismissed);
  const analyze = useCoachStore((s) => s.analyze);
  const dismiss = useCoachStore((s) => s.dismiss);
  const applyRecommendation = useCoachStore((s) => s.applyRecommendation);

  const presentation = usePresentationStore((s) => s.presentation);
  const selectedSlideId = usePresentationStore((s) => s.selectedSlideId);
  const editorSelection = usePresentationStore((s) => s.editorSelection);
  const selectSlide = usePresentationStore((s) => s.selectSlide);
  const undo = usePresentationStore((s) => s.undo);
  const recommendPrompt = usePresentationStore((s) => s.recommendPrompt);

  const recommendations =
    report?.recommendations.filter((r) => !dismissed.includes(r.id)) ?? [];

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-zinc-950">
              Presentation Coach
            </p>
            <ProBadge />
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Estimated speaking time plus Apply / Rewrite suggestions on the open
            slides.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() =>
          usePresentationStore.getState().setPanelTab("feedback")
        }
        className="text-left text-[11px] font-medium text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline"
      >
        Came from feedback? Open Redesign →
      </button>

      <ProGate
        feature="presentation_coach"
        reason="Presentation Coach is available on EchoFlow Pro."
      >
        <button
          type="button"
          disabled={processing || !presentation.slides.length}
          onClick={() => analyze(presentation, recommendPrompt)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {processing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Analyze slides
        </button>
      </ProGate>

      {error && <p className="text-[11px] text-red-600">{error}</p>}

      {report && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
              Estimated speaking time
            </p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-zinc-950">
              ~{report.estimatedMinutes}
              <span className="text-lg font-semibold text-zinc-400"> min</span>
            </p>
            <p className="mt-1 text-xs text-zinc-500">{report.summary}</p>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                Suggestions
              </p>
              <button
                type="button"
                onClick={undo}
                className="text-[10px] font-semibold text-zinc-500"
              >
                Undo
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {recommendations.length === 0 ? (
                <p className="text-xs text-zinc-500">All suggestions handled.</p>
              ) : (
                recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="rounded-2xl border border-zinc-200 bg-white px-3 py-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs leading-relaxed text-zinc-800">
                        {rec.message}
                      </p>
                      <span
                        className={cn(
                          "shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase",
                          rec.severity === "critical" &&
                            "bg-red-100 text-red-700",
                          rec.severity === "warn" &&
                            "bg-amber-100 text-amber-800",
                          rec.severity === "info" && "bg-zinc-100 text-zinc-600"
                        )}
                      >
                        {rec.severity}
                      </span>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (rec.slideIndex != null) {
                            const id =
                              presentation.slides[rec.slideIndex]?.id;
                            if (id) selectSlide(id);
                          }
                          applyRecommendation({
                            rec,
                            presentation,
                            selectedSlideId,
                            selection: editorSelection,
                            onApplied: ({
                              presentation: next,
                              selectedSlideId: sid,
                              selection,
                            }) => {
                              usePresentationStore.setState((state) => ({
                                past: [
                                  ...state.past,
                                  {
                                    presentation: structuredClone(
                                      state.presentation
                                    ),
                                    selectedSlideId: state.selectedSlideId,
                                    editorSelection: structuredClone(
                                      state.editorSelection
                                    ),
                                  },
                                ].slice(-40),
                                future: [],
                                presentation: next,
                                selectedSlideId: sid,
                                editorSelection: selection,
                                coachReport: report.legacy,
                              }));
                            },
                          });
                        }}
                        className="rounded-lg bg-zinc-950 px-2.5 py-1 text-[10px] font-semibold text-white"
                      >
                        {rec.actionLabel}
                      </button>
                      <button
                        type="button"
                        onClick={() => dismiss(rec.id)}
                        className="rounded-lg bg-zinc-100 px-2.5 py-1 text-[10px] font-semibold text-zinc-600"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
