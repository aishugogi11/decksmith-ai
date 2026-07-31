"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  ImageIcon,
  Loader2,
  Mic,
  MicOff,
  Sparkles,
  ArrowUp,
} from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { usePresentationStore } from "@/store/presentation-store";
import { cn } from "@/lib/utils";
import { useVisualAssistantStore } from "./store";
import type { VisualCandidate, VisualRecommendation } from "./types";

const STARTERS = [
  "Add a visual for this slide",
  "Find a photo of a product demo",
  "Something abstract that matches our brand",
  "Team collaborating in an office",
];

export function VisualAssistantPanel() {
  const presentation = usePresentationStore((s) => s.presentation);
  const selectedSlideId = usePresentationStore((s) => s.selectedSlideId);
  const editorSelection = usePresentationStore((s) => s.editorSelection);
  const runEditorCommands = usePresentationStore((s) => s.runEditorCommands);

  const messages = useVisualAssistantStore((s) => s.messages);
  const status = useVisualAssistantStore((s) => s.status);
  const seedWelcome = useVisualAssistantStore((s) => s.seedWelcome);
  const send = useVisualAssistantStore((s) => s.send);
  const selectCandidate = useVisualAssistantStore((s) => s.selectCandidate);
  const applyRecommendation = useVisualAssistantStore(
    (s) => s.applyRecommendation
  );

  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const speech = useSpeechRecognition();

  useEffect(() => {
    seedWelcome(presentation, selectedSlideId);
  }, [presentation, selectedSlideId, seedWelcome]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  function apply(commands: Parameters<typeof runEditorCommands>[0]) {
    return runEditorCommands(commands, { source: "ai" });
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    if (speech.listening) speech.stop();
    send(text, presentation, selectedSlideId);
  }

  function toggleMic() {
    if (speech.listening) {
      speech.stop();
      return;
    }
    speech.start((transcript, { isFinal }) => {
      setInput(transcript);
      if (isFinal && transcript.trim()) {
        setInput("");
        send(transcript.trim(), presentation, selectedSlideId);
      }
    });
  }

  function onPick(candidate: VisualCandidate) {
    const replaceId =
      editorSelection.objectType === "image" ? editorSelection.objectId : null;
    selectCandidate(
      candidate,
      presentation,
      selectedSlideId,
      apply,
      replaceId
    );
  }

  function onRec(rec: VisualRecommendation) {
    applyRecommendation(rec, presentation, selectedSlideId, apply);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-4 space-y-1">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-950 text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-zinc-950">
              AI Visual Assistant
            </p>
            <p className="text-xs text-zinc-500">
              Ask in chat or voice — clarify, search, place
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "max-w-[95%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
              m.role === "user"
                ? "ml-auto bg-zinc-950 text-white"
                : "bg-zinc-100 text-zinc-800"
            )}
          >
            <p className="whitespace-pre-wrap">{m.content}</p>

            {m.clarifyOptions && m.clarifyOptions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {m.clarifyOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      send(opt.label, presentation, selectedSlideId)
                    }
                    className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-zinc-800 transition hover:border-zinc-950 hover:bg-zinc-950 hover:text-white"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {m.recommendations && m.recommendations.length > 0 && (
              <div className="mt-3 space-y-2">
                {m.recommendations.map((rec) => (
                  <div
                    key={`${rec.kind}-${rec.title}`}
                    className="rounded-xl border border-zinc-200 bg-white p-3"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Better than a photo
                    </p>
                    <p className="mt-1 text-sm font-semibold text-zinc-950">
                      {rec.title}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-600">{rec.reason}</p>
                    <button
                      type="button"
                      onClick={() => onRec(rec)}
                      className="mt-2 rounded-lg bg-zinc-950 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-zinc-800"
                    >
                      {rec.cta}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {m.candidates && m.candidates.length > 0 && (
              <CandidateGallery
                candidates={m.candidates}
                queries={m.searchQueries}
                onPick={onPick}
              />
            )}
          </div>
        ))}

        {status === "thinking" && (
          <div className="inline-flex items-center gap-2 rounded-2xl bg-zinc-100 px-3.5 py-2 text-xs font-medium text-zinc-600">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Thinking about visuals…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length <= 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {STARTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s, presentation, selectedSlideId)}
              className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-[11px] font-medium text-zinc-700 transition hover:border-zinc-400"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="mt-4 flex items-end gap-2 border-t border-zinc-100 pt-4"
      >
        <button
          type="button"
          onClick={toggleMic}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition",
            speech.listening
              ? "bg-red-500 text-white"
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
          )}
          aria-label={speech.listening ? "Stop listening" : "Speak"}
        >
          {speech.listening ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask for an image, chart, or icon…"
          className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none ring-zinc-950/10 placeholder:text-zinc-400 focus:ring-2"
        />
        <button
          type="submit"
          disabled={!input.trim() || status === "thinking"}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-white transition hover:bg-zinc-800 disabled:opacity-40"
          aria-label="Send"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

function CandidateGallery({
  candidates,
  queries,
  onPick,
}: {
  candidates: VisualCandidate[];
  queries?: string[];
  onPick: (c: VisualCandidate) => void;
}) {
  return (
    <div className="mt-3">
      {queries && queries.length > 0 && (
        <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
          Queries · {queries.slice(0, 2).join(" · ")}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        {candidates.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onPick(c)}
            className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 text-left transition hover:border-zinc-950"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={c.thumb}
              alt={c.alt}
              className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              loading="lazy"
            />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 pt-6">
              <span className="flex items-center gap-1 text-[10px] font-semibold text-white">
                <ImageIcon className="h-3 w-3" />
                {c.kind === "illustration" ? "Illustration" : "Photo"}
              </span>
              <span className="line-clamp-2 text-[10px] text-white/90">
                {c.alt}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
