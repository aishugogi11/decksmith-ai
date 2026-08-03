import type { Presentation, Slide } from "@/lib/types";
import { THEMES } from "@/lib/themes";

/**
 * Export a EchoFlow presentation to .pptx via PPTXGenJS.
 * Layouts are generated programmatically — not a Canva scrape.
 */
export async function exportPresentationToPptx(
  presentation: Presentation,
  filename?: string
): Promise<void> {
  const PptxGenJS = (await import("pptxgenjs")).default;
  // pptxgenjs typings are loose across versions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pptx: any = new PptxGenJS();
  const theme = THEMES[presentation.themeId];
  const darkSlide = isLikelyDarkBg(theme.slideBg);

  pptx.author = "EchoFlow";
  pptx.title = presentation.title;
  pptx.subject = presentation.subtitle ?? "EchoFlow export";

  for (const slide of presentation.slides) {
    const s = pptx.addSlide();
    s.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: "100%",
      h: "100%",
      fill: { color: hexFromTheme(theme.slideBg, darkSlide ? "0F172A" : "F8FAFC") },
    });

    const fg = stripHash(theme.slideFg) || (darkSlide ? "F8FAFC" : "111111");
    const muted = stripHash(theme.muted) || "64748B";
    const accent = stripHash(theme.accent) || "0F766E";

    paintSlide(s, slide, { fg, muted, accent, pptx });
  }

  const safe =
    (filename || presentation.title || "echoflow")
      .replace(/[^\w\-]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "echoflow";

  await pptx.writeFile({ fileName: `${safe}.pptx` });
}

