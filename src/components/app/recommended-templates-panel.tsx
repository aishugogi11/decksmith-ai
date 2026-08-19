"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { usePresentationStore } from "@/store/presentation-store";
import { cn } from "@/lib/utils";

/** Chooser for ranked / featured template slides — does not replace the editor. */
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

  useEffect(() => {
    if (!open) return;
    const i = matches.findIndex((m) => m.template.id === selectedId);
    setIndex(i >= 0 ? i : 0);
  }, [open, matches, selectedId]);

  const safeIndex = matches.length ? Math.min(index, matches.length - 1) : 0;
  const active = matches[safeIndex];
  const browsingExamples = prompt === "Slide template examples";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close template chooser"
            className="fixed inset-0 z-40 bg-zinc-950/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            role="dialog"
            aria-modal
            aria-label="Choose template slides"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="fixed inset-x-3 top-[6vh] z-50 mx-auto flex max-h-[88vh] max-w-4xl flex-col overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-[0_40px_100px_rgba(0,0,0,0.18)] sm:inset-x-6"
          >
            <header className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4 sm:px-6">
              <div>
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  <Sparkles className="h-3.5 w-3.5" />
                  {browsingExamples
                    ? "Template slides"
                    : "Recommended templates"}
                </p>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-zinc-950 sm:text-2xl">
                  {intent?.summary || "Choose template slides"}
                </h2>
                <p className="mt-1 max-w-xl text-sm text-zinc-500">
                  {browsingExamples
                    ? "Pick a set of slides to start from — then customize."
                    : prompt
                      ? `Matches for “${prompt}”`
                      : "Pick one to load into the studio."}
                </p>
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
                  Finding template slides for you…
                </div>
              ) : matches.length === 0 ? (
                <p className="py-16 text-center text-sm text-zinc-500">
                  No templates yet. Try Templates in the rail, or describe what
                  you need in chat.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {matches.map((m, i) => {
                    const selected =
                      i === safeIndex || selectedId === m.template.id;
                    return (
                      <button
                        key={m.template.id}
                        type="button"
                        onClick={() => {
                          setIndex(i);
                          selectRecommendation(m.template.id);
                        }}
                        className={cn(
                          "overflow-hidden rounded-2xl border text-left transition",
                          selected
                            ? "border-zinc-950 ring-2 ring-zinc-950"
                            : "border-zinc-200 hover:border-zinc-400"
                        )}
                      >
                        <div
                          className="aspect-[16/10] w-full"
                          style={{ background: m.template.preview }}
                        />
                        <div className="space-y-1 p-3">
                          <p className="truncate text-sm font-semibold text-zinc-950">
                            {m.template.name}
                          </p>
                          <p className="line-clamp-2 text-[11px] leading-snug text-zinc-500">
                            {m.template.description}
                          </p>
                          <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                            {m.template.slideCount} slides ·{" "}
                            {m.template.presentationType}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {active && !isRecommending && (
              <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 px-5 py-4 sm:px-6">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-950">
                    {active.template.name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Layouts stay intact — Customize fills titles and copy.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      selectRecommendation(active.template.id);
                      void customizeWithAI(active.template.id, {
                        loadOnly: true,
                      });
                    }}
                  >
                    Use structure
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
