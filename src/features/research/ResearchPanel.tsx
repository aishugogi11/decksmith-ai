"use client";

import { useState } from "react";
import { Check, Loader2, Search } from "lucide-react";
import { ProBadge, ProGate } from "@/features/subscription";
import { useResearchStore } from "@/features/research/store";
import { usePresentationStore } from "@/store/presentation-store";
import { createCitation, upsertReferencesSlide } from "@/lib/ai/citations";
import { cn } from "@/lib/utils";

export function ResearchPanel() {
  const input = useResearchStore((s) => s.input);
  const setInput = useResearchStore((s) => s.setInput);
  const run = useResearchStore((s) => s.run);
  const stages = useResearchStore((s) => s.stages);
  const processing = useResearchStore((s) => s.processing);
  const output = useResearchStore((s) => s.output);
  const error = useResearchStore((s) => s.error);
  const toPresentation = useResearchStore((s) => s.toPresentation);
  const setTemplatesOpen = usePresentationStore((s) => s.setTemplatesOpen);
  const presentation = usePresentationStore((s) => s.presentation);
  const [intent, setIntent] = useState<"new" | "strengthen">("new");

  function loadDeck() {
    const deck = toPresentation();
    if (!deck) return;
    const style = usePresentationStore.getState().citationStyle;
    const citations = (output?.citations ?? []).map((c) => {
      const src = output?.sources.find((s) => s.id === c.sourceId);
      return createCitation(src?.url || c.apa, style);
    });
    const withRefs = upsertReferencesSlide(deck, citations, "References");

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
      presentation: withRefs,
      selectedSlideId: withRefs.slides[0]?.id ?? null,
      citations: [...state.citations, ...citations],
      coachReport: null,
      messages: [
        ...state.messages,
        {
          id: `msg_${Date.now()}`,
          role: "assistant" as const,
          content: output?.summary || "Research deck loaded.",
          createdAt: new Date().toISOString(),
        },
      ],
    }));
    setTemplatesOpen(false);
  }

  return (
    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-6">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-zinc-950">Research Mode</h3>
            <ProBadge />
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Evidence in — outline and citations out. Build a new deck, or
            strengthen the one on the canvas.
          </p>
        </div>
      </div>

      <ProGate
        feature="research_mode"
        reason="Research Mode is available on EchoFlow Pro."
      >
        <div className="space-y-4">
          <div className="flex gap-1.5 rounded-xl bg-zinc-100 p-1">
            <button
              type="button"
              onClick={() => setIntent("new")}
              className={cn(
                "flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition",
                intent === "new"
                  ? "bg-white text-zinc-950 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800"
              )}
            >
              New from research
            </button>
            <button
              type="button"
              onClick={() => {
                setIntent("strengthen");
                const seed =
                  presentation.title !== "Untitled deck"
                    ? presentation.title
                    : presentation.slides[0]?.title || "";
                if (seed) setInput(`Statistics and citations for: ${seed}`);
              }}
              className={cn(
                "flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition",
                intent === "strengthen"
                  ? "bg-white text-zinc-950 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800"
              )}
            >
              Strengthen this deck
            </button>
          </div>

          {intent === "strengthen" && (
            <p className="text-[11px] leading-snug text-zinc-500">
              Research evidence for the open presentation — then load a
              research-backed outline or pull citations into References.
            </p>
          )}

          <div className="flex flex-wrap gap-1.5">
            {[
              "Recent productivity statistics for investors",
              "Climate policy facts with citations for a class presentation",
              "B2B SaaS market size and growth for a sales deck",
            ].map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setInput(example)}
                className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[10px] font-medium text-zinc-600 hover:border-zinc-400"
              >
                {example.length > 42 ? `${example.slice(0, 40)}…` : example}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 focus-within:border-zinc-400 focus-within:bg-white">
            <Search className="h-4 w-4 shrink-0 text-zinc-400" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                intent === "strengthen"
                  ? "Evidence to find for this deck…"
                  : "Research topic — e.g. clinical documentation trends"
              }
              className="min-w-0 flex-1 bg-transparent text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") void run();
              }}
            />
          </div>
          <button
            type="button"
            disabled={processing || !input.trim()}
            onClick={() => void run()}
            className="inline-flex items-center gap-2 rounded-2xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {processing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Run research
          </button>

          <ol className="space-y-2">
            {stages.map((stage) => (
              <li
                key={stage.id}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-sm",
                  stage.status === "done" && "bg-emerald-50 text-emerald-800",
                  stage.status === "running" && "bg-amber-50 text-amber-900",
                  stage.status === "pending" && "bg-zinc-50 text-zinc-500"
                )}
              >
                {stage.status === "done" ? (
                  <Check className="h-4 w-4 shrink-0" />
                ) : stage.status === "running" ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                ) : (
                  <span className="h-4 w-4 shrink-0 rounded-full border border-zinc-300" />
                )}
                <span className="flex-1 font-medium">{stage.label}</span>
                {stage.detail && (
                  <span className="text-[11px] opacity-80">{stage.detail}</span>
                )}
              </li>
            ))}
          </ol>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {output && (
            <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4">
              <p className="text-sm font-semibold text-zinc-950">
                {output.summary}
              </p>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  Statistics (with citations)
                </p>
                <ul className="mt-2 space-y-1">
                  {output.statistics.map((s) => {
                    const cite = output.citations.find(
                      (c) => c.sourceId === s.sourceId
                    );
                    return (
                      <li key={s.id} className="text-sm text-zinc-700">
                        <span className="font-semibold">{s.value}</span>{" "}
                        {s.label}{" "}
                        <span className="text-[11px] text-zinc-400">
                          {cite?.inText}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <button
                type="button"
                onClick={loadDeck}
                className="w-full rounded-2xl bg-zinc-950 py-2.5 text-sm font-semibold text-white"
              >
                Generate presentation from research
              </button>
            </div>
          )}
        </div>
      </ProGate>
    </div>
  );
}
