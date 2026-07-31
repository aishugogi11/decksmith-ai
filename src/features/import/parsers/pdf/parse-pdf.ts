import type {
  EditorObject,
  Presentation,
  PresentationImportMeta,
  Slide,
} from "@/lib/types";
import { uid } from "@/lib/utils";
import type { ImportResult } from "@/features/import/types";
import type { OcrProvider } from "@/features/import/parsers/pdf/ocr-provider";
import { noopOcrProvider } from "@/features/import/parsers/pdf/ocr-provider";
import { loadPdfJs } from "@/features/import/parsers/pdf/pdfjs-loader";

type TextItem = {
  str: string;
  transform: number[];
  width: number;
  height: number;
  hasEOL?: boolean;
};

type LineBlock = {
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fontSize: number;
};

/**
 * PDF → editable Decksmith slides.
 * Uses Mozilla PDF.js for real text-layer extraction + page rasterization
 * so imported slides match the uploaded deck visually.
 */
export async function parsePdfFile(
  file: File,
  ocr: OcrProvider = noopOcrProvider
): Promise<ImportResult> {
  void ocr;
  const buf = await file.arrayBuffer();
  const data = new Uint8Array(buf);

  const pdfjs = await loadPdfJs();
  // Copy buffer — pdf.js may transfer ownership of TypedArrays to the worker
  const doc = await pdfjs.getDocument({
    data: data.slice(0),
    useSystemFonts: true,
    isEvalSupported: false,
  }).promise;

  const warnings: string[] = [];
  const slides: Slide[] = [];
  let textboxes = 0;
  let images = 0;

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1 });
    const pageW = viewport.width;
    const pageH = viewport.height;

    // High-DPI raster of the page → exact visual match
    const renderScale = Math.min(2.2, 1600 / Math.max(pageW, 1));
    const renderViewport = page.getViewport({ scale: renderScale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(renderViewport.width);
    canvas.height = Math.floor(renderViewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not create canvas for PDF page render.");

    await page.render({
      canvasContext: ctx,
      viewport: renderViewport,
    }).promise;

    const pageImage = canvas.toDataURL("image/jpeg", 0.92);
    images += 1;

    // Structured text with positions (for AI + optional edit overlays)
    const content = await page.getTextContent();
    const items = (content.items as TextItem[]).filter(
      (it) => typeof it?.str === "string" && it.str.trim().length > 0
    );
    const lines = groupIntoLines(items, pageW, pageH);
    const cleanLines = lines.filter((l) => isCleanText(l.text));

    if (!cleanLines.length) {
      warnings.push(
        `Page ${pageNum}: little/no text layer — showing page image (OCR can be plugged in later).`
      );
    }

    const title =
      pickTitle(cleanLines) ||
      (pageNum === 1 ? file.name.replace(/\.pdf$/i, "") : `Slide ${pageNum}`);

    const bodyLines = cleanLines
      .filter((l) => l.text !== title)
      .map((l) => l.text);

    const objects: EditorObject[] = [
      {
        id: uid("obj"),
        type: "image",
        x: 0,
        y: 0,
        w: 100,
        h: 100,
        src: pageImage,
        imageHint: "__import_page__",
        zIndex: 0,
      },
    ];

    // Editable text overlays matching PDF positions (transparent until selected)
    for (const line of cleanLines.slice(0, 40)) {
      objects.push({
        id: uid("obj"),
        type: "textbox",
        x: clamp(line.x, 0, 92),
        y: clamp(line.y, 0, 92),
        w: clamp(line.w, 8, 100 - line.x),
        h: clamp(Math.max(line.h, 4), 3, 24),
        text: line.text,
        fontSize: clamp(Math.round(line.fontSize * 0.85), 11, 48),
        zIndex: 1,
      });
      textboxes += 1;
    }

    slides.push({
      id: uid("slide"),
      layout: "blank",
      title,
      subtitle: bodyLines[0],
      body: bodyLines.slice(0, 12).join("\n") || undefined,
      bullets: inferBullets(bodyLines),
      objects,
      imageHint: `PDF page ${pageNum}`,
    });
  }

  await doc.destroy();

  if (!slides.length) {
    throw new Error("No pages found in this PDF.");
  }

  const now = new Date().toISOString();
  const title = file.name.replace(/\.pdf$/i, "") || "Imported PDF";
  const meta: PresentationImportMeta = {
    sourceFormat: "pdf",
    sourceFileName: file.name,
    importedAt: now,
    counts: {
      slides: slides.length,
      textboxes,
      images,
      charts: 0,
      shapes: 0,
      notes: 0,
    },
    warnings: [
      "Each PDF page is rendered exactly, with editable text overlays from the text layer.",
      ...warnings.slice(0, 6),
    ],
  };

  const presentation: Presentation = {
    id: uid("deck"),
    title,
    subtitle: `Imported from ${file.name}`,
    themeId: "minimal",
    slides,
    createdAt: now,
    updatedAt: now,
    importMeta: meta,
  };

  return { presentation, meta, providerId: "pdf" };
}

function groupIntoLines(
  items: TextItem[],
  pageW: number,
  pageH: number
): LineBlock[] {
  // PDF y grows upward; transform[5] is baseline y from bottom-left.
  type Raw = {
    str: string;
    x: number;
    yTop: number;
    w: number;
    h: number;
    fontSize: number;
  };

  const raws: Raw[] = [];
  for (const it of items) {
    const str = sanitizeFragment(it.str);
    if (!str) continue;
    const [a, , , d, e, f] = it.transform;
    const fontSize = Math.abs(d || a || 12);
    const x = e;
    // Convert to top-left origin in PDF units
    const yTop = pageH - f - fontSize;
    const w = it.width || str.length * fontSize * 0.5;
    const h = it.height || fontSize * 1.15;
    raws.push({ str, x, yTop, w, h, fontSize });
  }

  // Group by similar y (same visual line)
  raws.sort((a, b) => a.yTop - b.yTop || a.x - b.x);
  const lines: Raw[][] = [];
  const yTol = 3.5;

  for (const r of raws) {
    const last = lines[lines.length - 1];
    if (
      last &&
      Math.abs(last[0]!.yTop - r.yTop) <= Math.max(yTol, last[0]!.fontSize * 0.35)
    ) {
      last.push(r);
    } else {
      lines.push([r]);
    }
  }

  return lines.map((parts) => {
    parts.sort((a, b) => a.x - b.x);
    let text = "";
    let prevRight = -Infinity;
    for (const p of parts) {
      const gap = p.x - prevRight;
      if (text && gap > p.fontSize * 0.25) text += " ";
      text += p.str;
      prevRight = p.x + p.w;
    }
    text = text.replace(/\s+/g, " ").trim();

    const minX = Math.min(...parts.map((p) => p.x));
    const maxX = Math.max(...parts.map((p) => p.x + p.w));
    const minY = Math.min(...parts.map((p) => p.yTop));
    const maxY = Math.max(...parts.map((p) => p.yTop + p.h));
    const fontSize = Math.max(...parts.map((p) => p.fontSize));

    return {
      text,
      x: (minX / pageW) * 100,
      y: (minY / pageH) * 100,
      w: ((maxX - minX) / pageW) * 100,
      h: ((maxY - minY) / pageH) * 100,
      fontSize: (fontSize / pageH) * 540, // ~px on 16:9 canvas height scale
    };
  });
}

function sanitizeFragment(s: string): string {
  return s
    .replace(/\u0000/g, "")
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/\s+/g, " ");
}

