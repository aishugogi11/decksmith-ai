"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Mic,
  MicOff,
  Plus,
  Redo2,
  Save,
  Square,
  Trash2,
  Type,
  Undo2,
  Volume2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SlideCanvas } from "@/components/slides/slide-canvas";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { THEMES } from "@/lib/themes";
import { slideToSpeechText } from "@/lib/voice/slide-script";
import { isSpeaking, speakText, stopSpeaking } from "@/lib/voice/speak";
import { usePresentationStore } from "@/store/presentation-store";
import { cn } from "@/lib/utils";

/** Floating white-framed slide preview (Blueprint canvas). */
export function StudioCanvas() {
  const presentation = usePresentationStore((s) => s.presentation);
  const selectedSlideId = usePresentationStore((s) => s.selectedSlideId);
  const personalityId = usePresentationStore((s) => s.personalityId);
  const selectSlide = usePresentationStore((s) => s.selectSlide);
  const updateSlide = usePresentationStore((s) => s.updateSlide);
  const addSlide = usePresentationStore((s) => s.addSlide);
  const duplicateSlide = usePresentationStore((s) => s.duplicateSlide);
  const deleteSlide = usePresentationStore((s) => s.deleteSlide);
  const zoom = usePresentationStore((s) => s.zoom);
  const setZoom = usePresentationStore((s) => s.setZoom);
  const exportPptx = usePresentationStore((s) => s.exportPptx);
  const exportJson = usePresentationStore((s) => s.exportJson);
  const exportPdf = usePresentationStore((s) => s.exportPdf);
  const undo = usePresentationStore((s) => s.undo);
  const redo = usePresentationStore((s) => s.redo);
  const sendMessage = usePresentationStore((s) => s.sendMessage);
  const voiceStatus = usePresentationStore((s) => s.voiceStatus);
  const setVoiceStatus = usePresentationStore((s) => s.setVoiceStatus);
  const setPanelTab = usePresentationStore((s) => s.setPanelTab);
  const editorSelection = usePresentationStore((s) => s.editorSelection);
  const selectEditorObject = usePresentationStore((s) => s.selectEditorObject);
  const addTextbox = usePresentationStore((s) => s.addTextbox);
  const deleteSelectedObject = usePresentationStore((s) => s.deleteSelectedObject);
  const setDeckTitle = usePresentationStore((s) => s.setDeckTitle);
  const saveCurrentProject = usePresentationStore((s) => s.saveCurrentProject);
  const setLibraryTab = usePresentationStore((s) => s.setLibraryTab);
  const setTemplatesOpen = usePresentationStore((s) => s.setTemplatesOpen);

  const [speaking, setSpeaking] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [titleDraft, setTitleDraft] = useState(presentation.title);
  const [saveNote, setSaveNote] = useState<string | null>(null);
  const speech = useSpeechRecognition();

  const theme = THEMES[presentation.themeId];
  const activeId = selectedSlideId ?? presentation.slides[0]?.id;
  const activeIndex = Math.max(
    0,
    presentation.slides.findIndex((s) => s.id === activeId)
  );
  const activeSlide = presentation.slides[activeIndex] ?? presentation.slides[0];
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeId || !scrollerRef.current) return;
    const el = document.getElementById(`studio-slide-${activeId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeId]);

  useEffect(() => {
    setTitleDraft(presentation.title);
  }, [presentation.id, presentation.title]);

  const hasSelectedObject =
    Boolean(editorSelection.objectId) &&
    (editorSelection.slideId === activeId || !editorSelection.slideId);

  // Delete / Backspace removes selected textbox (not while typing inside it)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      if (!hasSelectedObject) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA")
      ) {
        return;
      }
      e.preventDefault();
      deleteSelectedObject();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hasSelectedObject, deleteSelectedObject]);

  function go(delta: number) {
    const next = presentation.slides[activeIndex + delta];
    if (next) selectSlide(next.id);
  }

  async function speakActiveSlide() {
    if (speaking || isSpeaking()) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }

    const script = slideToSpeechText(activeSlide, activeIndex + 1);
    if (!script) {
      setVoiceError("Nothing to speak on this slide.");
      return;
    }

    setVoiceError(null);
    setSpeaking(true);
    try {
      await speakText(script, { personalityId });
    } catch (err) {
      setVoiceError(err instanceof Error ? err.message : "Voice failed");
    } finally {
      setSpeaking(false);
    }
  }

  useEffect(() => () => stopSpeaking(), []);

  useEffect(() => {
    if (speech.listening) setVoiceStatus("listening");
  }, [speech.listening, setVoiceStatus]);

  function toggleVoiceEdit() {
    if (speech.listening) {
      speech.stop();
      setVoiceStatus("idle");
      return;
    }
    setPanelTab("chat");
    speech.start((transcript, { isFinal }) => {
      if (isFinal && transcript.trim()) {
        setVoiceStatus("processing");
        void sendMessage(transcript.trim(), { silent: true });
      }
    });
  }

  if (!activeSlide) return null;

  return (
    <div
      data-studio-canvas="true"
      className="flex h-full min-h-0 w-full max-w-5xl flex-col"
    >
      <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2 px-1">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={() => {
                const next = titleDraft.trim() || "Untitled project";
                setTitleDraft(next);
                if (next !== presentation.title) setDeckTitle(next);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                }
              }}
              aria-label="Project name"
              placeholder="Project name"
              className="min-w-[10rem] max-w-xs truncate rounded-lg border border-transparent bg-transparent px-1.5 py-0.5 text-xs font-semibold text-zinc-800 outline-none transition hover:border-zinc-200 focus:border-zinc-300 focus:bg-white"
            />
            <span className="text-zinc-400">·</span>
            <p className="text-xs font-medium text-zinc-700/80">
              Slide {activeIndex + 1} of {presentation.slides.length}
              {(voiceStatus === "listening" || voiceStatus === "processing") && (
                <>
                  <span className="mx-2 text-zinc-400">·</span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5",
                      voiceStatus === "listening"
                        ? "text-red-600"
                        : "text-amber-700"
                    )}
                  >
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                    {voiceStatus === "listening" ? "Listening" : "Editing"}
                  </span>
                </>
              )}
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="h-7 gap-1.5 px-2.5 text-[11px]"
              onClick={() => {
                const next = titleDraft.trim() || "Untitled project";
                setTitleDraft(next);
                const result = saveCurrentProject(next);
                setSaveNote(result.detail);
                window.setTimeout(() => setSaveNote(null), 2200);
              }}
              title="Save project"
            >
              <Save className="h-3.5 w-3.5" />
              Save
            </Button>
            <button
              type="button"
              className="text-[11px] font-medium text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline"
              onClick={() => {
                setLibraryTab("projects");
                setTemplatesOpen(true);
              }}
            >
              Projects
            </button>
          </div>
          {(saveNote || voiceError || speech.error) && (
            <p
              className={cn(
                "mt-1 max-w-md text-[11px]",
                saveNote ? "text-emerald-700" : "text-red-600/90"
              )}
            >
              {saveNote || voiceError || speech.error}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 rounded-2xl border border-white/70 bg-white/80 p-1 shadow-sm backdrop-blur">
          {speech.supported && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleVoiceEdit}
              aria-label={speech.listening ? "Stop voice edit" : "Voice edit"}
              title="Voice edit current presentation"
              className={cn(
                speech.listening && "bg-zinc-950 text-white hover:bg-zinc-800"
              )}
            >
              {speech.listening ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => void speakActiveSlide()}
            aria-label={speaking ? "Stop voice" : "Speak slide"}
            title={speaking ? "Stop" : "Speak slide (ElevenLabs)"}
          >
            {speaking ? (
              <Square className="h-3.5 w-3.5 fill-current" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <div className="mx-1 h-4 w-px bg-zinc-200" />
          <Button variant="ghost" size="icon" onClick={undo} aria-label="Undo" title="Undo">
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={redo} aria-label="Redo" title="Redo">
            <Redo2 className="h-4 w-4" />
          </Button>
          <div className="mx-1 h-4 w-px bg-zinc-200" />
          <Button variant="ghost" size="icon" onClick={() => go(-1)} disabled={activeIndex <= 0}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => go(1)}
            disabled={activeIndex >= presentation.slides.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="mx-1 h-4 w-px bg-zinc-200" />
          <Button variant="ghost" size="icon" onClick={() => setZoom(zoom - 0.08)}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="w-10 text-center text-[11px] text-zinc-500">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="ghost" size="icon" onClick={() => setZoom(zoom + 0.08)}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <div className="mx-1 h-4 w-px bg-zinc-200" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => addTextbox()}
            aria-label="Add textbox"
            title="Add textbox"
          >
            <Type className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={addSlide} aria-label="Add slide">
            <Plus className="h-4 w-4" />
          </Button>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              disabled={exporting}
              onClick={() => setExportMenuOpen((v) => !v)}
              aria-label="Export"
              title="Export PPTX / PDF / JSON"
            >
              <Download className="h-4 w-4" />
            </Button>
            {exportMenuOpen && (
              <div className="absolute right-0 top-full z-40 mt-1 w-44 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
                {(
                  [
                    {
                      label: "PowerPoint (.pptx)",
                      run: () => exportPptx(),
                    },
                    {
                      label: "PDF",
                      run: () => exportPdf(),
                    },
                    {
                      label: "EchoFlow (.json)",
                      run: async () => {
                        exportJson();
                      },
                    },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className="block w-full px-3 py-2 text-left text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                    onClick={() => {
                      setExportMenuOpen(false);
                      setExporting(true);
                      void item
                        .run()
                        .catch((err) =>
                          setVoiceError(
                            err instanceof Error ? err.message : "Export failed"
                          )
                        )
                        .finally(() => setExporting(false));
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
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
                onClick={() => {
                  if (hasSelectedObject) {
                    deleteSelectedObject();
                    return;
                  }
                  deleteSlide(activeId);
                }}
                aria-label={
                  hasSelectedObject ? "Delete selected text" : "Delete slide"
                }
                title={
                  hasSelectedObject
                    ? "Delete selected text (Delete)"
                    : "Delete slide"
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <div
        ref={scrollerRef}
        data-presentation-frame="true"
        className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain rounded-[28px] bg-white p-3 shadow-[0_30px_90px_rgba(0,0,0,0.18)] sm:p-5"
      >
        <div
          className="mx-auto flex flex-col gap-8 pb-10"
          style={{ width: `${Math.round(zoom * 100)}%`, maxWidth: "100%" }}
        >
          {presentation.slides.map((slide, index) => {
            const selected = slide.id === activeId;
            return (
              <div
                key={slide.id}
                id={`studio-slide-${slide.id}`}
                className="scroll-mt-4"
                onClick={() => selectSlide(slide.id)}
              >
                <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400">
                  Slide {index + 1}
                </p>
                <div
                  className={
                    selected
                      ? "rounded-2xl ring-2 ring-zinc-950 ring-offset-2 ring-offset-white"
                      : "rounded-2xl"
                  }
                >
                  <SlideCanvas
                    slide={slide}
                    theme={theme}
                    editable
                    onChange={(patch) => updateSlide(slide.id, patch)}
                    className="rounded-2xl border-zinc-100 shadow-none"
                    isFirstSlide={index === 0}
                    format={presentation.format}
                    selectedObjectId={
                      editorSelection.slideId === slide.id
                        ? editorSelection.objectId
                        : null
                    }
                    onSelectObject={(objectId) => {
                      selectSlide(slide.id);
                      selectEditorObject(slide.id, objectId);
                    }}
                    onDeleteObject={(objectId) => {
                      const slideNum = index + 1;
                      usePresentationStore.getState().runEditorCommands(
                        [
                          {
                            type: "DELETE_OBJECT",
                            params: { slide: slideNum, objectId },
                            source: "ui",
                          },
                        ],
                        { source: "ui" }
                      );
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
