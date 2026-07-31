import type { ImportProvider } from "@/features/import/providers/types";

/**
 * Future Apple Keynote (.key) connector.
 * Until then, export Keynote as PPTX.
 */
export const keynoteProvider: ImportProvider = {
  id: "keynote",
  label: "Apple Keynote",
  status: "coming_soon",
  description: "Export Keynote as PPTX, or wait for .key support",
  accept: [".key"],
  importFile: async () => {
    throw new Error(
      "Apple Keynote .key isn’t supported yet — export as .pptx from Keynote."
    );
  },
};
