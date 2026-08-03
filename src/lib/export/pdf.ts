import type { Presentation } from "@/lib/types";
import { THEMES } from "@/lib/themes";

/**
 * Export presentation as PDF via print pipeline.
 * Opens a print-ready window (browser “Save as PDF”).
 * Preserves title/body/bullets/notes; freeform objects as text overlays.
 */
export async function exportPresentationToPdf(
  presentation: Presentation
): Promise<void> {
  const theme = THEMES[presentation.themeId];
  const win = window.open("", "_blank", "noopener,noreferrer,width=1100,height=800");
  if (!win) {
    throw new Error("Popup blocked — allow popups to export PDF.");
  }

  const pages = presentation.slides
    .map((slide, i) => {
      const bullets = (slide.bullets || [])
        .map((b) => `<li>${escapeHtml(b)}</li>`)
        .join("");
      const objects = (slide.objects || [])
        .filter((o) => o.type === "textbox" && o.text)
        .map(
          (o) =>
            `<div class="obj" style="left:${o.x}%;top:${o.y}%;width:${o.w}%;font-size:${Math.max(10, (o.fontSize || 16) * 0.55)}px">${escapeHtml(o.text || "")}</div>`
        )
        .join("");

      return `
      <section class="page">
        <header>
          <span class="idx">${i + 1}</span>
          <h1>${escapeHtml(slide.title || "Untitled")}</h1>
          ${slide.subtitle ? `<p class="sub">${escapeHtml(slide.subtitle)}</p>` : ""}
        </header>
        ${slide.body ? `<p class="body">${escapeHtml(slide.body)}</p>` : ""}
        ${bullets ? `<ul>${bullets}</ul>` : ""}
        ${objects ? `<div class="objects">${objects}</div>` : ""}
        ${slide.notes ? `<footer><strong>Notes:</strong> ${escapeHtml(slide.notes)}</footer>` : ""}
      </section>`;
    })
    .join("\n");

  win.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(presentation.title)} — EchoFlow PDF</title>
  <style>
    @page { size: landscape; margin: 12mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Georgia, "Times New Roman", serif;
      color: ${theme.slideFg};
      background: #e4e4e7;
    }
    .page {
      position: relative;
      width: 100%;
      min-height: 180mm;
      margin: 0 auto 10mm;
      padding: 14mm 16mm;
      background: ${theme.slideBg};
      page-break-after: always;
      break-after: page;
      overflow: hidden;
    }
    .page:last-child { page-break-after: auto; }
    header h1 {
      font-size: 28px;
      margin: 0 0 6px;
      line-height: 1.15;
    }
    .idx {
      display: inline-block;
      font-size: 11px;
      opacity: 0.55;
      margin-bottom: 8px;
      font-family: system-ui, sans-serif;
    }
    .sub { font-size: 16px; opacity: 0.75; margin: 0 0 12px; }
    .body { font-size: 14px; line-height: 1.45; max-width: 90%; }
    ul { font-size: 14px; line-height: 1.5; padding-left: 1.2em; }
    .objects { position: absolute; inset: 0; pointer-events: none; }
    .obj { position: absolute; white-space: pre-wrap; }
    footer {
      position: absolute;
      left: 16mm;
      right: 16mm;
      bottom: 10mm;
      font-size: 11px;
      opacity: 0.65;
      font-family: system-ui, sans-serif;
      border-top: 1px solid rgba(0,0,0,0.08);
      padding-top: 6px;
    }
    @media print {
      body { background: white; }
      .page { margin: 0; box-shadow: none; }
    }
  </style>
</head>
<body>
  ${pages}
  <script>
    window.onload = function () {
      setTimeout(function () { window.print(); }, 250);
    };
  </script>
</body>
</html>`);
  win.document.close();
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
