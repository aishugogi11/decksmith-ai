import { canvaProvider } from "@/features/import/providers/canva";
import { googleSlidesProvider } from "@/features/import/providers/google-slides";
import { keynoteProvider } from "@/features/import/providers/keynote";
import type { ImportProvider } from "@/features/import/providers/types";

const fileProviders: ImportProvider[] = [
  {
    id: "pptx",
    label: "PowerPoint / Keynote / Canva (.pptx)",
    status: "ready",
    description: "Native OOXML parse into editable EchoFlow objects",
    accept: [".pptx"],
  },
  {
    id: "pdf",
    label: "PDF presentation",
    status: "ready",
    description: "Text-layer extract → editable slides (OCR-ready)",
    accept: [".pdf"],
  },
  {
    id: "decksmith",
    label: "EchoFlow JSON",
    status: "ready",
    description: "Exact restore of objects, theme, notes, metadata",
    accept: [".json"],
  },
];

export const IMPORT_PROVIDERS: ImportProvider[] = [
  ...fileProviders,
  googleSlidesProvider,
  canvaProvider,
  keynoteProvider,
];
