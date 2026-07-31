"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  BookMarked,
  Bug,
  FileUp,
  GraduationCap,
  History,
  ImageIcon,
  Lightbulb,
  Loader2,
  MessageSquare,
  MessageSquareWarning,
  Mic,
  MicOff,
  Volume2,
  X,
} from "lucide-react";
import { WorkflowChooser } from "@/components/app/WorkflowChooser";
import { Button } from "@/components/ui/button";
import { CITATION_STYLES, type CitationStyle } from "@/lib/ai/citations";
import { CoachPanel } from "@/features/coach/CoachPanel";
import { EditorDebugPanel } from "@/features/editor/EditorDebugPanel";
import { FeedbackPanel } from "@/features/feedback";
import { ImportAnalysisPanel } from "@/features/import";
import { useImportStore } from "@/features/import/store";
import { ProLockIcon, useSubscriptionStore } from "@/features/subscription";
import { VisualAssistantPanel } from "@/features/visual-assistant";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { speakText, stopSpeaking } from "@/lib/voice/speak";
import { usePresentationStore } from "@/store/presentation-store";
import { cn } from "@/lib/utils";

const DEFAULT_SUGGESTIONS = [
  "Make this look like an Apple Keynote.",
  "Reduce this from 40 slides to 15.",
  "Make this more persuasive for investors.",
];

/**
 * Right chatbar — collaborator chat with voice edits, suggestions, citations, history.
 */
