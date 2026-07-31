import { dispatchEditorCommands } from "@/lib/editor/dispatch";
import { useEditorDebugStore } from "@/lib/editor/debug-store";
import type { RedesignAction } from "@/features/feedback/types";
import type { Presentation } from "@/lib/types";
import type { EditorSelectionState } from "@/lib/voice-agent/types";

export function applyRedesignActions(
  presentation: Presentation,
  selectedSlideId: string | null,
  selection: EditorSelectionState,
  actions: RedesignAction[],
  source: "feedback" | "coach" = "feedback"
): {
  presentation: Presentation;
  selectedSlideId: string | null;
  selection: EditorSelectionState;
  appliedIds: string[];
  failed: { id: string; detail: string }[];
} {
  const pending = actions.filter((a) => a.status === "pending");
  const batch = dispatchEditorCommands({
    presentation,
    selectedSlideId,
    // Keep slide targeting even when no object is selected
    selection,
    commands: pending.map((a) => a.command),
    source,
  });

  for (const entry of batch.debugEntries) {
    useEditorDebugStore.getState().push(entry);
  }

  const appliedIds: string[] = [];
  const failed: { id: string; detail: string }[] = [];
  pending.forEach((action, i) => {
    const result = batch.executed[i];
    if (result?.ok) appliedIds.push(action.id);
    else failed.push({ id: action.id, detail: result?.detail || "Failed" });
  });

  return {
    presentation: batch.presentation,
    selectedSlideId: batch.selectedSlideId,
    selection: batch.selection,
    appliedIds,
    failed,
  };
}
