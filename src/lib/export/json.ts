import { presentationToEchoFlowJson } from "@/features/import/parsers/decksmith/parse-json";
import type { Presentation } from "@/lib/types";

/**
 * Download native EchoFlow JSON (exact re-import restore).
 */
export function exportPresentationToJson(
  presentation: Presentation,
  filename?: string
): void {
  const json = presentationToEchoFlowJson(presentation);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const safe =
    (filename || presentation.title || "echoflow")
      .replace(/[^\w\-]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "echoflow";

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safe}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
