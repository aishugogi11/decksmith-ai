import { analyzeImportedPresentation } from "@/features/import/analysis/analyze-import";
import { parseEchoFlowJsonFile } from "@/features/import/parsers/decksmith/parse-json";
import { parsePdfFile } from "@/features/import/parsers/pdf/parse-pdf";
import { parsePptxFile } from "@/features/import/parsers/pptx/parse-pptx";
import type {
  ImportAnalysis,
  ImportFormat,
  ImportResult,
} from "@/features/import/types";

export function detectImportFormat(file: File): ImportFormat {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pptx")) return "pptx";
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".json")) return "decksmith-json";
  if (name.endsWith(".key")) return "keynote";
  return "unsupported";
}

export type ImportProgress = {
  stage: "reading" | "parsing" | "analyzing" | "ready";
  message: string;
};

/**
 * Universal import orchestrator.
 * Swap parsers without changing UI or analysis.
 */
export async function importPresentationFile(
  file: File,
  onProgress?: (p: ImportProgress) => void
): Promise<{ result: ImportResult; analysis: ImportAnalysis }> {
  const format = detectImportFormat(file);

  if (format === "unsupported" || format === "keynote") {
    if (format === "keynote") {
      throw new Error(
        "Apple Keynote .key isn’t supported yet — export as .pptx from Keynote, then import."
      );
    }
    throw new Error(
      `Unsupported file type. Use .pptx, .pdf, or EchoFlow .json. Google Slides & Canva are coming soon.`
    );
  }

  onProgress?.({ stage: "reading", message: `Reading ${file.name}…` });
  await tick(80);

  onProgress?.({ stage: "parsing", message: "Converting into editable objects…" });
  let result: ImportResult;
  if (format === "pptx") result = await parsePptxFile(file);
  else if (format === "pdf") result = await parsePdfFile(file);
  else result = await parseEchoFlowJsonFile(file);

  onProgress?.({ stage: "analyzing", message: "Preparing transform workspace…" });
  await tick(80);
  const analysis = analyzeImportedPresentation(result.presentation);

  onProgress?.({ stage: "ready", message: "Ready to transform" });
  return { result, analysis };
}

function tick(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
