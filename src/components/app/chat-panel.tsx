"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SUGGESTED_PROMPTS } from "@/lib/mock-ai";
import { usePresentationStore } from "@/store/presentation-store";
import { cn } from "@/lib/utils";

export function ChatPanel() {
  const messages = usePresentationStore((s) => s.messages);
  const isGenerating = usePresentationStore((s) => s.isGenerating);
  const sendMessage = usePresentationStore((s) => s.sendMessage);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input;
    setInput("");
    await sendMessage(text);
  }

  return (
    <section className="relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-white">
      <header className="flex items-center justify-between border-b border-stone-200/90 px-5 py-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
            Studio chat
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-medium text-[var(--ink)]">
            Design by conversation
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => usePresentationStore.getState().setTemplatesOpen(true)}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Templates
          </Button>
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex",
                m.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[90%] rounded-sm px-4 py-3 text-sm leading-relaxed",
                  m.role === "user"
                    ? "bg-[var(--ink)] text-[var(--paper)]"
                    : "border border-stone-200 bg-[var(--paper)] text-stone-700"
                )}
              >
                <p className="whitespace-pre-wrap">
                  {m.content}
                  {m.streaming && (
                    <span className="ml-1 inline-block h-4 w-1.5 animate-pulse bg-[var(--accent)] align-middle" />
                  )}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {messages.length < 3 && (
        <div className="flex flex-wrap gap-2 px-4 pb-3 sm:px-5">
          {SUGGESTED_PROMPTS.slice(0, 4).map((p) => (
            <button
              key={p}
              type="button"
              disabled={isGenerating}
              onClick={() => void sendMessage(p)}
              className="rounded-sm border border-stone-200 bg-[var(--paper)] px-3 py-1.5 text-left text-[11px] text-stone-600 transition hover:border-[var(--accent)]/40 hover:text-[var(--ink)]"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="sticky bottom-0 border-t border-stone-200/90 bg-white p-4 sm:p-5"
      >
        <div className="flex items-end gap-2 rounded-sm border border-stone-300 bg-[var(--paper)] p-2 focus-within:border-[var(--accent)]/50">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void onSubmit(e);
              }
            }}
            rows={2}
            placeholder="Describe the deck you want…"
            className="max-h-40 min-h-[52px] flex-1 resize-none bg-transparent px-3 py-2 text-sm text-[var(--ink)] placeholder:text-stone-400 focus:outline-none"
          />
          <Button
            type="submit"
            size="icon"
            variant="default"
            disabled={isGenerating || !input.trim()}
            aria-label="Send"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="mt-2 text-center text-[10px] tracking-wide text-stone-400">
          Ready for OpenAI · Anthropic · Grok · Gemini
        </p>
      </form>
    </section>
  );
}