/** Reject binary/metadata garbage that the old Latin1 scraper pulled in. */
function isCleanText(text: string): boolean {
  if (text.length < 1) return false;
  if (text.length > 400) return false;

  const bad =
    /\/(Type|Filter|Length|Width|Height|ColorSpace|Subtype|Resources|MediaBox|Parent|Contents|XObject|Font|ProcSet|ExtGState|DCTDecode|FlateDecode|DeviceRGB|DeviceCMYK)\b/i;
  if (bad.test(text)) return false;
  if (/\b(JFIF|Exif|stream|endstream|endobj|xref)\b/i.test(text)) return false;
  if (/^[\x00-\x08\x0E-\x1F]+/.test(text)) return false;

  // Require mostly printable / letters
  const letters = (text.match(/[A-Za-z0-9]/g) || []).length;
  const weird = (text.match(/[^\x20-\x7E\u00A0-\u024F\s]/g) || []).length;
  if (letters < 1 && text.length > 2) return false;
  if (weird > text.length * 0.25) return false;
  if (letters / Math.max(text.length, 1) < 0.15 && text.length > 8) return false;

  return true;
}

function pickTitle(lines: LineBlock[]): string | null {
  if (!lines.length) return null;
  // Prefer larger font near the top of the page
  const ranked = [...lines].sort((a, b) => {
    const score = (l: LineBlock) => l.fontSize * 2 - l.y * 0.15;
    return score(b) - score(a);
  });
  const top = ranked.find(
    (l) => l.y < 45 && l.text.length >= 2 && l.text.length < 120
  );
  return top?.text || lines[0]?.text || null;
}

function inferBullets(lines: string[]): string[] | undefined {
  const bullets = lines
    .filter((t) => /^[•\-\u2013\u2014*]|\d+[\.)]\s/.test(t) || t.length < 90)
    .slice(0, 8);
  return bullets.length >= 2 ? bullets : undefined;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
