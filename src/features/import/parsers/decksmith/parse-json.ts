import type {
  Presentation,
  PresentationImportMeta,
  Slide,
  ThemeId,
} from "@/lib/types";
import { uid } from "@/lib/utils";
import type { ImportResult } from "@/features/import/types";

/** Full Decksmith deck JSON (native restore). */
export type DecksmithDeckFile = {
  version?: number;
  presentation: Presentation;
  citations?: unknown[];
  metadata?: Record<string, unknown>;
};

/** Portable template JSON (legacy). */
type Portable = {
  name: string;
  description?: string;
  themeId?: ThemeId;
  tags?: string[];
  slides: Omit<Slide, "id">[];
};

export async function parseDecksmithJsonFile(file: File): Promise<ImportResult> {
  const raw = await file.text();
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON file.");
  }

  const now = new Date().toISOString();

  // Native full deck
  if (
    data &&
    typeof data === "object" &&
    "presentation" in data &&
    (data as DecksmithDeckFile).presentation?.slides
  ) {
    const deck = data as DecksmithDeckFile;
    const presentation: Presentation = {
      ...deck.presentation,
      id: deck.presentation.id || uid("deck"),
      slides: deck.presentation.slides.map((s) => ({
        ...s,
        id: s.id || uid("slide"),
        objects: s.objects?.map((o) => ({ ...o, id: o.id || uid("obj") })),
      })),
      updatedAt: now,
      createdAt: deck.presentation.createdAt || now,
    };
    const counts = countObjects(presentation);
    const meta: PresentationImportMeta = {
      sourceFormat: "decksmith-json",
      sourceFileName: file.name,
      importedAt: now,
      counts,
      warnings: [],
    };
    presentation.importMeta = meta;
    return { presentation, meta, providerId: "decksmith" };
  }

  // Direct Presentation shape
  if (
    data &&
    typeof data === "object" &&
    "slides" in data &&
    Array.isArray((data as Presentation).slides) &&
    "themeId" in data
  ) {
    const p = data as Presentation;
    const presentation: Presentation = {
      ...p,
      id: p.id || uid("deck"),
      slides: p.slides.map((s) => ({
        ...s,
        id: s.id || uid("slide"),
        objects: s.objects?.map((o) => ({ ...o, id: o.id || uid("obj") })),
      })),
      updatedAt: now,
      createdAt: p.createdAt || now,
    };
    const counts = countObjects(presentation);
    const meta: PresentationImportMeta = {
      sourceFormat: "decksmith-json",
      sourceFileName: file.name,
      importedAt: now,
      counts,
      warnings: [],
    };
    presentation.importMeta = meta;
    return { presentation, meta, providerId: "decksmith" };
  }

  // Legacy portable template
  const portable = data as Portable;
  if (!portable?.name || !Array.isArray(portable.slides)) {
    throw new Error(
      "Unrecognized Decksmith JSON — expected presentation, deck file, or template."
    );
  }

  const presentation: Presentation = {
    id: uid("deck"),
    title: portable.name,
    subtitle: portable.description,
    themeId: portable.themeId ?? "minimal",
    slides: portable.slides.map((s) => ({
      ...s,
      id: uid("slide"),
      objects: s.objects?.map((o) => ({ ...o, id: o.id || uid("obj") })),
    })),
    createdAt: now,
    updatedAt: now,
  };
  const counts = countObjects(presentation);
  const meta: PresentationImportMeta = {
    sourceFormat: "decksmith-json",
    sourceFileName: file.name,
    importedAt: now,
    counts,
    warnings: ["Imported from portable template JSON."],
  };
  presentation.importMeta = meta;
  return { presentation, meta, providerId: "decksmith" };
}

function countObjects(presentation: Presentation) {
  let textboxes = 0;
  let images = 0;
  let charts = 0;
  let shapes = 0;
  let notes = 0;
  for (const s of presentation.slides) {
    if (s.notes) notes += 1;
    for (const o of s.objects ?? []) {
      if (o.type === "textbox") textboxes += 1;
      else if (o.type === "image") images += 1;
      else if (o.type === "chart") charts += 1;
      else if (o.type === "shape") shapes += 1;
    }
  }
  return {
    slides: presentation.slides.length,
    textboxes,
    images,
    charts,
    shapes,
    notes,
  };
}

/** Serialize a live presentation for native re-import. */
export function presentationToDecksmithJson(presentation: Presentation): string {
  const file: DecksmithDeckFile = {
    version: 1,
    presentation,
    metadata: {
      exportedAt: new Date().toISOString(),
      app: "decksmith-ai",
    },
  };
  return JSON.stringify(file, null, 2);
}
