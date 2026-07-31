"use client";

import { create } from "zustand";
import { uid } from "@/lib/utils";
import type { Presentation } from "@/lib/types";
import { runVisualAssist } from "./assist";
import { buildVisualContext, summarizeContext } from "./context";
import {
  currentSlide,
  placeImageCommands,
  placeRecommendationCommands,
  slideNumberFor,
} from "./place";
import { searchCatalog } from "./catalog";
import { buildSearchQueries } from "./assist";
import type {
  VisualAssistMessage,
  VisualCandidate,
  VisualRecommendation,
} from "./types";

type ApplyFn = (
  commands: ReturnType<typeof placeImageCommands>
) => { ok: boolean; detail: string };

type VisualAssistantState = {
  messages: VisualAssistMessage[];
  status: "idle" | "thinking" | "ready";
  lastCandidates: VisualCandidate[];
  error: string | null;

  reset: () => void;
  seedWelcome: (presentation: Presentation, selectedSlideId: string | null) => void;
  send: (
    text: string,
    presentation: Presentation,
    selectedSlideId: string | null
  ) => void;
  selectCandidate: (
    candidate: VisualCandidate,
    presentation: Presentation,
    selectedSlideId: string | null,
    apply: ApplyFn,
    replaceObjectId?: string | null
  ) => { ok: boolean; detail: string };
  applyRecommendation: (
    rec: VisualRecommendation,
    presentation: Presentation,
    selectedSlideId: string | null,
    apply: ApplyFn
  ) => { ok: boolean; detail: string };
};

const welcome = (presentation: Presentation, selectedSlideId: string | null) => {
  const ctx = buildVisualContext(presentation, selectedSlideId);
  return {
    id: uid("va"),
    role: "assistant" as const,
    content: `I’m your Visual Assistant. Describe the image you want — or just say “add a visual” and I’ll ask a quick clarifying question.\n\n${summarizeContext(ctx)}`,
    at: new Date().toISOString(),
  };
};

export const useVisualAssistantStore = create<VisualAssistantState>((set, get) => ({
  messages: [],
  status: "idle",
  lastCandidates: [],
  error: null,

  reset: () =>
    set({ messages: [], status: "idle", lastCandidates: [], error: null }),

  seedWelcome: (presentation, selectedSlideId) => {
    if (get().messages.length > 0) return;
    set({ messages: [welcome(presentation, selectedSlideId)] });
  },

  send: (text, presentation, selectedSlideId) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: VisualAssistMessage = {
      id: uid("va"),
      role: "user",
      content: trimmed,
      at: new Date().toISOString(),
    };

    set((s) => ({
      messages: [...s.messages, userMsg],
      status: "thinking",
      error: null,
    }));

    const ctx = buildVisualContext(presentation, selectedSlideId);
    const turn = runVisualAssist(trimmed, ctx);

    let assistant: VisualAssistMessage;
    if (turn.type === "clarify") {
      assistant = {
        id: uid("va"),
        role: "assistant",
        content: turn.message,
        at: new Date().toISOString(),
        clarifyOptions: turn.options,
      };
      set((s) => ({
        messages: [...s.messages, assistant],
        status: "ready",
        lastCandidates: [],
      }));
      return;
    }

    if (turn.type === "recommend") {
      assistant = {
        id: uid("va"),
        role: "assistant",
        content: turn.message,
        at: new Date().toISOString(),
        recommendations: turn.recommendations,
        candidates: turn.candidates,
        searchQueries: turn.queries,
      };
      set((s) => ({
        messages: [...s.messages, assistant],
        status: "ready",
        lastCandidates: turn.candidates ?? [],
      }));
      return;
    }

    // gallery
    assistant = {
      id: uid("va"),
      role: "assistant",
      content: turn.message,
      at: new Date().toISOString(),
      candidates: turn.candidates,
      recommendations: turn.recommendations,
      searchQueries: turn.queries,
    };
    set((s) => ({
      messages: [...s.messages, assistant],
      status: "ready",
      lastCandidates: turn.candidates,
    }));
  },

  selectCandidate: (
    candidate,
    presentation,
    selectedSlideId,
    apply,
    replaceObjectId
  ) => {
    const slide = currentSlide(presentation, selectedSlideId);
    const n = slideNumberFor(presentation, selectedSlideId);
    const commands = placeImageCommands(candidate, {
      slideNumber: n,
      slide,
      replaceObjectId,
    });
    const result = apply(commands);

    const note: VisualAssistMessage = {
      id: uid("va"),
      role: "assistant",
      content: result.ok
        ? `Placed “${candidate.alt}” on slide ${n}. Want it moved? Say “move it to the top left” in Voice, or ask for another visual.`
        : `Couldn’t place that image — ${result.detail}`,
      at: new Date().toISOString(),
    };
    set((s) => ({ messages: [...s.messages, note] }));
    return result;
  },

  applyRecommendation: (rec, presentation, selectedSlideId, apply) => {
    if (rec.kind === "illustration") {
      const ctx = buildVisualContext(presentation, selectedSlideId);
      const queries = buildSearchQueries(
        "abstract brand illustration soft geometry",
        ctx
      );
      const candidates = searchCatalog(queries, {
        preferIllustration: true,
        limit: 8,
      });
      const msg: VisualAssistMessage = {
        id: uid("va"),
        role: "assistant",
        content:
          "Here are illustration-leaning options that match your deck style. Pick one to place.",
        at: new Date().toISOString(),
        candidates,
        searchQueries: queries,
      };
      set((s) => ({
        messages: [...s.messages, msg],
        lastCandidates: candidates,
        status: "ready",
      }));
      return { ok: true, detail: "Showing illustrations" };
    }

    const n = slideNumberFor(presentation, selectedSlideId);
    const commands = placeRecommendationCommands(rec, n);
    if (!commands.length) {
      return { ok: false, detail: "Nothing to apply" };
    }
    const result = apply(commands);
    const note: VisualAssistMessage = {
      id: uid("va"),
      role: "assistant",
      content: result.ok
        ? `Added a ${rec.kind} on slide ${n}. ${rec.reason}`
        : `Couldn’t apply that — ${result.detail}`,
      at: new Date().toISOString(),
    };
    set((s) => ({ messages: [...s.messages, note] }));
    return result;
  },
}));
