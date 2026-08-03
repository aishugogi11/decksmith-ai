"use client";

import { useEffect, useRef, useState } from "react";
import type { ThemeTokens } from "@/lib/themes";
import type { Slide } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EditorObjectLayer } from "@/components/slides/EditorObjectLayer";
import {
  BarChart3,
  GripVertical,
  ImageIcon,
  Quote,
  Sparkles,
  Square,
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
          "pointer-events-auto rounded-lg outline-none focus:ring-2 focus:ring-zinc-950/20 focus:ring-offset-2 focus:ring-offset-transparent",
        className
      )}
    />
  );
}


function clampPct(n: number, max: number) {
  return Math.max(0, Math.min(max, n));
}

type LayoutTextField = "title" | "subtitle" | "body" | "callout";

/** Layout title/subtitle/body — click to type, drag (or grip) to move. */
function DraggableLayoutText({
  field,
  value,
  onChange,
  position,
  onMove,
  editable,
  className,
  style,
  as,
}: {
  field: LayoutTextField;
  value: string;
  onChange?: (v: string) => void;
  position?: { x: number; y: number };
  onMove?: (x: number, y: number) => void;
  editable?: boolean;
  className?: string;
  style?: React.CSSProperties;
  as?: "div" | "h1" | "h2" | "h3" | "p" | "span";
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(position ?? null);
  const [dragging, setDragging] = useState(false);
  const posRef = useRef(pos);
  const dragActiveRef = useRef(false);
  const onMoveRef = useRef(onMove);

  useEffect(() => {
    onMoveRef.current = onMove;
  }, [onMove]);

  useEffect(() => {
    if (dragActiveRef.current) return;
    setPos(position ?? null);
    posRef.current = position ?? null;
  }, [position?.x, position?.y]);

  function beginPointer(e: React.PointerEvent, forceDrag = false) {
    if (!editable || !onMoveRef.current) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;

    // While already editing this field, only the grip starts a drag
    const target = e.target as HTMLElement;
    if (
      !forceDrag &&
      target.isContentEditable &&
      document.activeElement === target
    ) {
      return;
    }

    const slideEl = wrapRef.current?.closest("article");
    if (!slideEl) return;

    e.stopPropagation();
    if (forceDrag) e.preventDefault();

    const slideRect = slideEl.getBoundingClientRect();
    let origin = posRef.current;
    if (!origin && forceDrag) {
      const box = wrapRef.current!.getBoundingClientRect();
      origin = {
        x: ((box.left - slideRect.left) / Math.max(slideRect.width, 1)) * 100,
        y: ((box.top - slideRect.top) / Math.max(slideRect.height, 1)) * 100,
      };
      posRef.current = origin;
      setPos(origin);
    }

    const startX = e.clientX;
    const startY = e.clientY;
    const pointerId = e.pointerId;
    const thresholdPx = 6;
    let moved = forceDrag;
    let dragStarted = forceDrag;

    if (forceDrag) {
      dragActiveRef.current = true;
      setDragging(true);
      (document.activeElement as HTMLElement | null)?.blur?.();
    }

    const ensureOrigin = () => {
      if (origin) return origin;
      const box = wrapRef.current!.getBoundingClientRect();
      origin = {
        x: ((box.left - slideRect.left) / Math.max(slideRect.width, 1)) * 100,
        y: ((box.top - slideRect.top) / Math.max(slideRect.height, 1)) * 100,
      };
      posRef.current = origin;
      setPos(origin);
      return origin;
    };

    const onPointerMove = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      const dist = Math.hypot(ev.clientX - startX, ev.clientY - startY);
      if (!dragStarted) {
        if (dist < thresholdPx) return;
        dragStarted = true;
        moved = true;
        dragActiveRef.current = true;
        setDragging(true);
        (document.activeElement as HTMLElement | null)?.blur?.();
        ev.preventDefault();
      }
      const o = ensureOrigin();
      const dx = ((ev.clientX - startX) / Math.max(slideRect.width, 1)) * 100;
      const dy = ((ev.clientY - startY) / Math.max(slideRect.height, 1)) * 100;
      const next = {
        x: clampPct(o.x + dx, 92),
        y: clampPct(o.y + dy, 92),
      };
      posRef.current = next;
      setPos(next);
    };

    const onPointerUp = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);

      if (dragStarted && moved && posRef.current) {
        onMoveRef.current?.(posRef.current.x, posRef.current.y);
      }
      dragActiveRef.current = false;
      setDragging(false);

      // Click without drag → focus the editable text so the user can type
      if (!dragStarted && !forceDrag) {
        const editableEl = wrapRef.current?.querySelector(
          "[contenteditable=true]"
        ) as HTMLElement | null;
        editableEl?.focus();
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  }

  const abs = Boolean(pos);
  return (
    <div
      ref={wrapRef}
      data-layout-field={field}
      className={cn(
        "pointer-events-auto group/field max-w-full",
        abs && "absolute z-20",
        editable && onMove && !dragging && "cursor-text",
        dragging && "z-40 cursor-grabbing"
      )}
      style={
        abs && pos
          ? {
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              width: "max-content",
              maxWidth: "90%",
              touchAction: "none",
            }
          : { touchAction: editable ? "none" : undefined }
      }
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest('button[aria-label="Drag to move"]')) {
          return;
        }
        beginPointer(e, false);
      }}
    >
      {editable && onMove && (
        <button
          type="button"
          aria-label="Drag to move"
          title="Drag to move"
          className={cn(
            "absolute -left-1 top-1/2 z-30 flex h-8 w-6 -translate-y-1/2 items-center justify-center rounded-md bg-zinc-950 text-white shadow-md opacity-0 transition-opacity group-hover/field:opacity-100",
            dragging ? "cursor-grabbing opacity-100" : "cursor-grab"
          )}
          onPointerDown={(e) => {
            e.stopPropagation();
            beginPointer(e, true);
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      )}
      <Editable
        value={value}
        onChange={onChange}
        className={className}
        style={style}
        as={as}
      />
    </div>
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
  compact = false,
  format = "widescreen",
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
  /** Tighter type/padding for landing previews */
  compact?: boolean;
  /** widescreen 16:9 (default) or instagram 1:1 */
  format?: "widescreen" | "instagram";
}) {
  const edit = editable ? onChange : undefined;
  const square = format === "instagram";
  const moveField =
    edit &&
    ((field: "title" | "subtitle" | "body" | "callout", x: number, y: number) => {
      edit({
        textPositions: {
          ...(slide.textPositions ?? {}),
          [field]: { x, y },
        },
      });
    });


  return (
    <article
      data-first-slide={isFirstSlide ? "true" : undefined}
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border border-zinc-100 shadow-[0_18px_40px_rgba(0,0,0,0.08)]",
        square ? "aspect-square" : "aspect-[16/9]",
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
          editable ? "pointer-events-none" : undefined,
          slide.layout === "blank"
            ? "p-0"
            : compact
              ? "p-4 sm:p-5"
              : "p-8 sm:p-10"
        )}
      >
        {slide.layout === "blank" && <div className="h-full w-full" aria-hidden />}

        {slide.layout === "hero" && (
          <div
            className={cn(
              "flex h-full min-h-0 flex-col",
              compact
                ? "justify-center gap-1.5"
                : "justify-end gap-4"
            )}
          >
            {!compact && (
              <div
                className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
                style={{ background: theme.accentSoft, color: theme.accent }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                EchoFlow
              </div>
            )}
            <DraggableLayoutText
              field="title"
              as="h1"
              value={slide.title}
              onChange={edit && ((v) => edit({ title: v }))}
              editable={Boolean(edit)}
              position={slide.textPositions?.title}
              onMove={
                moveField ? (x, y) => moveField("title", x, y) : undefined
              }              className={cn(
                "max-w-4xl font-[family-name:var(--font-display)] font-semibold tracking-tight",
                compact
                  ? "text-xl leading-tight sm:text-2xl"
                  : "text-4xl leading-[1.05] sm:text-5xl"
              )}
            />
            {slide.subtitle && (
              <DraggableLayoutText
                field="subtitle"
                as="p"
                value={slide.subtitle}
                onChange={edit && ((v) => edit({ subtitle: v }))}
                editable={Boolean(edit)}
                position={slide.textPositions?.subtitle}
                onMove={
                  moveField ? (x, y) => moveField("subtitle", x, y) : undefined
                }                className={cn(
                  "max-w-2xl leading-snug",
                  compact ? "text-xs sm:text-sm" : "text-lg"
                )}
              />
            )}
            {slide.body && (
              <DraggableLayoutText
                field="body"
                as="p"
                value={slide.body}
                onChange={edit && ((v) => edit({ body: v }))}
                editable={Boolean(edit)}
                position={slide.textPositions?.body}
                onMove={
                  moveField ? (x, y) => moveField("body", x, y) : undefined
                }                className={cn(
                  "max-w-xl leading-snug opacity-80",
                  compact
                    ? "line-clamp-2 text-[11px] sm:text-xs"
                    : "text-base"
                )}
              />
            )}
          </div>
        )}

        {slide.layout === "section" && (
          <div className="flex h-full flex-col justify-center gap-5">
            <DraggableLayoutText
              field="title"
              as="h2"
              value={slide.title}
              onChange={edit && ((v) => edit({ title: v }))}
              editable={Boolean(edit)}
              position={slide.textPositions?.title}
              onMove={
                moveField ? (x, y) => moveField("title", x, y) : undefined
              }              className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight"
            />
            {slide.subtitle && (
              <DraggableLayoutText
                field="subtitle"
                as="p"
                value={slide.subtitle}
                onChange={edit && ((v) => edit({ subtitle: v }))}
                editable={Boolean(edit)}
                position={slide.textPositions?.subtitle}
                onMove={
                  moveField ? (x, y) => moveField("subtitle", x, y) : undefined
                }                className="text-xl opacity-70"
              />
            )}
            {slide.body && (
              <DraggableLayoutText
                field="body"
                as="p"
                value={slide.body}
                onChange={edit && ((v) => edit({ body: v }))}
                editable={Boolean(edit)}
                position={slide.textPositions?.body}
                onMove={
                  moveField ? (x, y) => moveField("body", x, y) : undefined
                }                className="max-w-3xl text-lg leading-relaxed opacity-85"
              />
            )}
            {slide.callout && (
              <div
                className="mt-2 max-w-2xl rounded-2xl border p-4 text-sm leading-relaxed"
                style={{ background: theme.card, borderColor: theme.border }}
              >
                <DraggableLayoutText
                  field="callout"
                  value={slide.callout}
                  onChange={edit && ((v) => edit({ callout: v }))}
                  editable={Boolean(edit)}
                  position={slide.textPositions?.callout}
                  onMove={
                    moveField ? (x, y) => moveField("callout", x, y) : undefined
                  }                />
              </div>
            )}
          </div>
        )}

        {slide.layout === "bullets" && (
          <div className="flex h-full flex-col gap-6">
            <DraggableLayoutText
              field="title"
              as="h2"
              value={slide.title}
              onChange={edit && ((v) => edit({ title: v }))}
              editable={Boolean(edit)}
              position={slide.textPositions?.title}
              onMove={
                moveField ? (x, y) => moveField("title", x, y) : undefined
              }              className="font-[family-name:var(--font-display)] text-3xl font-semibold"
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
              <DraggableLayoutText
                field="title"
                as="h2"
                value={slide.title}
                onChange={edit && ((v) => edit({ title: v }))}
                editable={Boolean(edit)}
                position={slide.textPositions?.title}
                onMove={
                  moveField ? (x, y) => moveField("title", x, y) : undefined
                }                className="font-[family-name:var(--font-display)] text-3xl font-semibold"
              />
              {slide.subtitle && (
                <DraggableLayoutText
                  field="subtitle"
                  as="p"
                  value={slide.subtitle}
                  onChange={edit && ((v) => edit({ subtitle: v }))}
                  editable={Boolean(edit)}
                  position={slide.textPositions?.subtitle}
                  onMove={
                    moveField ? (x, y) => moveField("subtitle", x, y) : undefined
                  }                  className="mt-2 opacity-70"
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
            <DraggableLayoutText
              field="title"
              as="h2"
              value={slide.title}
              onChange={edit && ((v) => edit({ title: v }))}
              editable={Boolean(edit)}
              position={slide.textPositions?.title}
              onMove={
                moveField ? (x, y) => moveField("title", x, y) : undefined
              }              className="font-[family-name:var(--font-display)] text-3xl font-semibold"
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
              <DraggableLayoutText
                field="title"
                as="h2"
                value={slide.title}
                onChange={edit && ((v) => edit({ title: v }))}
                editable={Boolean(edit)}
                position={slide.textPositions?.title}
                onMove={
                  moveField ? (x, y) => moveField("title", x, y) : undefined
                }                className="font-[family-name:var(--font-display)] text-3xl font-semibold"
              />
              {slide.subtitle && (
                <DraggableLayoutText
                  field="subtitle"
                  as="p"
                  value={slide.subtitle}
                  onChange={edit && ((v) => edit({ subtitle: v }))}
                  editable={Boolean(edit)}
                  position={slide.textPositions?.subtitle}
                  onMove={
                    moveField ? (x, y) => moveField("subtitle", x, y) : undefined
                  }                  className="mt-2 opacity-70"
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
            <DraggableLayoutText
              field="title"
              as="h2"
              value={slide.title}
              onChange={edit && ((v) => edit({ title: v }))}
              editable={Boolean(edit)}
              position={slide.textPositions?.title}
              onMove={
                moveField ? (x, y) => moveField("title", x, y) : undefined
              }              className="font-[family-name:var(--font-display)] text-3xl font-semibold"
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
              <DraggableLayoutText
                field="title"
                as="h2"
                value={slide.title}
                onChange={edit && ((v) => edit({ title: v }))}
                editable={Boolean(edit)}
                position={slide.textPositions?.title}
                onMove={
                  moveField ? (x, y) => moveField("title", x, y) : undefined
                }                className="font-[family-name:var(--font-display)] text-3xl font-semibold"
              />
              {slide.subtitle && (
                <DraggableLayoutText
                  field="subtitle"
                  as="p"
                  value={slide.subtitle}
                  onChange={edit && ((v) => edit({ subtitle: v }))}
                  editable={Boolean(edit)}
                  position={slide.textPositions?.subtitle}
                  onMove={
                    moveField ? (x, y) => moveField("subtitle", x, y) : undefined
                  }                  className="opacity-70"
                />
              )}
              {slide.body && (
                <DraggableLayoutText
                  field="body"
                  as="p"
                  value={slide.body}
                  onChange={edit && ((v) => edit({ body: v }))}
                  editable={Boolean(edit)}
                  position={slide.textPositions?.body}
                  onMove={
                    moveField ? (x, y) => moveField("body", x, y) : undefined
                  }                  className="text-base leading-relaxed opacity-85"
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
              <DraggableLayoutText
                field="title"
                as="h2"
                value={slide.title}
                onChange={edit && ((v) => edit({ title: v }))}
                editable={Boolean(edit)}
                position={slide.textPositions?.title}
                onMove={
                  moveField ? (x, y) => moveField("title", x, y) : undefined
                }                className="font-[family-name:var(--font-display)] text-3xl font-semibold"
              />
              {slide.subtitle && (
                <DraggableLayoutText
                  field="subtitle"
                  as="p"
                  value={slide.subtitle}
                  onChange={edit && ((v) => edit({ subtitle: v }))}
                  editable={Boolean(edit)}
                  position={slide.textPositions?.subtitle}
                  onMove={
                    moveField ? (x, y) => moveField("subtitle", x, y) : undefined
                  }                  className="mt-2 opacity-70"
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
            <DraggableLayoutText
              field="title"
              as="h1"
              value={slide.title}
              onChange={edit && ((v) => edit({ title: v }))}
              editable={Boolean(edit)}
              position={slide.textPositions?.title}
              onMove={
                moveField ? (x, y) => moveField("title", x, y) : undefined
              }              className="font-[family-name:var(--font-display)] text-5xl font-semibold tracking-tight"
            />
            {slide.subtitle && (
              <DraggableLayoutText
                field="subtitle"
                as="p"
                value={slide.subtitle}
                onChange={edit && ((v) => edit({ subtitle: v }))}
                editable={Boolean(edit)}
                position={slide.textPositions?.subtitle}
                onMove={
                  moveField ? (x, y) => moveField("subtitle", x, y) : undefined
                }                className="max-w-xl text-lg opacity-75"
              />
            )}
            {slide.body && (
              <DraggableLayoutText
                field="body"
                as="p"
                value={slide.body}
                onChange={edit && ((v) => edit({ body: v }))}
                editable={Boolean(edit)}
                position={slide.textPositions?.body}
                onMove={
                  moveField ? (x, y) => moveField("body", x, y) : undefined
                }                className="max-w-lg text-sm opacity-65"
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
