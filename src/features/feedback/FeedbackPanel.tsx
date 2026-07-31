"use client";

import { Check, Loader2, MessageSquareWarning, Sparkles } from "lucide-react";
import { ProBadge, ProGate } from "@/features/subscription";
import { useFeedbackStore } from "@/features/feedback/store";
import { usePresentationStore } from "@/store/presentation-store";
import { cn } from "@/lib/utils";

const SOURCE_OPTIONS = [
  { id: "general", label: "General" },
  { id: "youtube", label: "YouTube" },
  { id: "instagram", label: "Instagram" },
  { id: "professor", label: "Professor" },
  { id: "manager", label: "Manager" },
  { id: "investor", label: "Investor" },
  { id: "customer", label: "Customer" },
  { id: "rubric", label: "Rubric" },
] as const;

const WORKFLOW_EXAMPLES = [
  {
    label: "Student",
    source: "professor" as const,
    text: "Slides 3–5 are too text-heavy. Add recent statistics and improve the conclusion.",
  },
  {
    label: "Consultant",
    source: "manager" as const,
    text: "Use the client’s new brand colors. Replace every icon. Align all titles.",
  },
  {
    label: "Founder",
    source: "investor" as const,
    text: "Make this more persuasive for investors. Improve visual hierarchy and add speaker notes.",
  },
];

