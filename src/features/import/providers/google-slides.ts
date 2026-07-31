import type { ImportProvider } from "@/features/import/providers/types";

/**
 * Future Google Slides connector.
 * Implement OAuth + Slides API here — UI already lists as Coming Soon.
 */
export const googleSlidesProvider: ImportProvider = {
  id: "google-slides",
  label: "Google Slides",
  status: "coming_soon",
  description: "OAuth connector — coming soon",
  importRemote: async () => {
    throw new Error("Google Slides import is coming soon.");
  },
};