function paintSlide(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  s: any,
  slide: Slide,
  ctx: {
    fg: string;
    muted: string;
    accent: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pptx: any;
  }
) {
  const { fg, muted, accent, pptx } = ctx;

  s.addText(slide.title || "Untitled", {
    x: 0.6,
    y: 0.45,
    w: 8.8,
    h: 0.9,
    fontSize: slide.layout === "hero" ? 36 : 28,
    bold: true,
    color: fg,
    fontFace: "Arial",
  });

  if (slide.subtitle) {
    s.addText(slide.subtitle, {
      x: 0.6,
      y: 1.3,
      w: 8.8,
      h: 0.45,
      fontSize: 16,
      color: muted,
      fontFace: "Arial",
    });
  }

  let y = slide.subtitle ? 1.95 : 1.5;

  if (slide.body) {
    s.addText(slide.body, {
      x: 0.6,
      y,
      w: 8.8,
      h: 1.2,
      fontSize: 15,
      color: fg,
      fontFace: "Arial",
    });
    y += 1.35;
  }

  if (slide.bullets?.length) {
    s.addText(
      slide.bullets.map((b) => ({ text: b, options: { bullet: true } })),
      {
        x: 0.7,
        y,
        w: 8.6,
        h: 2.8,
        fontSize: 15,
        color: fg,
        fontFace: "Arial",
        paraSpacing: 8,
      }
    );
  }

  if (slide.stats?.length) {
    const w = 2.6;
    slide.stats.slice(0, 3).forEach((stat, i) => {
      const x = 0.7 + i * (w + 0.25);
      s.addShape(pptx.ShapeType.roundRect, {
        x,
        y,
        w,
        h: 1.5,
        fill: { color: accent },
      });
      s.addText(stat.value, {
        x,
        y: y + 0.25,
        w,
        h: 0.6,
        fontSize: 28,
        bold: true,
        color: "FFFFFF",
        align: "center",
        fontFace: "Arial",
      });
      s.addText(stat.label, {
        x,
        y: y + 0.9,
        w,
        h: 0.35,
        fontSize: 12,
        color: "FFFFFF",
        align: "center",
        fontFace: "Arial",
      });
    });
  }

  if (slide.quote) {
    s.addText(`“${slide.quote}”`, {
      x: 0.8,
      y: Math.max(y, 2.2),
      w: 8.4,
      h: 1.6,
      fontSize: 18,
      italic: true,
      color: fg,
      fontFace: "Georgia",
    });
    if (slide.quoteAuthor) {
      s.addText(`— ${slide.quoteAuthor}`, {
        x: 0.8,
        y: 4.1,
        w: 8.4,
        h: 0.35,
        fontSize: 13,
        color: muted,
        fontFace: "Arial",
      });
    }
  }

  if (slide.timeline?.length) {
    s.addText(
      slide.timeline.map((t) => ({
        text: `${t.title} — ${t.description}`,
        options: { bullet: true },
      })),
      {
        x: 0.7,
        y,
        w: 8.6,
        h: 2.6,
        fontSize: 14,
        color: fg,
        fontFace: "Arial",
      }
    );
  }

  if (slide.process?.length) {
    s.addText(
      slide.process
        .map((p, i) => `${i + 1}. ${p.title}: ${p.description}`)
        .join("\n"),
      {
        x: 0.7,
        y,
        w: 8.6,
        h: 2.6,
        fontSize: 14,
        color: fg,
        fontFace: "Arial",
      }
    );
  }

  if (slide.comparison?.length) {
    slide.comparison.slice(0, 2).forEach((col, i) => {
      const x = 0.7 + i * 4.5;
      s.addText(col.title, {
        x,
        y,
        w: 4.1,
        h: 0.4,
        fontSize: 16,
        bold: true,
        color: accent,
        fontFace: "Arial",
      });
      s.addText(
        col.items.map((item) => ({ text: item, options: { bullet: true } })),
        {
          x,
          y: y + 0.5,
          w: 4.1,
          h: 2.2,
          fontSize: 13,
          color: fg,
          fontFace: "Arial",
        }
      );
    });
  }

  if (slide.callout) {
    s.addText(slide.callout, {
      x: 0.6,
      y: 4.8,
      w: 8.8,
      h: 0.4,
      fontSize: 12,
      color: accent,
      fontFace: "Arial",
    });
  }

  if (slide.imageHint || slide.chartHint) {
    s.addText(slide.imageHint || slide.chartHint || "", {
      x: 0.6,
      y: 5.05,
      w: 8.8,
      h: 0.3,
      fontSize: 11,
      color: muted,
      italic: true,
      fontFace: "Arial",
    });
  }

  // Freeform editor objects (imported / voice-created) — percent → inches (10" × 5.625")
  for (const obj of slide.objects ?? []) {
    const x = (obj.x / 100) * 10;
    const y = (obj.y / 100) * 5.625;
    const w = (obj.w / 100) * 10;
    const h = (obj.h / 100) * 5.625;
    if (obj.type === "textbox" && obj.text) {
      s.addText(obj.text, {
        x,
        y,
        w,
        h,
        fontSize: Math.max(10, Math.min(36, obj.fontSize ?? 16)),
        color: fg,
        fontFace: "Arial",
        valign: "top",
      });
    } else if (obj.type === "image" && obj.src) {
      try {
        s.addPicture(obj.src, { x, y, w, h });
      } catch {
        /* skip bad data URLs */
      }
    } else if (obj.type === "shape") {
      s.addShape(
        obj.shape === "ellipse" ? pptx.ShapeType.ellipse : pptx.ShapeType.rect,
        {
          x,
          y,
          w,
          h,
          fill: { color: stripHash(obj.fill || "") || accent },
        }
      );
    } else if (obj.type === "chart") {
      s.addText(obj.chartHint || "Chart", {
        x,
        y,
        w,
        h,
        fontSize: 12,
        color: muted,
        align: "center",
        valign: "middle",
        fontFace: "Arial",
      });
    }
  }

  if (slide.notes) {
    s.addNotes(slide.notes);
  }
}

function stripHash(c: string): string {
  const m = c.match(/#([0-9a-fA-F]{6})/);
  return m ? m[1].toUpperCase() : "";
}

function isLikelyDarkBg(bg: string): boolean {
  return /#0|#1|rgb\(\s*0|slate|zinc-9|black/i.test(bg);
}

function hexFromTheme(bg: string, fallback: string): string {
  return stripHash(bg) || fallback;
}
