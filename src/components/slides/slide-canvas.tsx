"use client";

import { useEffect, useRef, useState } from "react";
import type { ThemeTokens } from "@/lib/themes";
import type { EditorObject, Slide } from "@/lib/types";
import { useEditorFocusStore } from "@/lib/editor/focus";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  GripVertical,
  ImageIcon,
  Quote,
  Sparkles,
  Square,
  Trash2,
} from "lucide-react";

function Editable({
  value,
  onChange,
  className,
  style,
  as: Tag = "div",
}: {
  value: string;
  onChange?: (v: string) => void;
  className?: string;
  style?: React.CSSProperties;
  as?: "div" | "h1" | "h2" | "h3" | "p" | "span";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerText !== value) {
      ref.current.innerText = value;
    }
  }, [value]);

  return (
    <Tag
      ref={ref as never}
      style={style}
      contentEditable={Boolean(onChange)}
      suppressContentEditableWarning
      onBlur={(e) => onChange?.(e.currentTarget.innerText)}
      className={cn(
        onChange &&
          "rounded-lg outline-none focus:ring-2 focus:ring-zinc-950/20 focus:ring-offset-2 focus:ring-offset-transparent",
        className
      )}
    />
  );
}

export function SlideCanvas({
  slide,
  theme,
  editable,
  onChange,
  className,
  isFirstSlide,
  selectedObjectId,
  onSelectObject,
  onDeleteObject,
}: {
  slide: Slide;
  theme: ThemeTokens;
  editable?: boolean;
  onChange?: (patch: Partial<Slide>) => void;
  className?: string;
  isFirstSlide?: boolean;
  selectedObjectId?: string | null;
  onSelectObject?: (objectId: string | null) => void;
  onDeleteObject?: (objectId: string) => void;
}) {
  const edit = editable ? onChange : undefined;

  return (
    <article
      data-first-slide={isFirstSlide ? "true" : undefined}
      className={cn(
        "relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-zinc-100 shadow-[0_18px_40px_rgba(0,0,0,0.08)]",
        className
      )}
      style={{
        background: theme.slideBg,
        color: theme.slideFg,
        borderColor: theme.border,
      }}
      onClick={() => onSelectObject?.(null)}
    >
      {slide.layout !== "blank" && (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "24px 24px",
            color: theme.muted,
            opacity: 0.08,
          }}
        />
      )}

      <div
        className={cn(
          "relative flex h-full flex-col",
          slide.layout === "blank" ? "p-0" : "p-8 sm:p-10"
        )}
      >
        {slide.layout === "blank" && <div className="h-full w-full" aria-hidden />}

        {slide.layout === "hero" && (
          <div className="flex h-full flex-col justify-end gap-4">
            <div
              className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: theme.accentSoft, color: theme.accent }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Decksmith
            </div>
            <Editable
              as="h1"
              value={slide.title}
              onChange={edit && ((v) => edit({ title: v }))}
              className="max-w-4xl font-[family-name:var(--font-display)] text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl"
            />
            {slide.subtitle && (
              <Editable
                as="p"
                value={slide.subtitle}
                onChange={edit && ((v) => edit({ subtitle: v }))}
                className="max-w-2xl text-lg"
                // muted via style
              />
            )}
            {slide.body && (
              <Editable
                as="p"
                value={slide.body}
                onChange={edit && ((v) => edit({ body: v }))}
                className="max-w-xl text-base opacity-80"
              />
            )}
          </div>
        )}

        {slide.layout === "section" && (
          <div className="flex h-full flex-col justify-center gap-5">
            <Editable
              as="h2"
              value={slide.title}
              onChange={edit && ((v) => edit({ title: v }))}
              className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight"
            />
            {slide.subtitle && (
              <Editable
                as="p"
                value={slide.subtitle}
                onChange={edit && ((v) => edit({ subtitle: v }))}
                className="text-xl opacity-70"
              />
            )}
            {slide.body && (
              <Editable
                as="p"
                value={slide.body}
                onChange={edit && ((v) => edit({ body: v }))}
                className="max-w-3xl text-lg leading-relaxed opacity-85"
              />
            )}
            {slide.callout && (
              <div
                className="mt-2 max-w-2xl rounded-2xl border p-4 text-sm leading-relaxed"
                style={{ background: theme.card, borderColor: theme.border }}
              >
                <Editable
                  value={slide.callout}
                  onChange={edit && ((v) => edit({ callout: v }))}
                />
              </div>
            )}
          </div>
        )}

        {slide.layout === "bullets" && (
          <div className="flex h-full flex-col gap-6">
            <Editable
              as="h2"
              value={slide.title}
              onChange={edit && ((v) => edit({ title: v }))}
              className="font-[family-name:var(--font-display)] text-3xl font-semibold"
            />
            <ul className="grid gap-3">
              {(slide.bullets ?? []).map((b, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-xl border px-4 py-3"
                  style={{ background: theme.card, borderColor: theme.border }}
                >
                  <span
                    className="mt-1 h-2 w-2 shrink-0 rounded-full"
                    style={{ background: theme.accent }}
                  />
                  <Editable
                    value={b}
                    onChange={
                      edit &&
                      ((v) => {
                        const bullets = [...(slide.bullets ?? [])];
                        bullets[i] = v;
                        edit({ bullets });
                      })
                    }
                    className="text-base leading-relaxed"
                  />
                </li>
              ))}
            </ul>
          </div>
        )}

        {slide.layout === "stats" && (
          <div className="flex h-full flex-col gap-8">
            <div>
              <Editable
                as="h2"
                value={slide.title}
                onChange={edit && ((v) => edit({ title: v }))}
                className="font-[family-name:var(--font-display)] text-3xl font-semibold"
              />
              {slide.subtitle && (
                <Editable
                  as="p"
                  value={slide.subtitle}
                  onChange={edit && ((v) => edit({ subtitle: v }))}
                  className="mt-2 opacity-70"
                />
              )}
            </div>
            <div className="grid flex-1 grid-cols-3 gap-4">
              {(slide.stats ?? []).map((s, i) => (
                <div
                  key={i}
                  className="flex flex-col justify-center rounded-2xl border p-5"
                  style={{ background: theme.card, borderColor: theme.border }}
                >
                  <Editable
                    value={s.value}
                    onChange={
                      edit &&
                      ((v) => {
                        const stats = [...(slide.stats ?? [])];
                        stats[i] = { ...stats[i], value: v };
                        edit({ stats });
                      })
                    }
                    className="font-[family-name:var(--font-display)] text-4xl font-semibold"
                    style={{ color: theme.accent }}
                  />
                  <Editable
                    value={s.label}
                    onChange={
                      edit &&
                      ((v) => {
                        const stats = [...(slide.stats ?? [])];
                        stats[i] = { ...stats[i], label: v };
                        edit({ stats });
                      })
                    }
                    className="mt-2 text-sm opacity-70"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {slide.layout === "quote" && (
          <div className="flex h-full flex-col justify-center gap-6">
            <Quote className="h-8 w-8 opacity-40" style={{ color: theme.accent }} />
            <Editable
              as="p"
              value={slide.quote ?? slide.title}
              onChange={edit && ((v) => edit({ quote: v }))}
              className="max-w-4xl font-[family-name:var(--font-display)] text-3xl font-medium leading-snug"
            />
            {slide.quoteAuthor && (
              <Editable
                as="p"
                value={slide.quoteAuthor}
                onChange={edit && ((v) => edit({ quoteAuthor: v }))}
                className="text-sm uppercase tracking-[0.2em] opacity-60"
              />
            )}
          </div>
        )}

        {slide.layout === "timeline" && (
          <div className="flex h-full flex-col gap-6">
            <Editable
              as="h2"
              value={slide.title}
              onChange={edit && ((v) => edit({ title: v }))}
              className="font-[family-name:var(--font-display)] text-3xl font-semibold"
            />
            <div className="grid flex-1 grid-cols-4 gap-3">
              {(slide.timeline ?? []).map((t, i) => (
                <div key={i} className="relative flex flex-col gap-2 pt-4">
                  <span
                    className="absolute left-0 top-0 h-1 w-full rounded-full"
                    style={{ background: theme.accent }}
                  />
                  <Editable
                    value={t.title}
                    onChange={
                      edit &&
                      ((v) => {
                        const timeline = [...(slide.timeline ?? [])];
                        timeline[i] = { ...timeline[i], title: v };
                        edit({ timeline });
                      })
                    }
                    className="text-sm font-semibold"
                    style={{ color: theme.accent } as React.CSSProperties}
                  />
                  <Editable
                    value={t.description}
                    onChange={
                      edit &&
                      ((v) => {
                        const timeline = [...(slide.timeline ?? [])];
                        timeline[i] = { ...timeline[i], description: v };
                        edit({ timeline });
                      })
                    }
                    className="text-sm leading-relaxed opacity-80"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {slide.layout === "comparison" && (
          <div className="flex h-full flex-col gap-6">
            <div>
              <Editable
                as="h2"
                value={slide.title}
                onChange={edit && ((v) => edit({ title: v }))}
                className="font-[family-name:var(--font-display)] text-3xl font-semibold"
              />
              {slide.subtitle && (
                <Editable
                  as="p"
                  value={slide.subtitle}
                  onChange={edit && ((v) => edit({ subtitle: v }))}
                  className="mt-2 opacity-70"
                />
              )}
            </div>
            <div className="grid flex-1 grid-cols-2 gap-4">
              {(slide.comparison ?? []).map((col, i) => (
                <div
                  key={i}
                  className="rounded-2xl border p-5"
                  style={{ background: theme.card, borderColor: theme.border }}
                >
                  <Editable
                    value={col.title}
                    onChange={
                      edit &&
                      ((v) => {
                        const comparison = [...(slide.comparison ?? [])];
                        comparison[i] = { ...comparison[i], title: v };
                        edit({ comparison });
                      })
                    }
                    className="mb-4 text-lg font-semibold"
                    style={{ color: theme.accent } as React.CSSProperties}
                  />
                  <ul className="space-y-2">
                    {col.items.map((item, j) => (
                      <li key={j} className="text-sm opacity-85">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {slide.layout === "process" && (
          <div className="flex h-full flex-col gap-6">
            <Editable
              as="h2"
              value={slide.title}
              onChange={edit && ((v) => edit({ title: v }))}
              className="font-[family-name:var(--font-display)] text-3xl font-semibold"
            />
            <div className="grid flex-1 grid-cols-3 gap-4">
              {(slide.process ?? []).map((step, i) => (
                <div
                  key={i}
                  className="rounded-2xl border p-5"
                  style={{ background: theme.card, borderColor: theme.border }}
                >
                  <div
                    className="mb-4 grid h-8 w-8 place-items-center rounded-full text-sm font-bold"
                    style={{ background: theme.accentSoft, color: theme.accent }}
                  >
                    {i + 1}
                  </div>
                  <Editable
                    value={step.title}
                    onChange={
                      edit &&
                      ((v) => {
                        const process = [...(slide.process ?? [])];
                        process[i] = { ...process[i], title: v };
                        edit({ process });
                      })
                    }
                    className="text-lg font-semibold"
                  />
                  <Editable
                    value={step.description}
                    onChange={
                      edit &&
                      ((v) => {
                        const process = [...(slide.process ?? [])];
                        process[i] = { ...process[i], description: v };
                        edit({ process });
                      })
                    }
                    className="mt-2 text-sm leading-relaxed opacity-75"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {slide.layout === "image" && (
          <div className="grid h-full grid-cols-2 gap-6">
            <div className="flex flex-col justify-center gap-4">
              <Editable
                as="h2"
                value={slide.title}
                onChange={edit && ((v) => edit({ title: v }))}
                className="font-[family-name:var(--font-display)] text-3xl font-semibold"
              />
              {slide.subtitle && (
                <Editable
                  as="p"
                  value={slide.subtitle}
                  onChange={edit && ((v) => edit({ subtitle: v }))}
                  className="opacity-70"
                />
              )}
              {slide.body && (
                <Editable
                  as="p"
                  value={slide.body}
                  onChange={edit && ((v) => edit({ body: v }))}
                  className="text-base leading-relaxed opacity-85"
                />
              )}
            </div>
            <div
              className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed"
              style={{ background: theme.accentSoft, borderColor: theme.border }}
            >
              <ImageIcon className="h-10 w-10 opacity-50" />
              <p className="px-6 text-center text-sm opacity-70">
                {slide.imageHint ?? "Image placeholder"}
              </p>
            </div>
          </div>
        )}

        {slide.layout === "chart" && (
          <div className="flex h-full flex-col gap-6">
            <div>
              <Editable
                as="h2"
                value={slide.title}
                onChange={edit && ((v) => edit({ title: v }))}
                className="font-[family-name:var(--font-display)] text-3xl font-semibold"
              />
              {slide.subtitle && (
                <Editable
                  as="p"
                  value={slide.subtitle}
                  onChange={edit && ((v) => edit({ subtitle: v }))}
                  className="mt-2 opacity-70"
                />
              )}
            </div>
            <div className="grid flex-1 grid-cols-[1.2fr_0.8fr] gap-4">
              <div
                className="flex flex-col justify-end gap-3 rounded-2xl border p-5"
                style={{ background: theme.card, borderColor: theme.border }}
              >
                <div className="mb-2 flex items-center gap-2 text-sm opacity-70">
                  <BarChart3 className="h-4 w-4" />
                  {slide.chartHint ?? "Chart placeholder"}
                </div>
                <div className="flex h-36 items-end gap-3">
                  {[42, 68, 55, 80].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-lg"
                      style={{
                        height: `${h}%`,
                        background: theme.accent,
                        opacity: 0.55 + i * 0.12,
                      }}
                    />
                  ))}
                </div>
              </div>
              <ul className="space-y-3 self-center">
                {(slide.bullets ?? []).map((b, i) => (
                  <li
                    key={i}
                    className="rounded-xl border px-4 py-3 text-sm"
                    style={{ background: theme.card, borderColor: theme.border }}
                  >
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {slide.layout === "thankyou" && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <Editable
              as="h1"
              value={slide.title}
              onChange={edit && ((v) => edit({ title: v }))}
              className="font-[family-name:var(--font-display)] text-5xl font-semibold tracking-tight"
            />
            {slide.subtitle && (
              <Editable
                as="p"
                value={slide.subtitle}
                onChange={edit && ((v) => edit({ subtitle: v }))}
                className="max-w-xl text-lg opacity-75"
              />
            )}
            {slide.body && (
              <Editable
                as="p"
                value={slide.body}
                onChange={edit && ((v) => edit({ body: v }))}
                className="max-w-lg text-sm opacity-65"
              />
            )}
          </div>
        )}
      </div>

      {(slide.objects ?? []).map((obj) => (
        <EditorObjectLayer
          key={obj.id}
          obj={obj}
          theme={theme}
          selected={selectedObjectId === obj.id}
          editable={editable}
          importPageMode={(slide.objects ?? []).some(
            (o) => o.imageHint === "__import_page__"
          )}
          onSelect={() => onSelectObject?.(obj.id)}
          onDelete={
            editable && onDeleteObject
              ? () => onDeleteObject(obj.id)
              : undefined
          }
          onMove={
            edit
              ? (x, y) => {
                  edit({
                    objects: (slide.objects ?? []).map((o) =>
                      o.id === obj.id ? { ...o, x, y } : o
                    ),
                  });
                }
              : undefined
          }
          onTextChange={
            edit
              ? (text) => {
                  edit({
                    objects: (slide.objects ?? []).map((o) =>
                      o.id === obj.id ? { ...o, text } : o
                    ),
                  });
                }
              : undefined
          }
        />
      ))}
    </article>
  );
}

function clampPct(n: number, max: number) {
  return Math.max(0, Math.min(max, n));
}

function EditorObjectLayer({
  obj,
  theme,
  selected,
  editable,
  onSelect,
  onDelete,
  onMove,
  onTextChange,
  importPageMode,
}: {
  obj: EditorObject;
  theme: ThemeTokens;
  selected?: boolean;
  editable?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
  onMove?: (x: number, y: number) => void;
  onTextChange?: (text: string) => void;
  /** PDF import: page bitmap is the visual; textboxes stay invisible until selected */
  importPageMode?: boolean;
}) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: obj.x, y: obj.y });
  const [dragging, setDragging] = useState(false);
  const posRef = useRef(pos);
  const onMoveRef = useRef(onMove);
  const onSelectRef = useRef(onSelect);
  const focusObjectId = useEditorFocusStore((s) => s.objectId);
  const focusNonce = useEditorFocusStore((s) => s.nonce);
  const clearFocus = useEditorFocusStore((s) => s.clear);

  useEffect(() => {
    onMoveRef.current = onMove;
    onSelectRef.current = onSelect;
  }, [onMove, onSelect]);

  useEffect(() => {
    if (!dragging) {
      setPos({ x: obj.x, y: obj.y });
      posRef.current = { x: obj.x, y: obj.y };
    }
  }, [obj.x, obj.y, dragging]);

  // Keep contentEditable in sync when not focused (avoids React children fighting caret)
  useEffect(() => {
    const el = textRef.current;
    if (!el || obj.type !== "textbox") return;
    if (document.activeElement === el) return;
    const next = obj.text || "";
    if (el.innerText !== next) el.innerText = next;
  }, [obj.text, obj.type, obj.id]);

  // Auto-focus after CREATE_TEXTBOX (UI or voice)
  useEffect(() => {
    if (obj.type !== "textbox") return;
    if (focusObjectId !== obj.id) return;
    onSelectRef.current?.();
    const el = textRef.current;
    if (el) {
      requestAnimationFrame(() => {
        el.focus();
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      });
    }
    clearFocus();
  }, [focusObjectId, focusNonce, obj.id, obj.type, clearFocus]);

  function beginDrag(e: React.PointerEvent) {
    if (!editable || !onMoveRef.current) return;
    const slideEl = nodeRef.current?.closest("article");
    if (!slideEl) return;

    e.preventDefault();
    e.stopPropagation();
    onSelectRef.current?.();

    const rect = slideEl.getBoundingClientRect();
    const origin = { ...posRef.current };
    const pointerId = e.pointerId;
    let moved = false;

    setDragging(true);

    const handlePointerMove = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      const dxPct = ((ev.clientX - e.clientX) / rect.width) * 100;
      const dyPct = ((ev.clientY - e.clientY) / rect.height) * 100;
      if (Math.abs(dxPct) > 0.25 || Math.abs(dyPct) > 0.25) moved = true;
      const next = {
        x: clampPct(origin.x + dxPct, 100 - obj.w),
        y: clampPct(origin.y + dyPct, 100 - obj.h),
      };
      posRef.current = next;
      setPos(next);
    };

    const handlePointerUp = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      setDragging(false);

      const next = posRef.current;
      if (moved) onMoveRef.current?.(next.x, next.y);
      else onSelectRef.current?.();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  }

  const canDrag = Boolean(editable && onMove);
  const isPageImage = obj.imageHint === "__import_page__";
  const ghostText = Boolean(importPageMode && obj.type === "textbox" && !selected);
  const dragFromBody = canDrag && obj.type !== "textbox" && !isPageImage;

  return (
    <div
      ref={nodeRef}
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        if (!dragging) onSelect?.();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.();
        }
      }}
      className={cn(
        "absolute overflow-hidden",
        isPageImage ? "rounded-none" : "rounded-md",
        dragging ? "z-30 cursor-grabbing transition-none shadow-lg" : "transition",
        obj.type === "textbox"
          ? selected
            ? "z-20 ring-1 ring-zinc-950/40 bg-white/95 shadow-sm"
            : ghostText
              ? "z-10 cursor-text"
              : "z-10"
          : isPageImage
            ? "z-0 border-0"
            : cn(
                "border border-dashed",
                selected
                  ? "z-20 border-zinc-950 ring-2 ring-zinc-950/30"
                  : "z-10 border-zinc-400/40 hover:border-zinc-700/60"
              ),
        dragFromBody && !dragging && "cursor-grab"
      )}
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        width: `${obj.w}%`,
        height: `${obj.h}%`,
        background:
          obj.type === "textbox"
            ? selected
              ? "rgba(255,255,255,0.96)"
              : "transparent"
            : obj.type === "image"
              ? isPageImage
                ? "transparent"
                : theme.accentSoft
              : obj.type === "chart"
                ? "rgba(0,0,0,0.04)"
                : theme.accentSoft,
        touchAction: canDrag ? "none" : undefined,
        userSelect: dragging ? "none" : undefined,
      }}
      onPointerDown={dragFromBody ? beginDrag : undefined}
    >
      {canDrag &&
        !isPageImage &&
        (obj.type !== "textbox" || selected || dragging) && (
        <button
          type="button"
          aria-label="Drag to move"
          title="Drag to move"
          className={cn(
            "absolute left-0.5 top-0.5 z-10 inline-flex h-6 w-5 items-center justify-center rounded bg-white/90 text-zinc-600 shadow-sm",
            dragging ? "cursor-grabbing" : "cursor-grab",
            selected || dragging ? "opacity-100" : "opacity-80 hover:opacity-100"
          )}
          onPointerDown={beginDrag}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      )}

      {editable && selected && onDelete && !isPageImage && (
        <button
          type="button"
          aria-label={obj.type === "textbox" ? "Delete text" : "Delete"}
          title={obj.type === "textbox" ? "Delete text" : "Delete"}
          className="absolute right-0.5 top-0.5 z-20 inline-flex h-6 w-6 items-center justify-center rounded bg-zinc-950 text-white shadow-sm hover:bg-red-600"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}

      {obj.type === "textbox" && (
        <div
          ref={textRef}
          contentEditable={Boolean(
            editable &&
              onTextChange &&
              !dragging &&
              (!importPageMode || selected)
          )}
          suppressContentEditableWarning
          onFocus={() => onSelect?.()}
          onDoubleClick={(e) => {
            e.stopPropagation();
            onSelect?.();
            textRef.current?.focus();
          }}
          onBlur={(e) => onTextChange?.(e.currentTarget.innerText)}
          onPointerDown={(e) => {
            e.stopPropagation();
            onSelect?.();
          }}
          className={cn(
            "h-full w-full px-1 py-0.5 outline-none",
            selected && "pl-2",
            selected && !ghostText && "ring-1 ring-zinc-950/15"
          )}
          style={{
            fontSize: obj.fontSize ?? 22,
            color: ghostText ? "transparent" : theme.slideFg,
            lineHeight: 1.25,
            caretColor: theme.slideFg,
            background:
              selected && !ghostText && !importPageMode
                ? "rgba(255,255,255,0.55)"
                : "transparent",
          }}
        />
      )}
      {obj.type === "image" &&
        (obj.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={obj.src}
            alt={
              isPageImage
                ? "Imported PDF page"
                : obj.imageHint || "Imported image"
            }
            className={cn(
              "pointer-events-none h-full w-full",
              isPageImage ? "object-fill" : "object-cover"
            )}
            draggable={false}
          />
        ) : (
          <div className="pointer-events-none flex h-full flex-col items-center justify-center gap-1 p-2 text-center">
            <ImageIcon className="h-6 w-6 opacity-50" />
            <p className="text-[10px] leading-snug opacity-70">
              {obj.imageHint || "Image"}
            </p>
          </div>
        ))}
      {obj.type === "chart" && (
        <div className="pointer-events-none flex h-full flex-col items-center justify-center gap-1 p-2 text-center">
          <BarChart3 className="h-6 w-6 opacity-50" />
          <p className="text-[10px] leading-snug opacity-70">
            {obj.chartHint || "Chart"}
          </p>
        </div>
      )}
      {obj.type === "icon" && (
        <div className="pointer-events-none flex h-full items-center justify-center">
          <Sparkles
            className={cn(
              "h-7 w-7",
              obj.iconStyle === "outlined"
                ? "opacity-70"
                : "fill-current opacity-90"
            )}
            style={{ color: theme.accent }}
          />
        </div>
      )}
      {obj.type === "shape" && (
        <div
          className="pointer-events-none h-full w-full"
          style={{
            background: obj.fill || theme.accentSoft,
            borderRadius: obj.shape === "ellipse" ? "999px" : 6,
            opacity: 0.85,
          }}
        />
      )}
    </div>
  );
}