export function FeedbackPanel() {
  const input = useFeedbackStore((s) => s.input);
  const setInput = useFeedbackStore((s) => s.setInput);
  const sourceKind = useFeedbackStore((s) => s.sourceKind);
  const setSourceKind = useFeedbackStore((s) => s.setSourceKind);
  const analyze = useFeedbackStore((s) => s.analyze);
  const result = useFeedbackStore((s) => s.result);
  const status = useFeedbackStore((s) => s.status);
  const progressMessage = useFeedbackStore((s) => s.progressMessage);
  const processing = useFeedbackStore((s) => s.processing);
  const error = useFeedbackStore((s) => s.error);
  const dismissAction = useFeedbackStore((s) => s.dismissAction);
  const applyActions = useFeedbackStore((s) => s.applyActions);

  const presentation = usePresentationStore((s) => s.presentation);
  const selectedSlideId = usePresentationStore((s) => s.selectedSlideId);
  const editorSelection = usePresentationStore((s) => s.editorSelection);
  const undo = usePresentationStore((s) => s.undo);
  const selectSlide = usePresentationStore((s) => s.selectSlide);

  function commitApply(actionIds?: string[]) {
    applyActions({
      presentation,
      selectedSlideId,
      selection: editorSelection,
      actionIds,
      onApplied: ({ presentation: next, selectedSlideId: sid, selection }) => {
        usePresentationStore.setState((state) => ({
          past: [
            ...state.past,
            {
              presentation: structuredClone(state.presentation),
              selectedSlideId: state.selectedSlideId,
              editorSelection: structuredClone(state.editorSelection),
            },
          ].slice(-40),
          future: [],
          presentation: next,
          selectedSlideId: sid,
          editorSelection: selection,
          messages: [
            ...state.messages,
            {
              id: `msg_${Date.now()}`,
              role: "assistant" as const,
              content: actionIds?.length
                ? "Applied selected redesign action(s)."
                : "Applied all redesign actions from feedback.",
              createdAt: new Date().toISOString(),
            },
          ],
        }));
      },
    });
  }

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-zinc-950">
              AI Redesign
            </p>
            <ProBadge />
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Turn comments on an existing deck into previewable redesign actions —
            then apply what you want.
          </p>
          <button
            type="button"
            onClick={() =>
              usePresentationStore.getState().setPanelTab("coach")
            }
            className="mt-1 text-[11px] font-medium text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline"
          >
            After applying — run Presentation Coach →
          </button>
        </div>
        <MessageSquareWarning className="h-4 w-4 text-zinc-400" />
      </div>

      <ProGate
        feature="feedback_redesign"
        reason="Feedback → Redesign turns comments into deterministic editor actions. Available on Pro."
      >
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {SOURCE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSourceKind(opt.id)}
                className={cn(
                  "rounded-lg px-2 py-1 text-[10px] font-semibold transition",
                  sourceKind === opt.id
                    ? "bg-zinc-950 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {WORKFLOW_EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                type="button"
                onClick={() => {
                  setSourceKind(ex.source);
                  setInput(ex.text);
                }}
                className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[10px] font-semibold text-zinc-700 hover:border-zinc-400"
              >
                Try: {ex.label}
              </button>
            ))}
          </div>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={6}
            placeholder={`Paste feedback on this deck…\n\nExample:\nSlides 3–5 are too text-heavy.\nAdd recent statistics.\nImprove the conclusion.`}
            className="w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-[13px] leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:outline-none"
          />

          <button
            type="button"
            disabled={processing || !input.trim()}
            onClick={() => void analyze(presentation)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {processing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Analyze feedback
          </button>

          {(processing || status === "ready") && progressMessage && (
            <p className="text-[11px] font-medium text-zinc-500">
              {progressMessage}
            </p>
          )}
          {error && (
            <p className="text-[11px] text-red-600">{error}</p>
          )}
        </div>
      </ProGate>

      {result && (
        <div className="space-y-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
              Issues found
            </p>
            <ul className="mt-2 space-y-1.5">
              {result.issues.map((issue) => (
                <li
                  key={issue.id}
                  className="flex items-start gap-2 text-sm text-zinc-800"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>
                    {issue.label}
                    {issue.quote ? (
                      <span className="block text-[11px] text-zinc-500">
                        “{issue.quote}”
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
              Mapped to slides
            </p>
            <div className="mt-2 space-y-2">
              {result.slideMap.map((row) => (
                <button
                  key={row.slideId}
                  type="button"
                  onClick={() => selectSlide(row.slideId)}
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-left transition hover:bg-white"
                >
                  <p className="text-xs font-semibold text-zinc-950">
                    Slide {row.slideIndex + 1} — {row.slideTitle}
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {row.notes.slice(0, 4).map((n, i) => (
                      <li key={i} className="text-[11px] text-zinc-600">
                        · {n}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                Redesign preview
              </p>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={undo}
                  className="rounded-lg bg-zinc-100 px-2 py-1 text-[10px] font-semibold text-zinc-700"
                >
                  Undo
                </button>
                <button
                  type="button"
                  disabled={
                    processing ||
                    !result.actions.some((a) => a.status === "pending")
                  }
                  onClick={() => commitApply()}
                  className="rounded-lg bg-zinc-950 px-2 py-1 text-[10px] font-semibold text-white disabled:opacity-40"
                >
                  Apply all
                </button>
              </div>
            </div>
            <div className="mt-2 space-y-2">
              {result.actions.map((action) => (
                <div
                  key={action.id}
                  className={cn(
                    "rounded-2xl border px-3 py-2.5",
                    action.status === "applied"
                      ? "border-emerald-200 bg-emerald-50/60"
                      : action.status === "dismissed"
                        ? "border-zinc-100 bg-zinc-50 opacity-50"
                        : "border-zinc-200 bg-white"
                  )}
                >
                  <p className="text-xs font-semibold text-zinc-950">
                    {action.label}
                  </p>
                  <pre className="mt-1 overflow-x-auto rounded-lg bg-zinc-950 px-2 py-1.5 text-[10px] text-emerald-300">
                    {JSON.stringify(action.command, null, 2)}
                  </pre>
                  {action.status === "pending" && (
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => commitApply([action.id])}
                        className="rounded-lg bg-zinc-950 px-2.5 py-1 text-[10px] font-semibold text-white"
                      >
                        Apply
                      </button>
                      <button
                        type="button"
                        onClick={() => dismissAction(action.id)}
                        className="rounded-lg bg-zinc-100 px-2.5 py-1 text-[10px] font-semibold text-zinc-600"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                  {action.status === "applied" && (
                    <p className="mt-1 text-[10px] font-semibold text-emerald-700">
                      Applied
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-zinc-500">{result.summary}</p>
        </div>
      )}
    </section>
  );
}
