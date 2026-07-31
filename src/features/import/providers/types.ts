import type { ImportProviderId, ImportResult } from "@/features/import/types";

/**
 * Future connector interface — Google Slides / Canva / Keynote plug in here.
 * Do not call external APIs yet; stubs return "coming soon".
 */
export type ImportProvider = {
  id: ImportProviderId;
  label: string;
  status: "ready" | "coming_soon";
  description: string;
  accept?: string[];
  importFile?: (file: File) => Promise<ImportResult>;
  /** Future: OAuth / remote deck id */
  importRemote?: (ref: string) => Promise<ImportResult>;
};
