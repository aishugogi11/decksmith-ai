import type {
  EditorObject,
  Presentation,
  PresentationImportMeta,
  Slide,
  SlideLayout,
  ThemeId,
} from "@/lib/types";
import { uid } from "@/lib/utils";
import type { ImportResult } from "@/features/import/types";

type ZipLike = {
  files: Record<string, { async: (t: "string" | "base64" | "uint8array") => Promise<string | Uint8Array> }>;
};

/**
 * PPTX → native EchoFlow presentation with editable objects.
 * Best-effort OOXML parse — not a full PowerPoint clone, but no static screenshots.
 */
export async function parsePptxFile(file: File): Promise<ImportResult> {
  const buf = await file.arrayBuffer();
  const JSZip = (await import("jszip")).default;
  const zip = (await JSZip.loadAsync(buf)) as unknown as ZipLike;

  const { slideW, slideH } = await readSlideSize(zip);
  const themeId = await inferThemeId(zip);
  const slidePaths = Object.keys(zip.files)
    .filter((p) => /^ppt\/slides\/slide\d+\.xml$/i.test(p))
    .sort((a, b) => numPath(a) - numPath(b));

  if (!slidePaths.length) {
    throw new Error("No slides found in this PPTX file.");
  }

  const warnings: string[] = [];
  const slides: Slide[] = [];
  let textboxes = 0;
  let images = 0;
  let charts = 0;
  let shapes = 0;
  let notesCount = 0;

  for (let i = 0; i < slidePaths.length; i++) {
    const path = slidePaths[i]!;
    const xml = String(await zip.files[path]!.async("string"));
    const relsPath = path
      .replace("slides/slide", "slides/_rels/slide")
      .replace(/\.xml$/i, ".xml.rels");
    const relsXml = zip.files[relsPath]
      ? String(await zip.files[relsPath]!.async("string"))
      : "";

    const notes = await readNotes(zip, relsXml);
    if (notes) notesCount += 1;

    const media = await extractImages(zip, relsXml);
    images += media.length;

    const { objects, hasChart, shapeCount } = extractObjects(
      xml,
      media,
      slideW,
      slideH
    );
    textboxes += objects.filter((o) => o.type === "textbox").length;
    shapes += shapeCount;
    if (hasChart) charts += 1;

    const texts = objects
      .filter((o) => o.type === "textbox" && o.text)
      .map((o) => o.text!)
      .filter(Boolean);

    const title = texts[0] || `Slide ${i + 1}`;
    const rest = texts.slice(1);
    const layout = inferLayout(texts, i, slidePaths.length, hasChart, media.length);

    slides.push({
      id: uid("slide"),
      ...slideFields(layout, title, rest, hasChart, media),
      notes: notes || undefined,
      objects,
    });
  }

  if (charts === 0 && warnings.length === 0) {
    /* ok */
  }

  const now = new Date().toISOString();
  const title = file.name.replace(/\.pptx$/i, "") || "Imported slides";
  const meta: PresentationImportMeta = {
    sourceFormat: "pptx",
    sourceFileName: file.name,
    importedAt: now,
    counts: {
      slides: slides.length,
      textboxes,
      images,
      charts,
      shapes,
      notes: notesCount,
    },
    warnings,
  };

  const presentation: Presentation = {
    id: uid("deck"),
    title,
    subtitle: `Imported from ${file.name}`,
    themeId,
    slides,
    createdAt: now,
    updatedAt: now,
    importMeta: meta,
  };

  return { presentation, meta, providerId: "pptx" };
}

function numPath(p: string) {
  return Number(p.match(/slide(\d+)/i)?.[1] ?? 0);
}

async function readSlideSize(zip: ZipLike) {
  const pres = zip.files["ppt/presentation.xml"];
  if (!pres) return { slideW: 12192000, slideH: 6858000 };
  const xml = String(await pres.async("string"));
  const cx = Number(xml.match(/sldSz[^>]*cx="(\d+)"/)?.[1] ?? 12192000);
  const cy = Number(xml.match(/sldSz[^>]*cy="(\d+)"/)?.[1] ?? 6858000);
  return { slideW: cx || 12192000, slideH: cy || 6858000 };
}

