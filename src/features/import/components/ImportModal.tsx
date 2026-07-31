"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FileJson2,
  FileText,
  Loader2,
  Presentation,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { IMPORT_PROVIDERS } from "@/features/import/providers/registry";
import { useImportStore } from "@/features/import/store";
import { usePresentationStore } from "@/store/presentation-store";
import { cn } from "@/lib/utils";

/**
 * Universal Presentation Import — drag-and-drop modal.
 */
export function ImportModal() {
  const modalOpen = useImportStore((s) => s.modalOpen);
  const closeModal = useImportStore((s) => s.closeModal);
  const importFile = useImportStore((s) => s.importFile);
  const status = useImportStore((s) => s.status);
  const progressMessage = useImportStore((s) => s.progressMessage);
  const error = useImportStore((s) => s.error);
  const result = useImportStore((s) => s.result);
  const analysis = useImportStore((s) => s.analysis);
  const fileName = useImportStore((s) => s.fileName);
  const reset = useImportStore((s) => s.reset);

  const loadImportedPresentation = usePresentationStore(
    (s) => s.loadImportedPresentation
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [view, setView] = useState<"drop" | "summary">("drop");

  const busy = status === "reading" || status === "parsing" || status === "analyzing";

  const onFiles = useCallback(
    async (files: FileList | File[] | null) => {
      const file = files?.[0];
      if (!file) return;
      setView("drop");
      await importFile(file);
      setView("summary");
    },
    [importFile]
  );

  function handleOpen(openAnalysis = false) {
    if (!result) return;
    loadImportedPresentation(result.presentation, {
      sourceLabel: fileName || "imported deck",
      openAnalysis,
    });
    closeModal();
    // Keep analysis in import store for the right-panel Import tab
    setView("drop");
  }

  const ready = IMPORT_PROVIDERS.filter((p) => p.status === "ready");
  const soon = IMPORT_PROVIDERS.filter((p) => p.status === "coming_soon");

  return (
    <AnimatePresence>
      {modalOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Close import"
            className="fixed inset-0 z-[70] bg-zinc-950/40 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (busy) return;
              closeModal();
              if (status !== "ready") reset();
              setView("drop");
            }}
          />
          <motion.div
            role="dialog"
            aria-modal
            aria-label="Import presentation"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
            className="fixed left-1/2 top-[8vh] z-[80] w-[min(560px,calc(100vw-1.5rem))] -translate-x-1/2 overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-[0_40px_100px_rgba(0,0,0,0.28)]"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
              <div>
                <p className="text-sm font-bold text-zinc-950">
                  Bring an existing deck
                </p>
                <p className="text-xs text-zinc-500">
                  Upload work you already have — then redesign it with AI
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  closeModal();
                  if (status !== "ready") reset();
                  setView("drop");
                }}
                className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[min(70vh,640px)] overflow-y-auto px-5 py-5">
              {status === "ready" && result && view === "summary" ? (
                <ImportSummary
                  fileName={fileName}
                  result={result}
                  analysis={analysis}
                  onOpen={() => handleOpen(false)}
                  onAnalyze={() => handleOpen(true)}
                  onAnother={() => {
                    reset();
                    setView("drop");
                  }}
                />
              ) : (
                <>
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".pptx,.pdf,.json,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/json"
                    className="hidden"
                    onChange={(e) => void onFiles(e.target.files)}
                  />

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      void onFiles(e.dataTransfer.files);
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 transition",
                      dragOver
                        ? "border-zinc-900 bg-zinc-50"
                        : "border-zinc-200 bg-zinc-50/50"
                    )}
                  >
                    {busy ? (
                      <>
                        <Loader2 className="h-8 w-8 animate-spin text-zinc-700" />
                        <p className="text-sm font-semibold text-zinc-900">
                          {progressMessage || "Importing…"}
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200">
                          <Upload className="h-5 w-5 text-zinc-800" />
                        </div>
                        <p className="text-sm font-semibold text-zinc-950">
                          Drop a PPTX, PDF, or Decksmith JSON
                        </p>
                        <p className="max-w-xs text-center text-xs text-zinc-500">
                          Skip rebuilding from scratch — transform what you already have
                        </p>
                        <p className="text-xs text-zinc-500">or</p>
                        <Button
                          type="button"
                          onClick={() => inputRef.current?.click()}
                        >
                          Browse files
                        </Button>
                      </>
                    )}
                  </div>

                  {error && (
                    <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                      {error}
                    </p>
                  )}

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                        Supported
                      </p>
                      <ul className="mt-2 space-y-2">
                        {ready.map((p) => (
                          <li
                            key={p.id}
                            className="flex items-start gap-2 text-sm text-zinc-700"
                          >
                            <FormatIcon id={p.id} />
                            <span>
                              <span className="font-medium text-zinc-900">
                                {p.label}
                              </span>
                              <span className="block text-xs text-zinc-500">
                                {p.description}
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                        Coming soon
                      </p>
                      <ul className="mt-2 space-y-2">
                        {soon.map((p) => (
                          <li
                            key={p.id}
                            className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-2"
                          >
                            <p className="text-sm font-medium text-zinc-800">
                              {p.label}
                            </p>
                            <p className="text-[11px] text-zinc-500">
                              {p.description}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function FormatIcon({ id }: { id: string }) {
  if (id === "pdf") return <FileText className="mt-0.5 h-4 w-4 shrink-0" />;
  if (id === "decksmith")
    return <FileJson2 className="mt-0.5 h-4 w-4 shrink-0" />;
  return <Presentation className="mt-0.5 h-4 w-4 shrink-0" />;
}

function ImportSummary({
  fileName,
  result,
  analysis,
  onOpen,
  onAnalyze,
  onAnother,
}: {
  fileName: string | null;
  result: NonNullable<ReturnType<typeof useImportStore.getState>["result"]>;
  analysis: ReturnType<typeof useImportStore.getState>["analysis"];
  onOpen: () => void;
  onAnalyze: () => void;
  onAnother: () => void;
}) {
  const c = result.meta.counts;
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-4">
        <div className="flex items-center gap-2 text-emerald-900">
          <Sparkles className="h-4 w-4" />
          <p className="text-sm font-bold">Ready to transform</p>
        </div>
        <p className="mt-1 truncate text-xs text-emerald-800/80">
          {fileName || result.presentation.title}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-emerald-900/80">
          {c.slides} slides are editable in Decksmith. Next: redesign from
          feedback, or strengthen with Research.
          {analysis && analysis.estimatedMinutes > 0
            ? ` (~${analysis.estimatedMinutes} min to present)`
            : ""}
        </p>
      </div>

      <ul className="space-y-2 text-sm text-zinc-600">
        <li>
          <span className="font-medium text-zinc-900">Feedback → Redesign</span>
          {" — "}paste professor, client, or investor comments
        </li>
        <li>
          <span className="font-medium text-zinc-900">Research Mode</span>
          {" — "}pull current stats and citations into the story
        </li>
        <li>
          <span className="font-medium text-zinc-900">Voice</span>
          {" — "}“Make this look like an Apple Keynote.”
        </li>
      </ul>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" className="flex-1" onClick={onAnalyze}>
          Open & transform
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          onClick={onOpen}
        >
          Open on canvas
        </Button>
      </div>
      <button
        type="button"
        onClick={onAnother}
        className="w-full text-center text-xs font-medium text-zinc-500 hover:text-zinc-800"
      >
        Import another file
      </button>
    </div>
  );
}
