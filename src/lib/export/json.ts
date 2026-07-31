import { presentationToDecksmithJson } from "@/features/import/parsers/decksmith/parse-json";
import type { Presentation } from "@/lib/types";

/**
 * Download native Decksmith JSON (exact re-import restore).
 */
export function exportPresentationToJson(
  presentation: Presentation,
  filename?: string
): void {
  const json = presentationToDecksmithJson(presentation);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const safe =
    (filename || presentation.title || "decksmith")
      .replace(/[^\w\-]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "decksmith";

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safe}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