async function inferThemeId(zip: ZipLike): Promise<ThemeId> {
  const theme = zip.files["ppt/theme/theme1.xml"];
  if (!theme) return "minimal";
  const xml = String(await theme.async("string")).toLowerCase();
  if (/dk1|dark/.test(xml) && /schemeclr.*dk1/.test(xml)) return "dark";
  if (/accent1[^>]*>#[0-9a-f]*0{0,2}[0-9a-f]{0,2}76/.test(xml)) return "corporate";
  return "minimal";
}

async function readNotes(zip: ZipLike, relsXml: string): Promise<string | null> {
  const notesTarget = relsXml.match(
    /Type="[^"]*notesSlide"[^>]*Target="([^"]+)"/i
  )?.[1];
  if (!notesTarget) return null;
  const path = normalizeRel("ppt/slides/", notesTarget);
  const file = zip.files[path];
  if (!file) return null;
  const xml = String(await file.async("string"));
  const texts: string[] = [];
  const re = /<a:t[^>]*>([\s\S]*?)<\/a:t>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const t = decodeXml(m[1] || "").trim();
    if (t) texts.push(t);
  }
  return texts.join(" ").trim() || null;
}

function normalizeRel(base: string, target: string) {
  if (target.startsWith("/")) return target.slice(1);
  // ppt/slides/../notesSlides/notesSlide1.xml
  const joined = base + target;
  const parts = joined.split("/");
  const out: string[] = [];
  for (const p of parts) {
    if (p === "..") out.pop();
    else if (p && p !== ".") out.push(p);
  }
  return out.join("/");
}

type MediaRef = { rId: string; dataUrl: string; hint: string };

async function extractImages(
  zip: ZipLike,
  relsXml: string
): Promise<MediaRef[]> {
  const out: MediaRef[] = [];
  const re =
    /Id="(rId\d+)"[^>]*Type="[^"]*image"[^>]*Target="([^"]+)"/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(relsXml))) {
    const rId = m[1]!;
    const target = m[2]!;
    const path = normalizeRel("ppt/slides/", target);
    const file = zip.files[path];
    if (!file) continue;
    try {
      const bytes = (await file.async("uint8array")) as Uint8Array;
      const ext = path.split(".").pop()?.toLowerCase() || "png";
      const mime =
        ext === "jpg" || ext === "jpeg"
          ? "image/jpeg"
          : ext === "gif"
            ? "image/gif"
            : ext === "svg"
              ? "image/svg+xml"
              : "image/png";
      const b64 = uint8ToBase64(bytes);
      out.push({
        rId,
        dataUrl: `data:${mime};base64,${b64}`,
        hint: path.split("/").pop() || "image",
      });
    } catch {
      /* skip broken media */
    }
  }
  return out;
}

function extractObjects(
  xml: string,
  media: MediaRef[],
  slideW: number,
  slideH: number
): { objects: EditorObject[]; hasChart: boolean; shapeCount: number } {
  const objects: EditorObject[] = [];
  let shapeCount = 0;
  const hasChart = /<c:chart[\s>]|<a:graphicData[^>]*charts/i.test(xml);

  // Split roughly by shape containers
  const chunks = xml.split(/<p:sp[\s>]|<p:pic[\s>]|<p:graphicFrame[\s>]/i);
  // First chunk is preamble — skip
  for (let i = 1; i < chunks.length; i++) {
    const chunk = chunks[i]!;
    const isPic = xml.includes("<p:pic") && /<p:blip[\s>]|a:blip/i.test(chunk);
    // Detect type from preceding tag — rebuild from split is imperfect; use content
    const looksLikePic = /a:blip|p:blipFill/i.test(chunk);
    const looksLikeChart = /c:chart|charts\/chart/i.test(chunk);
    const off = chunk.match(
      /<a:off[^>]*x="(-?\d+)"[^>]*y="(-?\d+)"/
    );
    const ext = chunk.match(
      /<a:ext[^>]*cx="(-?\d+)"[^>]*cy="(-?\d+)"/
    );
    const x = off ? emuToPct(Number(off[1]), slideW) : 10 + (i % 3) * 5;
    const y = off ? emuToPct(Number(off[2]), slideH) : 20 + (i % 4) * 8;
    const w = ext ? emuToPct(Number(ext[1]), slideW) : 40;
    const h = ext ? emuToPct(Number(ext[2]), slideH) : 18;

    if (looksLikeChart || hasChart && /graphicFrame/i.test(chunk)) {
      objects.push({
        id: uid("obj"),
        type: "chart",
        x: clamp(x, 0, 90),
        y: clamp(y, 0, 90),
        w: clamp(w, 15, 90),
        h: clamp(h, 15, 80),
        chartHint: "Imported chart",
      });
      continue;
    }

    if (looksLikePic || isPic) {
      const embed = chunk.match(/r:embed="(rId\d+)"/i)?.[1];
      const mediaRef = media.find((m) => m.rId === embed) || media[0];
      objects.push({
        id: uid("obj"),
        type: "image",
        x: clamp(x, 0, 90),
        y: clamp(y, 0, 90),
        w: clamp(w, 10, 90),
        h: clamp(h, 10, 80),
        src: mediaRef?.dataUrl,
        imageHint: mediaRef?.hint || "Imported image",
      });
      continue;
    }

    const texts = extractTextFromChunk(chunk);
    if (texts.length) {
      const fontSz =
        Number(chunk.match(/sz="(\d+)"/)?.[1] ?? 0) / 100 || 22;
      objects.push({
        id: uid("obj"),
        type: "textbox",
        x: clamp(x, 0, 90),
        y: clamp(y, 0, 90),
        w: clamp(w || 50, 12, 95),
        h: clamp(h || 16, 8, 80),
        text: texts.join("\n"),
        fontSize: clamp(fontSz, 10, 72),
      });
      continue;
    }

    // Bare shape
    if (/prstGeom|solidFill/i.test(chunk)) {
      shapeCount += 1;
      const prst = chunk.match(/prst="([^"]+)"/)?.[1] || "rect";
      objects.push({
        id: uid("obj"),
        type: "shape",
        x: clamp(x, 0, 90),
        y: clamp(y, 0, 90),
        w: clamp(w || 20, 5, 90),
        h: clamp(h || 12, 5, 80),
        shape: prst.includes("ellipse") || prst.includes("oval")
          ? "ellipse"
          : prst.includes("line")
            ? "line"
            : "rect",
      });
    }
  }

  // Fallback: if no objects, create textboxes from all a:t
  if (!objects.length) {
    const all = extractTextFromChunk(xml);
    if (all[0]) {
      objects.push({
        id: uid("obj"),
        type: "textbox",
        x: 8,
        y: 12,
        w: 80,
        h: 14,
        text: all[0],
        fontSize: 32,
      });
    }
    all.slice(1).forEach((t, idx) => {
      objects.push({
        id: uid("obj"),
        type: "textbox",
        x: 8,
        y: 30 + idx * 12,
        w: 80,
        h: 10,
        text: t,
        fontSize: 18,
      });
    });
  }

  // Attach leftover images not referenced in shapes
  const usedSrc = new Set(objects.filter((o) => o.src).map((o) => o.src));
  media.forEach((m, idx) => {
    if (usedSrc.has(m.dataUrl)) return;
    objects.push({
      id: uid("obj"),
      type: "image",
      x: 55,
      y: 20 + idx * 8,
      w: 38,
      h: 40,
      src: m.dataUrl,
      imageHint: m.hint,
    });
  });

  if (hasChart && !objects.some((o) => o.type === "chart")) {
    objects.push({
      id: uid("obj"),
      type: "chart",
      x: 50,
      y: 28,
      w: 42,
      h: 48,
      chartHint: "Imported chart",
    });
  }

  return { objects, hasChart, shapeCount };
}

