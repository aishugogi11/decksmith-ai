"use client";

import { create } from "zustand";
import { applyRedesignActions } from "@/features/feedback/apply";
import { runFeedbackPipeline } from "@/features/feedback/pipeline";
import { detectFeedbackSourceKind } from "@/features/feedback/parse";
import type {
  FeedbackPipelineResult,
  FeedbackPipelineStage,
  FeedbackSourceKind,
  RedesignAction,
} from "@/features/feedback/types";
import type { Presentation } from "@/lib/types";
import type { EditorSelectionState } from "@/lib/voice-agent/types";
import { useSubscriptionStore } from "@/features/subscription/store";

type FeedbackStore = {
  input: string;
  sourceKind: FeedbackSourceKind;
  status: FeedbackPipelineStage;
  progressMessage: string;
  result: FeedbackPipelineResult | null;
  error: string | null;
  processing: boolean;

  setInput: (text: string) => void;
  setSourceKind: (kind: FeedbackSourceKind) => void;
  analyze: (presentation: Presentation) => Promise<void>;
  dismissAction: (id: string) => void;
  reset: () => void;

  /** Apply one or all pending actions into the live presentation */
  applyActions: (opts: {
    presentation: Presentation;
    selectedSlideId: string | null;
    selection: EditorSelectionState;
    actionIds?: string[];
    onApplied: (next: {
      presentation: Presentation;
      selectedSlideId: string | null;
      selection: EditorSelectionState;
    }) => void;
  }) => void;
};

export const useFeedbackStore = create<FeedbackStore>((set, get) => ({
  input: "",
  sourceKind: "general",
  status: "idle",
  progressMessage: "",
  result: null,
  error: null,
  processing: false,

  setInput: (text) =>
    set({
      input: text,
      sourceKind: detectFeedbackSourceKind(text),
      error: null,
    }),

  setSourceKind: (kind) => set({ sourceKind: kind }),

  reset: () =>
    set({
      status: "idle",
      progressMessage: "",
      result: null,
      error: null,
      processing: false,
    }),

  dismissAction: (id) =>
    set((state) => {
      if (!state.result) return state;
      return {
        result: {
          ...state.result,
          actions: state.result.actions.map((a) =>
            a.id === id ? { ...a, status: "dismissed" as const } : a
          ),
        },
      };
    }),

  analyze: async (presentation) => {
    const sub = useSubscriptionStore.getState();
    if (!sub.hasFeature("feedback_redesign")) {
      sub.openUpgrade(
        "Feedback → Redesign is a Pro feature. Upgrade to turn reviews into editor actions."
      );
      return;
    }
    if (!sub.recordAiRequest()) return;

    const input = get().input.trim();
    set({
      processing: true,
      status: "parsing",
      error: null,
      progressMessage: "Starting…",
      result: null,
    });

    try {
      const result = await runFeedbackPipeline(input, presentation, (p) => {
        set({ status: p.stage, progressMessage: p.message });
      });
      set({
        result,
        status: "ready",
        processing: false,
        progressMessage: "Preview ready",
      });
    } catch (err) {
      set({
        processing: false,
        status: "error",
        error: err instanceof Error ? err.message : "Feedback analysis failed",
      });
    }
  },

  applyActions: ({
    presentation,
    selectedSlideId,
    selection,
    actionIds,
    onApplied,
  }) => {
    const result = get().result;
    if (!result) return;

    const targets: RedesignAction[] = result.actions
      .filter((a) => a.status === "pending")
      .filter((a) => !actionIds || actionIds.includes(a.id));

    if (!targets.length) return;

    set({ status: "applying", processing: true });
    const applied = applyRedesignActions(
      presentation,
      selectedSlideId,
      selection,
      targets
    );

    set((state) => {
      if (!state.result) return { processing: false, status: "ready" };
      const ids = new Set(applied.appliedIds);
      return {
        processing: false,
        status: "ready",
        result: {
          ...state.result,
          actions: state.result.actions.map((a) =>
            ids.has(a.id) ? { ...a, status: "applied" as const } : a
          ),
        },
      };
    });

    onApplied({
      presentation: applied.presentation,
      selectedSlideId: applied.selectedSlideId,
      selection: applied.selection,
    });
  },
}));
