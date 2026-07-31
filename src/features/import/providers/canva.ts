import type { ImportProvider } from "@/features/import/providers/types";

/**
 * Future Canva connector.
 * Until then, users can export Canva as PPTX and use the PPTX parser.
 */
export const canvaProvider: ImportProvider = {
  id: "canva",
  label: "Canva",
  status: "coming_soon",
  description: "Export as PPTX today, or wait for direct Canva import",
  importRemote: async () => {
    throw new Error("Canva import is coming soon. Export as .pptx for now.");
  },
};
