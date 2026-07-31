import type { Presentation } from "@/lib/types";
import {
  emptyEditorSelection,
  type EditorSelectionState,
} from "@/lib/voice-agent/types";

/**
 * Single source of truth for slide + object focus.
 * When selectedSlideId and selection.slideId disagree, the visible slide wins.
 */
export function normalizeEditorSelection(
  presentation: Presentation,
  selectedSlideId: string | null,
  selection: EditorSelectionState
): {
  selectedSlideId: string | null;
  selection: EditorSelectionState;
} {
  const slides = presentation.slides;
  if (!slides.length) {
    return { selectedSlideId: null, selection: emptyEditorSelection() };
  }

  const visibleId =
    selectedSlideId && slides.some((s) => s.id === selectedSlideId)
      ? selectedSlideId
      : slides[0]!.id;

  // Stale selection from another slide — keep slide sync, clear object
  if (selection.slideId && selection.slideId !== visibleId) {
    return {
      selectedSlideId: visibleId,
      selection: {
        slideId: visibleId,
        objectId: null,
        objectType: null,
        lastAction: selection.lastAction,
      },
    };
  }

  const slide = slides.find((s) => s.id === visibleId)!;
  if (selection.objectId) {
    const obj = slide.objects?.find((o) => o.id === selection.objectId);
    if (!obj) {
      return {
        selectedSlideId: visibleId,
        selection: {
          slideId: visibleId,
          objectId: null,
          objectType: null,
          lastAction: selection.lastAction,
        },
      };
    }
    return {
      selectedSlideId: visibleId,
      selection: {
        slideId: visibleId,
        objectId: obj.id,
        objectType: obj.type,
        lastAction: selection.lastAction,
      },
    };
  }

  return {
    selectedSlideId: visibleId,
    selection: {
      slideId: visibleId,
      objectId: null,
      objectType: null,
      lastAction: selection.lastAction,
    },
  };
}

export function selectionForSlideChange(
  slideId: string,
  prev: EditorSelectionState
): EditorSelectionState {
  return {
    slideId,
    objectId: null,
    objectType: null,
    lastAction: prev.lastAction,
  };
}

export function multiIds(selection: EditorSelectionState): string[] {
  return selection.objectId ? [selection.objectId] : [];
}