export function StudioPanel({ compact: _compact = false }: { compact?: boolean }) {
  const setTemplatesOpen = usePresentationStore((s) => s.setTemplatesOpen);
  const setLibraryTab = usePresentationStore((s) => s.setLibraryTab);
  const autoSpeakReplies = usePresentationStore((s) => s.autoSpeakReplies);
  const setAutoSpeakReplies = usePresentationStore((s) => s.setAutoSpeakReplies);
  const messages = usePresentationStore((s) => s.messages);
  const isGenerating = usePresentationStore((s) => s.isGenerating);
  const sendMessage = usePresentationStore((s) => s.sendMessage);
  const personalityId = usePresentationStore((s) => s.personalityId);
  const newPresentation = usePresentationStore((s) => s.newPresentation);
  const suggestionChips = usePresentationStore((s) => s.suggestionChips);
  const coachReport = usePresentationStore((s) => s.coachReport);
  const collaborator = usePresentationStore((s) => s.collaborator);
  const panelTab = usePresentationStore((s) => s.panelTab);
  const setPanelTab = usePresentationStore((s) => s.setPanelTab);
  const designSuggestions = usePresentationStore((s) => s.designSuggestions);
  const applySuggestion = usePresentationStore((s) => s.applySuggestion);
  const dismissSuggestion = usePresentationStore((s) => s.dismissSuggestion);
  const refreshDesignSuggestions = usePresentationStore(
    (s) => s.refreshDesignSuggestions
  );
  const citations = usePresentationStore((s) => s.citations);
  const citationStyle = usePresentationStore((s) => s.citationStyle);
  const setCitationStyle = usePresentationStore((s) => s.setCitationStyle);
  const addCitationFromText = usePresentationStore((s) => s.addCitationFromText);
  const removeCitation = usePresentationStore((s) => s.removeCitation);
  const createReferencesSlide = usePresentationStore(
    (s) => s.createReferencesSlide
  );
  const editHistory = usePresentationStore((s) => s.editHistory);
  const voiceStatus = usePresentationStore((s) => s.voiceStatus);
  const setVoiceStatus = usePresentationStore((s) => s.setVoiceStatus);
  const selectSlide = usePresentationStore((s) => s.selectSlide);
  const presentation = usePresentationStore((s) => s.presentation);
  const undo = usePresentationStore((s) => s.undo);
  const redo = usePresentationStore((s) => s.redo);
  const voiceDebugLogs = usePresentationStore((s) => s.voiceDebugLogs);
  const clearVoiceDebugLogs = usePresentationStore((s) => s.clearVoiceDebugLogs);
  const editorSelection = usePresentationStore((s) => s.editorSelection);

  const [input, setInput] = useState("");
  const [citeInput, setCiteInput] = useState("");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [speakingReply, setSpeakingReply] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastSpokenIdRef = useRef<string | null>(null);
  const speech = useSpeechRecognition();

  const chips =
    suggestionChips.length > 0
      ? suggestionChips
      : messages.length < 3
        ? DEFAULT_SUGGESTIONS
        : [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  useEffect(() => {
    if (!autoSpeakReplies || isGenerating) return;
    const last = [...messages]
      .reverse()
      .find((m) => m.role === "assistant" && !m.streaming);
    if (!last?.content || last.id === lastSpokenIdRef.current) return;
    if (!lastSpokenIdRef.current && messages.length <= 1) {
      lastSpokenIdRef.current = last.id;
      return;
    }
    lastSpokenIdRef.current = last.id;
    setSpeakingReply(true);
    setVoiceStatus("speaking");
    setVoiceError(null);
    void speakText(last.content, { personalityId })
      .catch((err) => {
        setVoiceError(err instanceof Error ? err.message : "Voice failed");
      })
      .finally(() => {
        setSpeakingReply(false);
        setVoiceStatus("idle");
      });
  }, [
    autoSpeakReplies,
    isGenerating,
    messages,
    personalityId,
    setVoiceStatus,
  ]);

  useEffect(() => () => stopSpeaking(), []);

  useEffect(() => {
    if (speech.listening) setVoiceStatus("listening");
    else if (voiceStatus === "listening") setVoiceStatus("idle");
  }, [speech.listening, setVoiceStatus, voiceStatus]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input;
    setInput("");
    if (speech.listening) speech.stop();
    await sendMessage(text);
  }

  function toggleMic() {
    if (speech.listening) {
      speech.stop();
      setVoiceStatus("idle");
      return;
    }
    speech.start((transcript, { isFinal }) => {
      setInput(transcript);
      if (isFinal && transcript.trim()) {
        setInput("");
        setVoiceStatus("processing");
        void sendMessage(transcript.trim());
      }
    });
  }

  async function speakLastReply() {
    const last = [...messages]
      .reverse()
      .find((m) => m.role === "assistant" && !m.streaming);
    if (!last?.content) return;
    if (speakingReply) {
      stopSpeaking();
      setSpeakingReply(false);
      setVoiceStatus("idle");
      return;
    }
    setSpeakingReply(true);
    setVoiceStatus("speaking");
    setVoiceError(null);
    try {
      await speakText(last.content, { personalityId });
    } catch (err) {
      setVoiceError(err instanceof Error ? err.message : "Voice failed");
    } finally {
      setSpeakingReply(false);
      setVoiceStatus("idle");
    }
  }

  const statusLabel =
    voiceStatus === "listening"
      ? "Listening…"
      : voiceStatus === "processing"
        ? "Applying edit…"
        : voiceStatus === "speaking"
          ? "Speaking…"
          : null;

  const hasFeature = useSubscriptionStore((s) => s.hasFeature);
  const openUpgrade = useSubscriptionStore((s) => s.openUpgrade);

  const importAnalysis = useImportStore((s) => s.analysis);

  const tabs = [
    { id: "chat" as const, label: "Voice", icon: MessageSquare },
    { id: "visuals" as const, label: "Visuals", icon: ImageIcon },
    { id: "feedback" as const, label: "Redesign", icon: MessageSquareWarning, pro: true as const },
    { id: "coach" as const, label: "Coach", icon: GraduationCap, pro: true as const },
    { id: "import" as const, label: "Import", icon: FileUp },
    { id: "suggestions" as const, label: "Suggest", icon: Lightbulb },
    { id: "citations" as const, label: "Cite", icon: BookMarked },
    { id: "history" as const, label: "Edits", icon: History },
    { id: "debug" as const, label: "Debug", icon: Bug },
  ];

  return (
    <aside className="flex h-full min-h-0 w-full flex-col rounded-[28px] bg-white">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-100 px-5 py-5">
        <h1 className="text-[20px] font-bold leading-snug tracking-tight text-zinc-950">
          Research · Redesign · Voice · Coach
        </h1>
        <button
          type="button"
          onClick={newPresentation}
          className="mt-0.5 shrink-0 rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
          aria-label="Close / reset"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-zinc-100 px-2 py-2">
        {tabs.map(({ id, label, icon: Icon, pro }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              if (pro) {
                const flag =
                  id === "feedback" ? "feedback_redesign" : "presentation_coach";
                if (!hasFeature(flag)) {
                  openUpgrade(
                    id === "feedback"
                      ? "Feedback → Redesign is a Pro feature."
                      : "Presentation Coach is a Pro feature."
                  );
                  return;
                }
              }
              setPanelTab(id);
              if (id === "suggestions") refreshDesignSuggestions();
            }}
            className={cn(
              "relative inline-flex shrink-0 items-center justify-center gap-1 rounded-xl px-2.5 py-2 text-[10px] font-semibold transition sm:text-[11px]",
              panelTab === id
                ? "bg-zinc-950 text-white"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
            {pro &&
              !hasFeature(
                id === "feedback" ? "feedback_redesign" : "presentation_coach"
              ) && <ProLockIcon className="h-3 w-3 opacity-70" />}
          </button>
        ))}
      </div>

      {statusLabel && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-700">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              voiceStatus === "listening" && "animate-pulse bg-red-500",
              voiceStatus === "processing" && "animate-pulse bg-amber-500",
              voiceStatus === "speaking" && "animate-pulse bg-emerald-500"
            )}
          />
          {statusLabel}
        </div>
      )}

      <div
        className={cn(
          "min-h-0 flex-1 px-5 py-5",
          panelTab === "visuals"
            ? "flex flex-col overflow-hidden"
            : "space-y-5 overflow-y-auto"
        )}
      >
        {panelTab === "import" &&
          (importAnalysis ? (
            <ImportAnalysisPanel
              analysis={importAnalysis}
              onOpenFeedback={() => setPanelTab("feedback")}
            />
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-zinc-950">
                Transform an existing deck
              </p>
              <p className="text-sm text-zinc-500">
                Import a PPTX or PDF you already have — then redesign it from
                feedback or strengthen it with Research. Decksmith is an AI
                editor for work that already exists.
              </p>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  useImportStore.getState().openModal();
                }}
              >
                <FileUp className="h-4 w-4" />
                Bring existing deck
              </Button>
            </div>
          ))}
        {panelTab === "feedback" && <FeedbackPanel />}
        {panelTab === "coach" && <CoachPanel />}
        {panelTab === "visuals" && <VisualAssistantPanel />}

        {panelTab === "chat" && (
          <>
            <WorkflowChooser compact />

            <section>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-950">
                    Voice refinement
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                    Always on — “Make this look like an Apple Keynote” or
                    “Reduce the text on slide three.”
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void speakLastReply()}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 transition hover:bg-zinc-200"
                  aria-label="Speak last reply"
                >
                  <Volume2
                    className={cn("h-4 w-4", speakingReply && "animate-pulse")}
                  />
                </button>
              </div>
              <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-2xl bg-zinc-100 px-4 py-3">
                <span className="text-xs font-medium text-zinc-700">
                  Auto-speak AI replies
                </span>
                <input
                  type="checkbox"
                  checked={autoSpeakReplies}
                  onChange={(e) => setAutoSpeakReplies(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 accent-zinc-950"
                />
              </label>
              {(voiceError || speech.error) && (
                <p className="mt-2 text-[11px] text-red-600/90">
                  {voiceError || speech.error}
                </p>
              )}
            </section>

            {coachReport && (
              <section className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
                  Estimated speaking time
                </p>
                <p className="mt-1 text-sm font-bold text-zinc-950">
                  ~{coachReport.estimatedMinutes} min
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Based on word count and slide count for this deck.
                </p>
                <button
                  type="button"
                  onClick={() => setPanelTab("coach")}
                  className="mt-2 text-xs font-semibold text-zinc-950 underline-offset-2 hover:underline"
                >
                  Open Presentation Coach
                </button>
              </section>
            )}

            <section>
              <p className="text-sm font-semibold text-zinc-950">Ask Decksmith</p>
              <p className="mt-1 text-xs text-zinc-500">
                {collaborator.active
                  ? "Collaborating — answer to shape the deck."
                  : "Describe what you need — or edit by voice."}
              </p>

              <div className="mt-3 max-h-44 space-y-2 overflow-y-auto rounded-2xl bg-zinc-50 p-3">
                <AnimatePresence initial={false}>
                  {messages.slice(-5).map((m) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
                        m.role === "user"
                          ? "ml-8 bg-zinc-950 text-white"
                          : "mr-2 border border-zinc-200/80 bg-white text-zinc-700 shadow-sm"
                      )}
                    >
                      <p className="whitespace-pre-wrap">
                        {m.content}
                        {m.streaming && (
                          <span className="ml-1 inline-block h-3 w-1 animate-pulse bg-zinc-400 align-middle" />
                        )}
                      </p>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={bottomRef} />
              </div>

              {chips.length > 0 && (
                <div className="mt-2.5 flex flex-col gap-2">
                  {chips.slice(0, 4).map((p) => (
                    <button
                      key={p}
                      type="button"
                      disabled={isGenerating}
                      onClick={() => void sendMessage(p)}
                      className="rounded-2xl bg-zinc-100 px-3.5 py-2.5 text-left text-[12px] leading-snug text-zinc-600 transition hover:bg-zinc-200/80"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {panelTab === "suggestions" && (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-zinc-950">
                  Design assistant
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Actionable tips — Apply updates only what changed.
                </p>
              </div>
              <button
                type="button"
                onClick={refreshDesignSuggestions}
                className="rounded-xl bg-zinc-100 px-3 py-1.5 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-200"
              >
                Refresh
              </button>
            </div>
            {designSuggestions.length === 0 ? (
              <p className="rounded-2xl bg-zinc-50 px-4 py-6 text-center text-xs text-zinc-500">
                No suggestions yet. Build or open a deck, then refresh.
              </p>
            ) : (
              designSuggestions.map((s) => (
                <div
                  key={s.id}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-zinc-950">
                      {s.title}
                    </p>
                    <span
                      className={cn(
                        "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                        s.severity === "critical" && "bg-red-100 text-red-700",
                        s.severity === "warn" && "bg-amber-100 text-amber-800",
                        s.severity === "info" && "bg-zinc-200 text-zinc-600"
                      )}
                    >
                      {s.severity}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-600">
                    {s.message}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      disabled={isGenerating}
                      onClick={() => {
                        if (s.slideIndex != null) {
                          const id = presentation.slides[s.slideIndex]?.id;
                          if (id) selectSlide(id);
                        }
                        void applySuggestion(s.id);
                      }}
                      className="rounded-xl bg-zinc-950 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
                    >
                      Apply
                    </button>
                    <button
                      type="button"
                      onClick={() => dismissSuggestion(s.id)}
                      className="rounded-xl bg-white px-3 py-1.5 text-[11px] font-semibold text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-100"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        {panelTab === "citations" && (
          <section className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-zinc-950">
                Citation manager
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Paste a URL or source, or ask in chat: “Add citation to works
                cited: https://…”
              </p>
            </div>
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                Style
              </span>
              <select
                value={citationStyle}
                onChange={(e) =>
                  setCitationStyle(e.target.value as CitationStyle)
                }
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
              >
                {CITATION_STYLES.map((style) => (
                  <option key={style} value={style}>
                    {style}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex gap-2">
              <input
                value={citeInput}
                onChange={(e) => setCiteInput(e.target.value)}
                placeholder="https://… or paper / book title"
                className="h-10 min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  addCitationFromText(citeInput);
                  setCiteInput("");
                }}
                className="rounded-xl bg-zinc-950 px-3 text-[11px] font-semibold text-white"
              >
                Cite
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => createReferencesSlide("References")}
                className="rounded-xl bg-zinc-100 px-3 py-2 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-200"
              >
                References slide
              </button>
              <button
                type="button"
                onClick={() => createReferencesSlide("Works Cited")}
                className="rounded-xl bg-zinc-100 px-3 py-2 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-200"
              >
                Works Cited slide
              </button>
            </div>
            {citations.length === 0 ? (
              <p className="rounded-2xl bg-zinc-50 px-4 py-6 text-center text-xs text-zinc-500">
                No citations yet. Try “Add citation to works cited: …” in chat.
              </p>
            ) : (
              citations.map((c) => (
                <div
                  key={c.id}
                  className="rounded-2xl border border-zinc-200 bg-white px-4 py-3"
                >
                  <p className="text-xs font-semibold text-zinc-950">
                    {c.title}
                  </p>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    {c.sourceType.toUpperCase()} · in-text {c.inText}
                  </p>
                  <p className="mt-2 text-[12px] leading-relaxed text-zinc-700">
                    {c.bibliography}
                  </p>
                  {c.missing.length > 0 && (
                    <p className="mt-2 text-[11px] text-amber-700">
                      Missing: {c.missing.join(", ")}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => removeCitation(c.id)}
                    className="mt-2 text-[11px] font-semibold text-zinc-500 hover:text-zinc-800"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </section>
        )}

        {panelTab === "history" && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-zinc-950">
                  Edit history
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Partial updates with undo / redo.
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={undo}
                  className="rounded-lg bg-zinc-100 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-700"
                >
                  Undo
                </button>
                <button
                  type="button"
                  onClick={redo}
                  className="rounded-lg bg-zinc-100 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-700"
                >
                  Redo
                </button>
              </div>
            </div>
            {editHistory.length === 0 ? (
              <p className="rounded-2xl bg-zinc-50 px-4 py-6 text-center text-xs text-zinc-500">
                Voice and chat edits will appear here.
              </p>
            ) : (
              editHistory.map((h) => (
                <div
                  key={h.id}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3"
                >
                  <p className="text-[11px] font-semibold text-zinc-400">
                    {new Date(h.at).toLocaleTimeString()} ·{" "}
                    {h.commandIds.join(", ") || "edit"}
                  </p>
                  <p className="mt-1 text-xs font-medium text-zinc-900">
                    “{h.userText}”
                  </p>
                  <p className="mt-1 text-xs text-zinc-600">{h.reply}</p>
                  {h.changedSlideIds.length > 0 && (
                    <p className="mt-1 text-[10px] text-zinc-400">
                      Updated {h.changedSlideIds.length} slide
                      {h.changedSlideIds.length === 1 ? "" : "s"}
                    </p>
                  )}
                </div>
              ))
            )}
          </section>
        )}

        {panelTab === "debug" && (
          <section className="space-y-5">
            <EditorDebugPanel embedded />
            <div className="flex items-center justify-between gap-2 border-t border-zinc-100 pt-4">
              <div>
                <p className="text-sm font-semibold text-zinc-950">
                  Voice pipeline log
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Transcript → intent → JSON → executed actions.
                </p>
              </div>
              <button
                type="button"
                onClick={clearVoiceDebugLogs}
                className="rounded-xl bg-zinc-100 px-3 py-1.5 text-[11px] font-semibold text-zinc-700"
              >
                Clear
              </button>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-[10px] text-zinc-600">
              selection: {JSON.stringify(editorSelection)}
            </div>
            {voiceDebugLogs.length === 0 ? (
              <p className="rounded-2xl bg-zinc-50 px-4 py-6 text-center text-xs text-zinc-500">
                Speak or type an edit command to see the pipeline log.
              </p>
            ) : (
              voiceDebugLogs.map((log) => (
                <details
                  key={log.id}
                  className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 open:pb-3"
                >
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-zinc-950">
                        “{log.transcript}”
                      </p>
                      <span className="shrink-0 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-zinc-600">
                        {log.source} · {Math.round(log.confidence * 100)}%
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      intent: {log.intent}
                      {log.clarification ? ` · clarify: ${log.clarification}` : ""}
                    </p>
                  </summary>
                  <div className="mt-2 space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                      JSON envelope
                    </p>
                    <pre className="max-h-40 overflow-auto rounded-xl bg-zinc-950 p-2 text-[10px] leading-relaxed text-emerald-300">
                      {log.envelopeJson}
                    </pre>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                      Executed
                    </p>
                    {log.executed.length === 0 ? (
                      <p className="text-[11px] text-zinc-500">
                        (none — clarification or low confidence)
                      </p>
                    ) : (
                      <ul className="space-y-1">
                        {log.executed.map((e, i) => (
                          <li
                            key={`${log.id}-${i}`}
                            className={cn(
                              "rounded-lg px-2 py-1 text-[11px]",
                              e.ok
                                ? "bg-emerald-50 text-emerald-800"
                                : "bg-red-50 text-red-700"
                            )}
                          >
                            {e.ok ? "✓" : "✗"} {e.action}: {e.detail}
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="text-[11px] text-zinc-600">{log.reply}</p>
                  </div>
                </details>
              ))
            )}
          </section>
        )}
      </div>

      {panelTab !== "visuals" && (
        <form onSubmit={onSubmit} className="shrink-0 border-t border-zinc-100 p-4">
          <div className="flex items-center gap-2 rounded-[22px] bg-zinc-100 px-2.5 py-2 focus-within:ring-2 focus-within:ring-zinc-950/10">
            {speech.supported && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleMic}
                aria-label={speech.listening ? "Stop listening" : "Voice edit"}
                title="Voice edit — speak a command"
                className={cn(
                  "h-9 w-9 shrink-0 rounded-full",
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
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onMouseUp={() => {
                const sel = window.getSelection()?.toString().trim();
                if (sel && sel.length > 8 && panelTab === "citations") {
                  setCiteInput(sel);
                }
              }}
              placeholder={
                speech.listening
                  ? "Listening…"
                  : collaborator.active
                    ? "Answer the question…"
                    : "Edit or describe… (“Make it larger.”)"
              }
              className="h-9 min-w-0 flex-1 bg-transparent px-1 text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isGenerating || !input.trim()}
              aria-label="Send"
              className="h-9 w-9 shrink-0 rounded-full"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </Button>
          </div>
          {panelTab === "citations" && (
            <button
              type="button"
              className="mt-2 w-full text-center text-[11px] font-semibold text-zinc-500 hover:text-zinc-800"
              onClick={() => {
                const sel = window.getSelection()?.toString().trim();
                if (sel) {
                  addCitationFromText(sel);
                } else if (input.trim()) {
                  void sendMessage(`Generate citation: ${input.trim()}`);
                  setInput("");
                }
              }}
            >
              Generate citation from selection / input
            </button>
          )}
        </form>
      )}
    </aside>
  );
}