function extractTextFromChunk(chunk: string): string[] {
  const out: string[] = [];
  const re = /<a:t[^>]*>([\s\S]*?)<\/a:t>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(chunk))) {
    const text = decodeXml(m[1] || "").replace(/\s+/g, " ").trim();
    if (text && text !== out[out.length - 1]) out.push(text);
  }
  return out;
}

function slideFields(
  layout: SlideLayout,
  title: string,
  rest: string[],
  hasChart: boolean,
  media: MediaRef[]
): Omit<Slide, "id" | "objects" | "notes"> {
  if (hasChart) {
    return {
      layout: "chart",
      title,
      subtitle: rest[0],
      bullets: rest.slice(1).slice(0, 4),
      chartHint: "Imported chart",
    };
  }
  if (media.length && rest.length <= 1) {
    return {
      layout: "image",
      title,
      subtitle: rest[0],
      imageHint: media[0]?.hint,
    };
  }
  switch (layout) {
    case "hero":
      return { layout, title, subtitle: rest[0], body: rest.slice(1).join(" ") };
    case "bullets":
      return {
        layout,
        title,
        bullets: rest.length ? rest.slice(0, 6) : ["Point"],
      };
    case "quote":
      return {
        layout,
        title: "Quote",
        quote: rest[0] || title,
        quoteAuthor: rest[1],
      };
    case "thankyou":
      return { layout, title: title || "Thank you", subtitle: rest[0] };
    default:
      return {
        layout: "section",
        title,
        body: rest.join("\n"),
        bullets: rest.length > 2 ? rest.slice(0, 5) : undefined,
      };
  }
}

function inferLayout(
  texts: string[],
  index: number,
  total: number,
  hasChart: boolean,
  imageCount: number
): SlideLayout {
  if (hasChart) return "chart";
  if (index === 0) return "hero";
  if (index === total - 1) return "thankyou";
  if (imageCount && texts.length <= 2) return "image";
  if (texts.length >= 4 && texts.slice(1).every((t) => t.length < 90))
    return "bullets";
  if (texts.some((t) => /["“]/.test(t))) return "quote";
  return "section";
}

function emuToPct(emu: number, total: number) {
  if (!total) return 0;
  return (Math.abs(emu) / total) * 100;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function decodeXml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
