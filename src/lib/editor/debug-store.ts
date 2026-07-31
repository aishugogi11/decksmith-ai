"use client";

import { create } from "zustand";
import type { EditorDebugEntry } from "@/lib/editor/types";
import type { EditorHistorySnapshot } from "@/lib/editor/types";
import type { EditorSelectionState } from "@/lib/voice-agent/types";

type EditorDebugState = {
  open: boolean;
  entries: EditorDebugEntry[];
  lastError: string | null;
  /** Mirrored for the panel (set by store on commit) */
  currentSlideId: string | null;
  selection: EditorSelectionState | null;
  undoDepth: number;
  redoDepth: number;
  lastVoiceTranscript: string | null;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  push: (entry: EditorDebugEntry) => void;
  mirror: (snap: {
    currentSlideId: string | null;
    selection: EditorSelectionState;
    undoDepth: number;
    redoDepth: number;
    lastVoiceTranscript?: string | null;
  }) => void;
  clear: () => void;
};

export const useEditorDebugStore = create<EditorDebugState>((set) => ({
  open: false,
  entries: [],
  lastError: null,
  currentSlideId: null,
  selection: null,
  undoDepth: 0,
  redoDepth: 0,
  lastVoiceTranscript: null,
  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open })),
  push: (entry) =>
    set((s) => ({
      entries: [entry, ...s.entries].slice(0, 80),
      lastError: entry.ok ? s.lastError : entry.error || entry.detail,
    })),
  mirror: (snap) =>
    set((s) => ({
      currentSlideId: snap.currentSlideId,
      selection: snap.selection,
      undoDepth: snap.undoDepth,
      redoDepth: snap.redoDepth,
      lastVoiceTranscript:
        snap.lastVoiceTranscript !== undefined
          ? snap.lastVoiceTranscript
          : s.lastVoiceTranscript,
    })),
  clear: () => set({ entries: [], lastError: null }),
}));

export type { EditorHistorySnapshot };
