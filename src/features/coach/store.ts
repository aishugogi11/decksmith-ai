"use client";

import { create } from "zustand";
import {
  analyzePresentationCoach,
  type CoachRecommendation,
  type CoachWorkspaceReport,
} from "@/features/coach/analyze";
import { applyRedesignActions } from "@/features/feedback/apply";
import { useSubscriptionStore } from "@/features/subscription/store";
import type { Presentation } from "@/lib/types";
import type { EditorSelectionState } from "@/lib/voice-agent/types";

type CoachStore = {
  report: CoachWorkspaceReport | null;
  processing: boolean;
  error: string | null;
  dismissed: string[];
  analyze: (presentation: Presentation, audienceHint?: string) => void;
  dismiss: (id: string) => void;
  applyRecommendation: (opts: {
    rec: CoachRecommendation;
    presentation: Presentation;
    selectedSlideId: string | null;
    selection: EditorSelectionState;
    onApplied: (next: {
      presentation: Presentation;
      selectedSlideId: string | null;
      selection: EditorSelectionState;
    }) => void;
  }) => void;
};

export const useCoachStore = create<CoachStore>((set, get) => ({
  report: null,
  processing: false,
  error: null,
  dismissed: [],

  dismiss: (id) => set((s) => ({ dismissed: [...s.dismissed, id] })),

  analyze: (presentation, audienceHint) => {
    const sub = useSubscriptionStore.getState();
    if (!sub.hasFeature("presentation_coach")) {
      sub.openUpgrade(
        "Presentation Coach is a Pro feature with speaking-time estimates and Apply actions."
      );
      return;
    }
    if (!sub.recordAiRequest()) return;

    set({ processing: true, error: null, dismissed: [] });
    try {
      const report = analyzePresentationCoach(presentation, { audienceHint });
      set({ report, processing: false });
    } catch (err) {
      set({
        processing: false,
        error: err instanceof Error ? err.message : "Coach failed",
      });
    }
  },

  applyRecommendation: ({
    rec,
    presentation,
    selectedSlideId,
    selection,
    onApplied,
  }) => {
    const applied = applyRedesignActions(
      presentation,
      selectedSlideId,
      selection,
      [
        {
          id: rec.id,
          issueId: rec.id,
          label: rec.message,
          command: rec.command,
          status: "pending",
        },
      ],
      "coach"
    );
    get().dismiss(rec.id);
    onApplied({
      presentation: applied.presentation,
      selectedSlideId: applied.selectedSlideId,
      selection: applied.selection,
    });
  },
}));
