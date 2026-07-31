"use client";

import { useEffect, useRef } from "react";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Maximize2,
  Minus,
  Plus,
  Redo2,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SlideCanvas } from "@/components/slides/slide-canvas";
import { THEME_LIST, THEMES } from "@/lib/themes";
import type { ThemeId } from "@/lib/types";
import { usePresentationStore } from "@/store/presentation-store";
import { cn } from "@/lib/utils";

export function SlidePreview() {
  const presentation = usePresentationStore((s) => s.presentation);
  const selectedSlideId = usePresentationStore((s) => s.selectedSlideId);
  const selectSlide = usePresentationStore((s) => s.selectSlide);
  const updateSlide = usePresentationStore((s) => s.updateSlide);
  const addSlide = usePresentationStore((s) => s.addSlide);
  const duplicateSlide = usePresentationStore((s) => s.duplicateSlide);
  const deleteSlide = usePresentationStore((s) => s.deleteSlide);
  const setTheme = usePresentationStore((s) => s.setTheme);
  const zoom = usePresentationStore((s) => s.zoom);
  const setZoom = usePresentationStore((s) => s.setZoom);
  const undo = usePresentationStore((s) => s.undo);
  const redo = usePresentationStore((s) => s.redo);

  const theme = THEMES[presentation.themeId];
  const activeId = selectedSlideId ?? presentation.slides[0]?.id;
  const activeIndex = Math.max(
    0,
    presentation.slides.findIndex((s) => s.id === activeId)
  );
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeId) return;
    const el = document.getElementById(`slide-card-${activeId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeId]);

  function goSlide(delta: number) {
    const next = presentation.slides[activeIndex + delta];
    if (next) selectSlide(next.id);
  }

  // Width-based zoom (not CSS transform) so scroll height stays correct
  const slideWidthPct = `${Math.round(zoom * 100)}%`;

  return (
    <section className="relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-[var(--sand)]/40">
      <header className="z-10 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-stone-200/90 bg-white/90 px-4 py-3 backdrop-blur-md">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
            Live preview
          </p>
          <h2 className="truncate font-[family-name:var(--font-display)] text-xl font-medium text-[var(--ink)]">
            {presentation.title}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => goSlide(-1)}
            disabled={activeIndex <= 0}
            aria-label="Previous slide"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <span className="min-w-[3.5rem] text-center text-xs text-stone-500">
            {activeIndex + 1}/{presentation.slides.length}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => goSlide(1)}
            disabled={activeIndex >= presentation.slides.length - 1}
            aria-label="Next slide"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <div className="mx-1 h-5 w-px bg-stone-200" />
          <Button variant="ghost" size="icon" onClick={undo} aria-label="Undo">
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={redo} aria-label="Redo">
            <Redo2 className="h-4 w-4" />
          </Button>
          <div className="mx-1 h-5 w-px bg-stone-200" />
          <Button variant="ghost" size="icon" onClick={() => setZoom(zoom - 0.1)}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center text-xs text-stone-500">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="ghost" size="icon" onClick={() => setZoom(zoom + 0.1)}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <div className="mx-1 h-5 w-px bg-stone-200" />
          <Button variant="secondary" size="sm" onClick={addSlide}>
            <Plus className="h-3.5 w-3.5" />
            Slide
          </Button>
          {activeId && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => duplicateSlide(activeId)}
                aria-label="Duplicate"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteSlide(activeId)}
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Fullscreen"
            onClick={() => {
              const el = document.getElementById("deck-stage");
              void el?.requestFullscreen?.();
            }}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="shrink-0 border-b border-stone-200/90 bg-white px-4 py-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
          Themes
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {THEME_LIST.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id as ThemeId)}
              className={cn(
                "shrink-0 rounded-sm border px-3 py-2 text-left transition",
                presentation.themeId === t.id
                  ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                  : "border-stone-200 bg-[var(--paper)] hover:border-stone-300"
              )}
            >
              <span className="block text-xs font-medium text-[var(--ink)]">{t.label}</span>
              <span className="mt-0.5 block max-w-[120px] truncate text-[10px] text-stone-500">
                {t.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div
        id="deck-stage"
        ref={stageRef}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-6 sm:px-8"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div
          className="mx-auto flex max-w-4xl flex-col gap-8 pb-24"
          style={{ width: slideWidthPct }}
        >
          {presentation.slides.map((slide, index) => {
            const selected = slide.id === activeId;
            return (
              <div
                key={slide.id}
                id={`slide-card-${slide.id}`}
                className="relative scroll-mt-6"
              >
                <button
                  type="button"
                  onClick={() => selectSlide(slide.id)}
                  className={cn(
                    "mb-2 inline-flex items-center gap-2 rounded-sm px-2.5 py-1 text-[11px] font-medium",
                    selected
                      ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "bg-white/70 text-stone-500"
                  )}
                >
                  <Minus className="h-3 w-3" />
                  Slide {index + 1} · {slide.layout}
                </button>
                <div
                  className={cn(
                    "rounded-sm p-[2px] transition",
                    selected ? "bg-[var(--ink)]" : "bg-transparent"
                  )}
                >
                  <SlideCanvas
                    slide={slide}
                    theme={theme}
                    editable={selected}
                    onChange={(patch) => updateSlide(slide.id, patch)}
                    className="rounded-sm shadow-[0_18px_40px_rgba(28,25,23,0.1)]"
                  />
                </div>
                {slide.notes && selected && (
                  <p className="mt-2 rounded-sm border border-stone-200 bg-white px-3 py-2 text-xs text-stone-600">
                    <span className="font-semibold text-[var(--ink)]">Notes: </span>
                    {slide.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
