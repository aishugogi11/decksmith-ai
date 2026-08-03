"use client";

import { useEffect, useRef, useState } from "react";
import type { ThemeTokens } from "@/lib/themes";
import type { EditorObject } from "@/lib/types";
import { useEditorFocusStore } from "@/lib/editor/focus";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  GripVertical,
  ImageIcon,
  Sparkles,
  Trash2,
} from "lucide-react";

function clampPct(n: number, max: number) {
  return Math.max(0, Math.min(max, n));
}

/**
 * Freely positioned slide objects.
 * Textboxes: click to type, drag (or use grip) to move.
 */
export function EditorObjectLayer({
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
  importPageMode?: boolean;
}) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: obj.x, y: obj.y });
  const [dragging, setDragging] = useState(false);
  const [editingText, setEditingText] = useState(false);
  const posRef = useRef(pos);
  const dragActiveRef = useRef(false);
  const pendingCommitRef = useRef<{ x: number; y: number } | null>(null);
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
    if (dragActiveRef.current) return;
    const pending = pendingCommitRef.current;
    if (pending) {
      if (
        Math.abs(obj.x - pending.x) < 0.05 &&
        Math.abs(obj.y - pending.y) < 0.05
      ) {
        pendingCommitRef.current = null;
      } else {
        return;
      }
    }
    setPos({ x: obj.x, y: obj.y });
    posRef.current = { x: obj.x, y: obj.y };
  }, [obj.x, obj.y, obj.id]);

  useEffect(() => {
    if (!selected) setEditingText(false);
  }, [selected]);

  useEffect(() => {
    const el = textRef.current;
    if (!el || obj.type !== "textbox") return;
    if (document.activeElement === el) return;
    const next = obj.text || "";
    if (el.innerText !== next) el.innerText = next;
  }, [obj.text, obj.type, obj.id]);

  // After create: select + focus so the user can type immediately
  useEffect(() => {
    if (obj.type !== "textbox") return;
    if (focusObjectId !== obj.id) return;
    onSelectRef.current?.();
    setEditingText(true);
    requestAnimationFrame(() => {
      const el = textRef.current;
      if (!el) return;
      el.focus();
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    });
    clearFocus();
  }, [focusObjectId, focusNonce, obj.id, obj.type, clearFocus]);

  function startEditing() {
    if (!editable || obj.type !== "textbox" || dragActiveRef.current) return;
    onSelect?.();
    setEditingText(true);
    requestAnimationFrame(() => {
      const el = textRef.current;
      if (!el) return;
      el.focus();
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    });
  }

  /**
   * @param forceDrag — grip handle: drag immediately
   * Otherwise: click = type, move past threshold = drag
   */
  function beginPointer(e: React.PointerEvent, forceDrag = false) {
    if (!editable) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;

    // While typing, only the grip may start a drag
    if (editingText && !forceDrag && obj.type === "textbox") return;
    if (!onMoveRef.current && !forceDrag) {
      if (obj.type === "textbox") startEditing();
      return;
    }

    const slideEl = nodeRef.current?.closest("article");
    if (!slideEl || !onMoveRef.current) {
      if (obj.type === "textbox" && !forceDrag) startEditing();
      return;
    }

    e.stopPropagation();
    if (forceDrag) e.preventDefault();

    onSelectRef.current?.();

    const rect = slideEl.getBoundingClientRect();
    const origin = { x: posRef.current.x, y: posRef.current.y };
    const startX = e.clientX;
    const startY = e.clientY;
    const pointerId = e.pointerId;
    const thresholdPx = 6;
    let moved = forceDrag;
    let dragStarted = forceDrag;

    if (forceDrag) {
      setEditingText(false);
      textRef.current?.blur();
      dragActiveRef.current = true;
      setDragging(true);
    }

    const onPointerMove = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      const dist = Math.hypot(ev.clientX - startX, ev.clientY - startY);

      if (!dragStarted) {
        if (dist < thresholdPx) return;
        dragStarted = true;
        moved = true;
        setEditingText(false);
        textRef.current?.blur();
        dragActiveRef.current = true;
        setDragging(true);
        ev.preventDefault();
      }

      const dx = ((ev.clientX - startX) / Math.max(rect.width, 1)) * 100;
      const dy = ((ev.clientY - startY) / Math.max(rect.height, 1)) * 100;
      const next = {
        x: clampPct(origin.x + dx, Math.max(0, 100 - (obj.w || 10))),
        y: clampPct(origin.y + dy, Math.max(0, 100 - (obj.h || 10))),
      };
      posRef.current = next;
      setPos(next);
    };

    const onPointerUp = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);

      if (dragStarted && moved) {
        pendingCommitRef.current = {
          x: posRef.current.x,
          y: posRef.current.y,
        };
        onMoveRef.current?.(posRef.current.x, posRef.current.y);
        dragActiveRef.current = false;
        setDragging(false);
        return;
      }

      dragActiveRef.current = false;
      setDragging(false);
      // Click without drag → type
      if (obj.type === "textbox" && !forceDrag) {
        startEditing();
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  }

  const canDrag = Boolean(editable && onMove);
  const isPageImage = obj.imageHint === "__import_page__";
  const ghostText = Boolean(
    importPageMode && obj.type === "textbox" && !selected
  );

  return (
    <div
      ref={nodeRef}
      data-editor-object={obj.id}
      role="button"
      tabIndex={0}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (obj.type === "textbox") startEditing();
      }}
      onKeyDown={(e) => {
        if (editingText) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (obj.type === "textbox") startEditing();
          else onSelect?.();
        }
        if (e.key === "Escape" && editingText) {
          setEditingText(false);
          textRef.current?.blur();
        }
      }}
      className={cn(
        "absolute rounded-md",
        !editingText && "select-none",
        isPageImage && "overflow-hidden rounded-none",
        dragging && "z-40 cursor-grabbing shadow-xl",
        obj.type === "textbox"
          ? selected || dragging || editingText
            ? "z-20 bg-white/95 shadow-sm ring-2 ring-zinc-950/40"
            : ghostText
              ? "z-10"
              : "z-10 bg-white/50 ring-1 ring-zinc-950/15 hover:ring-zinc-950/30"
          : isPageImage
            ? "z-0"
            : cn(
                "z-10 overflow-hidden border border-dashed",
                selected
                  ? "border-zinc-950 ring-2 ring-zinc-950/30"
                  : "border-zinc-400/40 hover:border-zinc-700/60"
              ),
        canDrag && !editingText && !dragging && "cursor-grab",
        editingText && "cursor-text"
      )}
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        width: `${obj.w}%`,
        height: `${obj.h}%`,
        background:
          obj.type === "textbox"
            ? undefined
            : obj.type === "image"
              ? isPageImage
                ? "transparent"
                : theme.accentSoft
              : obj.type === "chart"
                ? "rgba(0,0,0,0.04)"
                : theme.accentSoft,
        touchAction: "none",
      }}
      onPointerDown={(e) => {
        if (isPageImage) return;
        if (!canDrag && obj.type !== "textbox") return;
        beginPointer(e, false);
      }}
    >
      {canDrag && !isPageImage && (
        <button
          type="button"
          aria-label="Drag to move"
          title="Drag to move"
          className={cn(
            "absolute left-1 top-1/2 z-50 flex h-10 w-7 -translate-y-1/2 items-center justify-center rounded-md bg-zinc-950 text-white shadow-lg",
            dragging ? "cursor-grabbing" : "cursor-grab"
          )}
          onPointerDown={(e) => {
            e.stopPropagation();
            beginPointer(e, true);
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}

      {editable && selected && onDelete && !isPageImage && (
        <button
          type="button"
          aria-label={obj.type === "textbox" ? "Delete text" : "Delete"}
          title={obj.type === "textbox" ? "Delete text" : "Delete"}
          className="absolute -right-2 -top-2 z-50 inline-flex h-7 w-7 items-center justify-center rounded-full bg-zinc-950 text-white shadow-md hover:bg-red-600"
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
            editable && onTextChange && editingText && !dragging
          )}
          suppressContentEditableWarning
          onFocus={() => {
            onSelect?.();
            setEditingText(true);
          }}
          onBlur={(e) => {
            onTextChange?.(e.currentTarget.innerText);
            setEditingText(false);
          }}
          onPointerDown={(e) => {
            if (editingText) {
              e.stopPropagation();
              return;
            }
          }}
          className="h-full w-full px-2 py-1 outline-none"
          style={{
            fontSize: obj.fontSize ?? 22,
            color: ghostText ? "transparent" : theme.slideFg,
            lineHeight: 1.25,
            caretColor: theme.slideFg,
            pointerEvents: editingText ? "auto" : "none",
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
