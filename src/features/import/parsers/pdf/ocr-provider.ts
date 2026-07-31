/**
 * OCR provider interface — plug Tesseract / cloud OCR later.
 * Default import path uses embedded text extraction only.
 */
export type OcrProvider = {
  id: string;
  label: string;
  extractTextFromImage: (imageBytes: Uint8Array) => Promise<string>;
};

export const noopOcrProvider: OcrProvider = {
  id: "noop",
  label: "No OCR (text layer only)",
  async extractTextFromImage() {
    return "";
  },
};
