"use client";

import { create } from "zustand";
import {
  initialResearchStages,
  runResearchPipeline,
} from "@/features/research/pipeline";
import { researchBundleToPresentation } from "@/features/research/to-presentation";
import type {
  ResearchBundle,
  ResearchStageId,
  ResearchStageState,
} from "@/features/research/types";
import { useSubscriptionStore } from "@/features/subscription/store";
import type { Presentation } from "@/lib/types";

type ResearchStore = {
  input: string;
  stages: ResearchStageState[];
  status: ResearchStageId;
  output: ResearchBundle | null;
  processing: boolean;
  error: string | null;
  setInput: (v: string) => void;
  run: () => Promise<void>;
  reset: () => void;
  toPresentation: () => Presentation | null;
};

export const useResearchStore = create<ResearchStore>((set, get) => ({
  input: "",
  stages: initialResearchStages(),
  status: "idle",
  output: null,
  processing: false,
  error: null,

  setInput: (v) => set({ input: v, error: null }),

  reset: () =>
    set({
      stages: initialResearchStages(),
      status: "idle",
      output: null,
      processing: false,
      error: null,
    }),

  run: async () => {
    const sub = useSubscriptionStore.getState();
    if (!sub.hasFeature("research_mode")) {
      sub.openUpgrade(
        "Research Mode is a Pro feature — sources, stats, citations, and a ready outline."
      );
      return;
    }
    if (!sub.recordAiRequest()) return;

    set({
      processing: true,
      error: null,
      output: null,
      stages: initialResearchStages(),
      status: "search",
    });

    try {
      const output = await runResearchPipeline(get().input, (p) => {
        set({ stages: p.stages, status: p.stage });
      });
      set({
        output,
        processing: false,
        status: "done",
        stages: get().stages.map((s) => ({ ...s, status: "done" as const })),
      });
    } catch (err) {
      set({
        processing: false,
        status: "error",
        error: err instanceof Error ? err.message : "Research failed",
      });
    }
  },

  toPresentation: () => {
    const output = get().output;
    if (!output) return null;
    return researchBundleToPresentation(output);
  },
}));
