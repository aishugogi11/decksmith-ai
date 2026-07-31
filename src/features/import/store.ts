"use client";

import { create } from "zustand";
import {
  importPresentationFile,
  type ImportProgress,
} from "@/features/import/services/import-service";
import type {
  ImportAnalysis,
  ImportFormat,
  ImportPipelineState,
  ImportQuickActionId,
  ImportResult,
  ImportStatus,
} from "@/features/import/types";
import { dispatchEditorCommands } from "@/lib/editor/dispatch";
import { useEditorDebugStore } from "@/lib/editor/debug-store";
import type { EditorSelectionState } from "@/lib/voice-agent/types";
import type { Presentation } from "@/lib/types";

type ImportStore = ImportPipelineState & {
  openModal: () => void;
  closeModal: () => void;
  reset: () => void;
  importFile: (file: File) => Promise<void>;
  applyQuickAction: (args: {
    actionId: ImportQuickActionId;
    presentation: Presentation;
    selectedSlideId: string | null;
    selection: EditorSelectionState;
    onApplied: (next: {
      presentation: Presentation;
      selectedSlideId: string | null;
      selection: EditorSelectionState;
      detail: string;
    }) => void;
  }) => void;
  applyingActionId: ImportQuickActionId | null;
};

const initial: ImportPipelineState = {
  status: "idle",
  fileName: null,
  format: null,
  result: null,
  analysis: null,
  error: null,
  progressMessage: "",
  modalOpen: false,
};

export const useImportStore = create<ImportStore>((set, get) => ({
  ...initial,
  applyingActionId: null,

  openModal: () => set({ modalOpen: true, error: null }),
  closeModal: () => set({ modalOpen: false }),
  reset: () => set({ ...initial, modalOpen: get().modalOpen }),

  importFile: async (file) => {
    set({
      status: "reading",
      fileName: file.name,
      format: null,
      result: null,
      analysis: null,
      error: null,
      progressMessage: "Starting import…",
      modalOpen: true,
    });

    try {
      const { result, analysis } = await importPresentationFile(
        file,
        (p: ImportProgress) => {
          set({
            status: p.stage as ImportStatus,
            progressMessage: p.message,
          });
        }
      );
      set({
        status: "ready",
        result,
        analysis,
        format: result.meta.sourceFormat as ImportFormat,
        progressMessage: "Import complete",
        error: null,
      });
    } catch (err) {
      set({
        status: "error",
        error: err instanceof Error ? err.message : "Import failed",
        progressMessage: "",
      });
    }
  },

  applyQuickAction: ({
    actionId,
    presentation,
    selectedSlideId,
    selection,
    onApplied,
  }) => {
    const analysis = get().analysis;
    const action = analysis?.quickActions.find((a) => a.id === actionId);
    if (!action?.commands.length) return;

    set({ applyingActionId: actionId });
    try {
      const batch = dispatchEditorCommands({
        presentation,
        selectedSlideId,
        selection,
        commands: action.commands,
        source: "import",
      });
      for (const entry of batch.debugEntries) {
        useEditorDebugStore.getState().push(entry);
      }
      onApplied({
        presentation: batch.presentation,
        selectedSlideId: batch.selectedSlideId,
        selection: batch.selection,
        detail: `Applied “${action.label}” (${batch.executed.filter((e) => e.ok).length} commands).`,
      });
    } finally {
      set({ applyingActionId: null });
    }
  },
}));

export type { ImportResult, ImportAnalysis };
