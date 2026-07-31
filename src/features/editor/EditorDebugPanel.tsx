"use client";

import { useEffect } from "react";
import { Bug, Trash2, X } from "lucide-react";
import { useEditorDebugStore } from "@/lib/editor/debug-store";
import { usePresentationStore } from "@/store/presentation-store";
import { cn } from "@/lib/utils";

/**
 * Hidden developer panel — toggle with Ctrl/Cmd+Shift+D
 * or open from the Debug tab.
 */
export function EditorDebugPanel({ embedded }: { embedded?: boolean }) {
  const open = useEditorDebugStore((s) => s.open);
  const setOpen = useEditorDebugStore((s) => s.setOpen);
  const toggle = useEditorDebugStore((s) => s.toggle);
  const entries = useEditorDebugStore((s) => s.entries);
  const clear = useEditorDebugStore((s) => s.clear);
  const currentSlideId = useEditorDebugStore((s) => s.currentSlideId);
  const selection = useEditorDebugStore((s) => s.selection);
  const undoDepth = useEditorDebugStore((s) => s.undoDepth);
  const redoDepth = useEditorDebugStore((s) => s.redoDepth);
  const lastError = useEditorDebugStore((s) => s.lastError);
  const lastVoice = useEditorDebugStore((s) => s.lastVoiceTranscript);

  const presentation = usePresentationStore((s) => s.presentation);
  const selectedSlideId = usePresentationStore((s) => s.selectedSlideId);
  const editorSelection = usePresentationStore((s) => s.editorSelection);
  const past = usePresentationStore((s) => s.past);
  const future = usePresentationStore((s) => s.future);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  // Keep mirror fresh when embedded
  useEffect(() => {
    useEditorDebugStore.getState().mirror({
      currentSlideId: selectedSlideId,
      selection: editorSelection,
      undoDepth: past.length,
      redoDepth: future.length,
    });
  }, [selectedSlideId, editorSelection, past.length, future.length]);

  const slideIndex =
    presentation.slides.findIndex(
      (s) => s.id === (currentSlideId || selectedSlideId)
    ) + 1;

  const body = (
    <div className="space-y-3 font-mono text-[11px] leading-relaxed">
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Current slide" value={`${slideIndex || "—"} / ${presentation.slides.length}`} />
        <Stat
          label="Selected objects"
          value={
            (selection ?? editorSelection).objectId
              ? `${(selection ?? editorSelection).objectType}:${String((selection ?? editorSelection).objectId).slice(0, 10)}`
              : "none"
          }
        />
        <Stat label="Undo stack" value={String(undoDepth || past.length)} />
        <Stat label="Redo stack" value={String(redoDepth || future.length)} />
      </div>

      {lastVoice && (
        <p className="rounded-lg bg-zinc-100 px-2 py-1.5 text-zinc-700">
          Voice: “{lastVoice}”
        </p>
      )}
      {lastError && (
        <p className="rounded-lg bg-red-50 px-2 py-1.5 text-red-700">
          Error: {lastError}
        </p>
      )}

      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
          Command log
        </p>
        <button
          type="button"
          onClick={clear}
          className="inline-flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-800"
        >
          <Trash2 className="h-3 w-3" />
          Clear
        </button>
      </div>

      <ul className="max-h-64 space-y-1.5 overflow-y-auto">
        {entries.length === 0 && (
          <li className="text-zinc-400">No commands yet.</li>
        )}
        {entries.map((e) => (
          <li
            key={e.id}
            className={cn(
              "rounded-lg border px-2 py-1.5",
              e.ok
                ? "border-zinc-100 bg-zinc-50 text-zinc-700"
                : "border-red-100 bg-red-50 text-red-800"
            )}
          >
            <div className="flex justify-between gap-2">
              <span className="font-semibold">
                {e.commandType} → {e.action}
              </span>
              <span className="text-zinc-400">{e.durationMs}ms</span>
            </div>
            <div className="text-zinc-500">
              {e.source}
              {e.selectedObjectIds[0]
                ? ` · obj ${e.selectedObjectIds[0].slice(0, 8)}`
                : ""}
            </div>
            <pre className="mt-0.5 overflow-x-auto whitespace-pre-wrap text-[10px] text-zinc-500">
              {JSON.stringify(e.params)}
            </pre>
            <div>{e.detail}</div>
          </li>
        ))}
      </ul>
    </div>
  );

  if (embedded) {
    return (
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Bug className="h-4 w-4 text-zinc-500" />
          <p className="text-sm font-semibold text-zinc-950">
            Editor command debug
          </p>
        </div>
        <p className="text-[11px] text-zinc-500">
          Shortcut: Ctrl/Cmd+Shift+D for floating panel
        </p>
        {body}
      </section>
    );
  }

  if (!open) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[90] w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
      <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
          <Bug className="h-4 w-4" />
          Editor debug
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="max-h-[50vh] overflow-y-auto p-3">{body}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-2 py-1.5">
      <p className="text-[9px] uppercase tracking-wider text-zinc-400">{label}</p>
      <p className="truncate font-semibold text-zinc-800">{value}</p>
    </div>
  );
}
