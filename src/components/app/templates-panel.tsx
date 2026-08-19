"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, LayoutTemplate, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DECK_TEMPLATES,
  TEMPLATE_CATEGORIES,
  filterTemplates,
  type TemplateCategory,
} from "@/lib/templates";
import { usePresentationStore } from "@/store/presentation-store";
import { cn } from "@/lib/utils";

export function TemplatesPanel() {
  const open = usePresentationStore((s) => s.templatesOpen);
  const setTemplatesOpen = usePresentationStore((s) => s.setTemplatesOpen);
  const loadTemplate = usePresentationStore((s) => s.loadTemplate);
  const [category, setCategory] = useState<TemplateCategory | "all">("all");
  const [query, setQuery] = useState("");

  const templates = useMemo(
    () => filterTemplates(category, query),
    [category, query]
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close templates"
            className="fixed inset-0 z-40 bg-zinc-950/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setTemplatesOpen(false)}
          />
          <motion.div
            role="dialog"
            aria-modal
            aria-label="Template gallery"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="fixed inset-x-3 top-[6vh] z-50 mx-auto flex max-h-[88vh] max-w-5xl flex-col overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-[0_40px_100px_rgba(0,0,0,0.18)] sm:inset-x-6"
          >
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-200 px-5 py-5 sm:px-6">
              <div>
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  <LayoutTemplate className="h-3.5 w-3.5" />
                  Templates
                </p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
                  Start from a proven structure
                </h2>
                <p className="mt-1 max-w-xl text-sm text-zinc-500">
                  {DECK_TEMPLATES.length} EchoFlow templates — or describe your
                  slides in chat for ranked recommendations.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTemplatesOpen(false)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </header>

            <div className="flex flex-col gap-3 border-b border-stone-200 px-5 py-3 sm:flex-row sm:items-center sm:px-6">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-sm border border-stone-200 bg-[var(--paper)] px-3 py-2">
                <Search className="h-4 w-4 shrink-0 text-stone-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search pitch, webinar, OKR, lesson…"
                  className="w-full bg-transparent text-sm text-[var(--ink)] placeholder:text-stone-400 focus:outline-none"
                />
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                {TEMPLATE_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={cn(
                      "shrink-0 rounded-sm px-3 py-1.5 text-xs font-medium transition",
                      category === c.id
                        ? "bg-[var(--ink)] text-[var(--paper)]"
                        : "bg-[var(--paper)] text-stone-600 hover:text-[var(--ink)]"
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-[var(--paper)]/50 px-5 py-5 sm:px-6">
              {templates.length === 0 ? (
                <p className="py-16 text-center text-sm text-stone-500">
                  No templates match. Try another category or keyword.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {templates.map((t, i) => (
                    <motion.button
                      key={t.id}
                      type="button"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.02, 0.2) }}
                      onClick={() => {
                        loadTemplate(t.id);
                        setTemplatesOpen(false);
                      }}
                      className="group overflow-hidden rounded-sm border border-stone-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md"
                    >
                      <div
                        className="relative h-28 w-full"
                        style={{ background: t.preview }}
                      >
                        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(28,25,23,0.55),transparent_55%)]" />
                        <div className="absolute bottom-3 left-3 right-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/75">
                            {t.slides.length} slides · {t.themeId}
                          </p>
                          <p className="font-[family-name:var(--font-display)] text-xl font-medium text-white">
                            {t.name}
                          </p>
                        </div>
                        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-sm bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-[var(--ink)] opacity-0 transition group-hover:opacity-100">
                          <Sparkles className="h-3 w-3 text-[var(--accent)]" />
                          Use
                        </span>
                      </div>
                      <div className="p-3.5">
                        <p className="text-xs leading-relaxed text-stone-600">
                          {t.description}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {t.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-sm bg-[var(--paper)] px-1.5 py-0.5 text-[10px] text-stone-500"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
