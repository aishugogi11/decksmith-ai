import type { TemplateRecord } from "@/lib/template-engine/types";
import type { Slide, SlideLayout } from "@/lib/types";
import { uid } from "@/lib/utils";

/**
 * Lightweight PPTX → EchoFlow template extract.
 * Reads slide XML text nodes (open OOXML). Best-effort — not a full layout clone.
 */
export async function importPptxAsTemplate(
  file: ArrayBuffer,
  fileName: string
): Promise<TemplateRecord> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(file);

  const slidePaths = Object.keys(zip.files)
    .filter((p) => /^ppt\/slides\/slide\d+\.xml$/i.test(p))
    .sort((a, b) => {
      const na = Number(a.match(/slide(\d+)/i)?.[1] ?? 0);
      const nb = Number(b.match(/slide(\d+)/i)?.[1] ?? 0);
      return na - nb;
    });

  if (!slidePaths.length) {
    throw new Error("No slides found in this PPTX file.");
  }

  const slides: Omit<Slide, "id">[] = [];

  for (let i = 0; i < slidePaths.length; i++) {
    const xml = await zip.files[slidePaths[i]]!.async("string");
    const texts = extractTextNodes(xml);
    const title = texts[0] || `Slide ${i + 1}`;
    const rest = texts.slice(1);
    const layout = inferLayout(texts, i, slidePaths.length);

    slides.push(slideFromTexts(layout, title, rest));
  }

  const baseName = fileName.replace(/\.pptx$/i, "") || "Imported slides";
  const id = uid("user-pptx");

  return {
    id,
    source: "user",
    name: baseName,
    description: `Imported from ${fileName} · ready to redesign layouts & copy`,
    presentationType: "business",
    industry: ["imported"],
    audience: ["general"],
    visualStyle: ["modern"],
    colorPalette: ["#111111", "#ffffff"],
    layoutStyle: "imported-pptx",
    tone: ["professional"],
    tags: ["imported", "pptx", "user"],
    themeId: "minimal",
    slideCount: slides.length,
    preview: "linear-gradient(135deg,#dbeafe,#1e293b)",
    semanticText: `${baseName} imported pptx ${slides.map((s) => s.title).join(" ")}`,
    slides,
  };
}

function extractTextNodes(xml: string): string[] {
  const out: string[] = [];
  const re = /<a:t[^>]*>([\s\S]*?)<\/a:t>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const text = decodeXml(m[1] || "").replace(/\s+/g, " ").trim();
    if (text && text !== out[out.length - 1]) out.push(text);
  }
  return out;
}

function decodeXml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function inferLayout(texts: string[], index: number, total: number): SlideLayout {
  if (index === 0) return "hero";
  if (index === total - 1) return "thankyou";
  if (texts.length >= 4 && texts.slice(1).every((t) => t.length < 80)) return "bullets";
  if (texts.some((t) => /["“]/.test(t))) return "quote";
  return "section";
}

function slideFromTexts(
  layout: SlideLayout,
  title: string,
  rest: string[]
): Omit<Slide, "id"> {
  switch (layout) {
    case "hero":
      return {
        layout,
        title,
        subtitle: rest[0],
        body: rest.slice(1).join(" "),
      };
    case "bullets":
      return {
        layout,
        title,
        bullets: rest.length ? rest : ["Add points"],
      };
    case "quote":
      return {
        layout,
        title: "Quote",
        quote: rest[0] || title,
        quoteAuthor: rest[1],
      };
    case "thankyou":
      return {
        layout,
        title: title || "Thank you",
        subtitle: rest[0],
        body: rest.slice(1).join(" "),
      };
    default:
      return {
        layout: "section",
        title,
        body: rest.join("\n"),
      };
  }
}
