"use client";

import { create } from "zustand";

/**
 * Request canvas to focus/edit a textbox after CREATE_TEXTBOX (or similar).
 */
type FocusState = {
  objectId: string | null;
  nonce: number;
  requestFocus: (objectId: string) => void;
  clear: () => void;
};

export const useEditorFocusStore = create<FocusState>((set) => ({
  objectId: null,
  nonce: 0,
  requestFocus: (objectId) =>
    set((s) => ({ objectId, nonce: s.nonce + 1 })),
  clear: () => set({ objectId: null }),
}));
