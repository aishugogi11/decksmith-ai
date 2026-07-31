/**
 * Lazy-load pdf.js in the browser with a matching worker.
 */
export async function loadPdfJs() {
  const pdfjs = await import("pdfjs-dist");

  if (typeof window !== "undefined") {
    // Served from /public for reliable Next/Turbopack loading
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }

  return pdfjs;
}
