"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { usePresentationStore } from "@/store/presentation-store";
import { cn } from "@/lib/utils";

/** Preview carousel of AI-ranked templates — does not replace the editor. */
export function RecommendedTemplatesPanel() {
  const open = usePresentationStore((s) => s.recommendationsOpen);
  const setOpen = usePresentationStore((s) => s.setRecommendationsOpen);
  const matches = usePresentationStore((s) => s.recommendations);
  const intent = usePresentationStore((s) => s.recommendIntent);
  const prompt = usePresentationStore((s) => s.recommendPrompt);
  const selectedId = usePresentationStore((s) => s.selectedRecommendationId);
  const selectRecommendation = usePresentationStore((s) => s.selectRecommendation);
  const customizeWithAI = usePresentationStore((s) => s.customizeRecommendation);
  const isCustomizing = usePresentationStore((s) => s.isCustomizingTemplate);
  const isRecommending = usePresentationStore((s) => s.isRecommending);

  const [index, setIndex] = useState(0);
  const safeIndex = matches.length ? Math.min(index, matches.length - 1) : 0;
  const active = matches[safeIndex];

  function go(delta: number) {
    if (!matches.length) return;
    setIndex((i) => (i + delta + matches.length) % matches.length);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close recommendations"
            className="fixed inset-0 z-40 bg-zinc-950/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            role="dialog"
            aria-modal
            aria-label="Recommended templates"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="fixed inset-x-3 top-[8vh] z-50 mx-auto flex max-h-[84vh] max-w-3xl flex-col overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-[0_40px_100px_rgba(0,0,0,0.18)] sm:inset-x-6"
          >
            <header className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4 sm:px-6">
              <div>
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  <Sparkles className="h-3.5 w-3.5" />
                  Recommended templates
                </p>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-zinc-950 sm:text-2xl">
                  {intent?.summary || "Best matches for your brief"}
                </h2>
                {prompt && (
                  <p className="mt-1 line-clamp-2 max-w-xl text-sm text-zinc-500">
                    “{prompt}”
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              {isRecommending ? (
                <div className="flex flex-col items-center justify-center gap-3 py-20 text-sm text-zinc-500">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  Analyzing intent and ranking templates…
                </div>
              ) : matches.length === 0 ? (
                <p className="py-16 text-center text-sm text-zinc-500">
                  No strong matches. Try a clearer type, audience, or style.
                </p>
              ) : (
                <>
                  {/* Carousel */}
                  <div className="relative">
                    <div
                      className="overflow-hidden rounded-2xl border border-zinc-200"
                      style={{ background: active.template.preview }}
                    >
                      <div className="flex min-h-[180px] flex-col justify-end bg-gradient-to-t from-black/70 via-black/25 to-transparent p-5 sm:min-h-[220px]">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
                          {Math.round(active.score * 100)}% match ·{" "}
                          {active.template.slideCount} slides ·{" "}
                          {active.template.source}
                        </p>
                        <h3 className="mt-1 text-2xl font-bold text-white">
                          {active.template.name}
                        </h3>
                        <p className="mt-1 max-w-lg text-sm text-white/85">
                          {active.template.description}
                        </p>
                      </div>
                    </div>
                    <div className="absolute inset-y-0 left-2 flex items-center">
                      <button
                        type="button"
                        onClick={() => go(-1)}
                        className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-zinc-800 shadow"
                        aria-label="Previous template"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="absolute inset-y-0 right-2 flex items-center">
                      <button
                        type="button"
                        onClick={() => go(1)}
                        className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-zinc-800 shadow"
                        aria-label="Next template"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {active.reasons.map((r) => (
                      <span
                        key={r}
                        className="rounded-lg bg-zinc-100 px-2 py-1 text-[11px] text-zinc-600"
                      >
                        {r}
                      </span>
                    ))}
                    {active.template.visualStyle.slice(0, 2).map((s) => (
                      <span
                        key={s}
                        className="rounded-lg bg-zinc-100 px-2 py-1 text-[11px] text-zinc-600"
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  {/* Thumb strip */}
                  <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                    {matches.map((m, i) => (
                      <button
                        key={m.template.id}
                        type="button"
                        onClick={() => {
                          setIndex(i);
                          selectRecommendation(m.template.id);
                        }}
                        className={cn(
                          "w-36 shrink-0 overflow-hidden rounded-xl border text-left transition",
                          i === safeIndex || selectedId === m.template.id
                            ? "border-zinc-950 ring-2 ring-zinc-950"
                            : "border-zinc-200 hover:border-zinc-400"
                        )}
                      >
                        <div
                          className="h-14 w-full"
                          style={{ background: m.template.preview }}
                        />
                        <div className="p-2">
                          <p className="truncate text-[11px] font-semibold text-zinc-900">
                            {m.template.name}
                          </p>
                          <p className="text-[10px] text-zinc-500">
                            {Math.round(m.score * 100)}% · {m.template.slideCount}{" "}
                            slides
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {active && !isRecommending && (
              <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 px-5 py-4 sm:px-6">
                <p className="text-xs text-zinc-500">
                  Layouts stay intact — Customize fills titles, copy, and media hints.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      selectRecommendation(active.template.id);
                      void customizeWithAI(active.template.id, { loadOnly: true });
                    }}
                  >
                    Use blank structure
                  </Button>
                  <Button
                    onClick={() => {
                      selectRecommendation(active.template.id);
                      void customizeWithAI(active.template.id);
                    }}
                    disabled={isCustomizing}
                  >
                    {isCustomizing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Customize
                  </Button>
                </div>
              </footer>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
